/**
 * Authentication Service
 * Handles all authentication-related HTTP requests
 */

import type {
  ApiResponse,
  User,
  Tokens,
  LoginResponse,
  SignupData,
  LoginData,
} from '../types/auth.types';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class AuthService {
  /**
   * Generic request handler
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url: string = `${API_BASE_URL}${endpoint}`;

    const response: Response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }

    const data: ApiResponse<T> = await response.json();
    if (data.status === 'ERROR') {
      throw new Error(data.message || 'API error');
    }

    return data.data!;
  }

  /**
   * Signup a new user
   */
  async signup(data: SignupData): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(accessToken: string, sessionId: string): Promise<User> {
    return this.request<User>('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string,
    sessionId: string
  ): Promise<{ tokens: Tokens }> {
    return this.request<{ tokens: Tokens }>('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-session-id': sessionId,
      },
      body: JSON.stringify({ refreshToken }),
    });
  }

  /**
   * Logout user
   */
  async logout(accessToken: string, sessionId: string): Promise<void> {
    await this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
    });
  }
}

export const authService = new AuthService();
