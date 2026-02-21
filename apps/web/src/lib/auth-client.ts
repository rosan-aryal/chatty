import { env } from "@chat-application/env/web";
import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
  plugins: [
    stripeClient({
      subscription: true,
    }),
  ],
});
