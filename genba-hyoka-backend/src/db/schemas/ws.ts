import { pgTable, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';

export const wsTickets = pgTable('ws_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => ({
  expiresAtIdx: index('ws_tickets_expires_at_idx').on(table.expiresAt),
}));

export const wsTicketsRelations = relations(wsTickets, ({ one }) => ({
  user: one(users, {
    fields: [wsTickets.userId],
    references: [users.id],
  }),
}));
