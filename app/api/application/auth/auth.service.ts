import { UserRepository } from "../../domain/auth/repositories/user.repository";
import { User, Role } from "../../domain/auth/entities/user";
import { Email } from "../../domain/auth/value-objects/email";
import { Password } from "../../domain/auth/value-objects/password";
import { PasswordHasherService } from "../../infrastructure/auth/services/password-hasher.service";
import { JwtService, TokenPair } from "../../infrastructure/auth/services/jwt.service";
import { SessionService } from "../../infrastructure/auth/services/session.service";
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
  InactiveUserError,
  InvalidTokenError,
  SessionNotFoundError,
} from "../../domain/auth/errors";

export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    isActive: boolean;
  };
  tokens: TokenPair;
  sessionId: string;
}

/**
 * AuthService handles all authentication-related business logic.
 * Orchestrates User entity, repositories, password hashing, JWT, and sessions.
 */
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService
  ) {}

  /**
   * Registers a new user in the system
   */
  async register(dto: RegisterUserDto): Promise<AuthResponse> {
    const email: Email = Email.create(dto.email);

    // Check if user already exists
    const existingUser: boolean = await this.userRepository.existsByEmail(
      email
    );
    if (existingUser) {
      throw new UserAlreadyExistsError(
        `User with email ${dto.email} already exists`
      );
    }

    // Hash password
    const hashedPassword: Password = await this.passwordHasher.hash(
      dto.password
    );

    // Create user entity
    const user: User = User.create({
      email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role,
    });

    // Save to repository
    const savedUser: User = await this.userRepository.save(user);

    // Generate tokens
    const tokens: TokenPair = this.jwtService.generateTokenPair({
      userId: savedUser.getId(),
      email: savedUser.getEmail().getValue(),
      role: savedUser.getRole(),
    });

    // Create session
    const sessionId: string = await this.sessionService.createSession({
      userId: savedUser.getId(),
      email: savedUser.getEmail().getValue(),
      role: savedUser.getRole(),
    });

    return {
      user: savedUser.toJSON(),
      tokens,
      sessionId,
    };
  }

  /**
   * Authenticates a user and returns tokens + session
   */
  async login(dto: LoginUserDto): Promise<AuthResponse> {
    const email: Email = Email.create(dto.email);

    // Find user
    const user: User | null = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError("Invalid email or password");
    }

    // Check if user is active
    if (!user.getIsActive()) {
      throw new InactiveUserError("User account is deactivated");
    }

    // Verify password (users without password cannot login)
    const userPassword = user.getPassword();
    if (!userPassword) {
      throw new InvalidCredentialsError("Invalid email or password");
    }
    const isPasswordValid: boolean = await this.passwordHasher.verify(
      dto.password,
      userPassword
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError("Invalid email or password");
    }

    // Generate tokens
    const tokens: TokenPair = this.jwtService.generateTokenPair({
      userId: user.getId(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
    });

    // Create session
    const sessionId: string = await this.sessionService.createSession({
      userId: user.getId(),
      email: user.getEmail().getValue(),
      role: user.getRole(),
    });

    return {
      user: user.toJSON(),
      tokens,
      sessionId,
    };
  }

  /**
   * Refreshes access token using refresh token and session validation
   */
  async refreshToken(
    refreshToken: string,
    sessionId: string
  ): Promise<TokenPair> {
    // Verify refresh token
    let payload;
    try {
      payload = this.jwtService.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new InvalidTokenError("Invalid or expired refresh token");
    }

    // Validate session still exists
    const isSessionValid: boolean = await this.sessionService.validateSession(
      sessionId
    );
    if (!isSessionValid) {
      throw new SessionNotFoundError("Session expired or not found");
    }

    // Refresh session TTL
    await this.sessionService.refreshSession(sessionId);

    // Generate new token pair
    const tokens: TokenPair = this.jwtService.generateTokenPair({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    return tokens;
  }

  /**
   * Logs out user by destroying their session
   */
  async logout(sessionId: string): Promise<void> {
    await this.sessionService.destroySession(sessionId);
  }

  /**
   * Gets current user by ID and validates session
   */
  async getCurrentUser(userId: string, sessionId: string): Promise<User> {
    // Validate session
    const isSessionValid: boolean = await this.sessionService.validateSession(
      sessionId
    );
    if (!isSessionValid) {
      throw new SessionNotFoundError("Session expired or not found");
    }

    // Refresh session TTL on activity
    await this.sessionService.refreshSession(sessionId);

    // Get user
    const user: User | null = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(`User with ID ${userId} not found`);
    }

    // Check if user is still active
    if (!user.getIsActive()) {
      throw new InactiveUserError("User account is deactivated");
    }

    return user;
  }
}
