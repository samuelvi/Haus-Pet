import { PrismaClient, Pet as PrismaPet, PetType as PrismaPetType } from "@prisma/client";
import { PetReadRepository } from "../../domain/pet-read.repository";
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

  public async findAll(): Promise<DomainPet[]> {
    const prismaPets = await this.prisma.pet.findMany();
    return prismaPets.map(this.toDomain);
  }

  public async findByBreed(breed: string): Promise<DomainPet | null> {
    const prismaPet = await this.prisma.pet.findFirst({
      where: { breed },
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
    // The `id` is optional in the domain, but Prisma expects it to be undefined for creation.
    const { id, ...petData } = pet;

    const createdPrismaPet = await this.prisma.pet.create({
      data: {
        ...petData,
        // Cast the domain enum to the Prisma enum for writing
        type: pet.type as PrismaPetType,
      },
    });

    return this.toDomain(createdPrismaPet);
  }
}
