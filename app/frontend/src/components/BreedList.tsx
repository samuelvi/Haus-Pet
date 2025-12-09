import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminNav } from './AdminNav';
import { useBreeds, useBreedTypes } from '../hooks/useBreedQueries';
import { useDeleteBreed } from '../hooks/useBreedMutations';
import type { Breed, BreedFilters, BreedType } from '../types/api.types';

export const BreedList: React.FC = () => {
  const navigate = useNavigate();
  const { tokens, sessionId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<BreedFilters | undefined>(() => {
    const petType = searchParams.get('petType');
    const search = searchParams.get('search');
    const result: BreedFilters = {};
    if (petType) result.petType = petType;
    if (search) result.search = search;
    return Object.keys(result).length > 0 ? result : undefined;
  });
  const [page, setPage] = useState<number>(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [limit] = useState<number>(4); // ADMIN_PAGE_SIZE from .env

  // Load breed types dynamically
  const { data: breedTypesData } = useBreedTypes(tokens?.accessToken, sessionId || undefined, 1, 50);

  // Sync page and filters with URL
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const petType = searchParams.get('petType');
    const search = searchParams.get('search');
    const urlPage = pageParam ? parseInt(pageParam, 10) : 1;

    if (urlPage !== page) {
      setPage(urlPage);
    }

    const newFilters: BreedFilters = {};
    if (petType) newFilters.petType = petType;
    if (search) newFilters.search = search;

    const hasFilters = Object.keys(newFilters).length > 0;
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(hasFilters ? newFilters : undefined);

    if (filtersChanged) {
      setFilters(hasFilters ? newFilters : undefined);
    }

    if (search !== searchTerm) {
      setSearchTerm(search || '');
    }
  }, [searchParams]);

  // Use TanStack Query for data fetching with caching
  const { data, isLoading, isError, error, refetch } = useBreeds(filters, page, limit);

  // Delete mutation
  const deleteMutation = useDeleteBreed({
    accessToken: tokens?.accessToken || '',
    sessionId: sessionId || '',
  });

  const handleDelete = async (id: string, name: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to delete breed:', err);
      alert('Failed to delete breed. Please try again.');
    }
  };

  const buildParams = (pageNum: number, currentFilters?: BreedFilters): Record<string, string> => {
    const params: Record<string, string> = { page: pageNum.toString() };
    if (currentFilters?.petType) {
      params.petType = currentFilters.petType;
    }
    if (currentFilters?.search) {
      params.search = currentFilters.search;
    }
    return params;
  };

  const handleFilter = (petType: string | undefined): void => {
    const newFilters: BreedFilters = {};
    if (petType) newFilters.petType = petType;
    if (searchTerm) newFilters.search = searchTerm;

    const params = buildParams(1, Object.keys(newFilters).length > 0 ? newFilters : undefined);
    setSearchParams(params);
    setFilters(Object.keys(newFilters).length > 0 ? newFilters : undefined);
    setPage(1);
  };

  const handleSearch = (search: string): void => {
    const newFilters: BreedFilters = {};
    if (filters?.petType) newFilters.petType = filters.petType;
    if (search) newFilters.search = search;

    const params = buildParams(1, Object.keys(newFilters).length > 0 ? newFilters : undefined);
    setSearchParams(params);
    setFilters(Object.keys(newFilters).length > 0 ? newFilters : undefined);
    setSearchTerm(search);
    setPage(1);
  };

  const handlePreviousPage = (): void => {
    if (page > 1) {
      const newPage = page - 1;
      const params = buildParams(newPage, filters);
      setSearchParams(params);
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = (): void => {
    if (pagination?.hasNext) {
      const newPage = page + 1;
      const params = buildParams(newPage, filters);
      setSearchParams(params);
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const breeds = data?.items || [];
  const pagination = data?.pagination;

  return (
    <>
      <AdminNav />
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Breed Management</h1>
            <p style={styles.subtitle}>
              Manage all pet breeds in the system ({breeds.length} breeds)
            </p>
          </div>
          <button
            style={styles.primaryButton}
            onClick={() => navigate('/admin/breeds/new')}
          >
            + Add Breed
          </button>
        </header>

        {/* Search Bar */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search breeds by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchTerm);
              }
            }}
            style={styles.searchInput}
          />
          <button
            style={styles.searchButton}
            onClick={() => handleSearch(searchTerm)}
          >
            Search
          </button>
          {searchTerm && (
            <button
              style={styles.clearButton}
              onClick={() => handleSearch('')}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <button
            style={!filters?.petType ? styles.filterButtonActive : styles.filterButton}
            onClick={() => handleFilter(undefined)}
          >
            All
          </button>
          {breedTypesData?.items.map((breedType: BreedType) => (
            <button
              key={breedType.id}
              style={filters?.petType === breedType.name ? styles.filterButtonActive : styles.filterButton}
              onClick={() => handleFilter(breedType.name)}
            >
              {breedType.name.charAt(0).toUpperCase() + breedType.name.slice(1)}
            </button>
          ))}
        </div>

        <div style={styles.card}>
          {isLoading && <div style={styles.loading}>Loading breeds...</div>}

          {isError && (
            <div style={styles.error}>
              Error loading breeds: {error instanceof Error ? error.message : 'Unknown error'}
              <button style={styles.retryButton} onClick={() => refetch()}>
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && breeds.length === 0 && (
            <div style={styles.empty}>
              No breeds found. {filters && 'Try removing filters or '}
              <button
                style={styles.linkButton}
                onClick={() => navigate('/admin/breeds/new')}
              >
                add a new breed
              </button>
              .
            </div>
          )}

          {!isLoading && !isError && breeds.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>ID</th>
                  <th style={styles.thActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {breeds.map((breed: Breed) => (
                  <tr key={breed.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.breedName}>{breed.name}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{breed.petType}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.idText}>{breed.id}</span>
                    </td>
                    <td style={styles.tdActions}>
                      <button
                        style={styles.editButton}
                        onClick={() => navigate(`/admin/breeds/edit/${breed.id}`)}
                        disabled={deleteMutation.isPending}
                      >
                        Edit
                      </button>
                      <button
                        style={styles.deleteButton}
                        onClick={() => void handleDelete(breed.id, breed.name)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination Info */}
          {pagination && (
            <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '8px' }}>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Page {pagination.page} • Showing {breeds.length} breeds
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination && breeds.length > 0 && (
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
  searchInput: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    minWidth: '300px',
    marginRight: '8px',
  },
  searchButton: {
    backgroundColor: '#6B553D',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 600,
    marginRight: '8px',
  },
  clearButton: {
    backgroundColor: '#fff',
    color: '#666',
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  filterButton: {
    backgroundColor: '#fff',
    color: '#444',
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  filterButtonActive: {
    backgroundColor: '#6B553D',
    color: '#fff',
    border: '1px solid #6B553D',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  loading: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#555',
  },
  error: {
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: '#fdf6f0',
    color: '#843a23',
  },
  retryButton: {
    marginLeft: '12px',
    backgroundColor: '#6B553D',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  empty: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#666',
  },
  linkButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6B553D',
    cursor: 'pointer',
    fontWeight: 600,
    textDecoration: 'underline',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '16px 20px',
    backgroundColor: '#f8f8f8',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: 600,
    fontSize: '13px',
    color: '#666',
    textTransform: 'uppercase',
  },
  thActions: {
    textAlign: 'right',
    padding: '16px 20px',
    backgroundColor: '#f8f8f8',
    borderBottom: '2px solid #e0e0e0',
    fontWeight: 600,
    fontSize: '13px',
    color: '#666',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#333',
  },
  tdActions: {
    padding: '16px 20px',
    textAlign: 'right',
  },
  breedName: {
    fontWeight: 600,
    color: '#222',
  },
  badge: {
    backgroundColor: '#fdf5e1',
    color: '#774f06',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  idText: {
    fontSize: '12px',
    color: '#999',
    fontFamily: 'monospace',
  },
  editButton: {
    backgroundColor: 'transparent',
    color: '#6B553D',
    border: '1px solid #6B553D',
    borderRadius: '6px',
    padding: '6px 12px',
    marginRight: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    color: '#c45a2f',
    border: '1px solid #c45a2f',
    borderRadius: '6px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
  },
  primaryButton: {
    backgroundColor: '#6B553D',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 20px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
