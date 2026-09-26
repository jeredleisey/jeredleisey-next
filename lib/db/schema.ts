import { sql } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Better Auth core tables. Field names follow Better Auth 1.7's core schema.
// ---------------------------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_id_idx').on(t.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('account_user_id_idx').on(t.userId)],
);

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Site tables. RBAC lives here, not in Better Auth (docs/adr/0001).
// A Permission is a Project slug.
// ---------------------------------------------------------------------------

export const role = pgTable('role', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  // Set when this Role is the default Role of a Project.
  defaultForProject: text('default_for_project').unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const rolePermission = pgTable(
  'role_permission',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
    permission: text('permission').notNull(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permission] })],
);

export const userRole = pgTable(
  'user_role',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => role.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);

export const accessRequestStatus = pgEnum('access_request_status', [
  'pending',
  'approved',
  'declined',
]);

export const accessRequest = pgTable(
  'access_request',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    project: text('project').notNull(),
    note: text('note'),
    status: accessRequestStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    decidedAt: timestamp('decided_at'),
    roleId: uuid('role_id').references(() => role.id, { onDelete: 'set null' }),
  },
  (t) => [
    index('access_request_user_project_idx').on(t.userId, t.project),
    // A User has at most one pending Access Request per Project.
    uniqueIndex('access_request_one_pending_idx')
      .on(t.userId, t.project)
      .where(sql`${t.status} = 'pending'`),
  ],
);

export const run = pgTable(
  'run',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    project: text('project').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    model: text('model').notNull(),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    // USD, as reported by OpenRouter. Empty when the response has no cost.
    cost: doublePrecision('cost'),
    success: boolean('success').notNull(),
    error: text('error'),
  },
  (t) => [index('run_user_created_idx').on(t.userId, t.createdAt)],
);

// A User without a row here has the default daily Run limit.
export const runLimit = pgTable('run_limit', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  limit: integer('limit').notNull(),
});
