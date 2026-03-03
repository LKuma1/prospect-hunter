import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const sqlite = new Database(process.env.DATABASE_URL ?? 'prospect-hunter.db');
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = normal');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
