import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const sourceTypeEnum = pgEnum("source_type", [
  "pdf",
  "url",
  "youtube",
  "audio",
  "text",
  "document",
  "code",
  "image",
]);

export const sourceStatusEnum = pgEnum("source_status", [
  "processing",
  "ready",
  "failed",
]);

export const artifactTypeEnum = pgEnum("artifact_type", [
  "infographic",
  "audio",
  "mindmap",
  "flashcard",
  "quiz",
  "report",
]);

export const artifactStatusEnum = pgEnum("artifact_status", [
  "generating",
  "ready",
  "failed",
]);

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

// ─── Workspaces ───────────────────────────────────────────────────────────────

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    emoji: varchar("emoji", { length: 10 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("workspaces_user_id_idx").on(table.userId),
    index("workspaces_user_id_updated_at_idx").on(
      table.userId,
      table.updatedAt,
    ),
  ],
);

// ─── Sources ──────────────────────────────────────────────────────────────────

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: sourceTypeEnum("type").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    rawContent: text("raw_content"),
    fileUrl: text("file_url"),
    sourceUrl: text("source_url"),
    status: sourceStatusEnum("status").notNull().default("processing"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("sources_workspace_id_idx").on(table.workspaceId)],
);

// ─── Source Chunks (RAG) ──────────────────────────────────────────────────────

export const sourceChunks = pgTable(
  "source_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    chunkText: text("chunk_text").notNull(),
    chunkIndex: integer("chunk_index").notNull(), // order within source
    embedding: vector("embedding", { dimensions: 1024 }),
    metadata: jsonb("metadata"), // page number, timestamp, etc.
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("source_chunks_source_id_idx").on(table.sourceId),
    index("source_chunks_workspace_id_idx").on(table.workspaceId),
    index("embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

// ─── Chats ────────────────────────────────────────────────────────────────────

export const chats = pgTable(
  "chats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull().default("New Chat"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("chats_workspace_id_idx").on(table.workspaceId)],
);

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    sourceCitations: jsonb("source_citations"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("messages_chat_id_idx").on(table.chatId),
    index("messages_chat_id_created_at_idx").on(table.chatId, table.createdAt),
  ],
);

// ─── Artifacts ────────────────────────────────────────────────────────────────

export const artifacts = pgTable(
  "artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    type: artifactTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: jsonb("content"),
    fileUrl: text("file_url"),
    metadata: jsonb("metadata"),
    status: artifactStatusEnum("status").notNull().default("generating"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("artifacts_workspace_id_idx").on(table.workspaceId)],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  sources: many(sources),
  chats: many(chats),
  artifacts: many(artifacts),
  sourceChunks: many(sourceChunks),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [sources.workspaceId],
    references: [workspaces.id],
  }),
  chunks: many(sourceChunks),
}));

export const sourceChunksRelations = relations(sourceChunks, ({ one }) => ({
  source: one(sources, {
    fields: [sourceChunks.sourceId],
    references: [sources.id],
  }),
  workspace: one(workspaces, {
    fields: [sourceChunks.workspaceId],
    references: [workspaces.id],
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [chats.workspaceId],
    references: [workspaces.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
}));

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [artifacts.workspaceId],
    references: [workspaces.id],
  }),
}));
