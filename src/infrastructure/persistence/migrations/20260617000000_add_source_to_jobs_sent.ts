import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('jobs_sent')
    .addColumn('source', 'text')
    .execute();

  await db.schema
    .alterTable('jobs_sent')
    .addColumn('published_at', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('jobs_sent').dropColumn('published_at').execute();
  await db.schema.alterTable('jobs_sent').dropColumn('source').execute();
}
