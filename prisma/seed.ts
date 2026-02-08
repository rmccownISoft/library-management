import { PrismaClient, Prisma } from "../src/generated/prisma/client.js"
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean up existing data (in reverse dependency order)
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

  // Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const volunteerPassword = await bcrypt.hash('volunteer123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@toollibrary.org',
      passwordHash: adminPassword,
      name: 'Admin User',
      phone: '555-0100',
      mailingStreet: '123 Admin St',
      mailingCity: 'Springfield',
      mailingState: 'IL',
      mailingZipcode: '62701',
      role: 'ADMIN',
      trainingDate: new Date('2024-01-15'),
    },
  });

  const volunteer1 = await prisma.user.create({
    data: {
      email: 'john@toollibrary.org',
      passwordHash: volunteerPassword,
      name: 'John Volunteer',
      phone: '555-0101',
      mailingStreet: '456 Helper Ave',
      mailingCity: 'Springfield',
      mailingState: 'IL',
      mailingZipcode: '62702',
      role: 'VOLUNTEER',
      trainingDate: new Date('2024-02-01'),
      trainedById: admin.id,
    },
  });

  const volunteer2 = await prisma.user.create({
    data: {
      email: 'jane@toollibrary.org',
      passwordHash: volunteerPassword,
      name: 'Jane Volunteer',
      phone: '555-0102',
      mailingStreet: '789 Service Blvd',
      mailingCity: 'Springfield',
      mailingState: 'IL',
      mailingZipcode: '62703',
      role: 'VOLUNTEER',
      trainingDate: new Date('2024-02-15'),
      trainedById: admin.id,
    },
  });

  console.log('✅ Created users');

  // Create Patrons
  const patron1 = await prisma.patron.create({
    data: {
      firstName: 'Alice',
      lastName: 'Builder',
      email: 'alice@email.com',
      phone: '555-1001',
      mailingStreet: '100 Construction Way',
      mailingCity: 'Springfield',
      mailingState: 'IL',
      mailingZipcode: '62704',
    },
  });

  const patron2 = await prisma.patron.create({
    data: {
      firstName: 'Bob',
      lastName: 'Carpenter',
      email: 'bob@email.com',
      phone: '555-1002',
      mailingStreet: '200 Woodwork Lane',
      mailingCity: 'Springfield',
      mailingState: 'IL',
      mailingZipcode: '62705',
    },
  });

  const patron3 = await prisma.patron.create({
    data: {
      firstName: 'Carol',
      lastName: 'Handyperson',
      phone: '555-1003',
      mailingStreet: '300 Fix-It Circle',
      mailingCity: 'Springfield',
      mailingState: 'IL',
      mailingZipcode: '62706',
    },
  });

  console.log('✅ Created patrons');

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
  const cuttersCategory = await prisma.category.create({
    data: {
      name: 'Cutters',
      parentId: electricalCategory.id,
    },
  });

  const pliersCategory = await prisma.category.create({
    data: {
      name: 'Pliers',
      parentId: electricalCategory.id,
    },
  });

  const testersCategory = await prisma.category.create({
    data: {
      name: 'Testers & Meters',
      parentId: electricalCategory.id,
    },
  });

  // Create Subcategories for Hand Tools
  const hammersCategory = await prisma.category.create({
    data: {
      name: 'Hammers',
      parentId: handToolsCategory.id,
    },
  });

  const screwdriversCategory = await prisma.category.create({
    data: {
      name: 'Screwdrivers',
      parentId: handToolsCategory.id,
    },
  });

  const wrenchesCategory = await prisma.category.create({
    data: {
      name: 'Wrenches',
      parentId: handToolsCategory.id,
    },
  });

  // Create Subcategories for Power Tools
  const drillsCategory = await prisma.category.create({
    data: {
      name: 'Drills',
      parentId: powerToolsCategory.id,
    },
  });

  const sawsCategory = await prisma.category.create({
    data: {
      name: 'Saws',
      parentId: powerToolsCategory.id,
    },
  });

  const sandersCategory = await prisma.category.create({
    data: {
      name: 'Sanders',
      parentId: powerToolsCategory.id,
    },
  });

  // Create Subcategories for Garden
  const lawnCareCategory = await prisma.category.create({
    data: {
      name: 'Lawn Care',
      parentId: gardenCategory.id,
    },
  });

  const pruningCategory = await prisma.category.create({
    data: {
      name: 'Pruning & Trimming',
      parentId: gardenCategory.id,
    },
  });

  console.log('✅ Created subcategories');

  // Create Tools
  const tools = await prisma.tool.createMany({
    data: [
      // Electrical - Cutters
      {
        name: 'Wire Cutters',
        description: 'Professional wire cutting pliers',
        categoryId: cuttersCategory.id,
        quantity: 3,
        donor: 'Smith Electric',
        conditionStatus: 'GOOD',
      },
      {
        name: 'Cable Cutters',
        description: 'Heavy duty cable cutting tool',
        categoryId: cuttersCategory.id,
        quantity: 2,
        conditionStatus: 'GOOD',
      },
      // Electrical - Pliers
      {
        name: 'Needle Nose Pliers',
        description: 'Long nose pliers for electrical work',
        categoryId: pliersCategory.id,
        quantity: 4,
        conditionStatus: 'GOOD',
      },
      {
        name: 'Lineman Pliers',
        description: 'Heavy duty combination pliers',
        categoryId: pliersCategory.id,
        quantity: 2,
        donor: 'Jones Hardware',
        conditionStatus: 'GOOD',
      },
      // Electrical - Testers
      {
        name: 'Multimeter',
        description: 'Digital multimeter for electrical testing',
        categoryId: testersCategory.id,
        quantity: 2,
        conditionStatus: 'GOOD',
      },
      {
        name: 'Voltage Tester',
        description: 'Non-contact voltage detector',
        categoryId: testersCategory.id,
        quantity: 5,
        conditionStatus: 'GOOD',
      },
      // Hand Tools - Hammers
      {
        name: 'Claw Hammer',
        description: '16oz claw hammer',
        categoryId: hammersCategory.id,
        quantity: 10,
        conditionStatus: 'GOOD',
      },
      {
        name: 'Sledge Hammer',
        description: '10lb sledge hammer',
        categoryId: hammersCategory.id,
        quantity: 3,
        conditionStatus: 'GOOD',
      },
      // Hand Tools - Screwdrivers
      {
        name: 'Screwdriver Set',
        description: '6-piece precision screwdriver set',
        categoryId: screwdriversCategory.id,
        quantity: 5,
        conditionStatus: 'GOOD',
      },
      // Hand Tools - Wrenches
      {
        name: 'Adjustable Wrench',
        description: '10-inch adjustable wrench',
        categoryId: wrenchesCategory.id,
        quantity: 8,
        donor: 'Community Donation',
        conditionStatus: 'GOOD',
      },
      {
        name: 'Socket Set',
        description: '40-piece socket wrench set',
        categoryId: wrenchesCategory.id,
        quantity: 3,
        conditionStatus: 'GOOD',
      },
      // Power Tools - Drills
      {
        name: 'Cordless Drill',
        description: '18V cordless drill/driver',
        categoryId: drillsCategory.id,
        quantity: 5,
        donor: 'Home Depot',
        conditionStatus: 'GOOD',
      },
      {
        name: 'Hammer Drill',
        description: 'Corded hammer drill',
        categoryId: drillsCategory.id,
        quantity: 2,
        conditionStatus: 'GOOD',
      },
      // Power Tools - Saws
      {
        name: 'Circular Saw',
        description: '7-1/4" circular saw',
        categoryId: sawsCategory.id,
        quantity: 4,
        conditionStatus: 'GOOD',
      },
      {
        name: 'Jigsaw',
        description: 'Variable speed jigsaw',
        categoryId: sawsCategory.id,
        quantity: 3,
        conditionStatus: 'GOOD',
      },
      // Power Tools - Sanders
      {
        name: 'Orbital Sander',
        description: 'Random orbital sander',
        categoryId: sandersCategory.id,
        quantity: 3,
        conditionStatus: 'GOOD',
      },
      // Garden - Lawn Care
      {
        name: 'Lawn Mower',
        description: 'Gas-powered push mower',
        categoryId: lawnCareCategory.id,
        quantity: 2,
        donor: 'Green Thumb Landscaping',
        conditionStatus: 'GOOD',
      },
      {
        name: 'Leaf Blower',
        description: 'Electric leaf blower',
        categoryId: lawnCareCategory.id,
        quantity: 3,
        conditionStatus: 'GOOD',
      },
      // Garden - Pruning
      {
        name: 'Pruning Shears',
        description: 'Professional bypass pruning shears',
        categoryId: pruningCategory.id,
        quantity: 6,
        conditionStatus: 'GOOD',
      },
      {
        name: 'Hedge Trimmer',
        description: 'Electric hedge trimmer',
        categoryId: pruningCategory.id,
        quantity: 2,
        conditionStatus: 'GOOD',
      },
      // Measurement
      {
        name: 'Tape Measure',
        description: '25ft tape measure',
        categoryId: measurementCategory.id,
        quantity: 15,
        conditionStatus: 'GOOD',
      },
      {
        name: 'Laser Level',
        description: 'Self-leveling laser level',
        categoryId: measurementCategory.id,
        quantity: 2,
        donor: 'Professional Contractors',
        conditionStatus: 'GOOD',
      },
      // Safety
      {
        name: 'Safety Glasses',
        description: 'ANSI-rated safety glasses',
        categoryId: safetyCategory.id,
        quantity: 20,
        conditionStatus: 'GOOD',
      },
      {
        name: 'Work Gloves',
        description: 'Heavy duty work gloves',
        categoryId: safetyCategory.id,
        quantity: 25,
        donor: 'Local Union',
        conditionStatus: 'GOOD',
      },
    ],
  });

  console.log('✅ Created tools');

  // Create some sample checkouts
  const cordlessDrill = await prisma.tool.findFirst({
    where: { name: 'Cordless Drill' },
  });

  const tapeMeasure = await prisma.tool.findFirst({
    where: { name: 'Tape Measure' },
  });

  if (cordlessDrill && tapeMeasure) {
    await prisma.checkout.createMany({
      data: [
        {
          toolId: cordlessDrill.id,
          patronId: patron1.id,
          volunteerId: volunteer1.id,
          checkoutDate: new Date('2024-10-01'),
          dueDate: new Date('2024-10-08'),
          checkoutPeriod: 7,
          status: 'CHECKED_OUT',
        },
        {
          toolId: tapeMeasure.id,
          patronId: patron2.id,
          volunteerId: volunteer2.id,
          checkoutDate: new Date('2024-10-15'),
          dueDate: new Date('2024-10-22'),
          checkinDate: new Date('2024-10-20'),
          checkinVolunteerId: volunteer1.id,
          checkoutPeriod: 7,
          status: 'RETURNED',
        },
      ],
    });

    console.log('✅ Created sample checkouts');
  }

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
        value: 'Community Tool Library',
      },
      {
        key: 'library_email',
        value: 'info@toollibrary.org',
      },
      {
        key: 'library_phone',
        value: '555-TOOLS',
      },
    ],
  });

  console.log('✅ Created system settings');

  console.log('🎉 Seed completed successfully!');
  console.log('\nTest Credentials:');
  console.log('Admin: admin@toollibrary.org / admin123');
  console.log('Volunteer: john@toollibrary.org / volunteer123');
  console.log('Volunteer: jane@toollibrary.org / volunteer123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
