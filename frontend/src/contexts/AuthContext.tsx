import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { login as loginRequest } from '../services/authService';
import {
  readAuthStorage,
  writeAuthStorage,
  clearAuthStorage,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  /** True bila sesi berakhir karena token kedaluwarsa (bukan logout manual). */
  sessionExpired: boolean;
}

const EMPTY_AUTH = { token: null as string | null, user: null as User | null };

/**
 * Decode klaim `exp` dari JWT tanpa library tambahan.
 * Return null bila token tidak bisa dibaca / tidak punya exp.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes)) as {
      exp?: number;
    };
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiry(token);
  // Token tanpa exp dianggap berlaku supaya tidak mengunci user keluar
  // saat konfigurasi JWT_EXPIRES_IN tidak memasang klaim exp.
  if (exp === null) return false;
  return exp * 1000 <= Date.now();
}

/**
 * Hydrate sesi dari storage saat inisialisasi (bukan useEffect),
 * supaya render pertama sudah benar dan PrivateRoute tidak
 * melempar user ke /login saat refresh.
 */
function hydrateSession(): {
  auth: typeof EMPTY_AUTH;
  sessionExpired: boolean;
} {
  const stored = readAuthStorage();
  if (!stored.token || !stored.user) {
    return { auth: EMPTY_AUTH, sessionExpired: false };
  }

  if (isTokenExpired(stored.token)) {
    clearAuthStorage();
    return { auth: EMPTY_AUTH, sessionExpired: true };
  }

  try {
    const user = JSON.parse(stored.user) as User;
    return {
      auth: { token: stored.token, user },
      sessionExpired: false,
    };
  } catch {
    clearAuthStorage();
    return { auth: EMPTY_AUTH, sessionExpired: false };
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState(() => hydrateSession());
  const { auth, sessionExpired } = session;

  /**
   * Cek expiry berkala supaya sesi yang kedaluwarsa terangkat
   * walau user diam di halaman yang sama.
   */
  useEffect(() => {
    const validate = () => {
      const stored = readAuthStorage();
      if (stored.token && isTokenExpired(stored.token)) {
        clearAuthStorage();
        setSession({
          auth: EMPTY_AUTH,
          sessionExpired: true,
        });
      }
    };

    validate();
    const intervalId = window.setInterval(validate, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const login = useCallback(
    async (username: string, password: string, remember: boolean = true) => {
      const data = await loginRequest(username, password);

      writeAuthStorage(data.token, JSON.stringify(data.user), remember);
      setSession({
        auth: { token: data.token, user: data.user },
        sessionExpired: false,
      });
    },
    []
  );

  const logout = useCallback(() => {
    clearAuthStorage();
    setSession({ auth: EMPTY_AUTH, sessionExpired: false });
  }, []);

  const value = React.useMemo(
    () => ({
      user: auth.user,
      token: auth.token,
      login,
      logout,
      isAuthenticated: !!auth.token,
      sessionExpired,
    }),
    [auth, login, logout, sessionExpired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
