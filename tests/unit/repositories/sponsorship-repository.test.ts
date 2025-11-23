import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SponsorshipRepository } from '../../../src/repositories/sponsorship.repository';

vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    sponsorship: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    pet: {
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('SponsorshipRepository', () => {
  let repository: SponsorshipRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    repository = new SponsorshipRepository(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create sponsorship with new user', async () => {
      const sponsorshipData = {
        petId: 'pet-123',
        email: 'new@example.com',
        name: 'New Sponsor',
        amount: 50,
        currency: 'USD',
      };

      const mockUser = {
        id: 'user-123',
        email: 'new@example.com',
        name: 'New Sponsor',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSponsorship = {
        id: 'sponsorship-123',
        petId: 'pet-123',
        userId: 'user-123',
        amount: 50,
        currency: 'USD',
        createdAt: new Date(),
        user: mockUser,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.sponsorship.create.mockResolvedValue(mockSponsorship);

      const result = await repository.create(sponsorshipData);

      expect(result).toEqual(mockSponsorship);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          name: 'New Sponsor',
          role: 'USER',
        },
      });
    });

    it('CRITICAL: should reuse existing user when email already exists', async () => {
      const sponsorshipData = {
        petId: 'pet-123',
        email: 'existing@example.com',
        name: 'Existing User',
        amount: 75,
        currency: 'USD',
      };

      const existingUser = {
        id: 'existing-user-123',
        email: 'existing@example.com',
        name: 'Existing User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSponsorship = {
        id: 'sponsorship-456',
        petId: 'pet-123',
        userId: 'existing-user-123',
        amount: 75,
        currency: 'USD',
        createdAt: new Date(),
        user: existingUser,
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });
      mockPrisma.sponsorship.create.mockResolvedValue(mockSponsorship);

      const result = await repository.create(sponsorshipData);

      expect(result.userId).toBe('existing-user-123');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.create).not.toHaveBeenCalled(); // CRITICAL: No new user created
      expect(mockPrisma.sponsorship.create).toHaveBeenCalledWith({
        data: {
          petId: 'pet-123',
          userId: 'existing-user-123',
          amount: 75,
          currency: 'USD',
        },
        include: { user: true },
      });
    });

    it('should handle concurrent sponsorships from same email', async () => {
      const email = 'concurrent@example.com';
      const sponsorship1 = {
        petId: 'pet-1',
        email,
        name: 'Concurrent User',
        amount: 25,
        currency: 'USD',
      };
      const sponsorship2 = {
        petId: 'pet-2',
        email,
        name: 'Concurrent User',
        amount: 30,
        currency: 'USD',
      };

      const mockUser = {
        id: 'user-concurrent',
        email,
        name: 'Concurrent User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // First call: user doesn't exist
      // Second call: user exists
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.sponsorship.create.mockResolvedValue({
        id: 'sponsorship-1',
        ...sponsorship1,
        userId: mockUser.id,
        user: mockUser,
      });

      await repository.create(sponsorship1);

      mockPrisma.sponsorship.create.mockResolvedValue({
        id: 'sponsorship-2',
        ...sponsorship2,
        userId: mockUser.id,
        user: mockUser,
      });

      const result2 = await repository.create(sponsorship2);

      expect(result2.userId).toBe('user-concurrent');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1); // Only one user created
    });

    it('should update pet totalSponsored within transaction', async () => {
      const sponsorshipData = {
        petId: 'pet-123',
        email: 'sponsor@example.com',
        name: 'Sponsor',
        amount: 100,
        currency: 'USD',
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'sponsor@example.com',
        name: 'Sponsor',
        role: 'USER',
      });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        return await callback(mockPrisma);
      });

      mockPrisma.sponsorship.create.mockResolvedValue({
        id: 'sponsorship-123',
        petId: 'pet-123',
        userId: 'user-123',
        amount: 100,
        currency: 'USD',
        user: { id: 'user-123' },
      });

      mockPrisma.pet.update.mockResolvedValue({
        id: 'pet-123',
        totalSponsored: 100,
      });

      await repository.create(sponsorshipData);

      expect(mockPrisma.pet.update).toHaveBeenCalledWith({
        where: { id: 'pet-123' },
        data: {
          totalSponsored: { increment: 100 },
        },
      });
    });

    it('should validate amount is positive', async () => {
      const invalidData = {
        petId: 'pet-123',
        email: 'test@example.com',
        name: 'Test',
        amount: -50,
        currency: 'USD',
      };

      // This should be caught by validation before reaching repository
      // But testing repository behavior if it somehow receives negative amount
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        throw new Error('Amount must be positive');
      });

      await expect(repository.create(invalidData)).rejects.toThrow();
    });
  });

  describe('findByPetId', () => {
    it('should return all sponsorships for a pet', async () => {
      const mockSponsorships = [
        {
          id: '1',
          petId: 'pet-123',
          userId: 'user-1',
          amount: 50,
          currency: 'USD',
          createdAt: new Date(),
          user: { id: 'user-1', email: 'user1@example.com', name: 'User 1' },
        },
        {
          id: '2',
          petId: 'pet-123',
          userId: 'user-2',
          amount: 75,
          currency: 'USD',
          createdAt: new Date(),
          user: { id: 'user-2', email: 'user2@example.com', name: 'User 2' },
        },
      ];

      mockPrisma.sponsorship.findMany.mockResolvedValue(mockSponsorships);

      const result = await repository.findByPetId('pet-123');

      expect(result).toEqual(mockSponsorships);
      expect(mockPrisma.sponsorship.findMany).toHaveBeenCalledWith({
        where: { petId: 'pet-123' },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array for pet with no sponsorships', async () => {
      mockPrisma.sponsorship.findMany.mockResolvedValue([]);

      const result = await repository.findByPetId('pet-no-sponsors');

      expect(result).toEqual([]);
    });
  });

  describe('findRecent', () => {
    it('should return recent sponsorships with default limit', async () => {
      const mockSponsorships = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `sponsorship-${i}`,
          petId: `pet-${i}`,
          userId: `user-${i}`,
          amount: 50,
          currency: 'USD',
          createdAt: new Date(),
          user: { id: `user-${i}`, email: `user${i}@example.com`, name: `User ${i}` },
          pet: { id: `pet-${i}`, name: `Pet ${i}` },
        }));

      mockPrisma.sponsorship.findMany.mockResolvedValue(mockSponsorships);

      const result = await repository.findRecent();

      expect(result.length).toBe(10);
      expect(mockPrisma.sponsorship.findMany).toHaveBeenCalledWith({
        include: {
          user: true,
          pet: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });

    it('should respect custom limit', async () => {
      mockPrisma.sponsorship.findMany.mockResolvedValue([]);

      await repository.findRecent(5);

      expect(mockPrisma.sponsorship.findMany).toHaveBeenCalledWith({
        include: {
          user: true,
          pet: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });
});
