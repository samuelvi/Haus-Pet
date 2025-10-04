export interface AuditLog {
  ipAddress?: string;
  httpMethod: string;
  path: string;
  requestBody?: string;
  beforeState?: string;
  afterState?: string;
}
