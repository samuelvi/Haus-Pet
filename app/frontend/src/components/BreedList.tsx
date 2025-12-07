import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminNav } from './AdminNav';
import { useBreeds } from '../hooks/useBreedQueries';
import { useDeleteBreed } from '../hooks/useBreedMutations';
import type { Breed, BreedFilters } from '../types/api.types';

export const BreedList: React.FC = () => {
  const navigate = useNavigate();
  const { tokens, sessionId } = useAuth();
  const [filters, setFilters] = useState<BreedFilters | undefined>(undefined);

  // Use TanStack Query for data fetching with caching
  const { data, isLoading, isError, error, refetch } = useBreeds(filters);

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

  const handleFilter = (petType: string | undefined): void => {
    if (petType) {
      setFilters({ petType });
    } else {
      setFilters(undefined);
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

        {/* Filters */}
        <div style={styles.filters}>
          <button
            style={!filters ? styles.filterButtonActive : styles.filterButton}
            onClick={() => handleFilter(undefined)}
          >
            All
          </button>
          <button
            style={filters?.petType === 'dog' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => handleFilter('dog')}
          >
            Dogs
          </button>
          <button
            style={filters?.petType === 'cat' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => handleFilter('cat')}
          >
            Cats
          </button>
          <button
            style={filters?.petType === 'bird' ? styles.filterButtonActive : styles.filterButton}
            onClick={() => handleFilter('bird')}
          >
            Birds
          </button>
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

          {pagination && (
            <div style={styles.paginationInfo}>
              Showing {breeds.length} of {pagination.pageCount || 'many'} total breeds
              {pagination.hasNext && ' (more available)'}
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
  paginationInfo: {
    padding: '16px 20px',
    borderTop: '1px solid #f0f0f0',
    backgroundColor: '#f8f8f8',
    fontSize: '13px',
    color: '#666',
    textAlign: 'center',
  },
};
