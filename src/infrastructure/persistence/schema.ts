import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export type PipelineRunStatus = 'success' | 'error';

export interface JobsSentTable {
  id: Generated<number>;
  link: string;
  title: string;
  company: string | null;
  source: string | null;
  published_at: string | null;
  sent_at: Generated<string>;
}

export interface PipelineRunsTable {
  id: Generated<number>;
  run_date: string;
  scheduled_hour: number;
  status: PipelineRunStatus;
  ran_at: Generated<string>;
}

export interface Database {
  jobs_sent: JobsSentTable;
  pipeline_runs: PipelineRunsTable;
}

export type JobsSent = Selectable<JobsSentTable>;
export type NewJobsSent = Insertable<JobsSentTable>;
export type JobsSentUpdate = Updateable<JobsSentTable>;

export type PipelineRun = Selectable<PipelineRunsTable>;
export type NewPipelineRun = Insertable<PipelineRunsTable>;
export type PipelineRunUpdate = Updateable<PipelineRunsTable>;
