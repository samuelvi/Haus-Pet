import { PrismaClient, Breed as PrismaBreed } from "@prisma/client";
import { BreedReadRepository, BreedFilters } from "../../domain/breed-read.repository";
import { BreedWriteRepository } from "../../domain/breed-write.repository";
import { Breed as DomainBreed, PetType as DomainPetType } from "../../domain/breed";

export class PostgresBreedRepository implements BreedReadRepository, BreedWriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Mapper from Prisma model to Domain model
  private toDomain(prismaBreed: PrismaBreed): DomainBreed {
    return {
      id: prismaBreed.id,
      name: prismaBreed.name,
      petType: (prismaBreed as any).breedType?.name ?? (prismaBreed as any).petType ?? '',
      breedTypeId: (prismaBreed as any).breedTypeId ?? (prismaBreed as any).breed_type_id,
    };
  }

  public async findAll(filters?: BreedFilters): Promise<DomainBreed[]> {
    const where: any = {};

    // Only filter by type at database level
    // Search/fuzzy matching is done at application level for database agnosticism
    if (filters?.type) {
      where.breedType = {
        name: {
          equals: filters.type,
          mode: 'insensitive',
        },
      };
    }

    const prismaBreeds = await this.prisma.breed.findMany({
      where: where as any,
      orderBy: { name: 'asc' },
      include: { breedType: true } as any,
    });

    return prismaBreeds.map(this.toDomain);
  }

  public async countPetsUsingBreedName(name: string): Promise<number> {
    const count = await this.prisma.pet.count({
      where: {
        breed: {
          equals: name,
          mode: "insensitive",
        },
      },
    });
    return count;
  }

  public async findById(id: string): Promise<DomainBreed | null> {
    const prismaBreed = await this.prisma.breed.findUnique({
      where: { id },
      include: { breedType: true } as any,
    });
    return prismaBreed ? this.toDomain(prismaBreed) : null;
  }

  public async findByName(name: string): Promise<DomainBreed | null> {
    const prismaBreed = await this.prisma.breed.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      include: { breedType: true } as any,
    });
    return prismaBreed ? this.toDomain(prismaBreed) : null;
  }

  public async findByType(type: DomainPetType): Promise<DomainBreed[]> {
    const prismaBreeds = await this.prisma.breed.findMany({
      where: {
        breedType: {
          name: {
            equals: type,
            mode: 'insensitive',
          },
        },
      } as any,
      include: { breedType: true } as any,
    });
    return prismaBreeds.map(this.toDomain);
  }

  public async save(breed: DomainBreed): Promise<DomainBreed> {
    if (!breed.id) {
      throw new Error("Breed ID is required for saving");
    }

    const createdPrismaBreed = await this.prisma.breed.create({
      data: {
        id: breed.id, // UUIDv7 must be provided
        name: breed.name,
        breedTypeId: breed.breedTypeId,
      },
      include: { breedType: true } as any,
    });

    return this.toDomain(createdPrismaBreed);
  }

  public async update(id: string, breedData: Partial<DomainBreed>): Promise<DomainBreed> {
    const updateData: any = {};

    if (breedData.name !== undefined) {
      updateData.name = breedData.name;
    }
    // Only use breedTypeId for updates (petType is just metadata, breedTypeId is the actual FK)
    if (breedData.breedTypeId !== undefined) {
      updateData.breedTypeId = breedData.breedTypeId;
    }

    const updatedPrismaBreed = await this.prisma.breed.update({
      where: { id },
      data: updateData,
      include: { breedType: true } as any,
    });

    return this.toDomain(updatedPrismaBreed);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.breed.delete({
      where: { id },
    });
  }
}
