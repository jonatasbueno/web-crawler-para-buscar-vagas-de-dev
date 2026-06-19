import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Database as DbSchema } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDbPath = path.resolve(__dirname, '../../../db.sqlite');

export function createDb(databasePath: string = defaultDbPath): Kysely<DbSchema> {
  return new Kysely<DbSchema>({
    dialect: new SqliteDialect({
      database: new Database(databasePath),
    }),
  });
}

export const db = createDb();
