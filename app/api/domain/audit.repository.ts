import { AuditLog } from "./audit";

export interface AuditRepository {
  save(log: AuditLog): Promise<void>;
}
