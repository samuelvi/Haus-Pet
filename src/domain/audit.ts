export interface AuditLog {
  timestamp: Date;
  ipAddress?: string;
  httpMethod: string;
  path: string;
  requestBody?: string;
  beforeState?: string;
  afterState?: string;
}
