/**
 * Hook for persisting form data to IndexedDB
 * Auto-saves form changes and restores on mount
 */

import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface UsePersistedFormOptions {
  formId: string;
  formType: 'pet' | 'breed' | 'breedType';
  enabled?: boolean;
}

interface UsePersistedFormReturn<T> {
  draft: T | undefined;
  saveDraft: (data: T) => Promise<void>;
  clearDraft: () => Promise<void>;
  hasDraft: boolean;
}

/**
 * Persist form data to IndexedDB with auto-save and restoration
 *
 * @example
 * ```tsx
 * const { draft, saveDraft, clearDraft, hasDraft } = usePersistedForm({
 *   formId: 'breed-form-create',
 *   formType: 'breed'
 * });
 *
 * // Restore draft on mount
 * useEffect(() => {
 *   if (draft) {
 *     form.reset(draft);
 *   }
 * }, [draft]);
 *
 * // Auto-save on change
 * useEffect(() => {
 *   const subscription = form.watch((value) => {
 *     saveDraft(value);
 *   });
 *   return () => subscription.unsubscribe();
 * }, []);
 * ```
 */
export function usePersistedForm<T extends Record<string, any>>({
  formId,
  formType,
  enabled = true,
}: UsePersistedFormOptions): UsePersistedFormReturn<T> {
  // Load draft from IndexedDB (reactive query)
  const draftRecord = useLiveQuery(
    () => (enabled ? db.formDrafts.get(formId) : undefined),
    [formId, enabled]
  );

  const draft = draftRecord?.data as T | undefined;
  const hasDraft = Boolean(draft);

  /**
   * Save form data to IndexedDB
   */
  const saveDraft = async (data: T): Promise<void> => {
    if (!enabled) return;

    try {
      await db.formDrafts.put({
        id: formId,
        formType,
        data,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('[usePersistedForm] Failed to save draft:', error);
    }
  };

  /**
   * Clear draft from IndexedDB
   */
  const clearDraft = async (): Promise<void> => {
    try {
      await db.formDrafts.delete(formId);
    } catch (error) {
      console.error('[usePersistedForm] Failed to clear draft:', error);
    }
  };

  return {
    draft,
    saveDraft,
    clearDraft,
    hasDraft,
  };
}
