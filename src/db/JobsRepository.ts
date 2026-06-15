import { db } from './connection.js';
import { Job } from '../types/index.js';

function todayLocalDate(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

export class JobsRepository {
  async isJobAlreadySent(link: string): Promise<boolean> {
    const job = await db('jobs_sent').where('link', link).first();
    return !!job;
  }

  async markJobAsSent(job: Job): Promise<void> {
    await db('jobs_sent').insert({
      link: job.link,
      title: job.title,
      company: job.company || null,
      sent_at: new Date().toISOString()
    });
  }

  async markJobsAsSent(jobs: Job[]): Promise<void> {
    if (jobs.length === 0) return;
    const items = jobs.map(j => ({
      link: j.link,
      title: j.title,
      company: j.company || null,
      sent_at: new Date().toISOString()
    }));
    await db('jobs_sent').insert(items).onConflict('link').ignore();
  }

  /**
   * Registra que um slot horário do pipeline foi executado com sucesso.
   * @param scheduledHour - O slot agendado: 8, 13 ou 20
   */
  async recordRun(scheduledHour: number, status: 'success' | 'error' = 'success'): Promise<void> {
    await db('pipeline_runs').insert({
      run_date: todayLocalDate(),
      scheduled_hour: scheduledHour,
      status,
      ran_at: new Date().toISOString(),
    }).onConflict(['run_date', 'scheduled_hour']).ignore();
  }

  /**
   * Retorna quais slots horários já foram registrados hoje.
   */
  async getRanHoursToday(): Promise<number[]> {
    const rows = await db('pipeline_runs')
      .where('run_date', todayLocalDate())
      .where('status', 'success')
      .select('scheduled_hour');
    return rows.map((r: { scheduled_hour: number }) => r.scheduled_hour);
  }
}
