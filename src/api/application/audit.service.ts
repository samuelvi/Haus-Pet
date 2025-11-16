import { AuditRepository } from "../domain/audit.repository";
import { AuditLog } from "../domain/audit";

export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  public async log(auditLog: AuditLog): Promise<void> {
    await this.auditRepository.save(auditLog);
  }
}
