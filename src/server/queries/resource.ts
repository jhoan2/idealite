import { resources } from "~/server/db/schema";

export type Resource = typeof resources.$inferSelect;
