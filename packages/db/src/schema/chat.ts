import { relations } from "drizzle-orm";
import {
  pgTable, text, timestamp, boolean, integer, uuid, pgEnum, jsonb,
  index, uniqueIndex, primaryKey, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

// ── Enums ──────────────────────────────────────────────────────────────

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "friend_request",
  "friend_accepted",
  "group_invite",
]);

export const groupTypeEnum = pgEnum("group_type", ["public", "private"]);

export const groupRoleEnum = pgEnum("group_role", ["host", "admin", "member"]);

// ── Friendship ─────────────────────────────────────────────────────────

export const friendship = pgTable(
  "friendship",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: friendshipStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("friendship_requesterId_idx").on(table.requesterId),
    index("friendship_addresseeId_idx").on(table.addresseeId),
    uniqueIndex("friendship_requester_addressee_idx").on(
      table.requesterId,
      table.addresseeId,
    ),
  ],
);

export const friendshipRelations = relations(friendship, ({ one, many }) => ({
  requester: one(user, {
    fields: [friendship.requesterId],
    references: [user.id],
    relationName: "friendshipRequester",
  }),
  addressee: one(user, {
    fields: [friendship.addresseeId],
    references: [user.id],
    relationName: "friendshipAddressee",
  }),
  messages: many(message),
}));

// ── Notification ───────────────────────────────────────────────────────

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    data: jsonb("data"),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("notification_userId_read_idx").on(table.userId, table.read)],
);

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));

// ── Group ──────────────────────────────────────────────────────────────

export const group = pgTable(
  "group",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: groupTypeEnum("type").notNull().default("public"),
    inviteCode: text("invite_code"),
    hostId: text("host_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    maxMembers: integer("max_members").default(50).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("group_hostId_idx").on(table.hostId),
    uniqueIndex("group_inviteCode_idx").on(table.inviteCode),
  ],
);

export const groupRelations = relations(group, ({ one, many }) => ({
  host: one(user, {
    fields: [group.hostId],
    references: [user.id],
  }),
  members: many(groupMember),
  messages: many(message),
}));

// ── Group Member ───────────────────────────────────────────────────────

export const groupMember = pgTable(
  "group_member",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: groupRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })],
);

export const groupMemberRelations = relations(groupMember, ({ one }) => ({
  group: one(group, {
    fields: [groupMember.groupId],
    references: [group.id],
  }),
  user: one(user, {
    fields: [groupMember.userId],
    references: [user.id],
  }),
}));

// ── Message ────────────────────────────────────────────────────────────

export const message = pgTable(
  "message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").references(() => group.id, { onDelete: "cascade" }),
    friendshipId: uuid("friendship_id").references(() => friendship.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("message_groupId_createdAt_idx").on(table.groupId, table.createdAt),
    index("message_friendshipId_createdAt_idx").on(
      table.friendshipId,
      table.createdAt,
    ),
    check(
      "message_target_check",
      sql`(group_id IS NOT NULL AND friendship_id IS NULL) OR (group_id IS NULL AND friendship_id IS NOT NULL)`,
    ),
  ],
);

export const messageRelations = relations(message, ({ one }) => ({
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
  group: one(group, {
    fields: [message.groupId],
    references: [group.id],
  }),
  friendship: one(friendship, {
    fields: [message.friendshipId],
    references: [friendship.id],
  }),
}));
