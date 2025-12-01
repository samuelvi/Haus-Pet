import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { petService } from '../services/pet.service';
import { useAuth } from '../../../security/src/contexts/AuthContext';
import type { Pet, PetType } from '../types/pet.types';

export const PetList: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PetType | ''>('');
  const { tokens, sessionId, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadPets = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await petService.getAllPets();
      const filtered = typeFilter ? data.filter((a) => a.type === typeFilter) : data;
      setPets(filtered);
    } catch (err) {
      setError('Failed to load pets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, [typeFilter]);

  const handleDelete = async (id: string): Promise<void> => {
    if (!tokens || !sessionId) {
      setError('You must be logged in to delete pets');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this pet?')) {
      return;
    }
    try {
      await petService.deletePet(id, tokens.accessToken, sessionId);
      await loadPets();
    } catch (err) {
      setError('Failed to delete pet');
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading pets...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Pets for Sponsorship</h2>
        {isAuthenticated && (
          <button
            onClick={() => navigate('/pets/new')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add New Pet
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as PetType | '')}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ced4da' }}
        >
          <option value="">All Types</option>
          <option value="cat">Cats</option>
          <option value="dog">Dogs</option>
          <option value="bird">Birds</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {pets.map((pet) => (
          <div
            key={pet.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <img
              src={pet.photoUrl}
              alt={pet.name}
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
              onError={(e) => {
                console.error(`Failed to load image for ${pet.name}: ${pet.photoUrl}`);
                // Fallback to a generic pet icon using data URI
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect fill="%23cccccc" width="400" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="%23ffffff"%3E' + pet.type + '%3C/text%3E%3C/svg%3E';
              }}
            />
            <div style={{ padding: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{pet.name}</h3>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Type:</strong>{' '}
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: pet.type === 'dog' ? '#d4edda' : pet.type === 'cat' ? '#fff3cd' : '#cce5ff',
                }}>
                  {pet.type}
                </span>
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Breed:</strong> {pet.breed}
              </p>
              <p style={{ margin: '5px 0', color: '#28a745', fontWeight: 'bold' }}>
                Total Sponsored: ${Number(pet.totalSponsored).toFixed(2)}
              </p>
              {isAuthenticated && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate(`/pets/edit/${pet.id}`)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#ffc107',
                      color: 'black',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pet.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {pets.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          No pets found
        </div>
      )}
    </div>
  );
};
