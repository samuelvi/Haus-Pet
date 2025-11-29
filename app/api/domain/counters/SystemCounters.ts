/**
 * SystemCounters Entity - Domain Model
 *
 * Represents the system-wide counters that are precalculated for performance.
 * This is a singleton entity (only one row in the database).
 */
export class SystemCounters {
  private constructor(
    public readonly id: string,
    public readonly totalBreeds: number,
    public readonly totalActivePets: number,
    public readonly totalBreedTypes: number,
    public readonly totalSponsorships: number,
    public readonly totalUsers: number,
    public readonly totalRevenue: number,
    public readonly updatedAt: Date
  ) {}

  static create(data: {
    totalBreeds: number;
    totalActivePets: number;
    totalBreedTypes: number;
    totalSponsorships: number;
    totalUsers: number;
    totalRevenue: number;
  }): SystemCounters {
    return new SystemCounters(
      'system', // Fixed ID for singleton
      data.totalBreeds,
      data.totalActivePets,
      data.totalBreedTypes,
      data.totalSponsorships,
      data.totalUsers,
      data.totalRevenue,
      new Date()
    );
  }

  static reconstitute(data: {
    id: string;
    totalBreeds: number;
    totalActivePets: number;
    totalBreedTypes: number;
    totalSponsorships: number;
    totalUsers: number;
    totalRevenue: number;
    updatedAt: Date;
  }): SystemCounters {
    return new SystemCounters(
      data.id,
      data.totalBreeds,
      data.totalActivePets,
      data.totalBreedTypes,
      data.totalSponsorships,
      data.totalUsers,
      data.totalRevenue,
      data.updatedAt
    );
  }

  /**
   * Returns a new instance with the breed counter incremented
   */
  incrementBreeds(amount: number = 1): SystemCounters {
    return new SystemCounters(
      this.id,
      this.totalBreeds + amount,
      this.totalActivePets,
      this.totalBreedTypes,
      this.totalSponsorships,
      this.totalUsers,
      this.totalRevenue,
      new Date()
    );
  }

  /**
   * Returns a new instance with the breed counter decremented
   */
  decrementBreeds(amount: number = 1): SystemCounters {
    return new SystemCounters(
      this.id,
      Math.max(0, this.totalBreeds - amount),
      this.totalActivePets,
      this.totalBreedTypes,
      this.totalSponsorships,
      this.totalUsers,
      this.totalRevenue,
      new Date()
    );
  }

  /**
   * Returns a new instance with the pets counter incremented
   */
  incrementPets(amount: number = 1): SystemCounters {
    return new SystemCounters(
      this.id,
      this.totalBreeds,
      this.totalActivePets + amount,
      this.totalBreedTypes,
      this.totalSponsorships,
      this.totalUsers,
      this.totalRevenue,
      new Date()
    );
  }

  /**
   * Returns a new instance with the pets counter decremented
   */
  decrementPets(amount: number = 1): SystemCounters {
    return new SystemCounters(
      this.id,
      this.totalBreeds,
      Math.max(0, this.totalActivePets - amount),
      this.totalBreedTypes,
      this.totalSponsorships,
      this.totalUsers,
      this.totalRevenue,
      new Date()
    );
  }

  /**
   * Returns a new instance with the breed types counter incremented
   */
  incrementBreedTypes(amount: number = 1): SystemCounters {
    return new SystemCounters(
      this.id,
      this.totalBreeds,
      this.totalActivePets,
      this.totalBreedTypes + amount,
      this.totalSponsorships,
      this.totalUsers,
      this.totalRevenue,
      new Date()
    );
  }

  /**
   * Returns a new instance with the breed types counter decremented
   */
  decrementBreedTypes(amount: number = 1): SystemCounters {
    return new SystemCounters(
      this.id,
      this.totalBreeds,
      this.totalActivePets,
      Math.max(0, this.totalBreedTypes - amount),
      this.totalSponsorships,
      this.totalUsers,
      this.totalRevenue,
      new Date()
    );
  }

  /**
   * Returns a new instance with the sponsorships counter incremented and revenue updated
   */
  incrementSponsorships(amount: number, revenue: number): SystemCounters {
    return new SystemCounters(
      this.id,
      this.totalBreeds,
      this.totalActivePets,
      this.totalBreedTypes,
      this.totalSponsorships + amount,
      this.totalUsers,
      this.totalRevenue + revenue,
      new Date()
    );
  }

  /**
   * Returns a new instance with the users counter incremented
   */
  incrementUsers(amount: number = 1): SystemCounters {
    return new SystemCounters(
      this.id,
      this.totalBreeds,
      this.totalActivePets,
      this.totalBreedTypes,
      this.totalSponsorships,
      this.totalUsers + amount,
      this.totalRevenue,
      new Date()
    );
  }

  /**
   * Converts the entity to a plain object for persistence
   */
  toDTO() {
    return {
      id: this.id,
      totalBreeds: this.totalBreeds,
      totalActivePets: this.totalActivePets,
      totalBreedTypes: this.totalBreedTypes,
      totalSponsorships: this.totalSponsorships,
      totalUsers: this.totalUsers,
      totalRevenue: this.totalRevenue,
      updatedAt: this.updatedAt,
    };
  }
}
