import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePersistedForm } from './usePersistedForm';
import { db } from '../db/db';

describe('usePersistedForm', () => {
  beforeEach(async () => {
    // Clear database before each test
    await db.formDrafts.clear();
  });

  it('should initialize with no draft', async () => {
    const { result } = renderHook(() =>
      usePersistedForm({
        formId: 'test-form',
        formType: 'breed',
        enabled: true,
      })
    );

    await waitFor(() => {
      expect(result.current.hasDraft).toBe(false);
      expect(result.current.draft).toBeUndefined();
    });
  });

  it('should save draft to IndexedDB', async () => {
    const { result } = renderHook(() =>
      usePersistedForm<{ name: string; petType: string }>({
        formId: 'test-form',
        formType: 'breed',
        enabled: true,
      })
    );

    const formData = { name: 'Golden Retriever', petType: 'dog' };

    // Save draft
    await result.current.saveDraft(formData);

    // Verify it was saved
    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true);
      expect(result.current.draft).toEqual(formData);
    });

    // Verify it's in the database
    const savedDraft = await db.formDrafts.get('test-form');
    expect(savedDraft).toBeDefined();
    expect(savedDraft?.data).toEqual(formData);
    expect(savedDraft?.formType).toBe('breed');
  });

  it('should restore draft on mount', async () => {
    // Pre-populate database with a draft
    const existingData = { name: 'Persian', petType: 'cat' };
    await db.formDrafts.put({
      id: 'test-form-restore',
      formType: 'breed',
      data: existingData,
      updatedAt: Date.now(),
    });

    // Mount hook
    const { result } = renderHook(() =>
      usePersistedForm<{ name: string; petType: string }>({
        formId: 'test-form-restore',
        formType: 'breed',
        enabled: true,
      })
    );

    // Wait for draft to be restored
    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true);
      expect(result.current.draft).toEqual(existingData);
    });
  });

  it('should clear draft from IndexedDB', async () => {
    const { result } = renderHook(() =>
      usePersistedForm<{ name: string; petType: string }>({
        formId: 'test-form-clear',
        formType: 'breed',
        enabled: true,
      })
    );

    const formData = { name: 'Siamese', petType: 'cat' };

    // Save draft first
    await result.current.saveDraft(formData);

    await waitFor(() => {
      expect(result.current.hasDraft).toBe(true);
    });

    // Clear draft
    await result.current.clearDraft();

    // Verify it was cleared
    await waitFor(() => {
      expect(result.current.hasDraft).toBe(false);
      expect(result.current.draft).toBeUndefined();
    });

    // Verify it's removed from database
    const savedDraft = await db.formDrafts.get('test-form-clear');
    expect(savedDraft).toBeUndefined();
  });

  it('should not save when disabled', async () => {
    const { result } = renderHook(() =>
      usePersistedForm<{ name: string; petType: string }>({
        formId: 'test-form-disabled',
        formType: 'breed',
        enabled: false,
      })
    );

    const formData = { name: 'Beagle', petType: 'dog' };

    // Attempt to save
    await result.current.saveDraft(formData);

    // Verify nothing was saved
    const savedDraft = await db.formDrafts.get('test-form-disabled');
    expect(savedDraft).toBeUndefined();
    expect(result.current.hasDraft).toBe(false);
  });

  it('should update draft when data changes', async () => {
    const { result } = renderHook(() =>
      usePersistedForm<{ name: string; petType: string }>({
        formId: 'test-form-update',
        formType: 'breed',
        enabled: true,
      })
    );

    // Save initial draft
    const initialData = { name: 'Labrador', petType: 'dog' };
    await result.current.saveDraft(initialData);

    await waitFor(() => {
      expect(result.current.draft).toEqual(initialData);
    });

    // Update draft
    const updatedData = { name: 'Labrador Retriever', petType: 'dog' };
    await result.current.saveDraft(updatedData);

    await waitFor(() => {
      expect(result.current.draft).toEqual(updatedData);
    });

    // Verify database was updated
    const savedDraft = await db.formDrafts.get('test-form-update');
    expect(savedDraft?.data).toEqual(updatedData);
  });

  it('should handle multiple forms independently', async () => {
    const { result: result1 } = renderHook(() =>
      usePersistedForm<{ name: string }>({
        formId: 'form-1',
        formType: 'breed',
        enabled: true,
      })
    );

    const { result: result2 } = renderHook(() =>
      usePersistedForm<{ name: string }>({
        formId: 'form-2',
        formType: 'pet',
        enabled: true,
      })
    );

    // Save different data to each form
    await result1.current.saveDraft({ name: 'Form 1 Data' });
    await result2.current.saveDraft({ name: 'Form 2 Data' });

    // Verify each has its own draft
    await waitFor(() => {
      expect(result1.current.draft).toEqual({ name: 'Form 1 Data' });
      expect(result2.current.draft).toEqual({ name: 'Form 2 Data' });
    });
  });
});
