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
  "ppt",
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

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  emoji: varchar("emoji", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Sources ──────────────────────────────────────────────────────────────────

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  type: sourceTypeEnum("type").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  rawContent: text("raw_content"), // extracted plain text
  fileUrl: text("file_url"), // R2/S3 URL for file sources
  sourceUrl: text("source_url"), // original URL / YouTube link
  status: sourceStatusEnum("status").notNull().default("processing"),
  metadata: jsonb("metadata"), // page count, duration, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull().default("New Chat"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  sourceCitations: jsonb("source_citations"), // [{ chunkId, sourceId, snippet }]
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Artifacts ────────────────────────────────────────────────────────────────

export const artifacts = pgTable("artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  type: artifactTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: jsonb("content"), // structured data — flashcard array, mindmap nodes, etc.
  fileUrl: text("file_url"), // for audio / ppt — R2 URL
  metadata: jsonb("metadata"), // added back to avoid data loss
  status: artifactStatusEnum("status").notNull().default("generating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
