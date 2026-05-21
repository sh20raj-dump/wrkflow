import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@/lib/utils';
import { workflows } from './workflows';
import { users } from './users';

export const comments: any = sqliteTable('comments', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    content: text('content').notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    workflowId: text('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
    parentId: text('parent_id').references(() => comments.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
        .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .$defaultFn(() => new Date()),
});