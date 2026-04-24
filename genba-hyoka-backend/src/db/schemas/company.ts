import { pgTable, uuid, varchar, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { auditColumns } from './_utils/audit';
import { users } from './auth';

export const companyProfiles = pgTable('company_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  desc: text('desc'),
  address: text('address'),
  logo: varchar('logo', { length: 255 }),
  phoneNo: varchar('phone_no', { length: 25 }),
  email: varchar('email', { length: 255 }),
  ...auditColumns,
});

// ── RELATIONS ────────────────────────────────────────────────
export const companyProfilesRelations = relations(companyProfiles, ({ many }) => ({
  users: many(users),
}));
