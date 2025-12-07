import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../db/db';
import type { PendingCommand } from '../db/types';

describe('OutboxSyncService - Database Integration', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.pendingCommands.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await db.pendingCommands.clear();
  });

  describe('Pending Commands Queue', () => {
    it('should add CREATE_BREED command to queue', async () => {
      const command: PendingCommand = {
        id: 'cmd-1',
        type: 'CREATE_BREED',
        payload: { name: 'Golden Retriever', petType: 'dog' },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };

      await db.pendingCommands.add(command);

      const savedCommand = await db.pendingCommands.get('cmd-1');
      expect(savedCommand).toBeDefined();
      expect(savedCommand?.type).toBe('CREATE_BREED');
      expect(savedCommand?.status).toBe('pending');
      expect(savedCommand?.payload).toEqual({ name: 'Golden Retriever', petType: 'dog' });
    });

    it('should add UPDATE_BREED command to queue', async () => {
      const command: PendingCommand = {
        id: 'cmd-2',
        type: 'UPDATE_BREED',
        payload: { id: 'breed-1', name: 'Updated Name', petType: 'cat' },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };

      await db.pendingCommands.add(command);

      const savedCommand = await db.pendingCommands.get('cmd-2');
      expect(savedCommand).toBeDefined();
      expect(savedCommand?.type).toBe('UPDATE_BREED');
    });

    it('should add DELETE_BREED command to queue', async () => {
      const command: PendingCommand = {
        id: 'cmd-3',
        type: 'DELETE_BREED',
        payload: { id: 'breed-1' },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };

      await db.pendingCommands.add(command);

      const savedCommand = await db.pendingCommands.get('cmd-3');
      expect(savedCommand).toBeDefined();
      expect(savedCommand?.type).toBe('DELETE_BREED');
    });

    it('should add CREATE_PET command to queue', async () => {
      const command: PendingCommand = {
        id: 'cmd-4',
        type: 'CREATE_PET',
        payload: {
          name: 'Max',
          type: 'dog',
          breed: 'Golden Retriever',
          photoUrl: 'https://example.com/max.jpg',
        },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };

      await db.pendingCommands.add(command);

      const savedCommand = await db.pendingCommands.get('cmd-4');
      expect(savedCommand).toBeDefined();
      expect(savedCommand?.type).toBe('CREATE_PET');
    });

    it('should store multiple commands in order', async () => {
      const commands: PendingCommand[] = [
        {
          id: 'cmd-1',
          type: 'CREATE_BREED',
          payload: { name: 'Breed 1', petType: 'dog' },
          timestamp: Date.now(),
          retries: 0,
          status: 'pending',
        },
        {
          id: 'cmd-2',
          type: 'CREATE_BREED',
          payload: { name: 'Breed 2', petType: 'cat' },
          timestamp: Date.now() + 1,
          retries: 0,
          status: 'pending',
        },
        {
          id: 'cmd-3',
          type: 'CREATE_PET',
          payload: { name: 'Pet 1', type: 'dog', breed: 'Breed 1' },
          timestamp: Date.now() + 2,
          retries: 0,
          status: 'pending',
        },
      ];

      await db.pendingCommands.bulkAdd(commands);

      const allCommands = await db.pendingCommands.toArray();
      expect(allCommands.length).toBe(3);

      const types = allCommands.map(cmd => cmd.type);
      expect(types).toContain('CREATE_BREED');
      expect(types).toContain('CREATE_PET');
    });
  });

  describe('Command Status Management', () => {
    it('should update command status', async () => {
      const command: PendingCommand = {
        id: 'cmd-status',
        type: 'CREATE_BREED',
        payload: { name: 'Test Breed', petType: 'dog' },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };

      await db.pendingCommands.add(command);

      // Update status to syncing
      await db.pendingCommands.update('cmd-status', { status: 'syncing' });

      const updatedCommand = await db.pendingCommands.get('cmd-status');
      expect(updatedCommand?.status).toBe('syncing');
    });

    it('should increment retry count', async () => {
      const command: PendingCommand = {
        id: 'cmd-retry',
        type: 'CREATE_BREED',
        payload: { name: 'Test Breed', petType: 'dog' },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };

      await db.pendingCommands.add(command);

      // Increment retries
      await db.pendingCommands.update('cmd-retry', { retries: 1 });

      const updatedCommand = await db.pendingCommands.get('cmd-retry');
      expect(updatedCommand?.retries).toBe(1);
    });

    it('should mark command as failed with error', async () => {
      const command: PendingCommand = {
        id: 'cmd-failed',
        type: 'CREATE_BREED',
        payload: { name: 'Test Breed', petType: 'dog' },
        timestamp: Date.now(),
        retries: 5,
        status: 'pending',
      };

      await db.pendingCommands.add(command);

      // Mark as failed
      await db.pendingCommands.update('cmd-failed', {
        status: 'failed',
        error: 'Max retries exceeded',
      });

      const failedCommand = await db.pendingCommands.get('cmd-failed');
      expect(failedCommand?.status).toBe('failed');
      expect(failedCommand?.error).toBe('Max retries exceeded');
    });

    it('should delete completed commands', async () => {
      const command: PendingCommand = {
        id: 'cmd-delete',
        type: 'CREATE_BREED',
        payload: { name: 'Test Breed', petType: 'dog' },
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };

      await db.pendingCommands.add(command);

      // Simulate successful sync - delete command
      await db.pendingCommands.delete('cmd-delete');

      const deletedCommand = await db.pendingCommands.get('cmd-delete');
      expect(deletedCommand).toBeUndefined();
    });
  });

  describe('Query Commands', () => {
    it('should query pending commands', async () => {
      await db.pendingCommands.bulkAdd([
        {
          id: 'cmd-1',
          type: 'CREATE_BREED',
          payload: { name: 'Breed 1', petType: 'dog' },
          timestamp: Date.now(),
          retries: 0,
          status: 'pending',
        },
        {
          id: 'cmd-2',
          type: 'CREATE_BREED',
          payload: { name: 'Breed 2', petType: 'cat' },
          timestamp: Date.now(),
          retries: 0,
          status: 'syncing',
        },
        {
          id: 'cmd-3',
          type: 'CREATE_BREED',
          payload: { name: 'Breed 3', petType: 'bird' },
          timestamp: Date.now(),
          retries: 0,
          status: 'failed',
        },
      ]);

      const pendingCommands = await db.pendingCommands
        .where('status')
        .equals('pending')
        .toArray();

      expect(pendingCommands.length).toBe(1);
      expect(pendingCommands[0].id).toBe('cmd-1');
    });

    it('should query failed commands', async () => {
      await db.pendingCommands.bulkAdd([
        {
          id: 'cmd-1',
          type: 'CREATE_BREED',
          payload: { name: 'Breed 1', petType: 'dog' },
          timestamp: Date.now(),
          retries: 0,
          status: 'pending',
        },
        {
          id: 'cmd-2',
          type: 'CREATE_BREED',
          payload: { name: 'Breed 2', petType: 'cat' },
          timestamp: Date.now(),
          retries: 5,
          status: 'failed',
          error: 'Network error',
        },
      ]);

      const failedCommands = await db.pendingCommands
        .where('status')
        .equals('failed')
        .toArray();

      expect(failedCommands.length).toBe(1);
      expect(failedCommands[0].id).toBe('cmd-2');
      expect(failedCommands[0].error).toBe('Network error');
    });

    it('should clear all failed commands', async () => {
      await db.pendingCommands.bulkAdd([
        {
          id: 'cmd-1',
          type: 'CREATE_BREED',
          payload: { name: 'Breed 1', petType: 'dog' },
          timestamp: Date.now(),
          retries: 0,
          status: 'pending',
        },
        {
          id: 'cmd-2',
          type: 'CREATE_BREED',
          payload: { name: 'Breed 2', petType: 'cat' },
          timestamp: Date.now(),
          retries: 5,
          status: 'failed',
        },
        {
          id: 'cmd-3',
          type: 'CREATE_BREED',
          payload: { name: 'Breed 3', petType: 'bird' },
          timestamp: Date.now(),
          retries: 5,
          status: 'failed',
        },
      ]);

      // Delete all failed commands
      await db.pendingCommands
        .where('status')
        .equals('failed')
        .delete();

      const remainingCommands = await db.pendingCommands.toArray();
      expect(remainingCommands.length).toBe(1);
      expect(remainingCommands[0].status).toBe('pending');
    });
  });
});
