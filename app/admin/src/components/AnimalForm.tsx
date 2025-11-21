import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { animalService } from '../services/animal.service';
import { useAuth } from '../../../security/src/contexts/AuthContext';
import type { PetType, CreateAnimalDto, UpdateAnimalDto } from '../types/animal.types';

export const AnimalForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { tokens, sessionId } = useAuth();

  const [formData, setFormData] = useState<CreateAnimalDto>({
    name: '',
    type: 'cat',
    breed: '',
    photoUrl: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadAnimal(id);
    }
  }, [id, isEditing]);

  const loadAnimal = async (animalId: string): Promise<void> => {
    try {
      setLoading(true);
      const animal = await animalService.getAnimalById(animalId);
      setFormData({
        name: animal.name,
        type: animal.type,
        breed: animal.breed,
        photoUrl: animal.photoUrl,
      });
    } catch (err) {
      setError('Failed to load animal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!tokens || !sessionId) {
      setError('You must be logged in');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditing && id) {
        const updateData: UpdateAnimalDto = { ...formData };
        if (!updateData.photoUrl) delete updateData.photoUrl;
        await animalService.updateAnimal(id, updateData, tokens.accessToken, sessionId);
      } else {
        const createData: CreateAnimalDto = { ...formData };
        if (!createData.photoUrl) delete createData.photoUrl;
        await animalService.createAnimal(createData, tokens.accessToken, sessionId);
      }

      navigate('/animals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save animal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading && isEditing) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>{isEditing ? 'Edit Animal' : 'Add New Animal'}</h2>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type *</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
            }}
          >
            <option value="cat">Cat</option>
            <option value="dog">Dog</option>
            <option value="bird">Bird</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Breed *</label>
          <input
            type="text"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Photo URL (leave empty for random)
          </label>
          <input
            type="url"
            name="photoUrl"
            value={formData.photoUrl}
            onChange={handleChange}
            placeholder="https://example.com/photo.jpg"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Animal' : 'Create Animal'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/animals')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
