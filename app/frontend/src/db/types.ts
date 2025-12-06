/**
 * Types for IndexedDB storage
 */

export interface FormDraft {
  id: string;
  formType: 'pet' | 'breed' | 'breedType';
  data: Record<string, any>;
  updatedAt: number;
}

export interface PendingCommand {
  id: string;
  type: 'CREATE_PET' | 'UPDATE_PET' | 'DELETE_PET' | 'CREATE_BREED' | 'UPDATE_BREED' | 'DELETE_BREED';
  payload: Record<string, any>;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

export interface CachedEntity {
  id: string;
  data: Record<string, any>;
  cachedAt: number;
  expiresAt: number;
}
