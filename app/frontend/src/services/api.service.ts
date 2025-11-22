/**
 * API Service for backend communication
 * Handles all HTTP requests to the HausPet API
 */

import type {
  ApiResponse,
  User,
  Tokens,
  LoginResponse,
  SignupData,
  LoginData,
  Breed,
  BreedFormData,
  BreedFilters,
} from '../types/api.types';

const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
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
   * Signup a new user
   */
  async signup(data: SignupData): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(accessToken: string, sessionId: string): Promise<User> {
    return this.request<User>('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string,
    sessionId: string
  ): Promise<{ tokens: Tokens }> {
    return this.request<{ tokens: Tokens }>('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-session-id': sessionId,
      },
      body: JSON.stringify({ refreshToken }),
    });
  }

  /**
   * Logout user
   */
  async logout(accessToken: string, sessionId: string): Promise<void> {
    await this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
    });
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

export const apiService = new ApiService();
