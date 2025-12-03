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
  BreedType,
  SystemCounters,
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
  async getAllBreeds(filters?: BreedFilters, page?: number, limit?: number): Promise<{ items: Breed[]; pagination: any }> {
    let endpoint = '/api/breeds';
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
    }

    if (page) {
      params.append('page', page.toString());
    }
    if (limit) {
      params.append('limit', limit.toString());
    }

    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    // Backend now returns paginated response: { items: Breed[], pagination: {...} }
    return this.request<{ items: Breed[]; pagination: any }>(endpoint);
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

  /**
   * Check for similar breeds
   */
  async checkSimilarBreeds(
    name: string,
    petType?: string
  ): Promise<Array<{ id: string; name: string; petType: string; similarity: number }>> {
    const params = new URLSearchParams();
    params.append('name', name);
    if (petType) {
      params.append('petType', petType);
    }

    const response = await this.request<{
      query: string;
      similar: Array<{ id: string; name: string; petType: string; similarity: number }>;
    }>(`/api/breeds/check-similar?${params.toString()}`);

    return response.similar;
  }

  /**
   * List breed types (admin)
   */
  async getBreedTypes(accessToken: string, sessionId: string): Promise<BreedType[]> {
    // Backend now returns paginated response: { items: BreedType[], pagination: {...} }
    const response = await this.request<{ items: BreedType[]; pagination: any }>('/api/admin/breed-types', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
    });
    return response.items;
  }

  /**
   * Create breed type (admin)
   */
  async createBreedType(
    name: string,
    accessToken: string,
    sessionId: string
  ): Promise<BreedType> {
    const res = await this.request<BreedType>('/api/admin/breed-types', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
      body: JSON.stringify({ name }),
    });
    return res;
  }

  /**
   * Update breed type (admin)
   */
  async updateBreedType(
    id: string,
    name: string,
    accessToken: string,
    sessionId: string
  ): Promise<BreedType> {
    const res = await this.request<BreedType>(`/api/admin/breed-types/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
      body: JSON.stringify({ name }),
    });
    return res;
  }

  /**
   * Delete breed type (admin)
   */
  async deleteBreedType(
    id: string,
    accessToken: string,
    sessionId: string
  ): Promise<void> {
    await this.request<void>(`/api/admin/breed-types/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
    });
  }

  /**
   * Get system counters (admin)
   */
  async getSystemCounters(
    accessToken: string,
    sessionId: string
  ): Promise<SystemCounters> {
    return this.request<SystemCounters>('/api/admin/counters', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-session-id': sessionId,
      },
    });
  }
}

export const apiService = new ApiService();
