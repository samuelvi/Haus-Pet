import { PrismaClient, AnimalType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

const prisma = new PrismaClient();

const breedsToCreate = [
  // Dogs
  { name: 'Labrador', animalType: AnimalType.dog },
  { name: 'Beagle', animalType: AnimalType.dog },
  { name: 'Poodle', animalType: AnimalType.dog },
  { name: 'Golden Retriever', animalType: AnimalType.dog },
  { name: 'German Shepherd', animalType: AnimalType.dog },

  // Cats
  { name: 'Siamese', animalType: AnimalType.cat },
  { name: 'Persian', animalType: AnimalType.cat },
  { name: 'Sphynx', animalType: AnimalType.cat },
  { name: 'Maine Coon', animalType: AnimalType.cat },
  { name: 'Bengal', animalType: AnimalType.cat },

  // Birds
  { name: 'Parakeet', animalType: AnimalType.bird },
  { name: 'Cockatiel', animalType: AnimalType.bird },
  { name: 'Macaw', animalType: AnimalType.bird },
];

async function main() {
  console.log(`Start seeding ...`);

  // Seed admin user
  const adminEmail: string = 'admin@hauspet.com';
  const adminPassword: string = 'Admin123'; // Change this in production!
  const hashedPassword: string = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {}, // Don't update if exists
    create: {
      id: uuidv7(),
      email: adminEmail,
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`Created or found admin user: ${adminUser.email} (ID: ${adminUser.id})`);
  console.log(`  Login credentials: ${adminEmail} / ${adminPassword}`);

  // Seed breeds
  for (const b of breedsToCreate) {
    const breed = await prisma.breed.upsert({
      where: { name: b.name }, // Unique identifier
      update: {}, // No updates needed if it exists
      create: {
        id: uuidv7(),
        name: b.name,
        animalType: b.animalType,
      },
    });
    console.log(`Created or found breed: ${breed.name} (ID: ${breed.id})`);
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
