import { PrismaClient, Pet as PrismaPet, PetType as PrismaPetType } from "@prisma/client";
import { PetReadRepository, PetFilters } from "../../domain/pet-read.repository";
import { PetWriteRepository } from "../../domain/pet-write.repository";
import { Pet as DomainPet, PetType as DomainPetType } from "../../domain/pet";

export class PostgresPetRepository implements PetReadRepository, PetWriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Mapper from Prisma model to Domain model
  private toDomain(prismaPet: PrismaPet): DomainPet {
    return {
      id: prismaPet.id,
      breed: prismaPet.breed,
      // Cast the string value from Prisma's enum to the domain's enum
      type: prismaPet.type as DomainPetType,
    };
  }

  public async findAll(filters?: PetFilters): Promise<DomainPet[]> {
    const where: any = {};

    // Only filter by type at database level
    // Search/fuzzy matching is done at application level for database agnosticism
    if (filters?.type) {
      where.type = filters.type as PrismaPetType;
    }

    const prismaPets = await this.prisma.pet.findMany({
      where,
      orderBy: { breed: 'asc' },
    });

    return prismaPets.map(this.toDomain);
  }

  public async findById(id: string): Promise<DomainPet | null> {
    const prismaPet = await this.prisma.pet.findUnique({
      where: { id },
    });
    return prismaPet ? this.toDomain(prismaPet) : null;
  }

  public async findByBreed(breed: string): Promise<DomainPet | null> {
    const prismaPet = await this.prisma.pet.findFirst({
      where: {
        breed: {
          equals: breed,
          mode: 'insensitive',
        },
      },
    });
    return prismaPet ? this.toDomain(prismaPet) : null;
  }

  public async findByType(type: DomainPetType): Promise<DomainPet[]> {
    const prismaPets = await this.prisma.pet.findMany({
      // Cast the domain enum to the Prisma enum for the query
      where: { type: type as PrismaPetType },
    });
    return prismaPets.map(this.toDomain);
  }

  public async save(pet: DomainPet): Promise<DomainPet> {
    if (!pet.id) {
      throw new Error("Pet ID is required for saving");
    }

    const createdPrismaPet = await this.prisma.pet.create({
      data: {
        id: pet.id, // UUIDv7 must be provided
        breed: pet.breed,
        type: pet.type as PrismaPetType,
      },
    });

    return this.toDomain(createdPrismaPet);
  }

  public async update(id: string, petData: Partial<DomainPet>): Promise<DomainPet> {
    const updateData: any = {};

    if (petData.breed !== undefined) {
      updateData.breed = petData.breed;
    }
    if (petData.type !== undefined) {
      updateData.type = petData.type as PrismaPetType;
    }

    const updatedPrismaPet = await this.prisma.pet.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(updatedPrismaPet);
  }

  public async delete(id: string): Promise<void> {
    await this.prisma.pet.delete({
      where: { id },
    });
  }
}
