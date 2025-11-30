import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { petService } from '../services/pet.service';
import { useAuth } from '../contexts/AuthContext';
import type { CreatePetInput, Pet, PetType, UpdatePetInput } from '../types/pet.types';
import type { BreedType } from '../types/api.types';
import { AdminNav } from './AdminNav';

export const PetAdminForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { tokens, sessionId } = useAuth();

  const [formData, setFormData] = useState<CreatePetInput>({
    name: '',
    type: 'dog',
    breed: '',
    photoUrl: '',
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
        console.warn('Failed to load breed types', err);
      }
    };
    void loadTypes();

    if (!isEditMode || !id) return;

    const fetchPet = async (): Promise<void> => {
      try {
        setLoading(true);
        const pet: Pet = await petService.getPetById(id);
        setFormData({
          name: pet.name,
          type: pet.type,
          breed: pet.breed,
          photoUrl: pet.photoUrl,
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pet');
      } finally {
        setLoading(false);
      }
    };

    void fetchPet();
  }, [id, isEditMode, tokens, sessionId]);

  const handleChange = (field: keyof CreatePetInput, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value as PetType }));
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!tokens || !sessionId) {
      setError('You must be logged in to manage pets.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditMode && id) {
        const payload: UpdatePetInput = {
          name: formData.name,
          type: formData.type,
          breed: formData.breed,
          photoUrl: formData.photoUrl || undefined,
        };
        await petService.updatePet(id, payload, tokens.accessToken, sessionId);
      } else {
        const payload: CreatePetInput = {
          name: formData.name,
          type: formData.type,
          breed: formData.breed,
          photoUrl: formData.photoUrl || undefined,
        };
        await petService.createPet(payload, tokens.accessToken, sessionId);
      }
      navigate('/admin/pets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pet');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminNav />
      <div style={styles.container}>
        <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{isEditMode ? 'Edit Pet' : 'Add Pet'}</h1>
          <p style={styles.subtitle}>
            {isEditMode
              ? 'Update a pet through the event-sourced workflow'
              : 'Create a new pet; if no photo is provided, a random one will be fetched for the type.'}
          </p>
        </div>
        <button style={styles.linkButton} onClick={() => navigate('/admin/pets')}>
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
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                style={styles.select}
              >
                {(breedTypes.length ? breedTypes : [{ id: 'dog', name: 'dog' }, { id: 'cat', name: 'cat' }, { id: 'bird', name: 'bird' }]).map((type) => (
                  <option key={type.id} value={type.name}>{type.name}</option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Breed
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => handleChange('breed', e.target.value)}
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Photo URL (optional)
              <input
                type="url"
                value={formData.photoUrl ?? ''}
                onChange={(e) => handleChange('photoUrl', e.target.value)}
                placeholder="Leave empty to auto-generate per type"
                style={styles.input}
              />
            </label>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => navigate('/admin/pets')}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" style={styles.primaryButton} disabled={submitting}>
                {submitting ? 'Saving...' : isEditMode ? 'Save changes' : 'Create pet'}
              </button>
            </div>
          </form>
        )}
      </div>
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
    padding: '40px 20px',
    textAlign: 'center',
    color: '#555',
  },
  error: {
    padding: '14px 18px',
    marginBottom: '20px',
    backgroundColor: '#ffe6e6',
    border: '1px solid #f5c2c2',
    color: '#b71c1c',
    borderRadius: '6px',
  },
};
