import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { petService } from '../services/pet.service';
import { useAuth } from '../contexts/AuthContext';
import type { Pet, PetType } from '../types/pet.types';
import type { BreedType } from '../types/api.types';

type SortField = 'name' | 'type' | 'breed' | 'totalSponsored';

const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, () => []);
  for (let i = 0; i <= b.length; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const fuzzyScore = (source: string, query: string): number => {
  const a = source.toLowerCase();
  const b = query.toLowerCase();
  if (!a || !b) return 0;
  if (a.includes(b)) return 1; // best case quick path

  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  const similarity = 1 - distance / maxLen;
  return Math.max(0, similarity);
};

export const PetAdminList: React.FC = () => {
  const navigate = useNavigate();
  const { tokens, sessionId } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<PetType | ''>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [breedTypes, setBreedTypes] = useState<BreedType[]>([]);

  useEffect(() => {
    const fetchPets = async (): Promise<void> => {
      try {
        setLoading(true);
        const data = await petService.getAllPets();
        setPets(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pets');
      } finally {
        setLoading(false);
      }
    };

    const fetchTypes = async (): Promise<void> => {
      if (!tokens || !sessionId) return;
      try {
        const types = await apiService.getBreedTypes(tokens.accessToken, sessionId);
        setBreedTypes(types);
      } catch (err) {
        console.warn('Failed to load breed types', err);
      }
    };

    void fetchPets();
    void fetchTypes();
  }, [tokens, sessionId]);

  const filteredPets = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    const withTypeFilter = pets.filter((pet) => !typeFilter || pet.type === typeFilter);

    const withScores = withTypeFilter
      .map((pet) => {
        const score = lowerSearch
          ? Math.max(fuzzyScore(pet.name, lowerSearch), fuzzyScore(pet.breed, lowerSearch))
          : 1;
        return { pet, score };
      })
      .filter(({ score }) => score > 0.3); // keep reasonably similar matches

    const sorted = withScores.sort((a, b) => {
      if (lowerSearch && a.score !== b.score) {
        return b.score - a.score;
      }
      const valueA =
        sortField === 'totalSponsored'
          ? Number(a.pet.totalSponsored)
          : (a.pet[sortField] as string | number);
      const valueB =
        sortField === 'totalSponsored'
          ? Number(b.pet.totalSponsored)
          : (b.pet[sortField] as string | number);
      if (valueA < valueB) return sortDir === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted.map(({ pet }) => pet);
  }, [pets, search, typeFilter, sortField, sortDir]);

  const toggleSort = (field: SortField): void => {
    if (field === sortField) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!tokens || !sessionId) {
      setError('You must be logged in to manage pets.');
      return;
    }

    const confirmDelete = window.confirm('Delete this pet? This uses the event-sourced workflow.');
    if (!confirmDelete) return;

    try {
      setIsDeleting(id);
      await petService.deletePet(id, tokens.accessToken, sessionId);
      setPets((prev) => prev.filter((pet) => pet.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pet');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Pet Management (Event-Sourced)</h1>
          <p style={styles.subtitle}>
            Create, edit or delete pets through the event-sourced workflow. Reads come from the
            projected pets read model.
          </p>
        </div>
        <button style={styles.primaryButton} onClick={() => navigate('/admin/pets/new')}>
          + Add Pet
        </button>
      </header>

      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Search by name or breed..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as PetType | '')}
          style={styles.select}
        >
          <option value="">All types</option>
          {(breedTypes.length ? breedTypes : [{ id: 'dog', name: 'dog' }, { id: 'cat', name: 'cat' }, { id: 'bird', name: 'bird' }]).map((type) => (
            <option key={type.id} value={type.name}>{type.name}</option>
          ))}
        </select>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading pets...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader} onClick={() => toggleSort('name')}>
                  Name {sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={styles.tableHeader} onClick={() => toggleSort('type')}>
                  Type {sortField === 'type' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={styles.tableHeader} onClick={() => toggleSort('breed')}>
                  Breed {sortField === 'breed' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={styles.tableHeader} onClick={() => toggleSort('totalSponsored')}>
                  Sponsored {sortField === 'totalSponsored' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={styles.tableHeaderActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPets.map((pet) => (
                <tr key={pet.id} style={styles.tableRow}>
                  <td style={styles.cell}>
                    <div style={styles.nameCell}>
                      <img
                        src={pet.photoUrl}
                        alt={pet.name}
                        style={styles.avatar}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/60x60?text=Pet';
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{pet.name}</div>
                        <div style={{ color: '#777', fontSize: '12px' }}>{pet.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.cell}>{pet.type}</td>
                  <td style={styles.cell}>{pet.breed}</td>
                  <td style={styles.cell}>${Number(pet.totalSponsored).toFixed(2)}</td>
                  <td style={styles.actionsCell}>
                    <button
                      style={styles.linkButton}
                      onClick={() => navigate(`/admin/pets/edit/${pet.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      style={styles.dangerButton}
                      onClick={() => void handleDelete(pet.id)}
                      disabled={isDeleting === pet.id}
                    >
                      {isDeleting === pet.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPets.length === 0 && (
                <tr>
                  <td style={styles.emptyCell} colSpan={5}>
                    No pets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#222',
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: '#666',
    fontSize: '14px',
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
  toolbar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
  },
  searchInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  select: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    textAlign: 'left',
    padding: '12px 14px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e0e0e0',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  tableHeaderActions: {
    textAlign: 'right',
    padding: '12px 14px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e0e0e0',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
  },
  cell: {
    padding: '12px 14px',
    color: '#333',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  actionsCell: {
    padding: '12px 14px',
    textAlign: 'right',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  linkButton: {
    backgroundColor: 'transparent',
    color: '#0d6efd',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
  },
  dangerButton: {
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  emptyCell: {
    padding: '20px',
    textAlign: 'center',
    color: '#777',
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
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
  avatar: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginRight: '10px',
    border: '1px solid #eee',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};
