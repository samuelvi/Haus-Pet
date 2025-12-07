/**
 * Pet queries with TanStack Query
 * Handles fetching and caching of pet data from read models
 */

import { useQuery } from '@tanstack/react-query';
import { petService } from '../services/pet.service';

/**
 * Fetch all pets with pagination
 */
export function usePets(page?: number, limit?: number) {
  return useQuery({
    queryKey: ['pets', page, limit],
    queryFn: async () => {
      return petService.getAllPets(page, limit);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (read model may update frequently)
    refetchInterval: 1000 * 30, // Refetch every 30s to catch projection updates
  });
}

/**
 * Fetch pets by type with pagination
 */
export function usePetsByType(type: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: ['pets', 'type', type, page, limit],
    queryFn: async () => {
      return petService.getPetsByType(type, page, limit);
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
 * TODO: Implement searchPets method in petService
 */
/* export function useSearchPets(name: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: ['pets', 'search', name, page, limit],
    queryFn: async () => {
      return petService.searchPets(name, page, limit);
    },
    enabled: Boolean(name) && name.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });
} */
