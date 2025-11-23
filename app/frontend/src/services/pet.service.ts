import type { Pet, Sponsorship, CreateSponsorshipDto, PetType } from '../types/pet.types';

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
};
