/**
 * Dexie.js Database Configuration
 * IndexedDB database for offline persistence
 */

import Dexie, { type EntityTable } from 'dexie';
import type { FormDraft, PendingCommand, CachedEntity } from './types';

export class HausPetDB extends Dexie {
  formDrafts!: EntityTable<FormDraft, 'id'>;
  pendingCommands!: EntityTable<PendingCommand, 'id'>;
  cachedEntities!: EntityTable<CachedEntity, 'id'>;

  constructor() {
    super('HausPetDB');

    // Define schema
    this.version(1).stores({
      formDrafts: 'id, formType, updatedAt',
      pendingCommands: 'id, type, timestamp, status',
      cachedEntities: 'id, cachedAt, expiresAt'
    });
  }

  /**
   * Clear all expired cached entities
   */
  async clearExpiredCache(): Promise<void> {
    const now = Date.now();
    await this.cachedEntities
      .where('expiresAt')
      .below(now)
      .delete();
  }

  /**
   * Clear all form drafts older than 7 days
   */
  async clearOldDrafts(): Promise<void> {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    await this.formDrafts
      .where('updatedAt')
      .below(sevenDaysAgo)
      .delete();
  }

  /**
   * Get failed commands that need user attention
   */
  async getFailedCommands(): Promise<PendingCommand[]> {
    return this.pendingCommands
      .where('status')
      .equals('failed')
      .and(cmd => cmd.retries >= 5)
      .toArray();
  }
}

export const db = new HausPetDB();

// Cleanup old data on initialization
db.clearExpiredCache().catch(console.error);
db.clearOldDrafts().catch(console.error);
