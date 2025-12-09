import { describe, it, expect, beforeEach } from 'vitest';
import { PetAggregate } from '../../../app/api/domain/pet/pet.aggregate';
import { PetEventTypes } from '../../../app/api/domain/pet/pet.events';
import { createDomainEvent } from '../../../app/api/domain/eventsourcing/domain-event';

describe('PetAggregate', () => {

  describe('create()', () => {

    it('should create new pet and raise PetCreatedEvent', () => {
      const pet = PetAggregate.create('pet-123', 'Buddy', 'dog', 'Labrador', 'photo.jpg');

      expect(pet.name).toBe('Buddy');
      expect(pet.type).toBe('dog');
      expect(pet.breed).toBe('Labrador');
      expect(pet.photoUrl).toBe('photo.jpg');
      expect(pet.totalSponsored).toBe(0);
      expect(pet.isDeleted).toBe(false);
    });

    it('should raise PetCreated event with correct data', () => {
      const pet = PetAggregate.create('pet-123', 'Max', 'cat', 'Siamese', 'max.jpg');

      const events = pet.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe(PetEventTypes.PET_CREATED);
      expect(events[0].aggregateId).toBe('pet-123');
      expect(events[0].aggregateType).toBe('Pet');
      expect(events[0].data).toEqual({
        name: 'Max',
        type: 'cat',
        breed: 'Siamese',
        photoUrl: 'max.jpg'
      });
    });

    it('should set version to 1 after creation', () => {
      const pet = PetAggregate.create('pet-123', 'Buddy', 'dog', 'Labrador', 'photo.jpg');
      expect(pet.version).toBe(1);
    });

    it('should create pet with different types', () => {
      const dog = PetAggregate.create('pet-1', 'Buddy', 'dog', 'Labrador', 'dog.jpg');
      expect(dog.type).toBe('dog');

      const cat = PetAggregate.create('pet-2', 'Whiskers', 'cat', 'Persian', 'cat.jpg');
      expect(cat.type).toBe('cat');

      const bird = PetAggregate.create('pet-3', 'Tweety', 'bird', 'Canary', 'bird.jpg');
      expect(bird.type).toBe('bird');
    });
  });

  describe('update()', () => {

    let pet: PetAggregate;

    beforeEach(() => {
      pet = PetAggregate.create('pet-123', 'Buddy', 'dog', 'Labrador', 'photo.jpg');
      pet.clearUncommittedEvents(); // Clear creation event for cleaner assertions
    });

    it('should update pet name', () => {
      pet.update({ name: 'Buddy Updated' });

      expect(pet.name).toBe('Buddy Updated');
      const events = pet.getUncommittedEvents();
      expect(events[0].eventType).toBe(PetEventTypes.PET_UPDATED);
      expect(events[0].data).toEqual({ name: 'Buddy Updated' });
    });

    it('should update pet type', () => {
      pet.update({ type: 'cat' });

      expect(pet.type).toBe('cat');
      const events = pet.getUncommittedEvents();
      expect(events[0].data).toEqual({ type: 'cat' });
    });

    it('should update pet breed', () => {
      pet.update({ breed: 'Golden Retriever' });

      expect(pet.breed).toBe('Golden Retriever');
      const events = pet.getUncommittedEvents();
      expect(events[0].data).toEqual({ breed: 'Golden Retriever' });
    });

    it('should update pet photo URL', () => {
      pet.update({ photoUrl: 'new-photo.jpg' });

      expect(pet.photoUrl).toBe('new-photo.jpg');
      const events = pet.getUncommittedEvents();
      expect(events[0].data).toEqual({ photoUrl: 'new-photo.jpg' });
    });

    it('should update multiple fields at once', () => {
      pet.update({
        name: 'New Name',
        breed: 'New Breed',
        photoUrl: 'new.jpg'
      });

      expect(pet.name).toBe('New Name');
      expect(pet.breed).toBe('New Breed');
      expect(pet.photoUrl).toBe('new.jpg');
    });

    it('should increment version after update', () => {
      const initialVersion = pet.version;
      pet.update({ name: 'Updated' });
      expect(pet.version).toBe(initialVersion + 1);
    });

    it('should throw error when updating deleted pet', () => {
      pet.delete();

      expect(() => pet.update({ name: 'Should Fail' }))
        .toThrow('Cannot update a deleted pet');
    });

    it('should allow partial updates', () => {
      pet.update({ name: 'Only Name Changed' });

      expect(pet.name).toBe('Only Name Changed');
      expect(pet.type).toBe('dog'); // Unchanged
      expect(pet.breed).toBe('Labrador'); // Unchanged
    });
  });

  describe('delete()', () => {

    let pet: PetAggregate;

    beforeEach(() => {
      pet = PetAggregate.create('pet-123', 'Buddy', 'dog', 'Labrador', 'photo.jpg');
      pet.clearUncommittedEvents();
    });

    it('should mark pet as deleted', () => {
      pet.delete();

      expect(pet.isDeleted).toBe(true);
    });

    it('should raise PetDeleted event', () => {
      pet.delete();

      const events = pet.getUncommittedEvents();
      expect(events[0].eventType).toBe(PetEventTypes.PET_DELETED);
      expect(events[0].data).toHaveProperty('deletedAt');
    });

    it('should include timestamp in delete event', () => {
      const beforeDelete = new Date();
      pet.delete();
      const afterDelete = new Date();

      const events = pet.getUncommittedEvents();
      const deletedAt = new Date(events[0].data.deletedAt as string);

      expect(deletedAt.getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime());
      expect(deletedAt.getTime()).toBeLessThanOrEqual(afterDelete.getTime());
    });

    it('should throw error when deleting already deleted pet', () => {
      pet.delete();

      expect(() => pet.delete())
        .toThrow('Pet is already deleted');
    });

    it('should increment version after deletion', () => {
      const initialVersion = pet.version;
      pet.delete();
      expect(pet.version).toBe(initialVersion + 1);
    });
  });

  describe('recordSponsorship()', () => {

    let pet: PetAggregate;

    beforeEach(() => {
      pet = PetAggregate.create('pet-123', 'Buddy', 'dog', 'Labrador', 'photo.jpg');
      pet.clearUncommittedEvents();
    });

    it('should record sponsorship and update totalSponsored', () => {
      pet.recordSponsorship('sponsor-1', 'user-1', 25.50);

      expect(pet.totalSponsored).toBe(25.50);
    });

    it('should raise PetSponsored event with correct data', () => {
      pet.recordSponsorship('sponsor-1', 'user-1', 25.50, 'USD');

      const events = pet.getUncommittedEvents();
      expect(events[0].eventType).toBe(PetEventTypes.PET_SPONSORED);
      expect(events[0].data).toEqual({
        sponsorshipId: 'sponsor-1',
        userId: 'user-1',
        amount: 25.50,
        currency: 'USD'
      });
    });

    it('should default currency to USD', () => {
      pet.recordSponsorship('sponsor-1', 'user-1', 10);

      const events = pet.getUncommittedEvents();
      expect(events[0].data.currency).toBe('USD');
    });

    it('should accept custom currency', () => {
      pet.recordSponsorship('sponsor-1', 'user-1', 100, 'EUR');

      const events = pet.getUncommittedEvents();
      expect(events[0].data.currency).toBe('EUR');
    });

    it('should accumulate multiple sponsorships', () => {
      pet.recordSponsorship('sponsor-1', 'user-1', 10);
      pet.recordSponsorship('sponsor-2', 'user-2', 15);
      pet.recordSponsorship('sponsor-3', 'user-3', 20);

      expect(pet.totalSponsored).toBe(45);
    });

    it('should handle decimal amounts correctly', () => {
      pet.recordSponsorship('sponsor-1', 'user-1', 10.99);
      pet.recordSponsorship('sponsor-2', 'user-2', 5.01);

      expect(pet.totalSponsored).toBe(16.00);
    });

    it('should throw error for zero amount', () => {
      expect(() => pet.recordSponsorship('sponsor-1', 'user-1', 0))
        .toThrow('Sponsorship amount must be positive');
    });

    it('should throw error for negative amount', () => {
      expect(() => pet.recordSponsorship('sponsor-1', 'user-1', -10))
        .toThrow('Sponsorship amount must be positive');
    });

    it('should throw error when sponsoring deleted pet', () => {
      pet.delete();

      expect(() => pet.recordSponsorship('sponsor-1', 'user-1', 10))
        .toThrow('Cannot sponsor a deleted pet');
    });

    it('should increment version after recording sponsorship', () => {
      const initialVersion = pet.version;
      pet.recordSponsorship('sponsor-1', 'user-1', 10);
      expect(pet.version).toBe(initialVersion + 1);
    });

    it('should handle large sponsorship amounts', () => {
      pet.recordSponsorship('sponsor-1', 'user-1', 999999.99);
      expect(pet.totalSponsored).toBe(999999.99);
    });

    it('should handle very small amounts', () => {
      pet.recordSponsorship('sponsor-1', 'user-1', 0.01);
      expect(pet.totalSponsored).toBe(0.01);
    });
  });

  describe('loadFromHistory()', () => {

    it('should rebuild state from PetCreated event', () => {
      const pet = new PetAggregate('pet-123');
      const events = [
        createDomainEvent(PetEventTypes.PET_CREATED, 'pet-123', 'Pet', 1, {
          name: 'Buddy',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'photo.jpg'
        })
      ];

      pet.loadFromHistory(events);

      expect(pet.name).toBe('Buddy');
      expect(pet.type).toBe('dog');
      expect(pet.breed).toBe('Labrador');
      expect(pet.photoUrl).toBe('photo.jpg');
      expect(pet.version).toBe(1);
    });

    it('should rebuild state from multiple events', () => {
      const pet = new PetAggregate('pet-123');
      const events = [
        createDomainEvent(PetEventTypes.PET_CREATED, 'pet-123', 'Pet', 1, {
          name: 'Buddy',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'photo.jpg'
        }),
        createDomainEvent(PetEventTypes.PET_UPDATED, 'pet-123', 'Pet', 2, {
          name: 'Buddy Updated'
        }),
        createDomainEvent(PetEventTypes.PET_SPONSORED, 'pet-123', 'Pet', 3, {
          sponsorshipId: 's1',
          userId: 'u1',
          amount: 10,
          currency: 'USD'
        })
      ];

      pet.loadFromHistory(events);

      expect(pet.name).toBe('Buddy Updated');
      expect(pet.totalSponsored).toBe(10);
      expect(pet.version).toBe(3);
    });

    it('should accumulate sponsorships from multiple events', () => {
      const pet = new PetAggregate('pet-123');
      const events = [
        createDomainEvent(PetEventTypes.PET_CREATED, 'pet-123', 'Pet', 1, {
          name: 'Buddy',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'photo.jpg'
        }),
        createDomainEvent(PetEventTypes.PET_SPONSORED, 'pet-123', 'Pet', 2, {
          sponsorshipId: 's1',
          userId: 'u1',
          amount: 10,
          currency: 'USD'
        }),
        createDomainEvent(PetEventTypes.PET_SPONSORED, 'pet-123', 'Pet', 3, {
          sponsorshipId: 's2',
          userId: 'u2',
          amount: 15,
          currency: 'USD'
        }),
        createDomainEvent(PetEventTypes.PET_SPONSORED, 'pet-123', 'Pet', 4, {
          sponsorshipId: 's3',
          userId: 'u3',
          amount: 25,
          currency: 'USD'
        })
      ];

      pet.loadFromHistory(events);

      expect(pet.totalSponsored).toBe(50);
      expect(pet.version).toBe(4);
    });

    it('should apply PetDeleted event correctly', () => {
      const pet = new PetAggregate('pet-123');
      const events = [
        createDomainEvent(PetEventTypes.PET_CREATED, 'pet-123', 'Pet', 1, {
          name: 'Buddy',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'photo.jpg'
        }),
        createDomainEvent(PetEventTypes.PET_DELETED, 'pet-123', 'Pet', 2, {
          deletedAt: new Date().toISOString()
        })
      ];

      pet.loadFromHistory(events);

      expect(pet.isDeleted).toBe(true);
      expect(pet.version).toBe(2);
    });

    it('should handle partial updates correctly', () => {
      const pet = new PetAggregate('pet-123');
      const events = [
        createDomainEvent(PetEventTypes.PET_CREATED, 'pet-123', 'Pet', 1, {
          name: 'Buddy',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'photo.jpg'
        }),
        createDomainEvent(PetEventTypes.PET_UPDATED, 'pet-123', 'Pet', 2, {
          name: 'Buddy Updated'
          // Only name changed
        })
      ];

      pet.loadFromHistory(events);

      expect(pet.name).toBe('Buddy Updated');
      expect(pet.type).toBe('dog'); // Unchanged
      expect(pet.breed).toBe('Labrador'); // Unchanged
      expect(pet.photoUrl).toBe('photo.jpg'); // Unchanged
    });

    it('should support legacy AnimalCreated event', () => {
      const pet = new PetAggregate('pet-123');
      const events = [
        createDomainEvent('AnimalCreated', 'pet-123', 'Pet', 1, {
          name: 'Legacy Pet',
          type: 'dog',
          breed: 'Beagle',
          photoUrl: 'legacy.jpg'
        })
      ];

      pet.loadFromHistory(events);

      expect(pet.name).toBe('Legacy Pet');
      expect(pet.breed).toBe('Beagle');
    });

    it('should support legacy AnimalUpdated event', () => {
      const pet = new PetAggregate('pet-123');
      const events = [
        createDomainEvent(PetEventTypes.PET_CREATED, 'pet-123', 'Pet', 1, {
          name: 'Buddy',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'photo.jpg'
        }),
        createDomainEvent('AnimalUpdated', 'pet-123', 'Pet', 2, {
          name: 'Legacy Update'
        })
      ];

      pet.loadFromHistory(events);

      expect(pet.name).toBe('Legacy Update');
    });

    it('should support legacy AnimalSponsored event', () => {
      const pet = new PetAggregate('pet-123');
      const events = [
        createDomainEvent(PetEventTypes.PET_CREATED, 'pet-123', 'Pet', 1, {
          name: 'Buddy',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'photo.jpg'
        }),
        createDomainEvent('AnimalSponsored', 'pet-123', 'Pet', 2, {
          sponsorshipId: 's1',
          userId: 'u1',
          amount: 100,
          currency: 'USD'
        })
      ];

      pet.loadFromHistory(events);

      expect(pet.totalSponsored).toBe(100);
    });

    it('should support legacy AnimalDeleted event', () => {
      const pet = new PetAggregate('pet-123');
      const events = [
        createDomainEvent(PetEventTypes.PET_CREATED, 'pet-123', 'Pet', 1, {
          name: 'Buddy',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'photo.jpg'
        }),
        createDomainEvent('AnimalDeleted', 'pet-123', 'Pet', 2, {
          deletedAt: new Date().toISOString()
        })
      ];

      pet.loadFromHistory(events);

      expect(pet.isDeleted).toBe(true);
    });
  });

  describe('Event Sourcing Patterns', () => {

    it('should maintain event order', () => {
      const pet = PetAggregate.create('pet-123', 'Buddy', 'dog', 'Labrador', 'photo.jpg');
      pet.update({ name: 'Updated' });
      pet.recordSponsorship('s1', 'u1', 10);

      const events = pet.getUncommittedEvents();
      expect(events[0].eventType).toBe(PetEventTypes.PET_CREATED);
      expect(events[1].eventType).toBe(PetEventTypes.PET_UPDATED);
      expect(events[2].eventType).toBe(PetEventTypes.PET_SPONSORED);
    });

    it('should clear uncommitted events after commit', () => {
      const pet = PetAggregate.create('pet-123', 'Buddy', 'dog', 'Labrador', 'photo.jpg');
      expect(pet.getUncommittedEvents()).toHaveLength(1);

      pet.clearUncommittedEvents();
      expect(pet.getUncommittedEvents()).toHaveLength(0);
    });

    it('should be idempotent when replaying events', () => {
      const events = [
        createDomainEvent(PetEventTypes.PET_CREATED, 'pet-123', 'Pet', 1, {
          name: 'Buddy',
          type: 'dog',
          breed: 'Labrador',
          photoUrl: 'photo.jpg'
        }),
        createDomainEvent(PetEventTypes.PET_SPONSORED, 'pet-123', 'Pet', 2, {
          sponsorshipId: 's1',
          userId: 'u1',
          amount: 10,
          currency: 'USD'
        })
      ];

      const pet1 = new PetAggregate('pet-123');
      pet1.loadFromHistory(events);

      const pet2 = new PetAggregate('pet-123');
      pet2.loadFromHistory(events);

      expect(pet1.name).toBe(pet2.name);
      expect(pet1.totalSponsored).toBe(pet2.totalSponsored);
      expect(pet1.version).toBe(pet2.version);
    });

    it('should maintain version consistency', () => {
      const pet = PetAggregate.create('pet-123', 'Buddy', 'dog', 'Labrador', 'photo.jpg');
      expect(pet.version).toBe(1);

      pet.update({ name: 'Updated' });
      expect(pet.version).toBe(2);

      pet.recordSponsorship('s1', 'u1', 10);
      expect(pet.version).toBe(3);

      pet.delete();
      expect(pet.version).toBe(4);
    });
  });
});
