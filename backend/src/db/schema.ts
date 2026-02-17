import { pgTable, text, timestamp, boolean, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  refreshTokenHash: text("refresh_token_hash").notNull(),
  deviceInfo: text("device_info"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const oauthClients = pgTable("oauth_clients", {
  clientId: varchar("client_id", { length: 255 }).primaryKey(),
  clientSecretHash: text("client_secret_hash").notNull(),
  redirectUris: text("redirect_uris").array().notNull(), // PostgreSQL array of strings
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
