/**
 * Authentication Types
 * Type definitions for authentication-related API requests and responses
 */

export interface ApiResponse<T> {
  status: 'OK' | 'ERROR';
  data?: T;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: Tokens;
  sessionId: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}
