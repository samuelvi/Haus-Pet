import { Email } from '../value-objects/email';
import { Password } from '../value-objects/password';

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface UserProps {
  id: string;
  email: Email;
  password?: Password; // Optional for sponsor users (no login)
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Entity
 * Represents an authenticated user in the system
 */
export class User {
  private readonly id: string;
  private email: Email;
  private password?: Password;
  private name: string;
  private role: Role;
  private isActive: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
    this.name = props.name;
    this.role = props.role;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Creates a new User entity
   */
  public static create(props: {
    email: Email;
    password: Password;
    name: string;
    role?: Role;
  }): User {
    const now = new Date();
    const id = crypto.randomUUID();

    return new User({
      id,
      email: props.email,
      password: props.password,
      name: props.name,
      role: props.role || Role.ADMIN,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstructs a User entity from persistence
   */
  public static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getEmail(): Email {
    return this.email;
  }

  public getPassword(): Password | undefined {
    return this.password;
  }

  public getName(): string {
    return this.name;
  }

  public getRole(): Role {
    return this.role;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business methods
  public changeEmail(newEmail: Email): void {
    this.email = newEmail;
    this.touch();
  }

  public changeName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.name = newName.trim();
    this.touch();
  }

  public changePassword(newPassword: Password): void {
    this.password = newPassword;
    this.touch();
  }

  public deactivate(): void {
    this.isActive = false;
    this.touch();
  }

  public activate(): void {
    this.isActive = true;
    this.touch();
  }

  public isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  public toJSON(): {
    id: string;
    email: string;
    name: string;
    role: Role;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      email: this.email.getValue(),
      name: this.name,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
