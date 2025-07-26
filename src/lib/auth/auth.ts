import { env } from '@/env';
import db from '@/server/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  baseURL: env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    // 只有当 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET 都存在时，才启用 GitHub 登录
    github:
      env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          }
        : undefined, // 如果条件不满足，设置为 undefined
    // 只有当 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET 都存在时，才启用 Google 登录
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }
        : undefined, // 如果条件不满足，设置为 undefined
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24 * 3,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 
    },
  },
  plugins: [admin()],
});
