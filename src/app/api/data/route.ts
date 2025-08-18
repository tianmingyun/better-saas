import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import db from "@/server/db";
import { apiKey, user, userCredits } from "@/server/db/schema";
import { eq, or, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import dataJson from "@/content/data.json";
import { creditService } from "@/lib/credits/credit-service";

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取API Key
    const apiKeyValue = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!apiKeyValue) {
      return NextResponse.json(
        { error: "API Key is required. Please provide it in the 'x-api-key' header or 'Authorization: Bearer <key>' header." },
        { status: 401 }
      );
    }

    console.log(`API Key received: ${apiKeyValue.substring(0, 10)}...`);

    // 验证API Key并获取用户信息
    const apiKeys = await db
      .select({
        id: apiKey.id,
        hashedKey: apiKey.hashedKey,
        userId: apiKey.userId,
        expiresAt: apiKey.expiresAt,
        name: apiKey.name,
      })
      .from(apiKey)
      .innerJoin(user, eq(apiKey.userId, user.id))
      .where(or(eq(user.banned, false), isNull(user.banned))); // 确保用户未被封禁

  
    let validApiKey = null;
    for (const key of apiKeys) {
      console.log(`Checking API key: ${key.id}, hashedKey starts with: ${key.hashedKey.substring(0, 10)}...`);
      const isValid = await bcrypt.compare(apiKeyValue, key.hashedKey);
      console.log(`API key ${key.id} valid: ${isValid}`);
      if (isValid) {
        validApiKey = key;
        break;
      }
    }

    if (!validApiKey) {
      console.log('No valid API key found');
      return NextResponse.json(
        { error: "Invalid API Key" },
        { status: 401 }
      );
    }

    console.log(`Valid API key found: ${validApiKey.id}`);

    const { userId, expiresAt } = validApiKey;

    // 检查API Key是否过期
    if (expiresAt && new Date() > expiresAt) {
      return NextResponse.json(
        { error: "API Key has expired" },
        { status: 401 }
      );
    }

    // 获取用户信息和积分信息
    const [userData] = await db
      .select({ 
        banned: user.banned,
        balance: userCredits.balance 
      })
      .from(user)
      .leftJoin(userCredits, eq(user.id, userCredits.userId))
      .where(eq(user.id, userId));

    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 检查用户是否被封禁
    if (userData.banned === true) {
      return NextResponse.json(
        { error: "User is banned" },
        { status: 403 }
      );
    }

    const userBalance = userData.balance || 0;

    // 检查用户积分是否足够
    if (userBalance < 1) {
      return NextResponse.json(
        { error: "Insufficient credits. You need at least 1 credit to make this request." },
        { status: 402 } // Payment Required
      );
    }

    // 获取分页参数
    const url = new URL(request.url);
    const page = Number.parseInt(url.searchParams.get("page") || "1");
    const limit = 10; // 固定每次返回10条数据
    const offset = (page - 1) * limit;

    // 从data.json获取数据
    const totalItems = dataJson.length;
    const paginatedData = dataJson.slice(offset, offset + limit);

    // 如果没有更多数据，返回错误
    if (paginatedData.length === 0) {
      return NextResponse.json(
        { error: "No more data available for the requested page" },
        { status: 404 }
      );
    }

    // 扣除1个积分并创建交易记录
    await creditService.spendCredits({
      userId,
      amount: 1,
      source: 'api_call',
      description: `Data API call - Page ${page}`,
      referenceId: `data_api_${validApiKey.id}_${Date.now()}`
    });

    // 更新API Key最后使用时间
    await db
      .update(apiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKey.id, validApiKey.id));

    // 返回数据和分页信息
    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNext: offset + limit < totalItems,
        hasPrev: page > 1
      },
      credits: {
        used: 1,
        remaining: userBalance - 1
      }
    });

  } catch (error) {
    console.error("Data API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 添加OPTIONS方法支持CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
    },
  });
}