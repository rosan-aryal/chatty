import { db } from "@chat-application/db";
import * as schema from "@chat-application/db/schema/auth";
import { env } from "@chat-application/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

const stripeClient = new Stripe(env.STRIPE_SECRET_KEY);

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  user: {
    additionalFields: {
      onboarded: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      gender: {
        type: "string",
        required: false,
      },
      country: {
        type: "string",
        required: false,
      },
      isPremium: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      isAnonymous: {
        type: "boolean",
        defaultValue: true,
        input: false,
      },
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "premium",
            priceId: "price_premium_monthly",
          },
        ],
      },
    }),
  ],
});

export type Auth = typeof auth;
