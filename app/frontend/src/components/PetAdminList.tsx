import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { petService } from '../services/pet.service';
import { useAuth } from '../contexts/AuthContext';
import type { Pet, PetType, PaginationMeta } from '../types/pet.types';
import type { BreedType } from '../types/api.types';
// import { fuzzyFilter } from '../utils/fuzzySearch';
import { AdminNav } from './AdminNav';

type SortField = 'name' | 'type' | 'breed' | 'totalSponsored';

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
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const PAGE_SIZE = 4; // Admin page size

  useEffect(() => {
    const fetchPets = async (): Promise<void> => {
      try {
        setLoading(true);
        let result;
        if (typeFilter) {
          result = await petService.getPetsByType(typeFilter, page, PAGE_SIZE);
        } else {
          result = await petService.getAllPets(page, PAGE_SIZE);
        }
        setPets(result.items);
        setPagination(result.pagination);
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
  }, [tokens, sessionId, page, typeFilter]);

  const filteredPets = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    // Apply local search filter if needed
    let filtered = pets;
    if (lowerSearch) {
      filtered = pets.filter((pet) =>
        pet.name.toLowerCase().includes(lowerSearch) ||
        pet.breed.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort by selected field
    return filtered.sort((a, b) => {
      const valueA =
        sortField === 'totalSponsored'
          ? Number(a.totalSponsored)
          : (a[sortField] as string | number);
      const valueB =
        sortField === 'totalSponsored'
          ? Number(b.totalSponsored)
          : (b[sortField] as string | number);
      if (valueA < valueB) return sortDir === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [pets, search, sortField, sortDir]);

  const handleFilterChange = (newFilter: PetType | '') => {
    setTypeFilter(newFilter);
    setPage(1); // Reset to first page when changing filter
  };

  const handleNextPage = () => {
    if (pagination?.hasNext) {
      setPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (pagination?.hasPrevious) {
      setPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
    <>
      <AdminNav />
      <div style={styles.container}>
        <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Pet Management (Event-Sourced)</h1>
          <p style={styles.subtitle}>
            Create, edit or delete pets through the event-sourced workflow. Reads come from the
            projected pets read model.
          </p>
        </div>
        <button className="btn btn-primary px-6 py-3 flex items-center gap-2" onClick={() => navigate('/admin/pets/new')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Pet
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
          onChange={(e) => handleFilterChange(e.target.value as PetType | '')}
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
                          console.error(`Failed to load image for ${pet.name}: ${pet.photoUrl}`);
                          // Fallback to a generic pet icon using data URI
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"%3E%3Crect fill="%23e2e8f0" width="60" height="60"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="%2364748b"%3EPet%3C/text%3E%3C/svg%3E';
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
                      className="text-primary-600 hover:text-primary-900 font-semibold"
                      onClick={() => navigate(`/admin/pets/edit/${pet.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger px-4 py-2 text-sm disabled:opacity-50"
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

      {/* Pagination Info */}
      {pagination && (
        <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '8px' }}>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Page {pagination.page} • Showing {filteredPets.length} pets
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && filteredPets.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', marginBottom: '24px' }}>
          <button
            onClick={handlePreviousPage}
            disabled={!pagination.hasPrevious}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-soft flex items-center gap-2 ${
              pagination.hasPrevious
                ? 'bg-white text-dark-800 hover:bg-primary-100 hover:shadow-medium'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="px-4 py-3 bg-white rounded-xl shadow-soft">
            <span className="text-dark-800 font-semibold">Page {pagination.page}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={!pagination.hasNext}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-soft flex items-center gap-2 ${
              pagination.hasNext
                ? 'bg-white text-dark-800 hover:bg-primary-100 hover:shadow-medium'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
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
    marginBottom: '20px',
  },
  searchInput: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  select: {
    padding: '12px 14px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    minWidth: '180px',
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
    padding: '16px 20px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e0e0e0',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  },
  tableHeaderActions: {
    textAlign: 'right',
    padding: '16px 20px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e0e0e0',
    fontWeight: 600,
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
  },
  cell: {
    padding: '16px 20px',
    color: '#333',
    fontSize: '14px',
    verticalAlign: 'middle',
  },
  actionsCell: {
    padding: '16px 20px',
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
    borderRadius: '6px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  emptyCell: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#777',
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
