import { MongoClient } from "mongodb";

const uri = process.env.AUDIT_DB_URI;

if (!uri) {
  throw new Error("AUDIT_DB_URI is not defined in environment variables");
}

// Create a new MongoClient
const client = new MongoClient(uri);

// Export a single connected client instance for the entire app
export default client;
