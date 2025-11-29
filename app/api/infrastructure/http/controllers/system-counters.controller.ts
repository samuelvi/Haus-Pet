import { Request, Response } from 'express';
import { SystemCountersService } from '../../../application/SystemCountersService';

/**
 * System Counters Controller
 *
 * Handles HTTP requests for system counters/metrics.
 */
export class SystemCountersController {
  constructor(private readonly countersService: SystemCountersService) {}

  /**
   * GET /api/admin/counters
   * Get all system counters for dashboard
   */
  async getCounters(req: Request, res: Response): Promise<void> {
    try {
      const counters = await this.countersService.getCounters();

      res.status(200).json({
        status: 'OK',
        data: counters,
      });
    } catch (error) {
      console.error('Error fetching system counters:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Failed to fetch system counters',
      });
    }
  }

  /**
   * POST /api/admin/counters/recalculate
   * Recalculate all counters from scratch (admin only)
   */
  async recalculate(req: Request, res: Response): Promise<void> {
    try {
      await this.countersService.recalculate();

      const counters = await this.countersService.getCounters();

      res.status(200).json({
        status: 'OK',
        message: 'Counters recalculated successfully',
        data: counters,
      });
    } catch (error) {
      console.error('Error recalculating counters:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Failed to recalculate counters',
      });
    }
  }
}
