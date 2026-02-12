import { PrismaClient } from "../src/generated/prisma/client.js";
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production seed...');

  // Clean up existing data (in reverse dependency order)
  console.log('🧹 Cleaning existing data...');
  await prisma.checkout.deleteMany();
  await prisma.damageReport.deleteMany();
  await prisma.file.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.category.deleteMany();
  await prisma.patron.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.loginHistory.deleteMany();
  await prisma.overrideLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();
  console.log('✅ Cleaned up existing data');

  // Create Parent Categories
  const electricalCategory = await prisma.category.create({
    data: {
      name: 'Electrical',
    },
  });

  const handToolsCategory = await prisma.category.create({
    data: {
      name: 'Hand Tools',
    },
  });

  const powerToolsCategory = await prisma.category.create({
    data: {
      name: 'Power Tools',
    },
  });

  const gardenCategory = await prisma.category.create({
    data: {
      name: 'Garden & Outdoor',
    },
  });

  const measurementCategory = await prisma.category.create({
    data: {
      name: 'Measurement & Layout',
    },
  });

  const safetyCategory = await prisma.category.create({
    data: {
      name: 'Safety Equipment',
    },
  });

  console.log('✅ Created parent categories');

  // Create Subcategories for Electrical
  await prisma.category.create({
    data: {
      name: 'Cutters',
      parentId: electricalCategory.id,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Pliers',
      parentId: electricalCategory.id,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Testers & Meters',
      parentId: electricalCategory.id,
    },
  });

  // Create Subcategories for Hand Tools
  await prisma.category.create({
    data: {
      name: 'Hammers',
      parentId: handToolsCategory.id,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Screwdrivers',
      parentId: handToolsCategory.id,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Wrenches',
      parentId: handToolsCategory.id,
    },
  });

  // Create Subcategories for Power Tools
  await prisma.category.create({
    data: {
      name: 'Drills',
      parentId: powerToolsCategory.id,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Saws',
      parentId: powerToolsCategory.id,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Sanders',
      parentId: powerToolsCategory.id,
    },
  });

  // Create Subcategories for Garden
  await prisma.category.create({
    data: {
      name: 'Lawn Care',
      parentId: gardenCategory.id,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Pruning & Trimming',
      parentId: gardenCategory.id,
    },
  });

  console.log('✅ Created subcategories');

  // Create System Settings
  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'default_checkout_period',
        value: '7',
      },
      {
        key: 'max_checkout_period',
        value: '14',
      },
      {
        key: 'overdue_grace_period',
        value: '2',
      },
      {
        key: 'library_name',
        value: 'Lincoln Tool Library',
      },
      {
        key: 'library_email',
        value: 'info@lincolntoollibrary.org',
      },
      {
        key: 'library_phone',
        value: '555-TOOLS',
      },
    ],
  });

  console.log('✅ Created system settings');

  console.log('🎉 Production seed completed successfully!');
  console.log('\n⚠️  IMPORTANT: No users or tools were created.');
  console.log('📝 Run: npm run create-user');
  console.log('   to create your first admin user.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
