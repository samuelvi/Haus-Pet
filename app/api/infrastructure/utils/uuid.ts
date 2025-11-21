import { uuidv7 } from 'uuidv7';

/**
 * Generates a UUIDv7 (time-ordered UUID)
 * UUIDv7 is sortable by creation time and compatible with standard UUID columns
 */
export function generateId(): string {
  return uuidv7();
}
