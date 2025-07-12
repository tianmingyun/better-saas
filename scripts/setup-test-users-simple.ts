#!/usr/bin/env tsx

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { user } from '../src/server/db/schema';
import crypto from 'node:crypto';

// Create database connection
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL is not set');
  process.exit(1);
}
const sql = neon(databaseUrl);
const db = drizzle(sql);

// Test users data
const TEST_USERS = [
  {
    id: 'test-admin-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin',
    emailVerified: true,
  },
  {
    id: 'test-user-1',
    email: 'user@test.com',
    name: 'Test User',
    role: 'user',
    emailVerified: true,
  },
  {
    id: 'test-user-2',
    email: 'newuser@test.com',
    name: 'New Test User',
    role: 'user',
    emailVerified: false,
  },
];

async function createTestUser(userData: {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
}) {
  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, userData.email))
      .limit(1);

    if (existingUser.length > 0) {
      console.log(`✅ User ${userData.email} already exists`);
      // Update role if needed
      if (existingUser[0]?.role !== userData.role) {
        await db
          .update(user)
          .set({ role: userData.role, updatedAt: new Date() })
          .where(eq(user.email, userData.email));
        console.log(`🔄 Updated user role: ${userData.email} -> ${userData.role}`);
      }
      return;
    }

    // Create user directly in database
    await db.insert(user).values({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      emailVerified: userData.emailVerified,
      createdAt: new Date(),
      updatedAt: new Date(),
      banned: false,
    });

    console.log(`✅ Created test user: ${userData.email} (${userData.role})`);
  } catch (error) {
    console.error(`❌ Failed to create user ${userData.email}:`, error);
    throw error;
  }
}

async function setupTestUsers() {
  try {
    console.log('🔄 Setting up test users for E2E tests...');

    for (const userData of TEST_USERS) {
      await createTestUser(userData);
    }

    console.log('✅ All test users setup completed');
    console.log('Test users created:');
    for (const userData of TEST_USERS) {
      console.log(`  - ${userData.email} (${userData.role})`);
    }
  } catch (error) {
    console.error('❌ Failed to setup test users:', error);
    process.exit(1);
  }
}

async function cleanupTestUsers() {
  try {
    console.log('🧹 Cleaning up test users...');

    for (const userData of TEST_USERS) {
      await db.delete(user).where(eq(user.email, userData.email));
      console.log(`🗑️  Deleted test user: ${userData.email}`);
    }

    console.log('✅ Test users cleanup completed');
  } catch (error) {
    console.error('❌ Failed to cleanup test users:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      await setupTestUsers();
      break;
    case 'cleanup':
      await cleanupTestUsers();
      break;
    case 'reset':
      await cleanupTestUsers();
      await setupTestUsers();
      break;
    default:
      console.log('Usage: tsx scripts/setup-test-users-simple.ts [setup|cleanup|reset]');
      console.log('  setup   - Create test users');
      console.log('  cleanup - Remove test users');
      console.log('  reset   - Remove and recreate test users');
      process.exit(1);
  }
}

main().catch(console.error); 