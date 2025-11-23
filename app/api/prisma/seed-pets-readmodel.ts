import { PrismaClient, PetType } from '@prisma/client';

const prisma = new PrismaClient();

const pets = [
  {
    name: 'Max',
    type: PetType.dog,
    breed: 'Labrador Retriever',
    photoUrl: 'https://images.dog.ceo/breeds/labrador/n02099712_1094.jpg',
  },
  {
    name: 'Luna',
    type: PetType.dog,
    breed: 'Golden Retriever',
    photoUrl: 'https://images.dog.ceo/breeds/retriever-golden/n02099601_1082.jpg',
  },
  {
    name: 'Whiskers',
    type: PetType.cat,
    breed: 'Persian',
    photoUrl: 'https://cdn2.thecatapi.com/images/e9v.jpg',
  },
  {
    name: 'Shadow',
    type: PetType.cat,
    breed: 'Siamese',
    photoUrl: 'https://cdn2.thecatapi.com/images/ai6.jpg',
  },
  {
    name: 'Tweety',
    type: PetType.bird,
    breed: 'Canary',
    photoUrl: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400&h=400&fit=crop',
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
