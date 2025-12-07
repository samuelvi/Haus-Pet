/**
 * Pet mutations with offline support and Event Sourcing
 * Handles commands for Pet aggregate with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { petService } from '../services/pet.service';
import { db } from '../db/db';
import type { CreatePetInput, UpdatePetInput, Pet } from '../types/pet.types';

interface UsePetMutationsOptions {
  accessToken: string;
  sessionId: string;
}

/**
 * Create pet mutation (Event Sourcing: PET_CREATED event)
 */
export function useCreatePet({ accessToken, sessionId }: UsePetMutationsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePetInput) => {
      const commandId = `pet-create-${Date.now()}`;

      // Save command to outbox (Event Sourcing pattern)
      await db.pendingCommands.add({
        id: commandId,
        type: 'CREATE_PET',
        payload: data,
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      });

      // Execute command (will emit PET_CREATED event)
      return petService.createPet(data, accessToken, sessionId);
    },

    // Optimistic update
    onMutate: async (newPet) => {
      // Cancel outgoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ['pets'] });
      await queryClient.cancelQueries({ queryKey: ['pets', newPet.type] });

      // Snapshot previous values
      const previousPets = queryClient.getQueryData(['pets']);
      const previousTypePets = queryClient.getQueryData(['pets', newPet.type]);

      const tempPet: Pet = {
        id: `temp-${Date.now()}`,
        name: newPet.name,
        type: newPet.type,
        breed: newPet.breed,
        photoUrl: newPet.photoUrl || '',
        totalSponsored: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically add to cache
      queryClient.setQueryData(['pets'], (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            items: [tempPet, ...old.data.items],
            pagination: old.data.pagination,
          },
        };
      });

      queryClient.setQueryData(['pets', newPet.type], (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            items: [tempPet, ...old.data.items],
            pagination: old.data.pagination,
          },
        };
      });

      return { previousPets, previousTypePets };
    },

    // Revert on error
    onError: (err, newPet, context) => {
      console.error('[useCreatePet] Error:', err);
      if (context?.previousPets) {
        queryClient.setQueryData(['pets'], context.previousPets);
      }
      if (context?.previousTypePets) {
        queryClient.setQueryData(['pets', newPet.type], context.previousTypePets);
      }
    },

    // Invalidate on success (wait for projection to update read model)
    onSuccess: async () => {
      // Remove from outbox
      const commands = await db.pendingCommands
        .where('type')
        .equals('CREATE_PET')
        .toArray();

      for (const cmd of commands) {
        if (cmd.status !== 'failed') {
          await db.pendingCommands.delete(cmd.id);
        }
      }

      // Invalidate queries to refetch from read model
      // Note: Projection may take a moment, so we use a small delay
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ['pets'] });
      }, 500);
    },
  });
}

/**
 * Update pet mutation (Event Sourcing: PET_UPDATED event)
 */
export function useUpdatePet({ accessToken, sessionId }: UsePetMutationsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePetInput }) => {
      const commandId = `pet-update-${id}-${Date.now()}`;

      await db.pendingCommands.add({
        id: commandId,
        type: 'UPDATE_PET',
        payload: { id, ...data },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      });

      return petService.updatePet(id, data, accessToken, sessionId);
    },

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['pets'] });
      await queryClient.cancelQueries({ queryKey: ['pet', id] });

      const previousPets = queryClient.getQueryData(['pets']);
      const previousPet = queryClient.getQueryData(['pet', id]);

      // Update in list
      queryClient.setQueryData(['pets'], (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.map((pet: Pet) =>
              pet.id === id ? { ...pet, ...data, updatedAt: new Date().toISOString() } : pet
            ),
          },
        };
      });

      // Update detail
      queryClient.setQueryData(['pet', id], (old: any) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      return { previousPets, previousPet };
    },

    onError: (err, { id }, context) => {
      console.error('[useUpdatePet] Error:', err);
      if (context?.previousPets) {
        queryClient.setQueryData(['pets'], context.previousPets);
      }
      if (context?.previousPet) {
        queryClient.setQueryData(['pet', id], context.previousPet);
      }
    },

    onSuccess: async (_data, { id }) => {
      const commands = await db.pendingCommands
        .where('type')
        .equals('UPDATE_PET')
        .toArray();

      for (const cmd of commands) {
        if (cmd.payload.id === id && cmd.status !== 'failed') {
          await db.pendingCommands.delete(cmd.id);
        }
      }

      // Wait for projection
      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ['pets'] });
        await queryClient.invalidateQueries({ queryKey: ['pet', id] });
      }, 500);
    },
  });
}

/**
 * Delete pet mutation (Event Sourcing: PET_DELETED event)
 */
export function useDeletePet({ accessToken, sessionId }: UsePetMutationsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const commandId = `pet-delete-${id}-${Date.now()}`;

      await db.pendingCommands.add({
        id: commandId,
        type: 'DELETE_PET',
        payload: { id },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      });

      return petService.deletePet(id, accessToken, sessionId);
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['pets'] });

      const previousPets = queryClient.getQueryData(['pets']);

      queryClient.setQueryData(['pets'], (old: any) => {
        if (!old?.data?.items) return old;
        return {
          ...old,
          data: {
            ...old.data,
            items: old.data.items.filter((pet: Pet) => pet.id !== id),
          },
        };
      });

      return { previousPets };
    },

    onError: (err, _id, context) => {
      console.error('[useDeletePet] Error:', err);
      if (context?.previousPets) {
        queryClient.setQueryData(['pets'], context.previousPets);
      }
    },

    onSuccess: async (_data, id) => {
      const commands = await db.pendingCommands
        .where('type')
        .equals('DELETE_PET')
        .toArray();

      for (const cmd of commands) {
        if (cmd.payload.id === id && cmd.status !== 'failed') {
          await db.pendingCommands.delete(cmd.id);
        }
      }

      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ['pets'] });
      }, 500);
    },
  });
}
