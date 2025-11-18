import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';
import type { Pet, PetType, PetFilters } from '../types/api.types';

export const PetList: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PetType | ''>('');
  const [searchText, setSearchText] = useState<string>('');
  const { tokens, sessionId, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isAdmin: boolean = user?.role === 'ADMIN';

  const loadPets = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const filters: PetFilters = {};
      if (typeFilter) {
        filters.type = typeFilter;
      }
      if (searchText.trim()) {
        filters.search = searchText.trim();
      }

      const data = await apiService.getAllPets(filters);
      setPets(data);
    } catch (err) {
      setError('Failed to load pets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const handleDelete = async (id: number): Promise<void> => {
    if (!tokens || !sessionId) {
      setError('You must be logged in to delete pets');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this pet?')) {
      return;
    }

    try {
      await apiService.deletePet(id, tokens.accessToken, sessionId);
      await loadPets(); // Reload the list
    } catch (err) {
      setError('Failed to delete pet');
      console.error(err);
    }
  };

  const handleClearFilters = async (): Promise<void> => {
    setTypeFilter('');
    setSearchText('');
    // Reload pets without filters
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllPets();
      setPets(data);
    } catch (err) {
      setError('Failed to load pets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading pets...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Pet Breeds</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAuthenticated && !isAdmin && (
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Admin Login
            </button>
          )}
          {isAdmin && (
            <>
              <button
                onClick={() => navigate('/admin/dashboard')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/admin/pets/new')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Add New Pet
              </button>
            </>
          )}
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Admin Login
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Filter Controls */}
      <div style={{
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        marginBottom: '20px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label htmlFor="typeFilter" style={{ fontSize: '14px', fontWeight: 'bold', color: '#495057' }}>
            Pet Type:
          </label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PetType | '')}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              minWidth: '150px',
            }}
          >
            <option value="">All Types</option>
            <option value="cat">Cat</option>
            <option value="dog">Dog</option>
            <option value="bird">Bird</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '200px' }}>
          <label htmlFor="searchText" style={{ fontSize: '14px', fontWeight: 'bold', color: '#495057' }}>
            Search Breed:
          </label>
          <input
            id="searchText"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter breed name..."
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-end' }}>
          <button
            onClick={() => loadPets()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Listar
          </button>
          <button
            onClick={handleClearFilters}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Breed</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Type</th>
            {isAdmin && (
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {pets.map((pet) => (
            <tr key={pet.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '12px' }}>{pet.id}</td>
              <td style={{ padding: '12px' }}>{pet.breed}</td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: pet.type === 'dog' ? '#d4edda' : pet.type === 'cat' ? '#fff3cd' : '#cce5ff',
                  color: pet.type === 'dog' ? '#155724' : pet.type === 'cat' ? '#856404' : '#004085',
                }}>
                  {pet.type}
                </span>
              </td>
              {isAdmin && (
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => navigate(`/admin/pets/edit/${pet.id}`)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ffc107',
                      color: 'black',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '8px',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pet.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {pets.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          No pets found
        </div>
      )}
    </div>
  );
};
