import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { BreedRepository } from '../../../src/repositories/breed.repository';

// Mock PrismaClient
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    breed: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('BreedRepository', () => {
  let repository: BreedRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    repository = new BreedRepository(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findAll', () => {
    it('should return all breeds', async () => {
      const mockBreeds = [
        { id: '1', name: 'Labrador', petType: 'dog', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Persian', petType: 'cat', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockPrisma.breed.findMany.mockResolvedValue(mockBreeds);

      const result = await repository.findAll();

      expect(result).toEqual(mockBreeds);
      expect(mockPrisma.breed.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no breeds exist', async () => {
      mockPrisma.breed.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(mockPrisma.breed.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      mockPrisma.breed.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.findAll()).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('should return breed by id', async () => {
      const mockBreed = {
        id: '1',
        name: 'Labrador',
        petType: 'dog',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.breed.findUnique.mockResolvedValue(mockBreed);

      const result = await repository.findById('1');

      expect(result).toEqual(mockBreed);
      expect(mockPrisma.breed.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null when breed does not exist', async () => {
      mockPrisma.breed.findUnique.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return breed by name', async () => {
      const mockBreed = {
        id: '1',
        name: 'Labrador',
        petType: 'dog',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.breed.findUnique.mockResolvedValue(mockBreed);

      const result = await repository.findByName('Labrador');

      expect(result).toEqual(mockBreed);
      expect(mockPrisma.breed.findUnique).toHaveBeenCalledWith({
        where: { name: 'Labrador' },
      });
    });

    it('should be case-sensitive', async () => {
      mockPrisma.breed.findUnique.mockResolvedValue(null);

      const result = await repository.findByName('labrador');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new breed', async () => {
      const breedData = { name: 'Bulldog', petType: 'dog' as const };
      const mockCreatedBreed = {
        id: '123',
        ...breedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.breed.create.mockResolvedValue(mockCreatedBreed);

      const result = await repository.create(breedData);

      expect(result).toEqual(mockCreatedBreed);
      expect(mockPrisma.breed.create).toHaveBeenCalledWith({
        data: breedData,
      });
    });

    it('should handle duplicate name errors', async () => {
      const breedData = { name: 'Labrador', petType: 'dog' as const };

      mockPrisma.breed.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['name'] },
      });

      await expect(repository.create(breedData)).rejects.toMatchObject({
        code: 'P2002',
      });
    });
  });

  describe('update', () => {
    it('should update an existing breed', async () => {
      const updateData = { name: 'Golden Retriever', petType: 'dog' as const };
      const mockUpdatedBreed = {
        id: '1',
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.breed.update.mockResolvedValue(mockUpdatedBreed);

      const result = await repository.update('1', updateData);

      expect(result).toEqual(mockUpdatedBreed);
      expect(mockPrisma.breed.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });

    it('should throw error when breed does not exist', async () => {
      mockPrisma.breed.update.mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      });

      await expect(repository.update('non-existent', { name: 'Test', petType: 'dog' })).rejects.toMatchObject({
        code: 'P2025',
      });
    });
  });

  describe('delete', () => {
    it('should delete an existing breed', async () => {
      const mockDeletedBreed = {
        id: '1',
        name: 'Labrador',
        petType: 'dog',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.breed.delete.mockResolvedValue(mockDeletedBreed);

      const result = await repository.delete('1');

      expect(result).toEqual(mockDeletedBreed);
      expect(mockPrisma.breed.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw error when breed does not exist', async () => {
      mockPrisma.breed.delete.mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      });

      await expect(repository.delete('non-existent')).rejects.toMatchObject({
        code: 'P2025',
      });
    });
  });
});
