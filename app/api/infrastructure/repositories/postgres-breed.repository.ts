import { PrismaClient, Breed as PrismaBreed, AnimalType as PrismaAnimalType } from "@prisma/client";
import { BreedReadRepository, BreedFilters } from "../../domain/breed-read.repository";
import { BreedWriteRepository } from "../../domain/breed-write.repository";
import { Breed as DomainBreed, AnimalType as DomainAnimalType } from "../../domain/breed";

export class PostgresBreedRepository implements BreedReadRepository, BreedWriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Mapper from Prisma model to Domain model
  private toDomain(prismaBreed: PrismaBreed): DomainBreed {
    return {
      id: prismaBreed.id,
      name: prismaBreed.name,
      // Cast the string value from Prisma's enum to the domain's enum
      animalType: prismaBreed.animalType as DomainAnimalType,
    };
  }

  public async findAll(filters?: BreedFilters): Promise<DomainBreed[]> {
    const where: any = {};

    // Only filter by type at database level
    // Search/fuzzy matching is done at application level for database agnosticism
    if (filters?.type) {
      where.animalType = filters.type as PrismaAnimalType;
    }

    const prismaBreeds = await this.prisma.breed.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return prismaBreeds.map(this.toDomain);
  }

  public async findById(id: string): Promise<DomainBreed | null> {
    const prismaBreed = await this.prisma.breed.findUnique({
      where: { id },
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
    });
    return prismaBreed ? this.toDomain(prismaBreed) : null;
  }

  public async findByType(type: DomainAnimalType): Promise<DomainBreed[]> {
    const prismaBreeds = await this.prisma.breed.findMany({
      // Cast the domain enum to the Prisma enum for the query
      where: { animalType: type as PrismaAnimalType },
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
        animalType: breed.animalType as PrismaAnimalType,
      },
    });

    return this.toDomain(createdPrismaBreed);
  }

  public async update(id: string, breedData: Partial<DomainBreed>): Promise<DomainBreed> {
    const updateData: any = {};

    if (breedData.name !== undefined) {
      updateData.name = breedData.name;
    }
    if (breedData.animalType !== undefined) {
      updateData.animalType = breedData.animalType as PrismaAnimalType;
    }

    const updatedPrismaBreed = await this.prisma.breed.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(updatedPrismaBreed);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.breed.delete({
      where: { id },
    });
  }
}
