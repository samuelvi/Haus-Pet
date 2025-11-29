import type { SystemCounters } from '../types/api.types';
import { apiService } from './api.service';

export class CountersService {
  /**
   * Get system counters
   */
  static async getCounters(
    accessToken: string,
    sessionId: string
  ): Promise<SystemCounters> {
    return apiService.getSystemCounters(accessToken, sessionId);
  }
}
