import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { BreedFormData, PetType } from '../types/api.types';
import { useAuth } from '../contexts/AuthContext';
import { AdminNav } from './AdminNav';
import { usePersistedForm } from '../hooks/usePersistedForm';
import { useCreateBreed, useUpdateBreed } from '../hooks/useBreedMutations';
import { useBreed, useSimilarBreeds, useBreedTypes } from '../hooks/useBreedQueries';

export const BreedForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { tokens, sessionId } = useAuth();

  // Form state
  const [formData, setFormData] = useState<BreedFormData>({
    name: '',
    petType: 'dog',
  });
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [checkSimilar, setCheckSimilar] = useState<boolean>(false);

  // Persisted form (auto-save to IndexedDB)
  const formId = isEditMode ? `breed-form-edit-${id}` : 'breed-form-create';
  const { draft, saveDraft, clearDraft, hasDraft } = usePersistedForm<BreedFormData>({
    formId,
    formType: 'breed',
    enabled: !isEditMode, // Only persist for create mode
  });

  // Queries
  const { data: breed, isLoading: loadingBreed } = useBreed(id || '');
  const { data: breedTypes } = useBreedTypes(tokens?.accessToken || undefined, sessionId || undefined);
  const { data: similarBreeds = [], isFetching: checkingSimilar } = useSimilarBreeds(
    formData.name,
    formData.petType,
    checkSimilar
  );

  // Mutations
  const createMutation = useCreateBreed({
    accessToken: tokens?.accessToken || '',
    sessionId: sessionId || '',
  });
  const updateMutation = useUpdateBreed({
    accessToken: tokens?.accessToken || '',
    sessionId: sessionId || '',
  });

  const submitting = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  // Restore draft on mount (create mode only)
  useEffect(() => {
    if (!isEditMode && draft && !formData.name) {
      setFormData(draft);
    }
  }, [draft, isEditMode]);

  // Load breed data in edit mode
  useEffect(() => {
    if (isEditMode && breed) {
      setFormData({ name: breed.name, petType: breed.petType });
    }
  }, [breed, isEditMode]);

  // Auto-save form data
  useEffect(() => {
    if (!isEditMode && formData.name) {
      saveDraft(formData);
    }
  }, [formData, isEditMode, saveDraft]);

  const handleChange = (field: keyof BreedFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value as PetType }));

    // Reset similar breeds when changing name or type
    if (field === 'name' || field === 'petType') {
      setCheckSimilar(false);
      setShowConfirmModal(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent, forceCreate: boolean = false): Promise<void> => {
    event.preventDefault();

    if (!tokens || !sessionId) {
      return;
    }

    // Check for similar breeds before creating (unless forcing creation or editing)
    if (!forceCreate && !isEditMode && formData.name.trim()) {
      setCheckSimilar(true);

      // Wait a bit for query to complete
      setTimeout(() => {
        if (similarBreeds.length > 0) {
          // Filter out current breed if editing
          const filteredSimilar = isEditMode && id
            ? similarBreeds.filter(b => b.id !== id)
            : similarBreeds;

          if (filteredSimilar.length > 0) {
            setShowConfirmModal(true);
            setCheckSimilar(false);
            return;
          }
        }

        // No similar breeds, proceed
        submitForm();
      }, 500);
      return;
    }

    await submitForm();
  };

  const submitForm = async (): Promise<void> => {
    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
        await clearDraft(); // Clear draft after successful creation
      }
      navigate('/admin/breeds');
    } catch (err) {
      // Error is already stored in mutation state
      console.error('Failed to save breed:', err);

      if (showConfirmModal) {
        setShowConfirmModal(false);
      }
    }
  };

  const handleConfirmCreate = async (): Promise<void> => {
    setShowConfirmModal(false);
    await submitForm();
  };

  // Filter out current breed from similar results
  const filteredSimilar = similarBreeds.filter(b => !id || b.id !== id);

  return (
    <>
      <AdminNav />
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>{isEditMode ? 'Edit Breed' : 'Add Breed'}</h1>
            <p style={styles.subtitle}>
              {isEditMode
                ? 'Update the breed details'
                : 'Create a new breed for HausPet'}
              {hasDraft && !isEditMode && (
                <span style={styles.draftBadge}> (Draft restored)</span>
              )}
            </p>
          </div>
          <button style={styles.linkButton} onClick={() => navigate('/admin/breeds')}>
            ← Back to list
          </button>
        </header>

        <div style={styles.card}>
          {error && (
            <div style={styles.error}>
              {error instanceof Error ? error.message : 'Failed to save breed'}
            </div>
          )}
          {loadingBreed ? (
            <div style={styles.loading}>Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>
                Name
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                Type
                <select
                  value={formData.petType}
                  onChange={(e) => handleChange('petType', e.target.value)}
                  style={styles.select}
                >
                  {(breedTypes?.length ? breedTypes : [
                    { id: 'dog', name: 'dog' },
                    { id: 'cat', name: 'cat' },
                    { id: 'bird', name: 'bird' }
                  ]).map((type) => (
                    <option key={type.id} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </label>

              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => navigate('/admin/breeds')}
                  disabled={submitting || checkingSimilar}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={submitting || checkingSimilar}
                >
                  {checkingSimilar
                    ? 'Checking...'
                    : submitting
                    ? 'Saving...'
                    : isEditMode
                    ? 'Save changes'
                    : 'Create breed'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Confirmation Modal for Similar Breeds */}
        {showConfirmModal && filteredSimilar.length > 0 && (
          <div style={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Similar Breeds Found</h2>
                <button
                  style={styles.modalCloseButton}
                  onClick={() => setShowConfirmModal(false)}
                >
                  ×
                </button>
              </div>

              <div style={styles.modalBody}>
                {filteredSimilar.some(b => b.similarity === 100) ? (
                  <>
                    <p style={styles.modalDescriptionError}>
                      ⚠️ A breed with this exact name already exists!
                    </p>
                    <p style={styles.modalDescription}>
                      You cannot create a duplicate breed. Please use a different name.
                    </p>
                  </>
                ) : (
                  <p style={styles.modalDescription}>
                    The following similar breeds already exist. Are you sure you want to create "{formData.name}"?
                  </p>
                )}

                <div style={styles.similarBreedsList}>
                  {filteredSimilar.map((breed) => (
                    <div key={breed.id} style={styles.similarBreedItem}>
                      <div style={styles.similarBreedInfo}>
                        <span style={styles.similarBreedName}>{breed.name}</span>
                        <span style={styles.similarBreedType}>{breed.petType}</span>
                      </div>
                      <div
                        style={{
                          ...styles.similarityBadge,
                          ...(breed.similarity === 100 ? styles.similarityBadgeExact : {})
                        }}
                      >
                        {breed.similarity === 100 ? 'EXACT MATCH' : `${breed.similarity}% match`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => setShowConfirmModal(false)}
                >
                  {filteredSimilar.some(b => b.similarity === 100) ? 'Close' : 'Cancel'}
                </button>
                {!filteredSimilar.some(b => b.similarity === 100) && (
                  <button
                    style={styles.primaryButton}
                    onClick={() => void handleConfirmCreate()}
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Anyway'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: 'calc(100vh - 64px)',
    backgroundColor: '#f5f5f5',
    padding: '40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#222',
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: '#666',
    fontSize: '14px',
  },
  draftBadge: {
    color: '#6B553D',
    fontWeight: 600,
    fontSize: '12px',
  },
  linkButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6B553D',
    cursor: 'pointer',
    fontWeight: 600,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '24px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '14px',
    color: '#333',
    fontWeight: 500,
  },
  input: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  select: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
  },
  primaryButton: {
    backgroundColor: '#6B553D',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 18px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    color: '#444',
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '12px 18px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loading: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#555',
  },
  error: {
    padding: '14px 18px',
    marginBottom: '20px',
    backgroundColor: '#fdf6f0',
    border: '1px solid #f5d5bc',
    color: '#843a23',
    borderRadius: '6px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px',
    borderBottom: '1px solid #e0e0e0',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#222',
  },
  modalCloseButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '28px',
    color: '#666',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '24px',
  },
  modalDescription: {
    margin: '0 0 20px 0',
    color: '#555',
    fontSize: '15px',
    lineHeight: '1.5',
  },
  modalDescriptionError: {
    margin: '0 0 12px 0',
    color: '#c45a2f',
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: '1.5',
  },
  similarBreedsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  similarBreedItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  similarBreedInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  similarBreedName: {
    fontWeight: 600,
    color: '#222',
    fontSize: '15px',
  },
  similarBreedType: {
    fontSize: '13px',
    color: '#666',
    textTransform: 'capitalize',
  },
  similarityBadge: {
    backgroundColor: '#fdf5e1',
    color: '#774f06',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    border: '1px solid #f5d785',
  },
  similarityBadgeExact: {
    backgroundColor: '#faeade',
    color: '#a44726',
    border: '1px solid #efb890',
    fontWeight: 700,
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e0e0e0',
  },
};
