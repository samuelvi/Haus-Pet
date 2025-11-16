/**
 * Pet Management Service
 * Handles all pet-related HTTP requests
 */

import type {
  ApiResponse,
  Pet,
  PetFormData,
  PetFilters,
} from '../types/pet.types';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class PetService {
  /**
   * Generic request handler
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url: string = `${API_BASE_URL}${endpoint}`;

    const response: Response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }

    const data: ApiResponse<T> = await response.json();
    if (data.status === 'ERROR') {
      throw new Error(data.message || 'API error');
    }

    return data.data!;
  }

  /**
   * Get all pets with optional filters
   */
  async getAllPets(filters?: PetFilters): Promise<Pet[]> {
    let endpoint = '/api/pets';

    if (filters) {
      const params = new URLSearchParams();
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }

    return this.request<Pet[]>(endpoint);
  }

  /**
   * Get pet by ID
   */
  async getPetById(id: number): Promise<Pet> {
    return this.request<Pet>(`/api/pets/${id}`);
  }

  /**
   * Create new pet
   */
  async createPet(
    data: PetFormData,
    accessToken: string,
    sessionId: string
  ): Promise<Pet> {
    const response = await this.request<{ message: string; pet: Pet }>(
      '/api/pets/add',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-session-id': sessionId,
        },
        body: JSON.stringify(data),
      }
    );
    return response.pet;
  }

  /**
   * Update pet
   */
  async updatePet(
    id: number,
    data: PetFormData,
    accessToken: string,
    sessionId: string
  ): Promise<Pet> {
    const response = await this.request<{ message: string; pet: Pet }>(
      `/api/pets/${id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-session-id': sessionId,
        },
        body: JSON.stringify(data),
      }
    );
    return response.pet;
  }

  /**
   * Delete pet
   */
  async deletePet(
    id: number,
    accessToken: string,
    sessionId: string
  ): Promise<void> {
    await this.request<{ message: string }>(`/api/pets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
    });
  }
}

export const petService = new PetService();
