import { PrismaClient, PetType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

const prisma = new PrismaClient();

const breedsToCreate = [
  // Dogs
  { name: 'Labrador', petType: PetType.dog },
  { name: 'Beagle', petType: PetType.dog },
  { name: 'Poodle', petType: PetType.dog },
  { name: 'Golden Retriever', petType: PetType.dog },
  { name: 'German Shepherd', petType: PetType.dog },

  // Cats
  { name: 'Siamese', petType: PetType.cat },
  { name: 'Persian', petType: PetType.cat },
  { name: 'Sphynx', petType: PetType.cat },
  { name: 'Maine Coon', petType: PetType.cat },
  { name: 'Bengal', petType: PetType.cat },

  // Birds
  { name: 'Parakeet', petType: PetType.bird },
  { name: 'Cockatiel', petType: PetType.bird },
  { name: 'Macaw', petType: PetType.bird },
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
        petType: b.petType,
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
