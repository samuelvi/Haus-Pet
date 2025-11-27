import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';
import type { BreedType } from '../types/api.types';

export const BreedTypeList: React.FC = () => {
  const { tokens, sessionId } = useAuth();
  const [types, setTypes] = useState<BreedType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newType, setNewType] = useState<string>('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const guardAuth = (): boolean => {
    if (!tokens || !sessionId) {
      setError('You must be logged in to manage breed types.');
      return false;
    }
    return true;
  };

  const loadTypes = async (): Promise<void> => {
    if (!guardAuth()) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBreedTypes(tokens!.accessToken, sessionId!);
      setTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load breed types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTypes();
  }, [tokens, sessionId]);

  const handleCreate = async (): Promise<void> => {
    if (!guardAuth()) return;
    if (!newType.trim()) {
      setError('Name is required');
      return;
    }
    try {
      setBusyId('create');
      const created = await apiService.createBreedType(newType.trim(), tokens!.accessToken, sessionId!);
      setTypes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewType('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create breed type');
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdate = async (id: string): Promise<void> => {
    if (!guardAuth()) return;
    try {
      setBusyId(id);
      const updated = await apiService.updateBreedType(id, editingName.trim(), tokens!.accessToken, sessionId!);
      setTypes((prev) =>
        prev.map((t) => (t.id === id ? updated : t)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditing(null);
      setEditingName('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update breed type');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!guardAuth()) return;
    const confirmDelete = window.confirm('Delete this breed type? Breeds associated will block deletion.');
    if (!confirmDelete) return;
    try {
      setBusyId(id);
      await apiService.deleteBreedType(id, tokens!.accessToken, sessionId!);
      setTypes((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete breed type');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Breed Types</h1>
          <p style={styles.subtitle}>Administer allowable types; deletion blocked if breeds exist.</p>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        <div style={styles.formRow}>
          <input
            type="text"
            placeholder="New breed type name..."
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            style={styles.input}
          />
          <button
            style={styles.primaryButton}
            onClick={() => void handleCreate()}
            disabled={busyId === 'create'}
          >
            {busyId === 'create' ? 'Saving...' : 'Add Type'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading breed types...</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th} />
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <tr key={type.id}>
                  <td style={styles.td}>
                    {editing === type.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        style={styles.input}
                      />
                    ) : (
                      <span>{type.name}</span>
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', gap: '8px' }}>
                    {editing === type.id ? (
                      <>
                        <button
                          style={styles.primaryButton}
                          onClick={() => void handleUpdate(type.id)}
                          disabled={busyId === type.id}
                        >
                          {busyId === type.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          style={styles.secondaryButton}
                          onClick={() => {
                            setEditing(null);
                            setEditingName('');
                          }}
                          disabled={busyId === type.id}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          style={styles.linkButton}
                          onClick={() => {
                            setEditing(type.id);
                            setEditingName(type.name);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          style={styles.dangerButton}
                          onClick={() => void handleDelete(type.id)}
                          disabled={busyId === type.id}
                        >
                          {busyId === type.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {types.length === 0 && (
                <tr>
                  <td style={styles.emptyCell} colSpan={2}>
                    No breed types found.
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
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '16px',
    marginBottom: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    color: '#444',
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '10px 14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 14px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e0e0e0',
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid #f0f0f0',
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
};
