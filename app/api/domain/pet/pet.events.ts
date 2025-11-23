/**
 * Domain event types for the Pet aggregate
 */
export const PetEventTypes = {
  PET_CREATED: 'PetCreated',
  PET_UPDATED: 'PetUpdated',
  PET_DELETED: 'PetDeleted',
  PET_SPONSORED: 'PetSponsored',
} as const;

export type PetEventType = (typeof PetEventTypes)[keyof typeof PetEventTypes];

/**
 * Data payload for PetCreated event
 */
export interface PetCreatedData {
  name: string;
  type: 'cat' | 'dog' | 'bird';
  breed: string;
  photoUrl: string;
}

/**
 * Data payload for PetUpdated event
 */
export interface PetUpdatedData {
  name?: string;
  type?: 'cat' | 'dog' | 'bird';
  breed?: string;
  photoUrl?: string;
}

/**
 * Data payload for PetDeleted event
 */
export interface PetDeletedData {
  deletedAt: string;
}

/**
 * Data payload for PetSponsored event
 */
export interface PetSponsoredData {
  sponsorshipId: string;
  userId: string;
  amount: number;
  currency: string;
}
