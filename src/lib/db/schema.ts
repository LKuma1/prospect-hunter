import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const leads = sqliteTable(
  'leads',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    fullName: text('full_name'),
    bio: text('bio'),
    followers: integer('followers').notNull().default(0),
    following: integer('following').notNull().default(0),
    postsCount: integer('posts_count').notNull().default(0),
    profileUrl: text('profile_url').notNull().default(''),
    avatarUrl: text('avatar_url'),
    nicho: text('nicho').notNull().default(''),
    location: text('location'),
    score: integer('score').notNull().default(0),
    scoreBreakdown: text('score_breakdown').notNull().default('{}'),
    status: text('status', {
      enum: ['Novo', 'Contatado', 'Respondeu', 'Fechado', 'Descartado'],
    })
      .notNull()
      .default('Novo'),
    statusUpdatedAt: integer('status_updated_at', { mode: 'timestamp' }),
    collectedAt: integer('collected_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    statusIdx: index('leads_status_idx').on(table.status),
    nichoIdx: index('leads_nicho_idx').on(table.nicho),
    scoreIdx: index('leads_score_idx').on(table.score),
    collectedAtIdx: index('leads_collected_at_idx').on(table.collectedAt),
  })
);

export const messages = sqliteTable(
  'messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    leadId: integer('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    approved: integer('approved', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    approvedIdx: index('messages_approved_idx').on(table.approved),
    leadIdIdx: index('messages_lead_id_idx').on(table.leadId),
  })
);

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});
