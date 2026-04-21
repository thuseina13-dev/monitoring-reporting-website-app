import { pgTable, uuid, varchar, integer, boolean, text, timestamp, pgEnum, index, uniqueIndex, unique } from 'drizzle-orm/pg-core';
import { auditColumns } from './_utils/audit';

export const genderEnum = pgEnum('gender', ['male', 'female']);

export const roleTypeEnum = pgEnum('role_type', ['super_admin', 'admin', 'manager', 'employee']);

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  type: roleTypeEnum('type'),
  description: varchar('description', { length: 255 }),
  ...auditColumns,
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  companyProfileId: uuid('company_profile_id'),
  phoneNo: varchar('phone_no', { length: 25 }).unique(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  address: varchar('address', { length: 255 }),
  gender: genderEnum('gender'),
  photoProfile: varchar('photo_profile', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  ...auditColumns,
}, (table) => ({
  fullNameIdx: index('full_name_idx').on(table.fullName),
  companyProfileIdIdx: index('company_profile_id_idx').on(table.companyProfileId),
}));



export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
  ...auditColumns,
}, (table) => ({
  userIdRoleIdIdx: uniqueIndex('user_id_role_id_idx').on(table.userId, table.roleId),
  unq: unique().on(table.userId, table.roleId),
}));



export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  token: text('token').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  expiredAt: timestamp('expired_at', { withTimezone: true }).notNull(),
  ...auditColumns,
}, (table) => ({
  tokenIdx: index('sessions_token_idx').on(table.token),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  description: text('description').notNull(),
  type: varchar('type', { length: 255 }).notNull(), // Contoh: GET, POST, LOGIN, dll
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
});