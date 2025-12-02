import { PrismaClient } from "@prisma/client";
import { BreedTypeRepository } from "../../domain/breed-type.repository";
import { BreedType } from "../../domain/breed";

export class PostgresBreedTypeRepository implements BreedTypeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(row: any): BreedType {
    return {
      id: row.id,
      name: row.name,
    };
  }

  async findAll(page?: number, limit?: number): Promise<BreedType[]> {
    const queryOptions: any = {
      orderBy: { name: "asc" },
    };

    // Apply pagination if provided
    if (page !== undefined && limit !== undefined) {
      const offset = (page - 1) * limit;
      queryOptions.skip = offset;
      queryOptions.take = limit;
    }

    const rows = await this.prisma.breedType.findMany(queryOptions);
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<BreedType | null> {
    const row = await this.prisma.breedType.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByName(name: string): Promise<BreedType | null> {
    const row = await this.prisma.breedType.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(breedType: BreedType): Promise<BreedType> {
    const created = await this.prisma.breedType.create({
      data: {
        id: breedType.id!,
        name: breedType.name,
      },
    });
    return this.toDomain(created);
  }

  async update(id: string, data: Partial<BreedType>): Promise<BreedType> {
    const updated = await this.prisma.breedType.update({
      where: { id },
      data: {
        name: data.name,
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.breedType.delete({ where: { id } });
  }

  async countBreedsByTypeId(id: string): Promise<number> {
    const count = await this.prisma.breed.count({
      where: { breedTypeId: id },
    });
    return count;
  }
}
