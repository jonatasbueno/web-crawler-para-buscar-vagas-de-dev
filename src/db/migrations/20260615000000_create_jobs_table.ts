import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('jobs_sent', (table) => {
    table.increments('id').primary();
    table.string('link').notNullable().unique();
    table.string('title').notNullable();
    table.string('company');
    table.timestamp('sent_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('jobs_sent');
}
