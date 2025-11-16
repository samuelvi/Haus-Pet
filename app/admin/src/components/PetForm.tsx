import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { petService } from '../services/pet.service';
import { useAuth } from '../../../security/src/contexts/AuthContext';
import { petSchema, type PetFormInputs } from '../schemas/pet.schema';

export const PetForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode: boolean = Boolean(id);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { tokens, sessionId } = useAuth();
  const navigate = useNavigate();

  // Check if client validation should be disabled (for testing server validation)
  const disableClientValidation: boolean = import.meta.env.VITE_DISABLE_CLIENT_VALIDATION === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PetFormInputs>({
    resolver: disableClientValidation ? undefined : zodResolver(petSchema),
    defaultValues: {
      breed: '',
      type: 'dog',
    },
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadPet(parseInt(id, 10));
    }
  }, [id, isEditMode]);

  const loadPet = async (petId: number): Promise<void> => {
    try {
      const pet = await petService.getPetById(petId);
      reset({
        breed: pet.breed,
        type: pet.type,
      });
    } catch (err) {
      setError('Failed to load pet');
      console.error(err);
    }
  };

  const onSubmit = async (data: PetFormInputs): Promise<void> => {
    if (!tokens || !sessionId) {
      setError('You must be logged in to perform this action');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode && id) {
        await petService.updatePet(
          parseInt(id, 10),
          data,
          tokens.accessToken,
          sessionId
        );
      } else {
        await petService.createPet(data, tokens.accessToken, sessionId);
      }
      navigate('/pets');
    } catch (err: any) {
      setError(err.message || 'Failed to save pet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>{isEditMode ? 'Edit Pet' : 'Add New Pet'}</h2>

      {error && (
        <div
          style={{
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="breed"
            style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
          >
            Breed <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            id="breed"
            type="text"
            {...register('breed')}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${errors.breed ? '#dc3545' : '#ced4da'}`,
              borderRadius: '4px',
              fontSize: '16px',
            }}
            placeholder="Enter breed name"
          />
          {errors.breed && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.breed.message}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="type"
            style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
          >
            Type <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            id="type"
            {...register('type')}
            style={{
              width: '100%',
              padding: '10px',
              border: `1px solid ${errors.type ? '#dc3545' : '#ced4da'}`,
              borderRadius: '4px',
              fontSize: '16px',
            }}
          >
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="bird">Bird</option>
          </select>
          {errors.type && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '4px' }}>
              {errors.type.message}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Pet' : 'Create Pet'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/pets')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
