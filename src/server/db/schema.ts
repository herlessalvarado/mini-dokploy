import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const deployments = sqliteTable("deployments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  repoUrl: text("repo_url").notNull(),
  dockerfilePath: text("dockerfile_path").notNull(),
  exposedPort: integer("exposed_port").notNull(),
  imageTag: text("image_tag").notNull(),
  serviceName: text("service_name").notNull(),
  domain: text("domain").notNull(),
  status: text("status", {
    enum: ["building", "running", "failed", "removed"],
  })
    .notNull()
    .default("building"),
  customLabelsJson: text("custom_labels_json"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;