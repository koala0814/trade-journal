import { relations } from 'drizzle-orm';
import { boolean, decimal, pgTable, serial, text, timestamp, uuid, integer, json } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const trades = pgTable('trades', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  mt5Ticket: text('mt5_ticket').unique(),
  symbol: text('symbol'),
  entryTime: timestamp('entry_time'),
  exitTime: timestamp('exit_time'),
  entryPrice: decimal('entry_price'),
  exitPrice: decimal('exit_price'),
  lotSize: decimal('lot_size'),
  profit: decimal('profit'),
  swap: decimal('swap'),
  commission: decimal('commission'),
  strategy: text('strategy'),
  session: text('session'), // Asian/London/NY
  direction: text('direction'), // Long/Short
  followedRules: boolean('followed_rules'),
  mentalStatePre: text('mental_state_pre'),
  mentalStateDuring: text('mental_state_during'),
  mentalStatePost: text('mental_state_post'),
  setupAnalysis: text('setup_analysis'),
  outcomeAnalysis: text('outcome_analysis'),
  screenshotUrl: text('screenshot_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  date: text('date'), // YYYY-MM-DD
  type: text('type'), // Daily/Weekly/Monthly/Quarterly
  goalsChecklist: json('goals_checklist'),
  marketConditions: text('market_conditions'),
  whatWentWell: text('what_went_well'),
  challengesFaced: text('challenges_faced'),
  lessonsLearned: text('lessons_learned'),
  actionSteps: json('action_steps'),
  rating: integer('rating'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const milestones = pgTable('milestones', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.uid).notNull(),
  type: text('type'), // Trades/Profit/Streak
  targetValue: decimal('target_value'),
  currentValue: decimal('current_value'),
  achievedAt: timestamp('achieved_at'),
  badgeIcon: text('badge_icon'),
  createdAt: timestamp('created_at').defaultNow(),
});
