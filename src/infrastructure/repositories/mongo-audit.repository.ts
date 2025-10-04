import { MongoClient } from "mongodb";
import { AuditRepository } from "../../domain/audit.repository";
import { AuditLog } from "../../domain/audit";

const AUDIT_COLLECTION = "logs";

export class MongoAuditRepository implements AuditRepository {
  constructor(private readonly client: MongoClient) {}

  public async save(log: AuditLog): Promise<void> {
    try {
      await this.client.connect();
      const db = this.client.db(); // Get the default database from the connection string
      const collection = db.collection<AuditLog>(AUDIT_COLLECTION);
      await collection.insertOne(log);
    } finally {
      // Ensures that the client will close when you finish/error
      await this.client.close();
    }
  }
}
