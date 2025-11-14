import {
  PrismaClient,
  User as PrismaUser,
  Role as PrismaRole,
} from "@prisma/client";
import { UserRepository } from "../../../domain/auth/repositories/user.repository";
import { User } from "../../../domain/auth/entities/user";
import { Email } from "../../../domain/auth/value-objects/email";
import { Password } from "../../../domain/auth/value-objects/password";
import { Role } from "../../../domain/auth/entities/user";

/**
 * PostgreSQL implementation of UserRepository using Prisma ORM.
 * Handles mapping between Prisma models and Domain entities.
 */
export class PostgresUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Maps Prisma User model to Domain User entity
   */
  private toDomain(prismaUser: PrismaUser): User {
    return User.fromPersistence({
      id: prismaUser.id,
      email: Email.create(prismaUser.email),
      password: Password.fromHash(prismaUser.passwordHash),
      name: prismaUser.name,
      role: prismaUser.role as Role,
      isActive: prismaUser.isActive,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  /**
   * Maps Domain User entity to Prisma User data
   */
  private toPersistence(user: User): {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: PrismaRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: user.getId(),
      email: user.getEmail().getValue(),
      passwordHash: user.getPassword().getHash(),
      name: user.getName(),
      role: user.getRole() as PrismaRole,
      isActive: user.getIsActive(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    };
  }

  async findById(id: string): Promise<User | null> {
    const prismaUser: PrismaUser | null = await this.prisma.user.findUnique({
      where: { id },
    });

    return prismaUser ? this.toDomain(prismaUser) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const prismaUser: PrismaUser | null = await this.prisma.user.findUnique({
      where: { email: email.getValue() },
    });

    return prismaUser ? this.toDomain(prismaUser) : null;
  }

  async save(user: User): Promise<User> {
    const data = this.toPersistence(user);

    const savedUser: PrismaUser = await this.prisma.user.upsert({
      where: { id: user.getId() },
      update: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
      create: data,
    });

    return this.toDomain(savedUser);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findAll(limit: number, offset: number): Promise<User[]> {
    const prismaUsers: PrismaUser[] = await this.prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    return prismaUsers.map((u) => this.toDomain(u));
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count: number = await this.prisma.user.count({
      where: { email: email.getValue() },
    });

    return count > 0;
  }
}
