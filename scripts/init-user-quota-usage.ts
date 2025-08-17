import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { count, eq, and } from 'drizzle-orm';
import { user, userQuotaUsage } from '../src/server/db/schema';
import type { InferInsertModel } from 'drizzle-orm';

// Initialize database connection
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

type UserQuotaUsageInsert = InferInsertModel<typeof userQuotaUsage>;

/**
 * Initialize user quota usage data for all existing users
 * Creates records for current month if they don't exist
 */
export async function initUserQuotaUsage() {
  console.log('🚀 Starting user quota usage initialization...');
  
  try {
    // Get current period (YYYY-MM format)
    const currentDate = new Date();
    const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`📅 Current period: ${currentPeriod}`);
    
    // 1. Get all users
    const allUsers = await db.select({
      id: user.id,
      email: user.email,
      name: user.name,
    }).from(user);
    
    console.log(`👥 Found ${allUsers.length} users`);
    
    if (allUsers.length === 0) {
      console.log('⚠️  No users found in database');
      return { success: true, message: 'No users to initialize' };
    }
    
    // 2. Check existing quota usage records for current period
    const existingRecords = await db.select({
      userId: userQuotaUsage.userId,
      service: userQuotaUsage.service,
    }).from(userQuotaUsage)
    .where(eq(userQuotaUsage.period, currentPeriod));
    
    console.log(`📊 Found ${existingRecords.length} existing quota records for current period`);
    
    // Create a set of existing user-service combinations
    const existingCombinations = new Set(
      existingRecords.map(record => `${record.userId}-${record.service}`)
    );
    
    // 3. Prepare records to insert
    const recordsToInsert: UserQuotaUsageInsert[] = [];
    const services = ['api_call', 'storage'] as const;
    
    for (const userData of allUsers) {
      for (const service of services) {
        const combination = `${userData.id}-${service}`;
        
        if (!existingCombinations.has(combination)) {
          recordsToInsert.push({
            id: crypto.randomUUID(),
            userId: userData.id,
            service,
            period: currentPeriod,
            usedAmount: 0, // Start with 0 usage
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }
    
    console.log(`📝 Preparing to insert ${recordsToInsert.length} new quota usage records`);
    
    // 4. Insert new records in batches
    if (recordsToInsert.length > 0) {
      const batchSize = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < recordsToInsert.length; i += batchSize) {
        const batch = recordsToInsert.slice(i, i + batchSize);
        await db.insert(userQuotaUsage).values(batch);
        insertedCount += batch.length;
        console.log(`✅ Inserted batch ${Math.ceil((i + 1) / batchSize)}: ${batch.length} records (Total: ${insertedCount}/${recordsToInsert.length})`);
      }
      
      console.log(`🎉 Successfully inserted ${insertedCount} quota usage records`);
    } else {
      console.log('✅ All users already have quota usage records for current period');
    }
    
    // 5. Verify final state
    const finalCount = await db.select({ count: count() }).from(userQuotaUsage)
      .where(eq(userQuotaUsage.period, currentPeriod));
    
    const expectedCount = allUsers.length * services.length;
    const actualCount = finalCount[0].count;
    
    console.log('📈 Final Statistics:');
    console.log('='.repeat(50));
    console.log(`Users: ${allUsers.length}`);
    console.log(`Services per user: ${services.length}`);
    console.log(`Expected records: ${expectedCount}`);
    console.log(`Actual records: ${actualCount}`);
    console.log(`Coverage: ${Math.round((actualCount / expectedCount) * 100)}%`);
    
    if (actualCount === expectedCount) {
      console.log('✅ All users have complete quota usage records!');
    } else {
      console.log(`⚠️  Missing ${expectedCount - actualCount} records`);
    }
    
    return {
      success: true,
      message: `Initialized quota usage for ${allUsers.length} users`,
      stats: {
        totalUsers: allUsers.length,
        expectedRecords: expectedCount,
        actualRecords: actualCount,
        newRecordsInserted: recordsToInsert.length,
        period: currentPeriod,
      },
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize user quota usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Initialize quota usage for a specific user and period
 * Useful for new user registration or historical data
 */
export async function initUserQuotaUsageForUser(
  userId: string, 
  period?: string
) {
  try {
    const targetPeriod = period || (() => {
      const date = new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    })();
    
    const services = ['api_call', 'storage'] as const;
  const recordsToInsert: UserQuotaUsageInsert[] = [];
    
    // Check existing records
    const existingRecords = await db.select({
      service: userQuotaUsage.service,
    }).from(userQuotaUsage)
    .where(and(
      eq(userQuotaUsage.userId, userId),
      eq(userQuotaUsage.period, targetPeriod)
    ));
    
    const existingServices = new Set(existingRecords.map(r => r.service));
    
    for (const service of services) {
      if (!existingServices.has(service)) {
        recordsToInsert.push({
          id: crypto.randomUUID(),
          userId,
          service,
          period: targetPeriod,
          usedAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    
    if (recordsToInsert.length > 0) {
      await db.insert(userQuotaUsage).values(recordsToInsert);
      console.log(`✅ Initialized ${recordsToInsert.length} quota records for user ${userId} (period: ${targetPeriod})`);
    }
    
    return {
      success: true,
      recordsCreated: recordsToInsert.length,
      period: targetPeriod,
    };
    
  } catch (error) {
    console.error(`❌ Failed to initialize quota usage for user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initUserQuotaUsage()
    .then((result) => {
      console.log('\n📋 Final Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}