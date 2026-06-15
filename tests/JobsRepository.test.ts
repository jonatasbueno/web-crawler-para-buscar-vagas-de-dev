import { jest } from '@jest/globals';
import { db } from '../src/db/connection.js';
import { JobsRepository } from '../src/db/JobsRepository.js';

describe('JobsRepository', () => {
  let repo: JobsRepository;

  beforeAll(async () => {
    await db.schema.createTable('jobs_sent', (table) => {
      table.increments('id').primary();
      table.string('link').notNullable().unique();
      table.string('title').notNullable();
      table.string('company');
      table.timestamp('sent_at').defaultTo(db.fn.now());
    });
  });

  afterAll(async () => {
    await db.schema.dropTable('jobs_sent');
    await db.destroy();
  });

  beforeEach(async () => {
    await db('jobs_sent').delete();
    repo = new JobsRepository();
  });

  describe('isJobAlreadySent', () => {
    it('should return true if job exists', async () => {
      await db('jobs_sent').insert({ link: 'http://test', title: 'Test' });
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
        seniority: 'Pleno'
      });
      const job = await db('jobs_sent').where('link', 'http://link').first();
      expect(job).toBeDefined();
      expect(job.title).toBe('Frontend');
    });
  });

  describe('markJobsAsSent', () => {
    it('should insert multiple jobs and ignore conflicts', async () => {
      await repo.markJobsAsSent([
        { title: 'Frontend 1', link: 'http://link1', model: 'Home Office', seniority: 'Pleno' },
        { title: 'Frontend 2', link: 'http://link2', model: 'Home Office', seniority: 'Pleno' }
      ]);
      const count = await db('jobs_sent').count('* as c').first();
      expect((count as any).c).toBe(2);

      // Should ignore conflict
      await repo.markJobsAsSent([
        { title: 'Frontend 1', link: 'http://link1', model: 'Home Office', seniority: 'Pleno' },
        { title: 'Frontend 3', link: 'http://link3', model: 'Home Office', seniority: 'Pleno' }
      ]);
      const count2 = await db('jobs_sent').count('* as c').first();
      expect((count2 as any).c).toBe(3);
    });

    it('should do nothing if array is empty', async () => {
      await repo.markJobsAsSent([]);
      const count = await db('jobs_sent').count('* as c').first();
      expect((count as any).c).toBe(0);
    });
  });
});
