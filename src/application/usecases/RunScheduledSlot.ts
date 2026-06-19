import { JobRepository } from '../../domain/ports/JobRepository.js';
import { RunPipeline } from './RunPipeline.js';

/**
 * Executa um slot agendado. O registro do slot (`recordRun`) ocorre **somente
 * após** o pipeline completar — isto é, após a consolidação das vagas — para que
 * o slot só conste como executado quando a raspagem de fato aconteceu.
 */
export class RunScheduledSlot {
  constructor(
    private readonly pipeline: RunPipeline,
    private readonly repo: JobRepository
  ) {}

  async execute(scheduledHour: number): Promise<void> {
    const label = `cron-${scheduledHour}h`;
    try {
      await this.pipeline.execute(label);
      await this.repo.recordRun(scheduledHour, 'success');
    } catch (error) {
      await this.repo.recordRun(scheduledHour, 'error');
      throw error;
    }
  }
}
