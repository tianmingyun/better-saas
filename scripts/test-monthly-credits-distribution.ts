import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, isNull, not, inArray, or } from 'drizzle-orm';
import { env } from '../src/env';
import { user, payment } from '../src/server/db/schema';
import { creditService } from '../src/lib/credits';
import { paymentConfig } from '../src/config/payment.config';

// Initialize database connection
const sql = neon(env.DATABASE_URL);
const db = drizzle(sql, { 
  schema: { user, payment } 
});

async function testMonthlyCreditsDistribution() {
  console.log('🧪 Testing monthly credits distribution...');
  
  try {
    // 1. 模拟 grantMonthlyFreeCredits 函数
    console.log('🎁 Granting monthly free credits...');
    
    // 查找所有免费用户（没有有效订阅的用户）
    const freeUsers = await db
      .select({ userId: user.id, email: user.email })
      .from(user)
      .leftJoin(payment, eq(payment.userId, user.id))
      .where(
        or(
          isNull(payment.status),
          not(inArray(payment.status, ['active', 'trialing']))
        )
      )
      .limit(5); // 只测试前5个用户
    
    console.log(`Found ${freeUsers.length} free users for testing`);
    
    if (freeUsers.length === 0) {
      console.log('ℹ️  No free users found for testing');
      return { success: true, message: 'No free users to test' };
    }
    
    // 获取免费计划的月度积分
    const freePlan = paymentConfig.plans.find(p => p.id === 'free');
    const monthlyCredits = freePlan?.credits?.monthly || 100;
    
    console.log(`Will grant ${monthlyCredits} monthly credits to each free user`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ userId: string; email: string; error: string }> = [];
    
    // 为每个免费用户发放月度积分
    for (const user of freeUsers) {
      try {
        console.log(`Processing user: ${user.email} (${user.userId})`);
        
        await creditService.earnCredits({
          userId: user.userId,
          amount: monthlyCredits,
          source: 'subscription',
          description: 'Monthly free credits (TEST)',
          referenceId: `free_${new Date().toISOString().slice(0, 7)}_test`, // 添加 _test 后缀以区分测试数据
          metadata: {
            type: 'monthly_free_credits',
            planId: 'free',
            isTest: true,
            grantedAt: new Date().toISOString(),
          },
        });
        
        console.log(`✅ Granted ${monthlyCredits} credits to ${user.email}`);
        successCount++;
        
        // 添加小延迟
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ 
          userId: user.userId, 
          email: user.email, 
          error: errorMessage 
        });
        console.error(`❌ Failed to grant credits to ${user.email}:`, errorMessage);
      }
    }
    
    // 2. 统计结果
    console.log('\n🎯 Test results:');
    console.log(`   ✅ Success: ${successCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    console.log(`   💰 Total credits granted: ${successCount * monthlyCredits}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Failed users:');
      for (const error of errors) {
        console.log(`   - ${error.email}: ${error.error}`);
      }
    }
    
    // 3. 验证结果
    if (successCount > 0) {
      console.log('\n🔍 Verifying results...');
      
      // 检查前几个用户的积分余额
      for (const testUser of freeUsers.slice(0, 2)) {
        try {
          const account = await creditService.getCreditAccount(testUser.userId);
          if (account) {
            console.log(`✅ ${testUser.email}: ${account.balance} credits (Total Earned: ${account.totalEarned})`);
          }
        } catch (error) {
          console.log(`❌ Failed to verify ${testUser.email}: ${error}`);
        }
      }
    }
    
    return {
      success: errorCount === 0,
      message: `Processed ${freeUsers.length} free users`,
      successCount,
      errorCount,
      totalCreditsGranted: successCount * monthlyCredits,
      errors: errors.length > 0 ? errors : undefined,
    };
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMonthlyCreditsDistribution()
    .then((result) => {
      console.log('\n📋 Final Test Result:', result);
      if (result.success) {
        console.log('✅ Monthly credits distribution test completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('1. Deploy to production to activate Vercel cron jobs');
        console.log('2. Monitor the first automated execution on the 1st of next month');
        console.log('3. Check logs in Vercel dashboard for cron job execution');
        process.exit(0);
      } else {
        console.log('❌ Monthly credits distribution test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

export { testMonthlyCreditsDistribution };
