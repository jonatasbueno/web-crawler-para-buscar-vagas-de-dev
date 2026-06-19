import dotenv from 'dotenv';
dotenv.config();

import { systemClock } from '../../domain/ports/Clock.js';
import { isScheduledHour, SCHEDULED_HOURS } from '../../domain/services/Schedule.js';
import { RunPipeline } from '../../application/usecases/RunPipeline.js';
import { RunScheduledSlot } from '../../application/usecases/RunScheduledSlot.js';
import { CatchUp } from '../../application/usecases/CatchUp.js';
import { RunOnce } from '../../application/usecases/RunOnce.js';
import { db } from '../../infrastructure/persistence/connection.js';
import { KyselyJobRepository } from '../../infrastructure/persistence/KyselyJobRepository.js';
import { SlackNotifier } from '../../infrastructure/notifier/SlackNotifier.js';
import { createAllScrapers } from '../../infrastructure/scrapers/registry.js';

/**
 * Composition root: instancia os adaptadores concretos (infra) e injeta nos
 * casos de uso (application). É a única camada que conhece todas as outras.
 */
function buildPipeline(): { pipeline: RunPipeline; repo: KyselyJobRepository; notifier: SlackNotifier } {
  const repo = new KyselyJobRepository();
  const notifier = new SlackNotifier(process.env.SLACK_WEBHOOK_URL || '');
  const scrapers = createAllScrapers();
  const pipeline = new RunPipeline(scrapers, repo, notifier, systemClock);
  return { pipeline, repo, notifier };
}

/**
 * Ponto de entrada da CLI.
 *   --scheduled-hour 8   → slot agendado (cron)
 *   --catch-up           → executa só o último slot pendente de hoje
 *   --once-loose         → execução avulsa (avisa quando vazio)
 */
async function cli(): Promise<void> {
  const argv = process.argv;
  const { pipeline, repo, notifier } = buildPipeline();

  if (argv.includes('--once-loose')) {
    await new RunOnce(pipeline).execute();
    return;
  }

  if (argv.includes('--catch-up')) {
    await new CatchUp(pipeline, repo, notifier, systemClock).execute();
    return;
  }

  const hourFlagIdx = argv.indexOf('--scheduled-hour');
  if (hourFlagIdx !== -1) {
    const hour = parseInt(argv[hourFlagIdx + 1], 10);
    if (!isScheduledHour(hour)) {
      console.error(`Hora inválida: ${hour}. Use um dos slots: ${SCHEDULED_HOURS.join(', ')}`);
      process.exit(1);
    }
    await new RunScheduledSlot(pipeline, repo).execute(hour);
    return;
  }

  console.error('Nenhuma flag válida. Use --scheduled-hour <h>, --catch-up ou --once-loose.');
  process.exit(1);
}

async function bootstrap(): Promise<void> {
  try {
    await cli();
  } catch (error) {
    console.error('Falha fatal:', error);
    const notifier = new SlackNotifier(process.env.SLACK_WEBHOOK_URL || '');
    await notifier.sendError('Falha fatal', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
