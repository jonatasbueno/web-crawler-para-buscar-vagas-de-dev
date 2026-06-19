import { JobRepository } from '../../domain/ports/JobRepository.js';
import { Notifier } from '../../domain/ports/Notifier.js';
import { Clock, systemClock } from '../../domain/ports/Clock.js';
import { latestPendingSlot } from '../../domain/services/Schedule.js';
import { RunPipeline } from './RunPipeline.js';

/**
 * Catch-up no boot: executa **apenas o último slot pendente do dia atual**.
 * Ex.: se 08h e 13h de hoje estão pendentes (e 20h de ontem nunca rodou),
 * roda somente 13h de hoje. O registro do slot ocorre após a consolidação.
 */
export class CatchUp {
  constructor(
    private readonly pipeline: RunPipeline,
    private readonly repo: JobRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock = systemClock
  ) {}

  async execute(): Promise<void> {
    const currentHour = this.clock.currentHourBRT();
    const ranToday = await this.repo.getRanHoursToday();
    const slot = latestPendingSlot(currentHour, ranToday);

    if (slot === null) {
      console.log('[catch-up] Nenhum slot pendente para hoje.');
      return;
    }

    console.log(`[catch-up] Executando o último slot pendente de hoje: ${slot}h.`);
    try {
      await this.pipeline.execute(`catch-up-${slot}h`);
      await this.repo.recordRun(slot, 'success');
      console.log(`[catch-up] Slot ${slot}h concluído.`);
    } catch (error) {
      await this.repo.recordRun(slot, 'error');
      console.error(`[catch-up] Erro no slot ${slot}h:`, error);
      await this.notifier.sendError(`catch-up-${slot}h`, error);
    }
  }
}
