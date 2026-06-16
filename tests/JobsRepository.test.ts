import { jest } from '@jest/globals';
import { Kysely } from 'kysely';
import { createDb } from '../src/db/connection.js';
import { JobsRepository } from '../src/db/JobsRepository.js';
import type { Database } from '../src/db/schema.js';
import { up as createJobsTable } from '../src/db/migrations/20260615000000_create_jobs_table.js';
import { up as createPipelineRunsTable } from '../src/db/migrations/20260615000001_create_pipeline_runs_table.js';

describe('JobsRepository', () => {
  let testDb: Kysely<Database>;
  let repo: JobsRepository;

  beforeAll(async () => {
    testDb = createDb(':memory:');
    await createJobsTable(testDb);
    await createPipelineRunsTable(testDb);
  });

  afterAll(async () => {
    await testDb.destroy();
  });

  beforeEach(async () => {
    await testDb.deleteFrom('jobs_sent').execute();
    await testDb.deleteFrom('pipeline_runs').execute();
    repo = new JobsRepository(testDb);
  });

  describe('isJobAlreadySent', () => {
    it('should return true if job exists', async () => {
      await testDb
        .insertInto('jobs_sent')
        .values({ link: 'http://test', title: 'Test' })
        .execute();

      const result = await repo.isJobAlreadySent('http://test');
      expect(result).toBe(true);
    });

    it('should return false if job does not exist', async () => {
      const result = await repo.isJobAlreadySent('http://test2');
      expect(result).toBe(false);
    });
  });

  describe('markJobAsSent', () => {
    it('should insert a single job', async () => {
      await repo.markJobAsSent({
        title: 'Frontend',
        link: 'http://link',
        model: 'Home Office',
        seniority: 'Pleno',
      });

      const job = await testDb
        .selectFrom('jobs_sent')
        .selectAll()
        .where('link', '=', 'http://link')
        .executeTakeFirst();

      expect(job).toBeDefined();
      expect(job?.title).toBe('Frontend');
    });
  });

  describe('markJobsAsSent', () => {
    it('should insert multiple jobs and ignore conflicts', async () => {
      await repo.markJobsAsSent([
        { title: 'Frontend 1', link: 'http://link1', model: 'Home Office', seniority: 'Pleno' },
        { title: 'Frontend 2', link: 'http://link2', model: 'Home Office', seniority: 'Pleno' },
      ]);

      const count = await testDb
        .selectFrom('jobs_sent')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirstOrThrow();
      expect(count.count).toBe(2);

      await repo.markJobsAsSent([
        { title: 'Frontend 1', link: 'http://link1', model: 'Home Office', seniority: 'Pleno' },
        { title: 'Frontend 3', link: 'http://link3', model: 'Home Office', seniority: 'Pleno' },
      ]);

      const count2 = await testDb
        .selectFrom('jobs_sent')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirstOrThrow();
      expect(count2.count).toBe(3);
    });

    it('should do nothing if array is empty', async () => {
      await repo.markJobsAsSent([]);

      const count = await testDb
        .selectFrom('jobs_sent')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirstOrThrow();
      expect(count.count).toBe(0);
    });
  });

  describe('recordRun', () => {
    it('should insert a pipeline run', async () => {
      await repo.recordRun(8);

      const run = await testDb
        .selectFrom('pipeline_runs')
        .selectAll()
        .where('scheduled_hour', '=', 8)
        .executeTakeFirst();

      expect(run).toBeDefined();
      expect(run?.status).toBe('success');
    });

    it('should ignore duplicate run for same date and hour', async () => {
      await repo.recordRun(13);
      await repo.recordRun(13);

      const count = await testDb
        .selectFrom('pipeline_runs')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('scheduled_hour', '=', 13)
        .executeTakeFirstOrThrow();

      expect(count.count).toBe(1);
    });
  });

  describe('getRanHoursToday', () => {
    it('should return successful runs for today', async () => {
      await repo.recordRun(8);
      await repo.recordRun(13, 'error');
      await repo.recordRun(20);

      const hours = await repo.getRanHoursToday();
      expect(hours).toEqual([8, 20]);
    });
  });
});
