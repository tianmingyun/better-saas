import { drizzle } from 'drizzle-orm/neon-http';
import { user, session, file } from '../src/server/db/schema';
import { like, eq, or } from 'drizzle-orm';

// 直接使用数据库URL，不依赖完整的环境配置
const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL 或 TEST_DATABASE_URL 环境变量未设置');
  process.exit(1);
}

const db = drizzle(databaseUrl);

async function cleanupTestUsers() {
  try {
    console.log('🧹 开始清理测试数据...');
    
    // 清理文件记录 - 所有测试相关的文件
    console.log('清理测试文件记录...');
    await db.delete(file).where(
      or(
        like(file.uploadUserId, 'test-user-%'),
        like(file.filename, 'test-%'),
        like(file.originalName, 'test-%')
      )
    );
    
    // 清理会话记录 - 所有测试相关的会话
    console.log('清理测试会话记录...');
    await db.delete(session).where(
      like(session.userId, 'test-user-%')
    );
    
    // 清理用户记录 - 所有测试相关的用户
    console.log('清理测试用户记录...');
    const userDeleteResult = await db.delete(user).where(
      or(
        like(user.id, 'test-user-%'),
        like(user.email, '%@test.com'),
        like(user.email, '%@example.com'),
        like(user.email, 'test@%'),
        like(user.email, 'findme%'),
        like(user.email, 'update%'),
        like(user.email, 'delete%'),
        like(user.email, 'ban%'),
        like(user.email, 'filetest%')
      )
    );
    
    console.log('✅ 测试数据清理完成');
    console.log(`📊 删除的用户数量: ${userDeleteResult.rowCount || 0}`);
    
    // 显示剩余用户数量
    const remainingUsers = await db.select().from(user);
    console.log(`📊 数据库中剩余用户数量: ${remainingUsers.length}`);
    
  } catch (error) {
    console.error('❌ 清理测试数据失败:', error);
    throw error;
  }
}

// 如果直接运行脚本，执行清理并退出
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupTestUsers()
    .then(() => {
      console.log('✅ 清理完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 清理失败:', error);
      process.exit(1);
    });
}

export default cleanupTestUsers; 