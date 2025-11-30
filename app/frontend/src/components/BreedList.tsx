import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import type { Breed, PetType } from '../types/api.types';
import { useAuth } from '../contexts/AuthContext';
import { fuzzyFilter } from '../utils/fuzzySearch';
import { AdminNav } from './AdminNav';

type SortField = 'name' | 'petType';

export const BreedList: React.FC = () => {
  const navigate = useNavigate();
  const { tokens, sessionId } = useAuth();
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<PetType | ''>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchBreeds = async (): Promise<void> => {
      try {
        setLoading(true);
        const data = await apiService.getAllBreeds();
        setBreeds(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load breeds');
      } finally {
        setLoading(false);
      }
    };

    void fetchBreeds();
  }, []);

  const filteredBreeds = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    // Apply type filter first
    const typeFiltered = breeds.filter((breed) => !typeFilter || breed.petType === typeFilter);

    // Apply fuzzy search
    const fuzzyFiltered = fuzzyFilter(
      typeFiltered,
      lowerSearch,
      (breed) => [breed.name, breed.petType],
      0.3
    );

    // Sort by fuzzy score first (if searching), then by selected field
    return fuzzyFiltered
      .sort((a, b) => {
        // If there's a search query, prioritize by score
        if (lowerSearch && a.score !== b.score) {
          return b.score - a.score;
        }

        // Otherwise sort by selected field
        const valueA = a.item[sortField];
        const valueB = b.item[sortField];
        if (valueA < valueB) return sortDir === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
      .map(({ item }) => item);
  }, [breeds, search, typeFilter, sortField, sortDir]);

  const handleDelete = async (id: string): Promise<void> => {
    if (!tokens || !sessionId) {
      setError('You must be logged in to manage breeds.');
      return;
    }

    const confirmDelete = window.confirm('Delete this breed?');
    if (!confirmDelete) return;

    try {
      setIsDeleting(id);
      await apiService.deleteBreed(id, tokens.accessToken, sessionId);
      setBreeds((prev) => prev.filter((breed) => breed.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete breed');
    } finally {
      setIsDeleting(null);
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

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Breed Management</h1>
                <p className="text-gray-600 mt-2">Create, edit, or remove breeds</p>
              </div>
              <button
                onClick={() => navigate('/admin/breeds/new')}
                className="btn btn-primary px-6 py-3 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Breed
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-10">
        {/* Filters */}
        <div className="card shadow-soft mb-6">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by name or type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Type
                </label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as PetType | '')}
                  className="input"
                >
                  <option value="">All types</option>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="card shadow-soft">
            <div className="card-body text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
                <svg className="animate-spin h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-gray-600">Loading breeds...</p>
            </div>
          </div>
        ) : (
          <div className="card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => toggleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Name
                        {sortField === 'name' && (
                          <svg className={`w-4 h-4 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort('petType')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        Type
                        {sortField === 'petType' && (
                          <svg className={`w-4 h-4 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBreeds.map((breed) => (
                    <tr key={breed.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{breed.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge badge-primary capitalize">{breed.petType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => navigate(`/admin/breeds/edit/${breed.id}`)}
                            className="text-primary-600 hover:text-primary-900 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void handleDelete(breed.id)}
                            disabled={isDeleting === breed.id}
                            className="btn btn-danger px-4 py-2 text-sm disabled:opacity-50"
                          >
                            {isDeleting === breed.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBreeds.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-600 font-medium">No breeds found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or create a new breed</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn btn-secondary px-4 py-2 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
    </>
  );
};
