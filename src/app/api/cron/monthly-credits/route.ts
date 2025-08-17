import { NextResponse } from 'next/server';
import { grantMonthlyFreeCredits } from '@/server/cron/monthly-credits';
import { createChildLogger } from '@/lib/logger/logger';
import { validateCronRequest } from '@/lib/cron/auth';

const cronLogger = createChildLogger('monthly-credits-cron');

export async function GET(request: Request) {
  const executionStart = new Date();
  
  try {
    // 安全验证
    const authError = validateCronRequest(request);
    if (authError) {
      return authError;
    }
    
    // 获取请求信息
    const userAgent = request.headers.get('user-agent');
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    
    cronLogger.info({
      timestamp: executionStart.toISOString(),
      userAgent,
      ip,
    }, 'Starting monthly credits cron job');
    
    const result = await grantMonthlyFreeCredits();
    const executionEnd = new Date();
    const executionTime = executionEnd.getTime() - executionStart.getTime();
    
    if (result.success) {
      cronLogger.info({
        totalUsers: result.totalUsers,
        successCount: result.successCount,
        errorCount: result.errorCount,
        totalCreditsDistributed: result.totalCreditsDistributed,
        executionTime: `${executionTime}ms`,
      }, 'Monthly credits distribution completed successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Monthly credits distributed successfully',
        data: {
          ...result,
          executionTime: `${executionTime}ms`,
          executedAt: executionEnd.toISOString(),
        },
      });
    }
    
    cronLogger.error({
      message: result.message,
      executionTime: `${executionTime}ms`,
    }, 'Monthly credits distribution failed');
    
    return NextResponse.json({
      success: false,
      message: result.message,
      data: {
        executionTime: `${executionTime}ms`,
        failedAt: executionEnd.toISOString(),
      },
    }, { status: 500 });
  } catch (error) {
    const executionEnd = new Date();
    const executionTime = executionEnd.getTime() - executionStart.getTime();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    cronLogger.error({
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      executionTime: `${executionTime}ms`,
    }, 'Monthly credits cron job failed');
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: errorMessage,
      data: {
        executionTime: `${executionTime}ms`,
        failedAt: executionEnd.toISOString(),
      },
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Allow manual triggering via POST as well
  return GET(request);
}
