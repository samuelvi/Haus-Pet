import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { petService } from '../services/pet.service';
import type { Pet, PetType } from '../types/pet.types';
import { Navbar } from './Navbar';

export const PetGallery: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<PetType | ''>('');
  const navigate = useNavigate();

  const loadPets = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      let data: Pet[];
      if (typeFilter) {
        data = await petService.getPetsByType(typeFilter);
      } else {
        data = await petService.getAllPets();
      }
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
  }, [typeFilter]);

  const petTypeConfig = [
    { type: '', label: 'All Pets', emoji: '🐾', color: 'primary' },
    { type: 'cat', label: 'Cats', emoji: '🐱', color: 'secondary' },
    { type: 'dog', label: 'Dogs', emoji: '🐕', color: 'accent' },
    { type: 'bird', label: 'Birds', emoji: '🐦', color: 'warm' },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dog': return 'bg-accent-600';
      case 'cat': return 'bg-secondary-500';
      case 'bird': return 'bg-warm-600';
      default: return 'bg-dark-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 via-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <svg className="animate-spin h-8 w-8 text-secondary-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-dark-800">Loading adorable pets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-primary-50 to-white">
      {/* Navigation */}
      <Navbar />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-primary-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-secondary-500 to-accent-600 bg-clip-text text-transparent leading-tight">
              Pet Sponsorship Gallery
            </h1>
            <p className="text-lg text-warm-700 leading-relaxed max-w-2xl mx-auto">
              Help our furry friends find their forever homes by sponsoring them today
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-xl bg-red-50 border border-red-200 p-5">
            <div className="flex items-center gap-4">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="font-semibold text-red-800 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {petTypeConfig.map((config) => {
            const isActive = typeFilter === config.type;
            const colorClasses = {
              primary: isActive ? 'bg-dark-700 text-white' : 'bg-white text-dark-800 hover:bg-primary-100',
              secondary: isActive ? 'bg-secondary-500 text-white' : 'bg-white text-dark-800 hover:bg-secondary-50',
              accent: isActive ? 'bg-accent-600 text-white' : 'bg-white text-dark-800 hover:bg-accent-50',
              warm: isActive ? 'bg-warm-600 text-white' : 'bg-white text-dark-800 hover:bg-warm-50',
            }[config.color];

            return (
              <button
                key={config.type}
                onClick={() => setTypeFilter(config.type as PetType | '')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-soft hover:shadow-medium ${colorClasses} ${isActive ? 'scale-105' : ''}`}
              >
                <span className={`mr-2 inline-block transition-all ${isActive && config.type === '' ? 'brightness-200 contrast-75' : ''}`}>
                  {config.emoji}
                </span>
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Pet Grid */}
        {pets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pets.map((pet) => (
              <div
                key={pet.id}
                onClick={() => navigate(`/pets/${pet.id}`)}
                className="group card hover:shadow-large transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
              >
                {/* Pet Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={pet.photoUrl}
                    alt={pet.name}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x300/e2e8f0/64748b?text=${pet.type}`;
                    }}
                  />
                  {/* Type Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`${getTypeColor(pet.type)} text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase shadow-lg`}>
                      {pet.type}
                    </span>
                  </div>
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Pet Info */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {pet.name}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <span className="font-medium">Breed:</span> {pet.breed}
                    </p>
                  </div>

                  {/* Sponsorship Amount */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-5 border border-green-200">
                    <p className="text-xs text-green-700 font-medium uppercase tracking-wide mb-2">
                      Total Sponsored
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${Number(pet.totalSponsored).toFixed(2)}
                    </p>
                  </div>

                  {/* Sponsor Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/pets/${pet.id}`);
                    }}
                    className="btn btn-danger w-full py-3.5 flex items-center justify-center gap-2 group-hover:scale-105 transition-transform mt-4"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    Sponsor {pet.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-soft mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No pets found</h3>
            <p className="text-gray-600">Check back soon for more adorable friends!</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-gray-600">
            Made with{' '}
            <span className="text-red-500">❤️</span>
            {' '}for our furry friends
          </p>
        </div>
      </footer>
    </div>
  );
};
