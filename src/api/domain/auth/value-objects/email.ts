/**
 * Email Value Object
 * Ensures email validity and provides email-specific behavior
 */
export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates a new Email value object
   * @param value - The email string to validate
   * @returns Email instance or throws error
   */
  public static create(value: string): Email {
    if (!this.isValid(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
    return new Email(value.toLowerCase().trim());
  }

  private static isValid(email: string): boolean {
    if (!email || email.trim().length === 0) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
