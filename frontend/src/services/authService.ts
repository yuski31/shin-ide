import axios from 'axios';
import { LoginRequest, RegisterRequest, User, AuthTokens, ApiResponse } from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await authApi.post<ApiResponse<LoginResponse>>('/login', credentials);
    return response.data.data!;
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await authApi.post<ApiResponse<RegisterResponse>>('/register', userData);
    return response.data.data!;
  },

  async logout(): Promise<void> {
    await authApi.post('/logout');
  },

  async refreshToken(refreshToken: string): Promise<{ tokens: AuthTokens }> {
    const response = await authApi.post<ApiResponse<{ tokens: AuthTokens }>>('/refresh', {
      refreshToken,
    });
    return response.data.data!;
  },

  async getCurrentUser(): Promise<User> {
    const response = await authApi.get<ApiResponse<User>>('/me');
    return response.data.data!;
  },

  async forgotPassword(email: string): Promise<void> {
    await authApi.post('/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await authApi.post('/reset-password', { token, password });
  },

  async verifyEmail(token: string): Promise<void> {
    await authApi.post('/verify-email', { token });
  },

  async resendVerification(email: string): Promise<void> {
    await authApi.post('/resend-verification', { email });
  },
};
