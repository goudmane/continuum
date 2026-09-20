import { sqliteTable,text,integer } from 'drizzle-orm/sqlite-core';
// A versioned personal aggregate keeps task, notebook, and session changes atomic.
export const workspaces=sqliteTable('workspaces',{userId:text('user_id').primaryKey(),revision:integer('revision').notNull().default(0),payload:text('payload').notNull(),updatedAt:text('updated_at').notNull()});
