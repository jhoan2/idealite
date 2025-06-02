import { integrationCredentials } from "~/server/db/schema";

export type IntegrationCredential = typeof integrationCredentials.$inferSelect;

export type NewIntegrationCredential =
  typeof integrationCredentials.$inferInsert;

// Additional types for integration functionality
export type IntegrationType = "machine" | "oauth" | "pat";

export interface IntegrationBase {
  id: string;
  userId: string;
  provider: string;
  type: IntegrationType;
  scope: string[];
  lastUsed?: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export interface MachineKeyIntegration extends IntegrationBase {
  type: "machine";
  hashedToken: string;
  accessTokenEnc?: never;
  refreshTokenEnc?: never;
  expiresAt?: never;
}

export interface OAuthIntegration extends IntegrationBase {
  type: "oauth" | "pat";
  hashedToken?: never;
  accessTokenEnc: string;
  refreshTokenEnc?: string;
  expiresAt?: Date;
}

export type Integration = MachineKeyIntegration | OAuthIntegration;
