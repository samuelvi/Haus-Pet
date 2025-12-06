/**
 * Breed queries with TanStack Query
 * Handles fetching and caching of breed data
 */

import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import type { Breed, BreedFilters } from '../types/api.types';

/**
 * Fetch all breeds with pagination
 */
export function useBreeds(filters?: BreedFilters) {
  return useQuery({
    queryKey: ['breeds', filters],
    queryFn: async () => {
      const response = await apiService.getBreeds(filters);
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch breed by ID
 */
export function useBreed(id: string) {
  return useQuery({
    queryKey: ['breed', id],
    queryFn: async () => {
      return apiService.getBreedById(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10, // 10 minutes (breed details don't change often)
  });
}

/**
 * Fetch breeds by pet type
 */
export function useBreedsByType(type: string) {
  return useQuery({
    queryKey: ['breeds', 'type', type],
    queryFn: async () => {
      return apiService.getBreedsByType(type);
    },
    enabled: Boolean(type),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Check similar breeds (for duplicate detection)
 */
export function useSimilarBreeds(name: string, petType: string, enabled = true) {
  return useQuery({
    queryKey: ['breeds', 'similar', name, petType],
    queryFn: async () => {
      return apiService.checkSimilarBreeds(name, petType);
    },
    enabled: enabled && Boolean(name) && Boolean(petType),
    staleTime: 0, // Always fresh for duplicate checks
  });
}

/**
 * Fetch breed types
 */
export function useBreedTypes(accessToken?: string, sessionId?: string) {
  return useQuery({
    queryKey: ['breedTypes'],
    queryFn: async () => {
      if (!accessToken || !sessionId) {
        throw new Error('Authentication required');
      }
      return apiService.getBreedTypes(accessToken, sessionId);
    },
    enabled: Boolean(accessToken) && Boolean(sessionId),
    staleTime: 1000 * 60 * 30, // 30 minutes (types don't change often)
  });
}
