import { uuidv7 } from "uuidv7";
import sessionConnection from "../redis-session-connection";
import { SessionNotFoundError } from "../../../domain/auth/errors";

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastAccessedAt: number;
}

export interface CreateSessionParams {
  userId: string;
  email: string;
  role: string;
}

/**
 * SessionService manages user sessions in Redis (database 1).
 * Sessions are stored with a TTL and can be validated, refreshed, and destroyed.
 */
export class SessionService {
  private readonly SESSION_PREFIX = "session:";
  private readonly DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

  /**
   * Creates a new session in Redis and returns the session ID.
   */
  async createSession(params: CreateSessionParams): Promise<string> {
    const sessionId: string = uuidv7();
    const now: number = Date.now();

    const sessionData: SessionData = {
      userId: params.userId,
      email: params.email,
      role: params.role,
      createdAt: now,
      lastAccessedAt: now,
    };

    const key: string = this.getSessionKey(sessionId);
    await sessionConnection.setex(
      key,
      this.DEFAULT_TTL_SECONDS,
      JSON.stringify(sessionData)
    );

    return sessionId;
  }

  /**
   * Retrieves session data from Redis.
   * Throws SessionNotFoundError if the session doesn't exist or has expired.
   */
  async getSession(sessionId: string): Promise<SessionData> {
    const key: string = this.getSessionKey(sessionId);
    const data: string | null = await sessionConnection.get(key);

    if (!data) {
      throw new SessionNotFoundError(
        `Session not found or expired: ${sessionId}`
      );
    }

    return JSON.parse(data) as SessionData;
  }

  /**
   * Validates if a session exists and is not expired.
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const key: string = this.getSessionKey(sessionId);
    const exists: number = await sessionConnection.exists(key);
    return exists === 1;
  }

  /**
   * Updates the lastAccessedAt timestamp and refreshes the TTL.
   */
  async refreshSession(sessionId: string): Promise<void> {
    const sessionData: SessionData = await this.getSession(sessionId);
    sessionData.lastAccessedAt = Date.now();

    const key: string = this.getSessionKey(sessionId);
    await sessionConnection.setex(
      key,
      this.DEFAULT_TTL_SECONDS,
      JSON.stringify(sessionData)
    );
  }

  /**
   * Destroys a session (logout).
   */
  async destroySession(sessionId: string): Promise<void> {
    const key: string = this.getSessionKey(sessionId);
    await sessionConnection.del(key);
  }

  /**
   * Destroys all sessions for a specific user.
   */
  async destroyAllUserSessions(userId: string): Promise<void> {
    const pattern: string = `${this.SESSION_PREFIX}*`;
    const keys: string[] = await sessionConnection.keys(pattern);

    for (const key of keys) {
      const data: string | null = await sessionConnection.get(key);
      if (data) {
        const sessionData: SessionData = JSON.parse(data) as SessionData;
        if (sessionData.userId === userId) {
          await sessionConnection.del(key);
        }
      }
    }
  }

  private getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }
}
