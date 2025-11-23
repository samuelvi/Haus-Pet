import type { Pet, CreatePetDto, UpdatePetDto } from '../types/pet.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const petService = {
  async getAllPets(): Promise<Pet[]> {
    const response = await fetch(`${API_URL}/pets`);
    if (!response.ok) {
      throw new Error('Failed to fetch pets');
    }
    return response.json();
  },

  async getPetById(id: string): Promise<Pet> {
    const response = await fetch(`${API_URL}/pets/${id}`);
    if (!response.ok) {
      throw new Error('Pet not found');
    }
    return response.json();
  },

  async createPet(data: CreatePetDto, accessToken: string, sessionId: string): Promise<Pet> {
    const response = await fetch(`${API_URL}/admin/pets`, {
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
      throw new Error(error.error || 'Failed to create pet');
    }
    return response.json();
  },

  async updatePet(id: string, data: UpdatePetDto, accessToken: string, sessionId: string): Promise<Pet> {
    const response = await fetch(`${API_URL}/admin/pets/${id}`, {
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
      throw new Error(error.error || 'Failed to update pet');
    }
    return response.json();
  },

  async deletePet(id: string, accessToken: string, sessionId: string): Promise<void> {
    const response = await fetch(`${API_URL}/admin/pets/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Session-ID': sessionId,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete pet');
    }
  },
};
