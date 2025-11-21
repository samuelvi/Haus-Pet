/**
 * Domain event types for the Animal aggregate
 */
export const AnimalEventTypes = {
  ANIMAL_CREATED: 'AnimalCreated',
  ANIMAL_UPDATED: 'AnimalUpdated',
  ANIMAL_DELETED: 'AnimalDeleted',
  ANIMAL_SPONSORED: 'AnimalSponsored',
} as const;

export type AnimalEventType = (typeof AnimalEventTypes)[keyof typeof AnimalEventTypes];

/**
 * Data payload for AnimalCreated event
 */
export interface AnimalCreatedData {
  name: string;
  type: 'cat' | 'dog' | 'bird';
  breed: string;
  photoUrl: string;
}

/**
 * Data payload for AnimalUpdated event
 */
export interface AnimalUpdatedData {
  name?: string;
  type?: 'cat' | 'dog' | 'bird';
  breed?: string;
  photoUrl?: string;
}

/**
 * Data payload for AnimalDeleted event
 */
export interface AnimalDeletedData {
  deletedAt: string;
}

/**
 * Data payload for AnimalSponsored event
 */
export interface AnimalSponsoredData {
  sponsorshipId: string;
  userId: string;
  amount: number;
  currency: string;
}
