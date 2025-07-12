#!/usr/bin/env tsx

import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { user } from '../src/server/db/schema';
import { createChildLogger } from '@/lib/logger/logger';
import { auth } from '../src/lib/auth/auth';

const setupTestUsersLogger = createChildLogger('setup-test-users');

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
    password: 'TestPassword123!',
    name: 'Test Admin',
    role: 'admin',
    emailVerified: true,
  },
  {
    id: 'test-user-1',
    email: 'user@test.com',
    password: 'TestPassword123!',
    name: 'Test User',
    role: 'user',
    emailVerified: true,
  },
  {
    id: 'test-user-2',
    email: 'newuser@test.com',
    password: 'TestPassword123!',
    name: 'New Test User',
    role: 'user',
    emailVerified: false,
  },
];

async function createTestUser(userData: {
  id: string;
  email: string;
  password: string;
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
      setupTestUsersLogger.info(`✅ User ${userData.email} already exists`);
      // Update role if needed
      if (existingUser[0]?.role !== userData.role) {
        await db
          .update(user)
          .set({ role: userData.role, updatedAt: new Date() })
          .where(eq(user.email, userData.email));
        setupTestUsersLogger.info(`🔄 Updated user role: ${userData.email} -> ${userData.role}`);
      }
      return;
    }

    // Use Better Auth to create user with proper password hashing
    const result = await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
      },
    });

    if (result) {
      // Update the user with additional fields
      await db
        .update(user)
        .set({ 
          role: userData.role,
          emailVerified: userData.emailVerified,
          updatedAt: new Date() 
        })
        .where(eq(user.email, userData.email));

      setupTestUsersLogger.info(`✅ Created test user: ${userData.email} (${userData.role})`);
    } else {
      throw new Error('Failed to create user via Better Auth');
    }
  } catch (error) {
    setupTestUsersLogger.error(`❌ Failed to create user ${userData.email}:`, error);
    throw error;
  }
}

async function setupTestUsers() {
  try {
    setupTestUsersLogger.info('🔄 Setting up test users for E2E tests...');

    for (const userData of TEST_USERS) {
      await createTestUser(userData);
    }

    setupTestUsersLogger.info('✅ All test users setup completed');
    setupTestUsersLogger.info('Test users created:');
    for (const userData of TEST_USERS) {
      setupTestUsersLogger.info(`  - ${userData.email} (${userData.role})`);
    }
  } catch (error) {
    setupTestUsersLogger.error('❌ Failed to setup test users:', error);
    process.exit(1);
  }
}

async function cleanupTestUsers() {
  try {
    setupTestUsersLogger.info('🧹 Cleaning up test users...');

    for (const userData of TEST_USERS) {
      await db.delete(user).where(eq(user.email, userData.email));
      setupTestUsersLogger.info(`🗑️  Deleted test user: ${userData.email}`);
    }

    setupTestUsersLogger.info('✅ Test users cleanup completed');
  } catch (error) {
    setupTestUsersLogger.error('❌ Failed to cleanup test users:', error);
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
      console.log('Usage: tsx scripts/setup-test-users.ts [setup|cleanup|reset]');
      console.log('  setup   - Create test users');
      console.log('  cleanup - Remove test users');
      console.log('  reset   - Remove and recreate test users');
      process.exit(1);
  }
}

main().catch(console.error); 