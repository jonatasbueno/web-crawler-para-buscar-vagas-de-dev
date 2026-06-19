import { Kysely, sql } from 'kysely'

export async function up (db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('jobs_sent')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('link', 'text', (col) => col.notNull().unique())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('company', 'text')
    .addColumn('sent_at', 'text', (col) =>
      col.defaultTo(sql`(datetime('now'))`).notNull()
    )
    .execute()
}

export async function down (db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('jobs_sent').execute()
}
