import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

export const notificationTypeEnum = pgEnum('notification_type', ['info', 'urgent', 'normal']);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: notificationTypeEnum('type').notNull().default('info'),
  isRead: boolean('is_read').notNull().default(false),
  referenceId: uuid('reference_id'),
  referenceType: varchar('reference_type', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  referenceTypeIdx: index('notifications_reference_type_idx').on(table.referenceType),
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
}));

// ── RELATIONS ────────────────────────────────────────────────
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
