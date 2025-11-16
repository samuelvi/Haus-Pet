import mongoose, { Schema, Document } from 'mongoose';
import { AuditLog } from '../../domain/audit';

// 1. Create a new interface that extends the domain type and Mongoose's Document
export interface IAuditLogDocument extends AuditLog, Document {}

const auditDbUri = process.env.AUDIT_DB_URI;

if (!auditDbUri) {
  throw new Error('AUDIT_DB_URI is not defined in environment variables');
}

// Create a dedicated connection for the audit database
const auditConnection = mongoose.createConnection(auditDbUri);

auditConnection.on('connected', () => {
  console.log('Mongoose connected to Audit DB');
});

auditConnection.on('error', (err) => {
  console.error('Mongoose Audit DB connection error:', err);
});

// 2. Define the schema WITHOUT the generic. Let Mongoose infer the type.
const AuditLogSchema = new Schema(
  {
    timestamp: { type: Date, required: true },
    ipAddress: { type: String },
    httpMethod: { type: String, required: true },
    path: { type: String, required: true },
    requestBody: { type: String },
    beforeState: { type: String },
    afterState: { type: String },
  },
  {
    collection: 'logs',
    versionKey: false,
  }
);

// 3. Create the model using the new, combined interface
export const AuditLogModel = auditConnection.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

export default auditConnection;
