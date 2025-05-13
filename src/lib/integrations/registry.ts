export const integrationRegistry = {
  obsidian: {
    displayName: "Obsidian Plugin",
    authType: "machine" as const,
    scopes: ["notes:read", "notes:write"] as const,
  },
  notion: {
    displayName: "Notion",
    authType: "oauth" as const,
    clientId: process.env.NOTION_CLIENT_ID!,
    clientSecret: process.env.NOTION_CLIENT_SECRET!,
    scopes: ["databases:read", "pages:write"] as const,
  },
  readwise: {
    displayName: "Readwise",
    authType: "pat" as const,
    scopes: ["highlights:read"] as const,
  },
};
export type Provider = keyof typeof integrationRegistry;
