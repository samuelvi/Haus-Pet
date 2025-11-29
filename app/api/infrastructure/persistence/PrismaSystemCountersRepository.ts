import { PrismaClient } from '@prisma/client';
import { ISystemCountersRepository } from '../../domain/counters/ISystemCountersRepository';
import { SystemCounters } from '../../domain/counters/SystemCounters';

/**
 * Prisma implementation of System Counters Repository
 *
 * Manages the singleton system counters row in the database.
 */
export class PrismaSystemCountersRepository implements ISystemCountersRepository {
  private static readonly SYSTEM_ID = 'system';

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get the system counters
   * Creates the row with zeros if it doesn't exist
   */
  async get(): Promise<SystemCounters> {
    let row = await this.prisma.systemCounters.findUnique({
      where: { id: PrismaSystemCountersRepository.SYSTEM_ID },
    });

    // Create if doesn't exist
    if (!row) {
      row = await this.prisma.systemCounters.create({
        data: {
          id: PrismaSystemCountersRepository.SYSTEM_ID,
          totalBreeds: 0,
          totalActivePets: 0,
          totalBreedTypes: 0,
          totalSponsorships: 0,
          totalUsers: 0,
          totalRevenue: 0,
        },
      });
    }

    return SystemCounters.reconstitute({
      id: row.id,
      totalBreeds: row.totalBreeds,
      totalActivePets: row.totalActivePets,
      totalBreedTypes: row.totalBreedTypes,
      totalSponsorships: row.totalSponsorships,
      totalUsers: row.totalUsers,
      totalRevenue: Number(row.totalRevenue),
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Update the system counters
   */
  async update(counters: SystemCounters): Promise<void> {
    await this.prisma.systemCounters.upsert({
      where: { id: PrismaSystemCountersRepository.SYSTEM_ID },
      create: {
        id: PrismaSystemCountersRepository.SYSTEM_ID,
        totalBreeds: counters.totalBreeds,
        totalActivePets: counters.totalActivePets,
        totalBreedTypes: counters.totalBreedTypes,
        totalSponsorships: counters.totalSponsorships,
        totalUsers: counters.totalUsers,
        totalRevenue: counters.totalRevenue,
      },
      update: {
        totalBreeds: counters.totalBreeds,
        totalActivePets: counters.totalActivePets,
        totalBreedTypes: counters.totalBreedTypes,
        totalSponsorships: counters.totalSponsorships,
        totalUsers: counters.totalUsers,
        totalRevenue: counters.totalRevenue,
      },
    });
  }

  /**
   * Initialize counters by calculating current values from the database
   */
  async initialize(): Promise<void> {
    // Calculate actual counts from database
    const [
      breedsCount,
      petsCount,
      breedTypesCount,
      sponsorshipsData,
      usersCount,
    ] = await Promise.all([
      this.prisma.breed.count(),
      this.prisma.pet.count(),
      this.prisma.breedType.count(),
      this.prisma.sponsorship.aggregate({
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.user.count(),
    ]);

    const totalRevenue = Number(sponsorshipsData._sum.amount || 0);

    // Upsert the calculated values
    await this.prisma.systemCounters.upsert({
      where: { id: PrismaSystemCountersRepository.SYSTEM_ID },
      create: {
        id: PrismaSystemCountersRepository.SYSTEM_ID,
        totalBreeds: breedsCount,
        totalActivePets: petsCount,
        totalBreedTypes: breedTypesCount,
        totalSponsorships: sponsorshipsData._count,
        totalUsers: usersCount,
        totalRevenue,
      },
      update: {
        totalBreeds: breedsCount,
        totalActivePets: petsCount,
        totalBreedTypes: breedTypesCount,
        totalSponsorships: sponsorshipsData._count,
        totalUsers: usersCount,
        totalRevenue,
      },
    });
  }
}
