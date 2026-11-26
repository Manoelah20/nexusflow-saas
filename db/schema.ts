import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export type TriggerType = 'webhook' | 'cron' | 'db_event';
export type ActionType =
  | 'send_email'
  | 'whatsapp_message'
  | 'slack_webhook'
  | 'discord_webhook'
  | 'http_post'
  | 'critical_alert';
export type ExecutionStatus = 'success' | 'failed' | 'ignored';

// ─── Usuários ───────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  sessionVersion: integer('session_version').default(0).notNull(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rateLimitBuckets = pgTable('rate_limit_buckets', {
  bucketHash: text('bucket_hash').primaryKey(),
  count: integer('count').notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
});

// ─── API Keys ────────────────────────────────────────────────────────────────
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('api_keys_user_id_idx').on(table.userId)]
);

// ─── Automações ──────────────────────────────────────────────────────────────
export const automations = pgTable(
  'automations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    triggerType: text('trigger_type').$type<TriggerType>().notNull(),
    filterCondition: jsonb('filter_condition').$type<Record<string, unknown>>().default({}).notNull(),
    actionType: text('action_type').$type<ActionType>().notNull(),
    actionConfig: jsonb('action_config').$type<Record<string, unknown>>().default({}).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('automations_user_id_idx').on(table.userId)]
);

// ─── Logs de Execução ────────────────────────────────────────────────────────
export const executionLogs = pgTable(
  'execution_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    automationId: uuid('automation_id')
      .notNull()
      .references(() => automations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').$type<ExecutionStatus>().notNull(),
    payloadSummary: jsonb('payload_summary').$type<Record<string, unknown>>().default({}).notNull(),
    latencyMs: integer('latency_ms').notNull(),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('execution_logs_user_id_idx').on(table.userId),
    index('execution_logs_automation_id_idx').on(table.automationId),
  ]
);

// ─── Relações ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  automations: many(automations),
  executionLogs: many(executionLogs),
  apiKeys: many(apiKeys),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

export const automationsRelations = relations(automations, ({ one, many }) => ({
  user: one(users, { fields: [automations.userId], references: [users.id] }),
  executionLogs: many(executionLogs),
}));

export const executionLogsRelations = relations(executionLogs, ({ one }) => ({
  automation: one(automations, {
    fields: [executionLogs.automationId],
    references: [automations.id],
  }),
  user: one(users, { fields: [executionLogs.userId], references: [users.id] }),
}));