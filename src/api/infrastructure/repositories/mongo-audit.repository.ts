import { AuditRepository } from "../../domain/audit.repository";
import { AuditLog } from "../../domain/audit";
import { AuditLogModel } from "../database/mongoose";

export class MongoAuditRepository implements AuditRepository {
  // The constructor is now empty as Mongoose handles the connection singleton.
  constructor() {}

  public async save(log: AuditLog): Promise<void> {
    try {
      // Use the Mongoose model to create a new document. Mongoose handles the connection.
      await AuditLogModel.create(log);
    } catch (error) {
      console.error("Error saving audit log with Mongoose:", error);
      // Depending on the desired behavior, you might want to re-throw the error
      // to let the calling service know that the audit failed.
      throw error;
    }
  }
}
