/**
 * Password Value Object
 * Represents a hashed password
 * Note: This stores the HASH, not the plain password
 */
export class Password {
  private readonly hash: string;

  private constructor(hash: string) {
    this.hash = hash;
  }

  /**
   * Creates a Password from an already hashed password
   * @param hash - The bcrypt hash
   */
  public static fromHash(hash: string): Password {
    if (!hash || hash.trim().length === 0) {
      throw new Error('Password hash cannot be empty');
    }
    return new Password(hash);
  }

  /**
   * Validates a plain password meets requirements
   * @param plainPassword - The plain text password
   * @returns true if valid, false otherwise
   */
  public static isValidPlainPassword(plainPassword: string): boolean {
    if (!plainPassword || plainPassword.length < 8) {
      return false;
    }
    // At least one uppercase, one lowercase, one number
    const hasUpperCase = /[A-Z]/.test(plainPassword);
    const hasLowerCase = /[a-z]/.test(plainPassword);
    const hasNumber = /[0-9]/.test(plainPassword);

    return hasUpperCase && hasLowerCase && hasNumber;
  }

  public getHash(): string {
    return this.hash;
  }

  public equals(other: Password): boolean {
    return this.hash === other.hash;
  }
}
