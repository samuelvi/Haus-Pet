/**
 * Pet queries with TanStack Query
 * Handles fetching and caching of pet data from read models
 */

import { useQuery } from '@tanstack/react-query';
import { petService } from '../services/pet.service';
import type { PaginationParams } from '../types/pet.types';

/**
 * Fetch all pets with pagination
 */
export function usePets(params?: PaginationParams) {
  return useQuery({
    queryKey: ['pets', params],
    queryFn: async () => {
      return petService.getAllPets(params);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (read model may update frequently)
    refetchInterval: 1000 * 30, // Refetch every 30s to catch projection updates
  });
}

/**
 * Fetch pets by type with pagination
 */
export function usePetsByType(type: string, params?: PaginationParams) {
  return useQuery({
    queryKey: ['pets', 'type', type, params],
    queryFn: async () => {
      return petService.getPetsByType(type, params);
    },
    enabled: Boolean(type),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 30,
  });
}

/**
 * Fetch pet by ID
 */
export function usePet(id: string) {
  return useQuery({
    queryKey: ['pet', id],
    queryFn: async () => {
      return petService.getPetById(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Search pets by name
 */
export function useSearchPets(name: string, params?: PaginationParams) {
  return useQuery({
    queryKey: ['pets', 'search', name, params],
    queryFn: async () => {
      return petService.searchPets(name, params);
    },
    enabled: Boolean(name) && name.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });
}
