import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/db.sqlite";

const sqlitePath = databaseUrl.replace("file:", "");

const sqlite = new Database(sqlitePath);

export const db = drizzle(sqlite, { schema });