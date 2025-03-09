import { pgTable, varchar } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: varchar("id").notNull(),
  title: varchar("title").notNull(),
  ownerId: varchar("owner_id").notNull(),
  progressStatus: varchar("progress_status").notNull(),
});

// チームテーブル
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull().unique(),
});

// チームメンバーテーブル
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().notNull(),
  teamId: varchar("team_id")
    .notNull()
    .references(() => teams.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull().unique(),
  status: varchar("status").notNull(),
});
