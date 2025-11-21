import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { animalService } from '../services/animal.service';
import { useAuth } from '../../../security/src/contexts/AuthContext';
import type { Animal, PetType } from '../types/animal.types';

export const AnimalList: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PetType | ''>('');
  const { tokens, sessionId, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const loadAnimals = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await animalService.getAllAnimals();
      const filtered = typeFilter ? data.filter((a) => a.type === typeFilter) : data;
      setAnimals(filtered);
    } catch (err) {
      setError('Failed to load animals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnimals();
  }, [typeFilter]);

  const handleDelete = async (id: string): Promise<void> => {
    if (!tokens || !sessionId) {
      setError('You must be logged in to delete animals');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this animal?')) {
      return;
    }
    try {
      await animalService.deleteAnimal(id, tokens.accessToken, sessionId);
      await loadAnimals();
    } catch (err) {
      setError('Failed to delete animal');
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading animals...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Animals for Sponsorship</h2>
        {isAuthenticated && (
          <button
            onClick={() => navigate('/animals/new')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add New Animal
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
        {animals.map((animal) => (
          <div
            key={animal.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <img
              src={animal.photoUrl}
              alt={animal.name}
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://placehold.co/400x200/gray/white?text=${animal.type}`;
              }}
            />
            <div style={{ padding: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{animal.name}</h3>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Type:</strong>{' '}
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: animal.type === 'dog' ? '#d4edda' : animal.type === 'cat' ? '#fff3cd' : '#cce5ff',
                }}>
                  {animal.type}
                </span>
              </p>
              <p style={{ margin: '5px 0', color: '#666' }}>
                <strong>Breed:</strong> {animal.breed}
              </p>
              <p style={{ margin: '5px 0', color: '#28a745', fontWeight: 'bold' }}>
                Total Sponsored: ${Number(animal.totalSponsored).toFixed(2)}
              </p>
              {isAuthenticated && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate(`/animals/edit/${animal.id}`)}
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
                    onClick={() => handleDelete(animal.id)}
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

      {animals.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          No animals found
        </div>
      )}
    </div>
  );
};
