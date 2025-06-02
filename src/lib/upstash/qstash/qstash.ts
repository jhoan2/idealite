import { Client } from "@upstash/qstash";

if (!process.env.QSTASH_TOKEN) {
  throw new Error("QSTASH_TOKEN environment variable is not set");
}

export const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN,
});

// Optional: Export types for better TypeScript support
export type QStashClient = typeof qstashClient;
