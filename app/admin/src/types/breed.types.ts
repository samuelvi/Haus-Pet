/**
 * Breed Management Types
 * Type definitions for breed-related API requests and responses
 */

export interface ApiResponse<T> {
  status: 'OK' | 'ERROR';
  data?: T;
  message?: string;
}

export type PetType = 'cat' | 'dog' | 'bird';

export interface Breed {
  id: string;
  name: string;
  petType: PetType;
}

export interface BreedFormData {
  name: string;
  petType: PetType;
}

export interface BreedFilters {
  type?: PetType;
  search?: string;
}
