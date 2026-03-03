import { pgTable, integer, text, index, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

export const leads = pgTable(
  'leads',
  {
    id: serial('id').primaryKey(),
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
    status: text('status').notNull().default('Novo'),
    statusUpdatedAt: timestamp('status_updated_at'),
    collectedAt: timestamp('collected_at').notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index('leads_status_idx').on(table.status),
    nichoIdx: index('leads_nicho_idx').on(table.nicho),
    scoreIdx: index('leads_score_idx').on(table.score),
    collectedAtIdx: index('leads_collected_at_idx').on(table.collectedAt),
  })
);

export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    leadId: integer('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    approved: boolean('approved').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    approvedIdx: index('messages_approved_idx').on(table.approved),
    leadIdIdx: index('messages_lead_id_idx').on(table.leadId),
  })
);

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
