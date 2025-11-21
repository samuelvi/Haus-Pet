import type { Animal, CreateAnimalDto, UpdateAnimalDto } from '../types/animal.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const animalService = {
  async getAllAnimals(): Promise<Animal[]> {
    const response = await fetch(`${API_URL}/animals`);
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

  async createAnimal(data: CreateAnimalDto, accessToken: string, sessionId: string): Promise<Animal> {
    const response = await fetch(`${API_URL}/admin/animals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create animal');
    }
    return response.json();
  },

  async updateAnimal(id: string, data: UpdateAnimalDto, accessToken: string, sessionId: string): Promise<Animal> {
    const response = await fetch(`${API_URL}/admin/animals/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Session-ID': sessionId,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update animal');
    }
    return response.json();
  },

  async deleteAnimal(id: string, accessToken: string, sessionId: string): Promise<void> {
    const response = await fetch(`${API_URL}/admin/animals/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Session-ID': sessionId,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete animal');
    }
  },
};
