import { Kysely } from 'kysely';
import { db } from './connection.js';
import type { Database, NewJobsSent, NewPipelineRun } from './schema.js';
import { Job } from '../types/index.js';

function todayLocalDate(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

function toNewJobsSent(job: Job): NewJobsSent {
  return {
    link: job.link,
    title: job.title,
    company: job.company ?? null,
  };
}

export class JobsRepository {
  constructor(private readonly database: Kysely<Database> = db) {}

  async isJobAlreadySent(link: string): Promise<boolean> {
    const job = await this.database
      .selectFrom('jobs_sent')
      .select('id')
      .where('link', '=', link)
      .executeTakeFirst();

    return job !== undefined;
  }

  async markJobAsSent(job: Job): Promise<void> {
    await this.database
      .insertInto('jobs_sent')
      .values(toNewJobsSent(job))
      .execute();
  }

  async markJobsAsSent(jobs: Job[]): Promise<void> {
    if (jobs.length === 0) return;

    await this.database
      .insertInto('jobs_sent')
      .values(jobs.map(toNewJobsSent))
      .onConflict((oc) => oc.column('link').doNothing())
      .execute();
  }

  /**
   * Registra que um slot horário do pipeline foi executado com sucesso.
   * @param scheduledHour - O slot agendado: 8, 13 ou 20
   */
  async recordRun(
    scheduledHour: number,
    status: NewPipelineRun['status'] = 'success'
  ): Promise<void> {
    await this.database
      .insertInto('pipeline_runs')
      .values({
        run_date: todayLocalDate(),
        scheduled_hour: scheduledHour,
        status,
      })
      .onConflict((oc) =>
        oc.columns(['run_date', 'scheduled_hour']).doNothing()
      )
      .execute();
  }

  /**
   * Retorna quais slots horários já foram registrados hoje.
   */
  async getRanHoursToday(): Promise<number[]> {
    const rows = await this.database
      .selectFrom('pipeline_runs')
      .select('scheduled_hour')
      .where('run_date', '=', todayLocalDate())
      .where('status', '=', 'success')
      .execute();

    return rows.map((row) => row.scheduled_hour);
  }
}
