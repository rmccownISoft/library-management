import { PrismaClient } from "../src/generated/prisma/client.js";
import * as bcrypt from 'bcrypt';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const prisma = new PrismaClient();

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log('🔐 Create New User\n');

  try {
    // Get username
    const userName = await rl.question('Username: ');
    if (!userName || userName.trim().length === 0) {
      throw new Error('Username is required');
    }

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { userName: userName.trim() }
    });
    if (existing) {
      throw new Error(`Username "${userName}" already exists`);
    }

    // Get password (note: will be visible in terminal)
    const password = await rl.question('Password (min 8 characters): ');
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Get full name
    const name = await rl.question('Full Name: ');
    if (!name || name.trim().length === 0) {
      throw new Error('Full name is required');
    }

    // Get role
    const roleInput = await rl.question('Role (ADMIN/VOLUNTEER) [ADMIN]: ');
    const role = roleInput.trim().toUpperCase() || 'ADMIN';
    if (role !== 'ADMIN' && role !== 'VOLUNTEER') {
      throw new Error('Role must be either ADMIN or VOLUNTEER');
    }

    // Get contact info
    const phone = await rl.question('Phone: ');
    const email = await rl.question('Email: ');
    const mailingStreet = await rl.question('Street Address: ');
    const mailingCity = await rl.question('City: ');
    const mailingState = await rl.question('State: ');
    const mailingZipcode = await rl.question('Zipcode: ');

    console.log('\n⏳ Creating user...');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        userName: userName.trim(),
        passwordHash,
        name: name.trim(),
        role: role as 'ADMIN' | 'VOLUNTEER',
        phone: phone.trim() || '',
        email: email.trim() || '',
        mailingStreet: mailingStreet.trim() || '',
        mailingCity: mailingCity.trim() || '',
        mailingState: mailingState.trim() || '',
        mailingZipcode: mailingZipcode.trim() || '',
        trainingDate: new Date(),
        active: true
      }
    });

    console.log('\n✅ User created successfully!');
    console.log(`   Username: ${user.userName}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}\n`);

  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}\n`);
    } else {
      console.error('\n❌ An unexpected error occurred\n');
    }
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
