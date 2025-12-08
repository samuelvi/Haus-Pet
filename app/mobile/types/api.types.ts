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

export type PetType = string;

export interface Breed {
  id: string;
  name: string;
  petType: PetType;
  breedTypeId?: string;
}

export interface BreedFormData {
  name: string;
  petType: PetType;
}

export interface BreedFilters {
  type?: PetType;
  petType?: PetType;
  search?: string;
}

export interface BreedType {
  id: string;
  name: string;
}

export interface SystemCounters {
  id: string;
  totalBreeds: number;
  totalActivePets: number;
  totalBreedTypes: number;
  totalSponsorships: number;
  totalUsers: number;
  totalRevenue: number;
  updatedAt: string;
}