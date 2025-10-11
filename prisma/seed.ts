import { PrismaClient, PetType } from '@prisma/client';

const prisma = new PrismaClient();

const petsToCreate = [
  // Dogs
  { breed: 'Labrador', type: PetType.dog },
  { breed: 'Beagle', type: PetType.dog },
  { breed: 'Poodle', type: PetType.dog },
  { breed: 'Golden Retriever', type: PetType.dog },
  { breed: 'German Shepherd', type: PetType.dog },

  // Cats
  { breed: 'Siamese', type: PetType.cat },
  { breed: 'Persian', type: PetType.cat },
  { breed: 'Sphynx', type: PetType.cat },
  { breed: 'Maine Coon', type: PetType.cat },
  { breed: 'Bengal', type: PetType.cat },

  // Birds
  { breed: 'Parakeet', type: PetType.bird },
  { breed: 'Cockatiel', type: PetType.bird },
  { breed: 'Macaw', type: PetType.bird },
];

async function main() {
  console.log(`Start seeding ...`);

  for (const p of petsToCreate) {
    const pet = await prisma.pet.upsert({
      where: { breed: p.breed }, // Unique identifier
      update: {}, // No updates needed if it exists
      create: {
        breed: p.breed,
        type: p.type,
      },
    });
    console.log(`Created or found pet: ${pet.breed} (ID: ${pet.id})`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
