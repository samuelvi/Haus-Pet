/**
 * Breed Management Types
 * Type definitions for breed-related API requests and responses
 */

export interface ApiResponse<T> {
  status: 'OK' | 'ERROR';
  data?: T;
  message?: string;
}

export type AnimalType = 'cat' | 'dog' | 'bird';

export interface Breed {
  id: string;
  name: string;
  animalType: AnimalType;
}

export interface BreedFormData {
  name: string;
  animalType: AnimalType;
}

export interface BreedFilters {
  type?: AnimalType;
  search?: string;
}
