import { Kysely, sql } from 'kysely'

export async function up (db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('pipeline_runs')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('run_date', 'text', (col) => col.notNull())
    .addColumn('scheduled_hour', 'integer', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('success'))
    .addColumn('ran_at', 'text', (col) =>
      col.defaultTo(sql`(datetime('now'))`).notNull()
    )
    .execute()

  await db.schema
    .createIndex('pipeline_runs_run_date_scheduled_hour_unique')
    .on('pipeline_runs')
    .columns(['run_date', 'scheduled_hour'])
    .unique()
    .execute()
}

export async function down (db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pipeline_runs').execute()
}
