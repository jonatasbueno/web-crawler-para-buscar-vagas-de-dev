import { Kysely } from 'kysely';
import { createDb } from '../src/infrastructure/persistence/connection.js';
import { KyselyJobRepository } from '../src/infrastructure/persistence/KyselyJobRepository.js';
import type { Database } from '../src/infrastructure/persistence/schema.js';
import { up as createJobsTable } from '../src/infrastructure/persistence/migrations/20260615000000_create_jobs_table.js';
import { up as createPipelineRunsTable } from '../src/infrastructure/persistence/migrations/20260615000001_create_pipeline_runs_table.js';
import { up as addSource } from '../src/infrastructure/persistence/migrations/20260617000000_add_source_to_jobs_sent.js';
import { Job } from '../src/domain/entities/Job.js';

function job(link: string, extra: Partial<Job> = {}): Job {
  return { title: 'Dev', model: 'Home Office', seniority: 'Pleno', link, ...extra };
}

describe('KyselyJobRepository', () => {
  let db: Kysely<Database>;
  let repo: KyselyJobRepository;

  beforeAll(async () => {
    db = createDb(':memory:');
    await createJobsTable(db);
    await createPipelineRunsTable(db);
    await addSource(db);
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    await db.deleteFrom('jobs_sent').execute();
    await db.deleteFrom('pipeline_runs').execute();
    repo = new KyselyJobRepository(db);
  });

  it('isJobAlreadySent reflete o estado do banco', async () => {
    expect(await repo.isJobAlreadySent('http://x')).toBe(false);
    await repo.markJobsAsSent([job('http://x')]);
    expect(await repo.isJobAlreadySent('http://x')).toBe(true);
  });

  it('markJobsAsSent persiste source e published_at e ignora conflitos', async () => {
    await repo.markJobsAsSent([
      job('http://a', { source: 'GitHub', publishedAt: new Date('2026-06-10T00:00:00Z') }),
      job('http://b'),
    ]);
    await repo.markJobsAsSent([job('http://a'), job('http://c')]);

    const rows = await db.selectFrom('jobs_sent').selectAll().execute();
    expect(rows).toHaveLength(3);
    const a = rows.find((r) => r.link === 'http://a')!;
    expect(a.source).toBe('GitHub');
    expect(a.published_at).toBe('2026-06-10T00:00:00.000Z');
  });

  it('markJobsAsSent não faz nada com lista vazia', async () => {
    await repo.markJobsAsSent([]);
    const rows = await db.selectFrom('jobs_sent').selectAll().execute();
    expect(rows).toHaveLength(0);
  });

  it('recordRun registra e ignora duplicata do mesmo dia/slot', async () => {
    await repo.recordRun(8);
    await repo.recordRun(8);
    const rows = await db.selectFrom('pipeline_runs').selectAll().where('scheduled_hour', '=', 8).execute();
    expect(rows).toHaveLength(1);
  });

  it('getRanHoursToday retorna apenas execuções de sucesso de hoje', async () => {
    await repo.recordRun(8, 'success');
    await repo.recordRun(13, 'error');
    await repo.recordRun(20, 'success');
    const hours = await repo.getRanHoursToday();
    expect(hours.sort((a, b) => a - b)).toEqual([8, 20]);
  });
});
