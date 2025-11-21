import type { Animal, Sponsorship, CreateSponsorshipDto, PetType } from '../types/animal.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const animalService = {
  async getAllAnimals(): Promise<Animal[]> {
    const response = await fetch(`${API_URL}/animals`);
    if (!response.ok) {
      throw new Error('Failed to fetch animals');
    }
    return response.json();
  },

  async getAnimalsByType(type: PetType): Promise<Animal[]> {
    const response = await fetch(`${API_URL}/animals/type/${type}`);
    if (!response.ok) {
      throw new Error('Failed to fetch animals');
    }
    return response.json();
  },

  async getAnimalById(id: string): Promise<Animal> {
    const response = await fetch(`${API_URL}/animals/${id}`);
    if (!response.ok) {
      throw new Error('Animal not found');
    }
    return response.json();
  },

  async createSponsorship(data: CreateSponsorshipDto): Promise<Sponsorship> {
    const response = await fetch(`${API_URL}/sponsorships`, {
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

  async getSponsorshipsForAnimal(animalId: string): Promise<Sponsorship[]> {
    const response = await fetch(`${API_URL}/sponsorships/animal/${animalId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sponsorships');
    }
    return response.json();
  },

  async getRecentSponsorships(limit: number = 10): Promise<Sponsorship[]> {
    const response = await fetch(`${API_URL}/sponsorships/recent?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sponsorships');
    }
    return response.json();
  },
};
