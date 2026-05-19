import { pgTable, uuid, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roles } from './auth';
import { taskDefinitions } from './task-definition';

export const roleTasks = pgTable('role_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  taskDefinitionId: uuid('task_definition_id').notNull().references(() => taskDefinitions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  roleIdTaskDefinitionIdUniqueIdx: uniqueIndex('role_id_task_definition_id_idx').on(table.roleId, table.taskDefinitionId),
}));

export const roleTasksRelations = relations(roleTasks, ({ one }) => ({
  role: one(roles, {
    fields: [roleTasks.roleId],
    references: [roles.id],
  }),
  taskDefinition: one(taskDefinitions, {
    fields: [roleTasks.taskDefinitionId],
    references: [taskDefinitions.id],
  }),
}));
