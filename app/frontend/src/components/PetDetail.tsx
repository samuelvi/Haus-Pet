import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { petService } from '../services/pet.service';
import type { Pet, Sponsorship, CreateSponsorshipDto } from '../types/pet.types';

export const PetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const [formData, setFormData] = useState<CreateSponsorshipDto>({
    petId: id || '',
    email: '',
    name: '',
    amount: 10,
    currency: 'USD',
  });

  useEffect(() => {
    if (id) {
      loadPetData(id);
    }
  }, [id]);

  const loadPetData = async (petId: string): Promise<void> => {
    try {
      setLoading(true);
      const [petData, sponsorshipsData] = await Promise.all([
        petService.getPetById(petId),
        petService.getSponsorshipsForPet(petId),
      ]);
      setPet(petData);
      setSponsorships(sponsorshipsData);
      setFormData((prev) => ({ ...prev, petId }));
    } catch (err) {
      setError('Failed to load pet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!id) return;

    try {
      setSubmitting(true);
      setError(null);
      await petService.createSponsorship(formData);
      setSuccess(true);
      setShowForm(false);
      await loadPetData(id);
      setFormData((prev) => ({ ...prev, email: '', name: '', amount: 10 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sponsorship');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dog': return 'bg-green-500';
      case 'cat': return 'bg-orange-500';
      case 'bird': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-gray-700">Loading pet details...</p>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-soft mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pet not found</h2>
          <button
            onClick={() => navigate('/gallery')}
            className="btn btn-primary px-6 py-3"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/gallery')}
          className="btn btn-secondary px-4 py-2 mb-6 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Gallery
        </button>

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-green-900 text-lg">Thank you for your sponsorship!</p>
                <p className="text-green-800 mt-1">{pet.name} appreciates your support!</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Pet Image */}
          <div className="card overflow-hidden shadow-large">
            <img
              src={pet.photoUrl}
              alt={pet.name}
              className="w-full h-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://placehold.co/600x600/e2e8f0/64748b?text=${pet.type}`;
              }}
            />
          </div>

          {/* Pet Info */}
          <div className="space-y-6">
            <div>
              <span className={`${getTypeColor(pet.type)} text-white px-4 py-2 rounded-full text-sm font-bold uppercase inline-block mb-4`}>
                {pet.type}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{pet.name}</h1>
              <p className="text-xl text-gray-600">
                <span className="font-medium">Breed:</span> {pet.breed}
              </p>
            </div>

            {/* Sponsorship Stats */}
            <div className="card shadow-soft bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="card-body text-center">
                <p className="text-sm text-green-700 font-medium uppercase tracking-wide mb-2">
                  Total Sponsored
                </p>
                <p className="text-5xl font-bold text-green-600 mb-2">
                  ${Number(pet.totalSponsored).toFixed(2)}
                </p>
                <p className="text-sm text-green-700">
                  from {sponsorships.length} generous sponsor{sponsorships.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Sponsorship Form/Button */}
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-danger w-full py-4 text-lg flex items-center justify-center gap-3 shadow-medium hover:shadow-large"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                Sponsor {pet.name}
              </button>
            ) : (
              <div className="card shadow-medium">
                <div className="card-body">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Sponsor {pet.name}</h3>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        className="input"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        required
                        className="input"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Amount (USD) *
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[5, 10, 25, 50, 100].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, amount }))}
                            className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                              formData.amount === amount
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={formData.amount}
                        onChange={(e) => setFormData((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                        required
                        className="input"
                        placeholder="Custom amount"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-success flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Processing...' : 'Complete Sponsorship'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="btn btn-secondary px-6 py-3"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sponsors */}
        {sponsorships.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Sponsors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sponsorships.slice(0, 12).map((sponsorship) => (
                <div key={sponsorship.id} className="card shadow-soft hover:shadow-medium transition-all">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-900">
                        {sponsorship.user?.name || 'Anonymous'}
                      </h3>
                      <span className="text-xl font-bold text-green-600">
                        ${Number(sponsorship.amount).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(sponsorship.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
