import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api.service';
import type { BreedFormData, Breed, PetType, BreedType } from '../types/api.types';
import { useAuth } from '../contexts/AuthContext';

export const BreedForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { tokens, sessionId } = useAuth();

  const [formData, setFormData] = useState<BreedFormData>({
    name: '',
    petType: 'dog',
  });
  const [breedTypes, setBreedTypes] = useState<BreedType[]>([]);
  const [loading, setLoading] = useState<boolean>(isEditMode);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTypes = async (): Promise<void> => {
      if (!tokens || !sessionId) return;
      try {
        const types = await apiService.getBreedTypes(tokens.accessToken, sessionId);
        setBreedTypes(types);
      } catch (err) {
        // silently ignore to avoid blocking the form; fallback to defaults
        console.warn('Failed to load breed types', err);
      }
    };
    void loadTypes();

    if (!isEditMode || !id) return;

    const fetchBreed = async (): Promise<void> => {
      try {
        setLoading(true);
        const breed: Breed = await apiService.getBreedById(id);
        setFormData({ name: breed.name, petType: breed.petType });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load breed');
      } finally {
        setLoading(false);
      }
    };

    void fetchBreed();
  }, [id, isEditMode, tokens, sessionId]);

  const handleChange = (field: keyof BreedFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value as PetType }));
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!tokens || !sessionId) {
      setError('You must be logged in to manage breeds.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditMode && id) {
        await apiService.updateBreed(id, formData, tokens.accessToken, sessionId);
      } else {
        await apiService.createBreed(formData, tokens.accessToken, sessionId);
      }
      navigate('/admin/breeds');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save breed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{isEditMode ? 'Edit Breed' : 'Add Breed'}</h1>
          <p style={styles.subtitle}>
            {isEditMode
              ? 'Update the breed details'
              : 'Create a new breed for HausPet'}
          </p>
        </div>
        <button style={styles.linkButton} onClick={() => navigate('/admin/breeds')}>
          ← Back to list
        </button>
      </header>

      <div style={styles.card}>
        {error && <div style={styles.error}>{error}</div>}
        {loading ? (
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
                {(breedTypes.length ? breedTypes : [{ id: 'dog', name: 'dog' }, { id: 'cat', name: 'cat' }, { id: 'bird', name: 'bird' }]).map((type) => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
            </label>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => navigate('/admin/breeds')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" style={styles.primaryButton} disabled={submitting}>
                {submitting ? 'Saving...' : isEditMode ? 'Save changes' : 'Create breed'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '30px 40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
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
  linkButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#0d6efd',
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
    gap: '16px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px',
    color: '#333',
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
    gap: '10px',
    marginTop: '10px',
  },
  primaryButton: {
    backgroundColor: '#007bff',
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
    padding: '12px',
    color: '#555',
  },
  error: {
    padding: '12px 14px',
    marginBottom: '12px',
    backgroundColor: '#ffe6e6',
    border: '1px solid #f5c2c2',
    color: '#b71c1c',
    borderRadius: '6px',
  },
};
