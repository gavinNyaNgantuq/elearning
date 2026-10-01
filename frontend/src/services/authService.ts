import api, { apiErrorMessage } from './api';
import { User } from '../types';

export interface LoginResult {
  token: string;
  user: User;
}

export interface ForgotPasswordResult {
  message: string;
}

export interface VerifyOtpResult {
  resetToken: string;
  message: string;
}

export interface ResetPasswordResult {
  message: string;
}

/**
 * Login dan ambil JWT + data user.
 * Melempar Error berisi pesan yang layak ditampilkan ke user.
 */
export async function login(
  username: string,
  password: string
): Promise<LoginResult> {
  try {
    const response = await api.post('/auth/login', { username, password });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Login gagal');
    }
    return response.data.data as LoginResult;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Login gagal. Periksa koneksi Anda.'));
  }
}

/**
 * Minta kode OTP. Respons selalu generik — tidak membocorkan
   apakah email terdaftar atau tidak.
 */
export async function forgotPassword(
  email: string
): Promise<ForgotPasswordResult> {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return { message: response.data.message as string };
  } catch (err) {
    throw new Error(
      apiErrorMessage(err, 'Gagal mengirim kode, coba lagi nanti.')
    );
  }
}

/**
 * Verifikasi kode OTP, menghasilkan resetToken untuk langkah terakhir.
 */
export async function verifyOtp(
  email: string,
  otp: string
): Promise<VerifyOtpResult> {
  try {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data.data as VerifyOtpResult;
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Kode tidak valid atau sudah kedaluwarsa.'));
  }
}

/**
 * Ganti password memakai resetToken (sekali pakai).
 */
export async function resetPassword(
  email: string,
  resetToken: string,
  password: string,
  confirmPassword: string
): Promise<ResetPasswordResult> {
  try {
    const response = await api.post('/auth/reset-password', {
      email,
      resetToken,
      password,
      confirmPassword,
    });
    return { message: response.data.message as string };
  } catch (err) {
    throw new Error(apiErrorMessage(err, 'Gagal mengubah password.'));
  }
}
