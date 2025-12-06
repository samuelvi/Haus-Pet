/**
 * Outbox Pattern Implementation
 * Synchronizes pending commands when network is available
 */

import { db } from '../db/db';
import type { PendingCommand } from '../db/types';
import { petService } from './pet.service';
import { apiService } from './api.service';
import { BroadcastChannel } from 'broadcast-channel';

interface SyncResult {
  synced: number;
  failed: number;
  pending: number;
}

class OutboxSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private syncChannel: BroadcastChannel<{ type: 'sync-complete' }>;
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;

  constructor() {
    // Create broadcast channel for cross-tab communication
    this.syncChannel = new BroadcastChannel('hauspet-sync');

    // Listen to sync completions from other tabs
    this.syncChannel.onmessage = (msg) => {
      if (msg.type === 'sync-complete') {
        console.log('[Outbox] Sync completed in another tab');
      }
    };

    // Listen to online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Start the sync service
   */
  start(): void {
    console.log('[Outbox] Starting sync service');

    // Sync immediately on start if online
    if (this.isOnline) {
      void this.syncPendingCommands();
    }

    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        void this.syncPendingCommands();
      }
    }, 30000);
  }

  /**
   * Stop the sync service
   */
  stop(): void {
    console.log('[Outbox] Stopping sync service');
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('[Outbox] Network connection restored');
    this.isOnline = true;
    void this.syncPendingCommands();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('[Outbox] Network connection lost');
    this.isOnline = false;
  }

  /**
   * Get count of pending commands
   */
  async getPendingCount(): Promise<number> {
    return db.pendingCommands.count();
  }

  /**
   * Sync all pending commands
   */
  async syncPendingCommands(): Promise<SyncResult> {
    if (!this.isOnline) {
      return { synced: 0, failed: 0, pending: 0 };
    }

    if (this.isSyncing) {
      console.log('[Outbox] Sync already in progress, skipping');
      return { synced: 0, failed: 0, pending: 0 };
    }

    this.isSyncing = true;
    console.log('[Outbox] Starting sync of pending commands');

    try {
      // Get all pending and failed commands
      const commands = await db.pendingCommands
        .where('status')
        .anyOf('pending', 'failed')
        .toArray();

      if (commands.length === 0) {
        return { synced: 0, failed: 0, pending: 0 };
      }

      console.log(`[Outbox] Found ${commands.length} commands to sync`);

      let synced = 0;
      let failed = 0;

      for (const command of commands) {
        // Skip commands that have exceeded max retries
        if (command.retries >= 5) {
          console.warn(`[Outbox] Command ${command.id} exceeded max retries, skipping`);
          continue;
        }

        try {
          await this.executeCommand(command);
          await db.pendingCommands.delete(command.id);
          synced++;
          console.log(`[Outbox] Successfully synced command ${command.id} (${command.type})`);
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[Outbox] Failed to sync command ${command.id}:`, errorMessage);

          // Update command status
          await db.pendingCommands.update(command.id, {
            status: 'failed',
            retries: command.retries + 1,
            error: errorMessage,
          });
        }
      }

      const remaining = await db.pendingCommands.count();

      console.log(`[Outbox] Sync complete: ${synced} synced, ${failed} failed, ${remaining} pending`);

      // Notify other tabs
      await this.syncChannel.postMessage({ type: 'sync-complete' });

      return { synced, failed, pending: remaining };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Execute a single command
   */
  private async executeCommand(command: PendingCommand): Promise<void> {
    // Mark as syncing
    await db.pendingCommands.update(command.id, { status: 'syncing' });

    // Get auth from localStorage (since we don't have access to context here)
    const tokensStr = localStorage.getItem('hauspet_tokens');
    const sessionId = localStorage.getItem('hauspet_sessionId');

    if (!tokensStr || !sessionId) {
      throw new Error('No authentication credentials found');
    }

    const tokens = JSON.parse(tokensStr);

    // Execute based on command type
    switch (command.type) {
      case 'CREATE_PET':
        await petService.createPet(command.payload, tokens.accessToken, sessionId);
        break;

      case 'UPDATE_PET':
        await petService.updatePet(
          command.payload.id,
          command.payload,
          tokens.accessToken,
          sessionId
        );
        break;

      case 'DELETE_PET':
        await petService.deletePet(command.payload.id, tokens.accessToken, sessionId);
        break;

      case 'CREATE_BREED':
        await apiService.createBreed(command.payload, tokens.accessToken, sessionId);
        break;

      case 'UPDATE_BREED':
        await apiService.updateBreed(
          command.payload.id,
          command.payload,
          tokens.accessToken,
          sessionId
        );
        break;

      case 'DELETE_BREED':
        await apiService.deleteBreed(command.payload.id, tokens.accessToken, sessionId);
        break;

      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }
  }

  /**
   * Manually trigger sync
   */
  async triggerSync(): Promise<SyncResult> {
    return this.syncPendingCommands();
  }

  /**
   * Clear all failed commands
   */
  async clearFailedCommands(): Promise<number> {
    const failed = await db.pendingCommands
      .where('status')
      .equals('failed')
      .count();

    await db.pendingCommands
      .where('status')
      .equals('failed')
      .delete();

    return failed;
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    this.stop();
    this.syncChannel.close();
    window.removeEventListener('online', () => this.handleOnline());
    window.removeEventListener('offline', () => this.handleOffline());
  }
}

// Singleton instance
export const outboxSync = new OutboxSyncService();
