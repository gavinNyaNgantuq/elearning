import axios from 'axios';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export type AuthStorageKind = 'local' | 'session';

export interface StoredAuth {
  token: string | null;
  user: string | null;
  persistent: boolean;
}

/**
 * Baca token dari localStorage (remember me) atau sessionStorage.
 * localStorage diprioritaskan karena sesi yang "diingat" harus menang.
 */
export function readAuthStorage(): StoredAuth {
  const localToken = localStorage.getItem(TOKEN_KEY);
  if (localToken) {
    return {
      token: localToken,
      user: localStorage.getItem(USER_KEY),
      persistent: true,
    };
  }

  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) {
    return {
      token: sessionToken,
      user: sessionStorage.getItem(USER_KEY),
      persistent: false,
    };
  }

  return { token: null, user: null, persistent: false };
}

/**
 * Simpan kredensial sesi. Kedua storage dibersihkan dulu supaya tidak ada
 * token lama yang tertinggal di storage yang tidak dipilih.
 */
export function writeAuthStorage(
  token: string,
  user: string,
  persistent: boolean
): void {
  clearAuthStorage();
  const target = persistent ? localStorage : sessionStorage;
  target.setItem(TOKEN_KEY, token);
  target.setItem(USER_KEY, user);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    const { token } = readAuthStorage();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 401 di halaman login adalah kredensial salah yang wajar,
      // jadi jangan bersihkan sesi / reload di sini.
      const onLoginPage = window.location.pathname.startsWith('/login');
      if (!onLoginPage) {
        clearAuthStorage();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Normalisasi pesan error API supaya komponen tidak perlu
 * mengetahui bentuk response axios.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    // Pesan dari backend diprioritaskan; kalau tidak ada (mis. jaringan
    // mati), pakai pesan generik yang tetap layak ditampilkan.
    const data = err.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default api;
