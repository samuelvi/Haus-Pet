/**
 * Domain event types for the Sponsorship aggregate
 */
export const SponsorshipEventTypes = {
  SPONSORSHIP_CREATED: 'SponsorshipCreated',
} as const;

export type SponsorshipEventType = (typeof SponsorshipEventTypes)[keyof typeof SponsorshipEventTypes];

/**
 * Data payload for SponsorshipCreated event
 */
export interface SponsorshipCreatedData {
  animalId: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
}
