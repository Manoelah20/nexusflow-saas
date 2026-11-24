import { pgTable, uuid, text, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Usuários ───────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:        uuid('id').defaultRandom().primaryKey(),
  email:     text('email').notNull().unique(),
  password:  text('password').notNull(),
  name:      text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── API Keys ────────────────────────────────────────────────────────────────
export const apiKeys = pgTable('api_keys', {
  id:        uuid('id').defaultRandom().primaryKey(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  keyHash:   text('key_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Automações ──────────────────────────────────────────────────────────────
export const automations = pgTable('automations', {
  id:              uuid('id').defaultRandom().primaryKey(),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:            text('name').notNull(),
  triggerType:     text('trigger_type').$type<'webhook' | 'cron' | 'db_event'>().notNull(),
  filterCondition: jsonb('filter_condition').default({}).notNull(),
  actionType:      text('action_type').$type<'send_email' | 'whatsapp_message' | 'slack_webhook' | 'discord_webhook' | 'http_post' | 'critical_alert'>().notNull(),
  actionConfig:    jsonb('action_config').default({}).notNull(),
  isActive:        boolean('is_active').default(true).notNull(),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Logs de Execução ────────────────────────────────────────────────────────
export const executionLogs = pgTable('execution_logs', {
  id:             uuid('id').defaultRandom().primaryKey(),
  automationId:   uuid('automation_id').notNull().references(() => automations.id, { onDelete: 'cascade' }),
  userId:         uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status:         text('status').$type<'success' | 'failed' | 'ignored'>().notNull(),
  payloadSummary: jsonb('payload_summary').default({}).notNull(),
  latencyMs:      integer('latency_ms').notNull(),
  errorMessage:   text('error_message'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Relações ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  automations:   many(automations),
  executionLogs: many(executionLogs),
  apiKeys:       many(apiKeys),
}));

export const automationsRelations = relations(automations, ({ one, many }) => ({
  user:          one(users, { fields: [automations.userId], references: [users.id] }),
  executionLogs: many(executionLogs),
}));

export const executionLogsRelations = relations(executionLogs, ({ one }) => ({
  automation: one(automations, { fields: [executionLogs.automationId], references: [automations.id] }),
  user:       one(users,       { fields: [executionLogs.userId],       references: [users.id] }),
}));
