import { User } from '../entities/user';
import { Email } from '../value-objects/email';

/**
 * User Repository Interface
 * Defines persistence operations for User aggregate
 */
export interface UserRepository {
  /**
   * Finds a user by their ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Finds a user by their email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Saves a user (create or update)
   */
  save(user: User): Promise<User>;

  /**
   * Deletes a user by their ID
   */
  delete(id: string): Promise<void>;

  /**
   * Finds all users with pagination
   */
  findAll(limit: number, offset: number): Promise<User[]>;

  /**
   * Checks if an email is already taken
   */
  existsByEmail(email: Email): Promise<boolean>;
}
