import { env } from '@/env';
import db from '@/server/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { createAuthMiddleware } from 'better-auth/api';
import { creditService } from '@/lib/credits';
import { paymentConfig } from '@/config/payment.config';

// Handle user creation - initialize credit account and grant signup bonus
async function handleUserCreated(user: { id: string; email: string }) {
  try {
    console.log(`🎯 Initializing credit account for new user: ${user.email}`);
    
    // Create credit account for new user
    await creditService.createCreditAccount(user.id);
    
    // Grant signup bonus credits for free plan
    const freePlan = paymentConfig.plans.find(p => p.id === 'free');
    const signupCredits = freePlan?.credits?.onSignup;
    
    if (signupCredits && signupCredits > 0) {
      await creditService.earnCredits({
        userId: user.id,
        amount: signupCredits,
        source: 'bonus',
        description: 'Welcome bonus credits',
        referenceId: `signup_${user.id}`,
        metadata: {
          type: 'signup_bonus',
          planId: 'free',
        },
      });
      
      console.log(`✅ Granted ${signupCredits} signup bonus credits to user ${user.email}`);
    }
    
    console.log(`🎉 Successfully initialized credit account for user ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to initialize credit account for user ${user.email}:`, error);
    // Don't throw error to avoid blocking the registration flow
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  baseURL: env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
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
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;
      if (newSession) {
        // Trigger user initialization in the background
        // Don't await to avoid blocking the registration flow
        handleUserCreated(newSession.user).catch(error => {
          console.error('Failed to initialize user business data:', error);
        });
      }
    })
  }
});
