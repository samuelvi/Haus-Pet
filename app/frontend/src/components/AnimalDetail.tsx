import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { animalService } from '../services/animal.service';
import type { Animal, Sponsorship, CreateSponsorshipDto } from '../types/animal.types';

export const AnimalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const [formData, setFormData] = useState<CreateSponsorshipDto>({
    animalId: id || '',
    email: '',
    name: '',
    amount: 10,
    currency: 'USD',
  });

  useEffect(() => {
    if (id) {
      loadAnimalData(id);
    }
  }, [id]);

  const loadAnimalData = async (animalId: string): Promise<void> => {
    try {
      setLoading(true);
      const [animalData, sponsorshipsData] = await Promise.all([
        animalService.getAnimalById(animalId),
        animalService.getSponsorshipsForAnimal(animalId),
      ]);
      setAnimal(animalData);
      setSponsorships(sponsorshipsData);
      setFormData((prev) => ({ ...prev, animalId }));
    } catch (err) {
      setError('Failed to load animal');
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
      await animalService.createSponsorship(formData);
      setSuccess(true);
      setShowForm(false);
      // Reload data to show updated total
      await loadAnimalData(id);
      // Reset form
      setFormData((prev) => ({ ...prev, email: '', name: '', amount: 10 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sponsorship');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', fontSize: '24px' }}>Loading...</div>;
  }

  if (!animal) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Animal not found</h2>
        <button onClick={() => navigate('/gallery')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Back to Gallery
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/gallery')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#ecf0f1',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontSize: '1rem',
        }}
      >
        ← Back to Gallery
      </button>

      {success && (
        <div style={{
          padding: '20px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          🎉 Thank you for your sponsorship! {animal.name} appreciates your support!
        </div>
      )}

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div>
          <img
            src={animal.photoUrl}
            alt={animal.name}
            style={{ width: '100%', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/400x400/gray/white?text=${animal.type}`;
            }}
          />
        </div>

        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: '20px',
              backgroundColor: animal.type === 'dog' ? '#27ae60' : animal.type === 'cat' ? '#e67e22' : '#9b59b6',
              color: 'white',
              fontWeight: 'bold',
              marginBottom: '15px',
              textTransform: 'capitalize',
            }}
          >
            {animal.type}
          </span>
          <h1 style={{ fontSize: '2.5rem', margin: '10px 0', color: '#2c3e50' }}>{animal.name}</h1>
          <p style={{ fontSize: '1.2rem', color: '#7f8c8d', margin: '10px 0' }}>
            Breed: <strong>{animal.breed}</strong>
          </p>

          <div
            style={{
              marginTop: '30px',
              padding: '25px',
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '1rem', color: '#7f8c8d' }}>Total Sponsored</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#27ae60', margin: '10px 0' }}>
              ${Number(animal.totalSponsored).toFixed(2)}
            </div>
            <span style={{ fontSize: '0.9rem', color: '#95a5a6' }}>
              {sponsorships.length} sponsor{sponsorships.length !== 1 ? 's' : ''}
            </span>
          </div>

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '18px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.2rem',
              }}
            >
              ❤️ Sponsor {animal.name}
            </button>
          ) : (
            <form onSubmit={handleSubmit} style={{ marginTop: '20px', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ecf0f1' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Sponsor {animal.name}</h3>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ced4da',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ced4da',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                  Amount (USD) *
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {[5, 10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, amount }))}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: formData.amount === amount ? '#3498db' : '#ecf0f1',
                        color: formData.amount === amount ? 'white' : '#2c3e50',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
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
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ced4da',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                  }}
                >
                  {submitting ? 'Processing...' : 'Complete Sponsorship'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '14px 20px',
                    backgroundColor: '#ecf0f1',
                    color: '#2c3e50',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Recent Sponsors */}
      {sponsorships.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Recent Sponsors</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {sponsorships.slice(0, 10).map((sponsorship) => (
              <div
                key={sponsorship.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px 20px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #ecf0f1',
                }}
              >
                <div>
                  <strong style={{ color: '#2c3e50' }}>{sponsorship.user?.name || 'Anonymous'}</strong>
                  <span style={{ color: '#95a5a6', marginLeft: '10px', fontSize: '0.9rem' }}>
                    {new Date(sponsorship.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '1.1rem' }}>
                  ${Number(sponsorship.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
