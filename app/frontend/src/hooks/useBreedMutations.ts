/**
 * Breed mutations with offline support and optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { db } from '../db/db';
import type { BreedFormData, Breed } from '../types/api.types';

interface UseBreedMutationsOptions {
  accessToken: string;
  sessionId: string;
}

/**
 * Create breed mutation with offline support
 */
export function useCreateBreed({ accessToken, sessionId }: UseBreedMutationsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BreedFormData) => {
      const commandId = `breed-create-${Date.now()}`;

      // Save command to outbox
      await db.pendingCommands.add({
        id: commandId,
        type: 'CREATE_BREED',
        payload: data,
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      });

      // Try to execute immediately
      return apiService.createBreed(data, accessToken, sessionId);
    },

    // Optimistic update
    onMutate: async (newBreed) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['breeds'] });

      // Snapshot previous value
      const previousBreeds = queryClient.getQueryData(['breeds']);

      // Optimistically update cache
      queryClient.setQueryData(['breeds'], (old: any) => {
        if (!old) return old;

        const tempId = `temp-${Date.now()}`;
        return {
          ...old,
          data: {
            items: [
              { id: tempId, ...newBreed, breedTypeId: `type-${newBreed.petType}` },
              ...(old.data?.items || []),
            ],
            pagination: old.data?.pagination,
          },
        };
      });

      return { previousBreeds };
    },

    // Revert on error
    onError: (err, _newBreed, context) => {
      console.error('[useCreateBreed] Error:', err);
      if (context?.previousBreeds) {
        queryClient.setQueryData(['breeds'], context.previousBreeds);
      }
    },

    // Invalidate on success
    onSuccess: async () => {
      // Remove successful command from outbox
      const commands = await db.pendingCommands
        .where('type')
        .equals('CREATE_BREED')
        .toArray();

      for (const cmd of commands) {
        if (cmd.status !== 'failed') {
          await db.pendingCommands.delete(cmd.id);
        }
      }

      // Invalidate to refetch fresh data
      await queryClient.invalidateQueries({ queryKey: ['breeds'] });
    },
  });
}

/**
 * Update breed mutation with offline support
 */
export function useUpdateBreed({ accessToken, sessionId }: UseBreedMutationsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BreedFormData }) => {
      const commandId = `breed-update-${id}-${Date.now()}`;

      // Save command to outbox
      await db.pendingCommands.add({
        id: commandId,
        type: 'UPDATE_BREED',
        payload: { id, ...data },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      });

      // Try to execute immediately
      return apiService.updateBreed(id, data, accessToken, sessionId);
    },

    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['breeds'] });
      await queryClient.cancelQueries({ queryKey: ['breed', id] });

      const previousBreeds = queryClient.getQueryData(['breeds']);
      const previousBreed = queryClient.getQueryData(['breed', id]);

      // Update list
      queryClient.setQueryData(['breeds'], (old: any) => {
        if (!old?.data?.items) return old;

        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.map((breed: Breed) =>
              breed.id === id ? { ...breed, ...data } : breed
            ),
          },
        };
      });

      // Update detail
      queryClient.setQueryData(['breed', id], (old: any) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previousBreeds, previousBreed };
    },

    onError: (err, { id }, context) => {
      console.error('[useUpdateBreed] Error:', err);
      if (context?.previousBreeds) {
        queryClient.setQueryData(['breeds'], context.previousBreeds);
      }
      if (context?.previousBreed) {
        queryClient.setQueryData(['breed', id], context.previousBreed);
      }
    },

    onSuccess: async (_data, { id }) => {
      // Remove from outbox
      const commands = await db.pendingCommands
        .where('type')
        .equals('UPDATE_BREED')
        .toArray();

      for (const cmd of commands) {
        if (cmd.payload.id === id && cmd.status !== 'failed') {
          await db.pendingCommands.delete(cmd.id);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['breeds'] });
      await queryClient.invalidateQueries({ queryKey: ['breed', id] });
    },
  });
}

/**
 * Delete breed mutation with offline support
 */
export function useDeleteBreed({ accessToken, sessionId }: UseBreedMutationsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const commandId = `breed-delete-${id}-${Date.now()}`;

      await db.pendingCommands.add({
        id: commandId,
        type: 'DELETE_BREED',
        payload: { id },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      });

      return apiService.deleteBreed(id, accessToken, sessionId);
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['breeds'] });

      const previousBreeds = queryClient.getQueryData(['breeds']);

      queryClient.setQueryData(['breeds'], (old: any) => {
        if (!old?.data?.items) return old;

        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((breed: Breed) => breed.id !== id),
          },
        };
      });

      return { previousBreeds };
    },

    onError: (err, _id, context) => {
      console.error('[useDeleteBreed] Error:', err);
      if (context?.previousBreeds) {
        queryClient.setQueryData(['breeds'], context.previousBreeds);
      }
    },

    onSuccess: async (_data, id) => {
      const commands = await db.pendingCommands
        .where('type')
        .equals('DELETE_BREED')
        .toArray();

      for (const cmd of commands) {
        if (cmd.payload.id === id && cmd.status !== 'failed') {
          await db.pendingCommands.delete(cmd.id);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['breeds'] });
    },
  });
}
