/**
 * API Types
 * Type definitions for API requests and responses
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

export type PetType = 'cat' | 'dog' | 'bird';

export interface Pet {
  id: number;
  breed: string;
  type: PetType;
}

export interface PetFormData {
  breed: string;
  type: PetType;
}

export interface PetFilters {
  type?: PetType;
  search?: string;
}
