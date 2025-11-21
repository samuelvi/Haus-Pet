import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const animals = [
  // Dogs
  {
    id: crypto.randomUUID(),
    name: 'Max',
    type: 'dog' as const,
    breed: 'Labrador Retriever',
    photoUrl: 'https://images.dog.ceo/breeds/labrador/n02099712_1094.jpg',
    totalSponsored: 150.00,
  },
  {
    id: crypto.randomUUID(),
    name: 'Luna',
    type: 'dog' as const,
    breed: 'Golden Retriever',
    photoUrl: 'https://images.dog.ceo/breeds/retriever-golden/n02099601_1082.jpg',
    totalSponsored: 275.50,
  },
  {
    id: crypto.randomUUID(),
    name: 'Rocky',
    type: 'dog' as const,
    breed: 'German Shepherd',
    photoUrl: 'https://images.dog.ceo/breeds/germanshepherd/n02106662_1453.jpg',
    totalSponsored: 0,
  },
  {
    id: crypto.randomUUID(),
    name: 'Buddy',
    type: 'dog' as const,
    breed: 'Beagle',
    photoUrl: 'https://images.dog.ceo/breeds/beagle/n02088364_10108.jpg',
    totalSponsored: 50.00,
  },
  // Cats
  {
    id: crypto.randomUUID(),
    name: 'Whiskers',
    type: 'cat' as const,
    breed: 'Persian',
    photoUrl: 'https://cdn2.thecatapi.com/images/e9v.jpg',
    totalSponsored: 320.00,
  },
  {
    id: crypto.randomUUID(),
    name: 'Shadow',
    type: 'cat' as const,
    breed: 'Siamese',
    photoUrl: 'https://cdn2.thecatapi.com/images/ai6.jpg',
    totalSponsored: 85.00,
  },
  {
    id: crypto.randomUUID(),
    name: 'Mittens',
    type: 'cat' as const,
    breed: 'Maine Coon',
    photoUrl: 'https://cdn2.thecatapi.com/images/OGTWqNNOt.jpg',
    totalSponsored: 0,
  },
  {
    id: crypto.randomUUID(),
    name: 'Felix',
    type: 'cat' as const,
    breed: 'British Shorthair',
    photoUrl: 'https://cdn2.thecatapi.com/images/s4k.jpg',
    totalSponsored: 125.00,
  },
  // Birds
  {
    id: crypto.randomUUID(),
    name: 'Tweety',
    type: 'bird' as const,
    breed: 'Canary',
    photoUrl: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400&h=400&fit=crop',
    totalSponsored: 45.00,
  },
  {
    id: crypto.randomUUID(),
    name: 'Rio',
    type: 'bird' as const,
    breed: 'Macaw',
    photoUrl: 'https://images.unsplash.com/photo-1544923246-77307dd628b4?w=400&h=400&fit=crop',
    totalSponsored: 200.00,
  },
  {
    id: crypto.randomUUID(),
    name: 'Coco',
    type: 'bird' as const,
    breed: 'Cockatiel',
    photoUrl: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=400&h=400&fit=crop',
    totalSponsored: 0,
  },
];

async function seedAnimals(): Promise<void> {
  console.log('🌱 Seeding animals...');

  // Clear existing animals (optional - comment out to keep existing)
  await prisma.sponsorship.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.event.deleteMany({ where: { aggregateType: 'Animal' } });
  await prisma.event.deleteMany({ where: { aggregateType: 'Sponsorship' } });

  console.log('✅ Cleared existing animals and sponsorships');

  // Insert animals
  for (const animal of animals) {
    await prisma.animal.create({
      data: animal,
    });

    // Also create the corresponding event for event sourcing consistency
    await prisma.event.create({
      data: {
        id: crypto.randomUUID(),
        aggregateId: animal.id,
        aggregateType: 'Animal',
        eventType: 'AnimalCreated',
        eventData: {
          name: animal.name,
          type: animal.type,
          breed: animal.breed,
          photoUrl: animal.photoUrl,
        },
        version: 1,
      },
    });

    console.log(`  ✅ Created ${animal.type}: ${animal.name} (${animal.breed})`);
  }

  console.log(`\n🎉 Seeded ${animals.length} animals successfully!`);
}

seedAnimals()
  .catch((e) => {
    console.error('❌ Error seeding animals:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
