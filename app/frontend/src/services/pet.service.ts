import type {
  Pet,
  Sponsorship,
  CreateSponsorshipDto,
  PetType,
  CreatePetInput,
  UpdatePetInput,
} from '../types/pet.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const petService = {
  async getAllPets(): Promise<Pet[]> {
    const response = await fetch(`${API_URL}/api/pets`);
    if (!response.ok) {
      throw new Error('Failed to fetch pets');
    }
    return response.json();
  },

  async getPetsByType(type: PetType): Promise<Pet[]> {
    const response = await fetch(`${API_URL}/api/pets/type/${type}`);
    if (!response.ok) {
      throw new Error('Failed to fetch pets');
    }
    return response.json();
  },

  async getPetById(id: string): Promise<Pet> {
    const response = await fetch(`${API_URL}/api/pets/${id}`);
    if (!response.ok) {
      throw new Error('Pet not found');
    }
    return response.json();
  },

  async createSponsorship(data: CreateSponsorshipDto): Promise<Sponsorship> {
    const response = await fetch(`${API_URL}/api/sponsorships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create sponsorship');
    }
    return response.json();
  },

  async getSponsorshipsForPet(petId: string): Promise<Sponsorship[]> {
    const response = await fetch(`${API_URL}/api/sponsorships/pet/${petId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sponsorships');
    }
    return response.json();
  },

  async getRecentSponsorships(limit: number = 10): Promise<Sponsorship[]> {
    const response = await fetch(`${API_URL}/api/sponsorships/recent?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sponsorships');
    }
    return response.json();
  },

  async createPet(
    data: CreatePetInput,
    accessToken: string,
    sessionId: string
  ): Promise<Pet> {
    const response = await fetch(`${API_URL}/api/admin/pets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create pet');
    }

    return response.json();
  },

  async updatePet(
    id: string,
    data: UpdatePetInput,
    accessToken: string,
    sessionId: string
  ): Promise<Pet> {
    const response = await fetch(`${API_URL}/api/admin/pets/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update pet');
    }

    return response.json();
  },

  async deletePet(id: string, accessToken: string, sessionId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/pets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete pet');
    }
  },
};
