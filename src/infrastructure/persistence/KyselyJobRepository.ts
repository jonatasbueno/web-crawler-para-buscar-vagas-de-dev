import { Kysely } from 'kysely'
import { db } from './connection.js'
import type { Database, NewJobsSent } from './schema.js'
import { Job } from '../../domain/entities/Job.js'
import { JobRepository, RunStatus } from '../../domain/ports/JobRepository.js'

function todayLocalDate (): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

function toNewJobsSent (job: Job): NewJobsSent {
  return {
    link: job.link,
    title: job.title,
    company: job.company ?? null,
    source: job.source ?? null,
    published_at: (job.publishedAt != null) ? job.publishedAt.toISOString() : null
  }
}

export class KyselyJobRepository implements JobRepository {
  constructor (private readonly database: Kysely<Database> = db) {}

  async isJobAlreadySent (link: string): Promise<boolean> {
    const job = await this.database
      .selectFrom('jobs_sent')
      .select('id')
      .where('link', '=', link)
      .executeTakeFirst()

    return job !== undefined
  }

  async markJobsAsSent (jobs: Job[]): Promise<void> {
    if (jobs.length === 0) return

    await this.database
      .insertInto('jobs_sent')
      .values(jobs.map(toNewJobsSent))
      .onConflict((oc) => oc.column('link').doNothing())
      .execute()
  }

  async recordRun (scheduledHour: number, status: RunStatus = 'success'): Promise<void> {
    await this.database
      .insertInto('pipeline_runs')
      .values({
        run_date: todayLocalDate(),
        scheduled_hour: scheduledHour,
        status
      })
      .onConflict((oc) => oc.columns(['run_date', 'scheduled_hour']).doNothing())
      .execute()
  }

  async getRanHoursToday (): Promise<number[]> {
    const rows = await this.database
      .selectFrom('pipeline_runs')
      .select('scheduled_hour')
      .where('run_date', '=', todayLocalDate())
      .where('status', '=', 'success')
      .execute()

    return rows.map((row) => row.scheduled_hour)
  }
}
