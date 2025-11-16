/**
 * Pet Management Types
 * Type definitions for pet-related API requests and responses
 */

export interface ApiResponse<T> {
  status: 'OK' | 'ERROR';
  data?: T;
  message?: string;
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
