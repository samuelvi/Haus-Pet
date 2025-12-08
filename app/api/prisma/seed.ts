import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';

const prisma = new PrismaClient();

const breedTypesToCreate = ['dog', 'cat', 'bird', 'fish', 'rabbit', 'hamster', 'guinea pig', 'turtle'] as const;

const breedsToCreate = [
  // Dogs - 10 breeds
  { name: 'Labrador', petType: 'dog' },
  { name: 'Beagle', petType: 'dog' },
  { name: 'Poodle', petType: 'dog' },
  { name: 'Golden Retriever', petType: 'dog' },
  { name: 'German Shepherd', petType: 'dog' },
  { name: 'Bulldog', petType: 'dog' },
  { name: 'Chihuahua', petType: 'dog' },
  { name: 'Dachshund', petType: 'dog' },
  { name: 'Boxer', petType: 'dog' },
  { name: 'Husky', petType: 'dog' },

  // Cats - 10 breeds
  { name: 'Siamese', petType: 'cat' },
  { name: 'Persian', petType: 'cat' },
  { name: 'Sphynx', petType: 'cat' },
  { name: 'Maine Coon', petType: 'cat' },
  { name: 'Bengal', petType: 'cat' },
  { name: 'Ragdoll', petType: 'cat' },
  { name: 'British Shorthair', petType: 'cat' },
  { name: 'Abyssinian', petType: 'cat' },
  { name: 'Scottish Fold', petType: 'cat' },
  { name: 'Russian Blue', petType: 'cat' },

  // Birds - 6 breeds
  { name: 'Parakeet', petType: 'bird' },
  { name: 'Cockatiel', petType: 'bird' },
  { name: 'Macaw', petType: 'bird' },
  { name: 'Canary', petType: 'bird' },
  { name: 'Lovebird', petType: 'bird' },
  { name: 'Parrot', petType: 'bird' },

  // Fish - 5 breeds
  { name: 'Goldfish', petType: 'fish' },
  { name: 'Betta', petType: 'fish' },
  { name: 'Guppy', petType: 'fish' },
  { name: 'Angelfish', petType: 'fish' },
  { name: 'Tetra', petType: 'fish' },

  // Rabbits - 4 breeds
  { name: 'Holland Lop', petType: 'rabbit' },
  { name: 'Netherland Dwarf', petType: 'rabbit' },
  { name: 'Lionhead', petType: 'rabbit' },
  { name: 'Flemish Giant', petType: 'rabbit' },
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

  // Seed all breed types first
  console.log('\nSeeding breed types...');
  for (const typeName of breedTypesToCreate) {
    const breedType = await prisma.breedType.upsert({
      where: { name: typeName },
      update: {},
      create: {
        id: uuidv7(),
        name: typeName,
      },
    });
    console.log(`Created or found breed type: ${breedType.name} (ID: ${breedType.id})`);
  }

  // Seed breeds
  console.log('\nSeeding breeds...');
  for (const b of breedsToCreate) {
    const breedType = await prisma.breedType.findUnique({
      where: { name: b.petType },
    });

    if (!breedType) {
      console.warn(`Warning: Breed type '${b.petType}' not found, skipping breed '${b.name}'`);
      continue;
    }

    const breed = await prisma.breed.upsert({
      where: { name: b.name }, // Unique identifier
      update: {}, // No updates needed if it exists
      create: {
        id: uuidv7(),
        name: b.name,
        breedTypeId: breedType.id,
      },
      include: { breedType: true },
    });
    console.log(`Created or found breed: ${breed.name} (ID: ${breed.id})`);
  }

  // Initialize system counters
  const totalBreeds = await prisma.breed.count();
  const totalBreedTypes = await prisma.breedType.count();
  const totalActivePets = await prisma.pet.count();
  const totalSponsorships = await prisma.sponsorship.count();
  const totalUsers = await prisma.user.count();
  const totalRevenue = await prisma.sponsorship.aggregate({
    _sum: { amount: true },
  });

  await prisma.systemCounters.upsert({
    where: { id: 'system' },
    update: {
      totalBreeds,
      totalBreedTypes,
      totalActivePets,
      totalSponsorships,
      totalUsers,
      totalRevenue: totalRevenue._sum.amount || 0,
    },
    create: {
      id: 'system',
      totalBreeds,
      totalBreedTypes,
      totalActivePets,
      totalSponsorships,
      totalUsers,
      totalRevenue: totalRevenue._sum.amount || 0,
    },
  });

  console.log(`System counters initialized:`);
  console.log(`  - Total Breeds: ${totalBreeds}`);
  console.log(`  - Total Breed Types: ${totalBreedTypes}`);
  console.log(`  - Total Active Pets: ${totalActivePets}`);
  console.log(`  - Total Sponsorships: ${totalSponsorships}`);
  console.log(`  - Total Users: ${totalUsers}`);
  console.log(`  - Total Revenue: $${totalRevenue._sum.amount || 0}`);

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
