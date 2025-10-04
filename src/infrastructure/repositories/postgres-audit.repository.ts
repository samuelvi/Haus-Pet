import { Pool } from "pg";
import { AuditRepository } from "../../domain/audit.repository";
import { AuditLog } from "../../domain/audit";

export class PostgresAuditRepository implements AuditRepository {
  // El repositorio ya no es responsable de crear el pool.
  // Lo recibe como una dependencia.
  constructor(private readonly pool: Pool) {}

  public async save(log: AuditLog): Promise<void> {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO audit_log (ip_address, http_method, path, request_body, before_state, after_state)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      const values = [
        log.ipAddress,
        log.httpMethod,
        log.path,
        log.requestBody,
        log.beforeState,
        log.afterState,
      ];
      await client.query(query, values);
    } finally {
      client.release();
    }
  }
}
