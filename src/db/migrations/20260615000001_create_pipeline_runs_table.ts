import { Knex } from 'knex';

/**
 * Registra cada execução agendada do pipeline no dia.
 * Usado pelo --catch-up para saber quais slots (08h, 13h, 20h) ainda não rodaram.
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('pipeline_runs', (table) => {
    table.increments('id').primary();
    table.string('run_date').notNullable();   // YYYY-MM-DD
    table.integer('scheduled_hour').notNullable(); // 8 | 13 | 20
    table.string('status').notNullable().defaultTo('success'); // 'success' | 'error'
    table.timestamp('ran_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('pipeline_runs');
}
