import { ISystemCountersRepository } from '../domain/counters/ISystemCountersRepository';

/**
 * System Counters Service - Application Layer
 *
 * Handles business logic for system counters.
 * This service is called by event handlers to update counters asynchronously.
 */
export class SystemCountersService {
  constructor(
    private readonly systemCountersRepository: ISystemCountersRepository
  ) {}

  /**
   * Get current system counters
   */
  async getCounters() {
    const counters = await this.systemCountersRepository.get();
    return counters.toDTO();
  }

  /**
   * Increment breed counter
   */
  async incrementBreeds(amount: number = 1): Promise<void> {
    const counters = await this.systemCountersRepository.get();
    const updated = counters.incrementBreeds(amount);
    await this.systemCountersRepository.update(updated);
  }

  /**
   * Decrement breed counter
   */
  async decrementBreeds(amount: number = 1): Promise<void> {
    const counters = await this.systemCountersRepository.get();
    const updated = counters.decrementBreeds(amount);
    await this.systemCountersRepository.update(updated);
  }

  /**
   * Increment pets counter
   */
  async incrementPets(amount: number = 1): Promise<void> {
    const counters = await this.systemCountersRepository.get();
    const updated = counters.incrementPets(amount);
    await this.systemCountersRepository.update(updated);
  }

  /**
   * Decrement pets counter
   */
  async decrementPets(amount: number = 1): Promise<void> {
    const counters = await this.systemCountersRepository.get();
    const updated = counters.decrementPets(amount);
    await this.systemCountersRepository.update(updated);
  }

  /**
   * Increment breed types counter
   */
  async incrementBreedTypes(amount: number = 1): Promise<void> {
    const counters = await this.systemCountersRepository.get();
    const updated = counters.incrementBreedTypes(amount);
    await this.systemCountersRepository.update(updated);
  }

  /**
   * Decrement breed types counter
   */
  async decrementBreedTypes(amount: number = 1): Promise<void> {
    const counters = await this.systemCountersRepository.get();
    const updated = counters.decrementBreedTypes(amount);
    await this.systemCountersRepository.update(updated);
  }

  /**
   * Increment sponsorships counter and add revenue
   */
  async incrementSponsorships(
    amount: number,
    revenue: number
  ): Promise<void> {
    const counters = await this.systemCountersRepository.get();
    const updated = counters.incrementSponsorships(amount, revenue);
    await this.systemCountersRepository.update(updated);
  }

  /**
   * Increment users counter
   */
  async incrementUsers(amount: number = 1): Promise<void> {
    const counters = await this.systemCountersRepository.get();
    const updated = counters.incrementUsers(amount);
    await this.systemCountersRepository.update(updated);
  }

  /**
   * Recalculate all counters from scratch
   * Useful for initialization or fixing inconsistencies
   */
  async recalculate(): Promise<void> {
    await this.systemCountersRepository.initialize();
  }
}
