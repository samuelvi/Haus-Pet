import bcrypt from 'bcrypt';
import { Password } from '../../../domain/auth/value-objects/password';

/**
 * Password Hasher Service
 * Handles password hashing and verification using bcrypt
 */
export class PasswordHasherService {
  private readonly saltRounds: number = 10;

  /**
   * Hashes a plain password
   * @param plainPassword - The plain text password
   * @returns Password value object with the hash
   */
  public async hash(plainPassword: string): Promise<Password> {
    if (!Password.isValidPlainPassword(plainPassword)) {
      throw new Error(
        'Password must be at least 8 characters and contain uppercase, lowercase, and number'
      );
    }

    const hash: string = await bcrypt.hash(plainPassword, this.saltRounds);
    return Password.fromHash(hash);
  }

  /**
   * Verifies a plain password against a hash
   * @param plainPassword - The plain text password to check
   * @param password - The Password value object with the hash
   * @returns true if password matches, false otherwise
   */
  public async verify(plainPassword: string, password: Password): Promise<boolean> {
    return bcrypt.compare(plainPassword, password.getHash());
  }
}
