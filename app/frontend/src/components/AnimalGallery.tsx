import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { animalService } from '../services/animal.service';
import type { Animal, PetType } from '../types/animal.types';

export const AnimalGallery: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PetType | ''>('');
  const navigate = useNavigate();

  const loadAnimals = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      let data: Animal[];
      if (typeFilter) {
        data = await animalService.getAnimalsByType(typeFilter);
      } else {
        data = await animalService.getAllAnimals();
      }
      setAnimals(data);
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px' }}>Loading adorable animals...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '10px' }}>
          🐾 Animal Sponsorship Gallery
        </h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
          Help our furry friends by sponsoring them today!
        </p>
      </div>

      {error && (
        <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setTypeFilter('')}
          style={{
            padding: '12px 24px',
            backgroundColor: typeFilter === '' ? '#3498db' : '#ecf0f1',
            color: typeFilter === '' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'all 0.3s',
          }}
        >
          All Animals
        </button>
        <button
          onClick={() => setTypeFilter('cat')}
          style={{
            padding: '12px 24px',
            backgroundColor: typeFilter === 'cat' ? '#e67e22' : '#ecf0f1',
            color: typeFilter === 'cat' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}
        >
          🐱 Cats
        </button>
        <button
          onClick={() => setTypeFilter('dog')}
          style={{
            padding: '12px 24px',
            backgroundColor: typeFilter === 'dog' ? '#27ae60' : '#ecf0f1',
            color: typeFilter === 'dog' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}
        >
          🐕 Dogs
        </button>
        <button
          onClick={() => setTypeFilter('bird')}
          style={{
            padding: '12px 24px',
            backgroundColor: typeFilter === 'bird' ? '#9b59b6' : '#ecf0f1',
            color: typeFilter === 'bird' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}
        >
          🐦 Birds
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
        {animals.map((animal) => (
          <div
            key={animal.id}
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#fff',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/animals/${animal.id}`)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={animal.photoUrl}
                alt={animal.name}
                style={{ width: '100%', height: '250px', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/400x250/gray/white?text=${animal.type}`;
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: animal.type === 'dog' ? '#27ae60' : animal.type === 'cat' ? '#e67e22' : '#9b59b6',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  textTransform: 'capitalize',
                }}
              >
                {animal.type}
              </span>
            </div>
            <div style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: '#2c3e50' }}>{animal.name}</h3>
              <p style={{ margin: '5px 0', color: '#7f8c8d' }}>
                Breed: <strong>{animal.breed}</strong>
              </p>
              <div
                style={{
                  marginTop: '15px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Total Sponsored</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#27ae60' }}>
                  ${Number(animal.totalSponsored).toFixed(2)}
                </div>
              </div>
              <button
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '14px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/animals/${animal.id}`);
                }}
              >
                ❤️ Sponsor {animal.name}
              </button>
            </div>
          </div>
        ))}
      </div>

      {animals.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#7f8c8d' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🐾</div>
          <p style={{ fontSize: '1.2rem' }}>No animals found. Check back soon!</p>
        </div>
      )}
    </div>
  );
};
