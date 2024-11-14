import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    POSTGRES_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET: z.string(),
    NEYNAR_API_KEY: z.string(),
    PINATA_JWT: z.string(),
    YOUTUBE_API_KEY: z.string(),
    APP_URL: z.string(),
    UPSTASH_REDIS_REST_URL: z.string(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_NEYNAR_CLIENT_ID: z.string(),
    NEXT_PUBLIC_GATEWAY_URL: z.string(),
    NEXT_PUBLIC_ROOT_TAG_ID: z.string(),
    NEXT_PUBLIC_PINATA_GATEWAY: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEYNAR_API_KEY: process.env.NEYNAR_API_KEY,
    NEXT_PUBLIC_NEYNAR_CLIENT_ID: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID,
    PINATA_JWT: process.env.PINATA_JWT,
    NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL,
    NEXT_PUBLIC_ROOT_TAG_ID: process.env.NEXT_PUBLIC_ROOT_TAG_ID,
    APP_URL: process.env.APP_URL,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    NEXT_PUBLIC_PINATA_GATEWAY: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
