import { timestamp, uuid } from 'drizzle-orm/pg-core';

// Memutus circular dependency dengan tidak mengimpor 'users' di sini.
// Relasi FK bisa dikelola secara manual atau via Drizzle Relations (optional).
export const auditColumns = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
};