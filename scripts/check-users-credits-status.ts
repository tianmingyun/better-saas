import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { env } from '../src/env';
import { user, userCredits, creditTransactions } from '../src/server/db/schema';

// Initialize database connection
const sql = neon(env.DATABASE_URL);
const db = drizzle(sql, { 
  schema: { user, userCredits, creditTransactions } 
});

async function checkUsersCreditStatus() {
  console.log('📊 Checking users credit status...');
  
  try {
    // 1. 获取所有用户及其积分账户信息
    const usersWithCredits = await db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userCreatedAt: user.createdAt,
        creditAccountId: userCredits.id,
        balance: userCredits.balance,
        totalEarned: userCredits.totalEarned,
        totalSpent: userCredits.totalSpent,
        frozenBalance: userCredits.frozenBalance,
        creditAccountCreatedAt: userCredits.createdAt,
      })
      .from(user)
      .leftJoin(userCredits, eq(user.id, userCredits.userId))
      .limit(10); // 只显示前10个用户

    console.log('\n📋 User Credit Status (showing first 10 users):');
    console.log('='.repeat(120));
    
    let usersWithCreditAccounts = 0;
    let usersWithoutCreditAccounts = 0;
    let totalCreditsInSystem = 0;

    for (const userData of usersWithCredits) {
      if (userData.creditAccountId) {
        usersWithCreditAccounts++;
        totalCreditsInSystem += userData.balance || 0;
        
        console.log(`✅ ${userData.userEmail}`);
        console.log(`   User ID: ${userData.userId}`);
        console.log(`   Balance: ${userData.balance} credits`);
        console.log(`   Total Earned: ${userData.totalEarned}`);
        console.log(`   Total Spent: ${userData.totalSpent}`);
        console.log(`   Frozen: ${userData.frozenBalance}`);
        console.log(`   User Created: ${userData.userCreatedAt?.toISOString()}`);
        console.log(`   Credit Account Created: ${userData.creditAccountCreatedAt?.toISOString()}`);
        
        // 检查该用户的交易记录
        const transactions = await db
          .select({
            id: creditTransactions.id,
            type: creditTransactions.type,
            amount: creditTransactions.amount,
            source: creditTransactions.source,
            description: creditTransactions.description,
            createdAt: creditTransactions.createdAt,
          })
          .from(creditTransactions)
          .where(eq(creditTransactions.userId, userData.userId))
          .limit(3);
        
        if (transactions.length > 0) {
          console.log('   Recent Transactions:');
          for (const tx of transactions) {
            console.log(`     - ${tx.type}: ${tx.amount} (${tx.source}) - ${tx.description} [${tx.createdAt.toISOString()}]`);
          }
        } else {
          console.log('   No transactions found');
        }
        
      } else {
        usersWithoutCreditAccounts++;
        console.log(`❌ ${userData.userEmail} - No credit account`);
        console.log(`   User ID: ${userData.userId}`);
        console.log(`   User Created: ${userData.userCreatedAt?.toISOString()}`);
      }
      console.log('');
    }

    // 2. 获取总体统计
    const totalUsersQuery = sql`SELECT COUNT(*) as count FROM "user"`;
    const totalCreditAccountsQuery = sql`SELECT COUNT(*) as count FROM user_credits`;
    const totalTransactionsQuery = sql`SELECT COUNT(*) as count FROM credit_transactions`;
    const totalCreditsSumQuery = sql`SELECT COALESCE(SUM(balance), 0) as sum FROM user_credits`;
    
    const totalUsersResult = await db.execute(totalUsersQuery);
    const totalCreditAccountsResult = await db.execute(totalCreditAccountsQuery);
    const totalTransactionsResult = await db.execute(totalTransactionsQuery);
    const totalCreditsSumResult = await db.execute(totalCreditsSumQuery);

    console.log('🎯 Overall Statistics:');
    console.log('='.repeat(50));
    console.log(`Total Users: ${totalUsersResult.rows[0].count}`);
    console.log(`Total Credit Accounts: ${totalCreditAccountsResult.rows[0].count}`);
    console.log(`Total Transactions: ${totalTransactionsResult.rows[0].count}`);
    console.log(`Total Credits in System: ${totalCreditsSumResult.rows[0].sum || 0}`);
    console.log(`Coverage: ${Math.round((Number(totalCreditAccountsResult.rows[0].count) / Number(totalUsersResult.rows[0].count)) * 100)}%`);

    // 3. 检查是否需要为现有用户补发积分
    if (Number(totalCreditAccountsResult.rows[0].count) < Number(totalUsersResult.rows[0].count)) {
      console.log(`\n⚠️  ${Number(totalUsersResult.rows[0].count) - Number(totalCreditAccountsResult.rows[0].count)} users still need credit accounts!`);
    } else if (Number(totalCreditsSumResult.rows[0].sum) === 0) {
      console.log('\n⚠️  All users have credit accounts but no credits! Consider running signup bonus script.');
    } else {
      console.log('\n✅ All users have credit accounts with credits!');
    }

    return {
      success: true,
      totalUsers: Number(totalUsersResult.rows[0].count),
      totalCreditAccounts: Number(totalCreditAccountsResult.rows[0].count),
      totalTransactions: Number(totalTransactionsResult.rows[0].count),
      totalCredits: Number(totalCreditsSumResult.rows[0].sum),
    };

  } catch (error) {
    console.error('❌ Failed to check credit status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkUsersCreditStatus()
    .then((result) => {
      console.log('\n📋 Final Result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { checkUsersCreditStatus };
