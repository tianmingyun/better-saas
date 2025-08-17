import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { count } from 'drizzle-orm';
import { env } from '../src/env';
import { user, userCredits, userQuotaUsage } from '../src/server/db/schema';
import { grantExistingUsersCredits } from './grant-existing-users-credits';
import { grantSignupCredits } from './grant-signup-credits';
import { initUserQuotaUsage } from './init-user-quota-usage';
import { checkUsersCreditStatus } from './check-users-credits-status';

// Initialize database connection
const sql = neon(env.DATABASE_URL);
const db = drizzle(sql, { 
  schema: { user, userCredits, userQuotaUsage } 
});

/**
 * 完整的部署后初始化流程
 * 按照推荐顺序执行所有初始化步骤
 */
async function deployInitAll() {
  console.log('🚀 开始完整的部署后初始化流程...');
  console.log('=' .repeat(60));
  
  try {
    // 步骤 1: 检查当前状态
    console.log('\n📊 步骤 1: 检查当前数据库状态');
    console.log('-'.repeat(40));
    
    const initialStats = await getSystemStats();
    console.log(`当前用户数: ${initialStats.totalUsers}`);
    console.log(`有积分账户的用户: ${initialStats.usersWithCredits}`);
    console.log(`配额记录数: ${initialStats.quotaRecords}`);
    
    // 步骤 2: 创建积分账户
    console.log('\n💳 步骤 2: 为现有用户创建积分账户');
    console.log('-'.repeat(40));
    
    const creditsResult = await grantExistingUsersCredits();
    if (creditsResult.success) {
      console.log(`✅ 积分账户创建完成: 处理了 ${creditsResult.processedUsers} 个用户`);
    } else {
      console.log(`❌ 积分账户创建失败: ${creditsResult.message}`);
    }
    
    // 步骤 3: 补发注册积分
    console.log('\n🎁 步骤 3: 为余额为零的用户补发注册积分');
    console.log('-'.repeat(40));
    
    const signupResult = await grantSignupCredits();
    if (signupResult.success) {
      console.log(`✅ 注册积分补发完成: 处理了 ${signupResult.processedUsers} 个用户`);
    } else {
      console.log(`❌ 注册积分补发失败: ${signupResult.message}`);
    }
    
    // 步骤 4: 初始化配额记录
    console.log('\n📈 步骤 4: 初始化用户配额使用记录');
    console.log('-'.repeat(40));
    
    const quotaResult = await initUserQuotaUsage();
    if (quotaResult.success) {
      console.log(`✅ 配额记录初始化完成: 创建了 ${quotaResult.stats?.newRecordsInserted} 条新记录`);
      console.log(`   期间: ${quotaResult.stats?.period}`);
      const actualRecords = quotaResult.stats?.actualRecords || 0;
      const expectedRecords = quotaResult.stats?.expectedRecords || 1;
      console.log(`   覆盖率: ${Math.round((actualRecords / expectedRecords) * 100)}%`);
    } else {
      console.log(`❌ 配额记录初始化失败: ${quotaResult.error}`);
    }
    
    // 步骤 5: 最终状态检查
    console.log('\n🔍 步骤 5: 验证最终状态');
    console.log('-'.repeat(40));
    
    const finalStats = await getSystemStats();
    
    console.log('\n📋 初始化前后对比:');
    console.log('=' .repeat(60));
    console.log(`用户总数: ${initialStats.totalUsers} → ${finalStats.totalUsers}`);
    console.log(`有积分账户的用户: ${initialStats.usersWithCredits} → ${finalStats.usersWithCredits}`);
    console.log(`配额记录数: ${initialStats.quotaRecords} → ${finalStats.quotaRecords}`);
    
    // 计算完成度
    const creditAccountCoverage = Math.round((finalStats.usersWithCredits / finalStats.totalUsers) * 100);
    const expectedQuotaRecords = finalStats.totalUsers * 2; // 2 services per user
    const quotaCoverage = Math.round((finalStats.quotaRecords / expectedQuotaRecords) * 100);
    
    console.log('\n🎯 系统健康状态:');
    console.log('=' .repeat(60));
    console.log(`积分账户覆盖率: ${creditAccountCoverage}% ${creditAccountCoverage === 100 ? '✅' : '⚠️'}`);
    console.log(`配额记录覆盖率: ${quotaCoverage}% ${quotaCoverage === 100 ? '✅' : '⚠️'}`);
    
    if (creditAccountCoverage === 100 && quotaCoverage === 100) {
      console.log('\n🎉 所有用户数据初始化完成！系统已准备就绪。');
    } else {
      console.log('\n⚠️  部分用户数据可能需要手动处理，请检查上述统计信息。');
    }
    
    return {
      success: true,
      initialStats,
      finalStats,
      results: {
        credits: creditsResult,
        signup: signupResult,
        quota: quotaResult,
      },
    };
    
  } catch (error) {
    console.error('💥 初始化流程失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 获取系统统计信息
 */
async function getSystemStats() {
  const [totalUsersResult, totalCreditsResult, totalQuotaResult] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(userCredits),
    db.select({ count: count() }).from(userQuotaUsage),
  ]);
  
  return {
    totalUsers: totalUsersResult[0].count,
    usersWithCredits: totalCreditsResult[0].count,
    quotaRecords: totalQuotaResult[0].count,
  };
}

/**
 * 快速检查模式 - 只显示统计信息，不执行初始化
 */
async function quickCheck() {
  console.log('🔍 快速状态检查模式');
  console.log('=' .repeat(40));
  
  const stats = await getSystemStats();
  const expectedQuotaRecords = stats.totalUsers * 2;
  const creditCoverage = Math.round((stats.usersWithCredits / stats.totalUsers) * 100);
  const quotaCoverage = Math.round((stats.quotaRecords / expectedQuotaRecords) * 100);
  
  console.log(`用户总数: ${stats.totalUsers}`);
  console.log(`有积分账户的用户: ${stats.usersWithCredits} (${creditCoverage}%)`);
  console.log(`配额记录数: ${stats.quotaRecords} / ${expectedQuotaRecords} (${quotaCoverage}%)`);
  
  if (creditCoverage === 100 && quotaCoverage === 100) {
    console.log('\n✅ 系统状态良好，所有用户数据完整');
  } else {
    console.log('\n⚠️  发现数据不完整，建议运行完整初始化流程');
    console.log('\n建议执行: npx tsx scripts/deploy-init-all.ts --full');
  }
}

// 命令行参数处理
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const isFullMode = args.includes('--full');
  const isCheckMode = args.includes('--check');
  
  if (isCheckMode) {
    // 快速检查模式
    quickCheck()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('检查失败:', error);
        process.exit(1);
      });
  } else if (isFullMode || args.length === 0) {
    // 完整初始化模式（默认）
    deployInitAll()
      .then((result) => {
        console.log('\n📋 最终结果:', result.success ? '成功' : '失败');
        process.exit(result.success ? 0 : 1);
      })
      .catch((error) => {
        console.error('初始化失败:', error);
        process.exit(1);
      });
  } else {
    console.log('用法:');
    console.log('  npx tsx scripts/deploy-init-all.ts          # 完整初始化（默认）');
    console.log('  npx tsx scripts/deploy-init-all.ts --full   # 完整初始化');
    console.log('  npx tsx scripts/deploy-init-all.ts --check  # 快速状态检查');
    process.exit(1);
  }
}

export { deployInitAll, quickCheck };