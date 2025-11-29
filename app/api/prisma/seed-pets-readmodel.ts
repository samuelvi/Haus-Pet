import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pets = [
  // Dogs
  {
    name: 'Max',
    type: 'dog',
    breed: 'Labrador',
    photoUrl: '/img/dog1.png',
  },
  {
    name: 'Luna',
    type: 'dog',
    breed: 'Golden Retriever',
    photoUrl: '/img/dog2.png',
  },
  {
    name: 'Rocky',
    type: 'dog',
    breed: 'German Shepherd',
    photoUrl: '/img/dog3.png',
  },
  {
    name: 'Cooper',
    type: 'dog',
    breed: 'Beagle',
    photoUrl: '/img/dog4.png',
  },
  // Cats
  {
    name: 'Whiskers',
    type: 'cat',
    breed: 'Persian',
    photoUrl: '/img/cat1.png',
  },
  {
    name: 'Shadow',
    type: 'cat',
    breed: 'Siamese',
    photoUrl: '/img/cat2.png',
  },
  {
    name: 'Mittens',
    type: 'cat',
    breed: 'Maine Coon',
    photoUrl: '/img/cat3.png',
  },
  {
    name: 'Oliver',
    type: 'cat',
    breed: 'Bengal',
    photoUrl: '/img/cat4.png',
  },
  // Birds
  {
    name: 'Tweety',
    type: 'bird',
    breed: 'Canary',
    photoUrl: '/img/bird1.jpeg',
  },
  {
    name: 'Rio',
    type: 'bird',
    breed: 'Macaw',
    photoUrl: '/img/bird2.png',
  },
  {
    name: 'Kiwi',
    type: 'bird',
    breed: 'Parakeet',
    photoUrl: '/img/bird3.png',
  },
  {
    name: 'Charlie',
    type: 'bird',
    breed: 'Cockatiel',
    photoUrl: '/img/bird4.jpeg',
  },
];

async function main(): Promise<void> {
  console.log('Seeding readmodels.pets with sample data...');
  await prisma.pet.deleteMany();

  for (const pet of pets) {
    await prisma.pet.create({
      data: {
        id: crypto.randomUUID(),
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        photoUrl: pet.photoUrl,
        totalSponsored: 0,
      },
    });
    console.log(`  ✅ Inserted ${pet.name} (${pet.breed})`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding pets:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
