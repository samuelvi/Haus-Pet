import IORedis from "ioredis";

const FAILURE_THRESHOLD = 3;
const COOLDOWN_PERIOD_MS = 30 * 1000; // 30 seconds

export class RedisHealthService {
  private failures = 0;
  private lastFailureTimestamp = 0;

  constructor(private readonly connection: IORedis) {}

  public async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.connection.ping();
      if (pong === "PONG") {
        this.recordSuccess();
        return true;
      }
    } catch (error) {
      // Ignore error, we handle it below
    }
    this.recordFailure();
    return false;
  }

  public get isCircuitOpen(): boolean {
    if (this.failures < FAILURE_THRESHOLD) {
      return false;
    }

    if (Date.now() - this.lastFailureTimestamp > COOLDOWN_PERIOD_MS) {
      // Cooldown period has passed, let's try again (half-open state)
      this.reset();
      return false;
    }

    return true;
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTimestamp = Date.now();
  }

  private recordSuccess() {
    this.reset();
  }

  private reset() {
    this.failures = 0;
    this.lastFailureTimestamp = 0;
  }
}
