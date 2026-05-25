import { pgTable, uuid, varchar, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { auditColumns } from './_utils/audit';

export const taskDefinitions = pgTable('task_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  procedures: jsonb('procedures'),
  formSchema: jsonb('form_schema').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isMandatory: boolean('is_mandatory').default(false).notNull(),
  ...auditColumns,
}, (table) => ({
  nameIdx: index('task_definitions_name_idx').on(table.name),
}));

import { roleTasks } from './role-task';

export const taskDefinitionsRelations = relations(taskDefinitions, ({ many }) => ({
  roleTasks: many(roleTasks),
}));
