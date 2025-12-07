import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateBreed, useUpdateBreed, useDeleteBreed } from './useBreedMutations';
import { db } from '../db/db';
import type { ReactNode } from 'react';

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBreedMutations', () => {
  const mockAuth = {
    accessToken: 'test-token',
    sessionId: 'test-session',
  };

  beforeEach(async () => {
    // Clear database before each test
    await db.pendingCommands.clear();
  });

  describe('useCreateBreed', () => {
    it('should add command to outbox on create', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateBreed(mockAuth), { wrapper });

      const newBreed = {
        name: 'Golden Retriever',
        petType: 'dog' as const,
      };

      // Trigger mutation
      result.current.mutate(newBreed);

      // Wait for mutation to settle
      await waitFor(
        () => {
          expect(result.current.isPending).toBe(false);
        },
        { timeout: 3000 }
      );

      // Verify command was added to outbox
      const commands = await db.pendingCommands.toArray();
      expect(commands.length).toBeGreaterThan(0);

      const createCommand = commands.find(cmd => cmd.type === 'CREATE_BREED');
      expect(createCommand).toBeDefined();
      expect(createCommand?.payload).toEqual(newBreed);
      expect(createCommand?.status).toBe('pending');
    });
  });

  describe('useUpdateBreed', () => {
    it('should add command to outbox on update', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateBreed(mockAuth), { wrapper });

      const updateData = {
        id: 'breed-1',
        data: {
          name: 'Updated Breed Name',
          petType: 'dog' as const,
        },
      };

      result.current.mutate(updateData);

      // Wait for mutation to settle
      await waitFor(
        () => {
          expect(result.current.isPending).toBe(false);
        },
        { timeout: 3000 }
      );

      // Verify command was added to outbox
      const commands = await db.pendingCommands.toArray();
      const updateCommand = commands.find(cmd => cmd.type === 'UPDATE_BREED');

      expect(updateCommand).toBeDefined();
      expect(updateCommand?.payload).toHaveProperty('id', 'breed-1');
    });
  });

  describe('useDeleteBreed', () => {
    it('should add command to outbox on delete', async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeleteBreed(mockAuth), { wrapper });

      const breedId = 'breed-to-delete';

      result.current.mutate(breedId);

      // Wait for mutation to settle
      await waitFor(
        () => {
          expect(result.current.isPending).toBe(false);
        },
        { timeout: 3000 }
      );

      // Verify command was added to outbox
      const commands = await db.pendingCommands.toArray();
      const deleteCommand = commands.find(cmd => cmd.type === 'DELETE_BREED');

      expect(deleteCommand).toBeDefined();
      expect(deleteCommand?.payload).toHaveProperty('id', breedId);
    });
  });

  describe('Outbox Integration', () => {
    it('should queue multiple mutations in order', async () => {
      const wrapper = createWrapper();

      const { result: createResult } = renderHook(
        () => useCreateBreed(mockAuth),
        { wrapper }
      );
      const { result: updateResult } = renderHook(
        () => useUpdateBreed(mockAuth),
        { wrapper }
      );
      const { result: deleteResult } = renderHook(
        () => useDeleteBreed(mockAuth),
        { wrapper }
      );

      // Execute mutations
      createResult.current.mutate({ name: 'Breed 1', petType: 'dog' });
      updateResult.current.mutate({ id: 'breed-2', data: { name: 'Updated', petType: 'cat' } });
      deleteResult.current.mutate('breed-3');

      // Wait for all mutations to settle
      await waitFor(
        () => {
          expect(createResult.current.isPending).toBe(false);
          expect(updateResult.current.isPending).toBe(false);
          expect(deleteResult.current.isPending).toBe(false);
        },
        { timeout: 3000 }
      );

      // Verify all commands in outbox
      const commands = await db.pendingCommands.toArray();
      expect(commands.length).toBeGreaterThanOrEqual(3);

      const types = commands.map(cmd => cmd.type);
      expect(types).toContain('CREATE_BREED');
      expect(types).toContain('UPDATE_BREED');
      expect(types).toContain('DELETE_BREED');
    });
  });
});
