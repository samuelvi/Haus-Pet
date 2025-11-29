import { SystemCounters } from './SystemCounters';

/**
 * Repository interface for System Counters
 *
 * This is a singleton repository that manages a single row in the database.
 */
export interface ISystemCountersRepository {
  /**
   * Get the system counters (singleton)
   * Creates the row if it doesn't exist
   */
  get(): Promise<SystemCounters>;

  /**
   * Update the system counters
   */
  update(counters: SystemCounters): Promise<void>;

  /**
   * Initialize counters with current values from the database
   * This should be called once during application startup or when counters need to be recalculated
   */
  initialize(): Promise<void>;
}
