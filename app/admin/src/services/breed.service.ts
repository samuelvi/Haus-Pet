/**
 * Breed Management Service
 * Handles all breed-related HTTP requests
 */

import type {
  ApiResponse,
  Breed,
  BreedFormData,
  BreedFilters,
} from '../types/breed.types';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class BreedService {
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
   * Get all breeds with optional filters
   */
  async getAllBreeds(filters?: BreedFilters): Promise<Breed[]> {
    let endpoint = '/api/breeds';

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

    return this.request<Breed[]>(endpoint);
  }

  /**
   * Get breed by ID
   */
  async getBreedById(id: string): Promise<Breed> {
    return this.request<Breed>(`/api/breeds/${id}`);
  }

  /**
   * Create new breed
   */
  async createBreed(
    data: BreedFormData,
    accessToken: string,
    sessionId: string
  ): Promise<Breed> {
    const response = await this.request<{ message: string; breed: Breed }>(
      '/api/breeds/add',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-session-id': sessionId,
        },
        body: JSON.stringify(data),
      }
    );
    return response.breed;
  }

  /**
   * Update breed
   */
  async updateBreed(
    id: string,
    data: BreedFormData,
    accessToken: string,
    sessionId: string
  ): Promise<Breed> {
    const response = await this.request<{ message: string; breed: Breed }>(
      `/api/breeds/${id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-session-id': sessionId,
        },
        body: JSON.stringify(data),
      }
    );
    return response.breed;
  }

  /**
   * Delete breed
   */
  async deleteBreed(
    id: string,
    accessToken: string,
    sessionId: string
  ): Promise<void> {
    await this.request<{ message: string }>(`/api/breeds/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
    });
  }
}

export const breedService = new BreedService();
