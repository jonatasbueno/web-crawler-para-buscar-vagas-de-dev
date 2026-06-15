import dotenv from 'dotenv';
dotenv.config();

import {
  LinkedinScraper,
  GupyScraper,
  ProgramaThorScraper,
  GeekHunterScraper,
  ReveloScraper,
  VagasComScraper,
  Scraper
} from './scrapers/index.js';
import { filterJobs } from './filters/jobFilter.js';
import { sortJobsBySeniority } from './sorters/jobSorter.js';
import { JobsRepository } from './db/JobsRepository.js';
import { SlackNotifier } from './notifier/slackNotifier.js';
import { Job } from './types/index.js';
import { db } from './db/connection.js';

/** Slots horários agendados (hora local, BRT). */
export const SCHEDULED_HOURS = [8, 13, 20] as const;

interface PipelineOptions {
  /** Envia mensagem no Slack quando não houver vagas novas. Padrão: true. */
  notifyWhenEmpty?: boolean;
}

function createNotifier(): SlackNotifier {
  return new SlackNotifier(process.env.SLACK_WEBHOOK_URL || '');
}

async function runPipeline(label: string, options: PipelineOptions = {}): Promise<void> {
  const { notifyWhenEmpty = true } = options;

  const scrapers: Scraper[] = [
    new LinkedinScraper(),
    new GupyScraper(),
    new ProgramaThorScraper(),
    new GeekHunterScraper(),
    new ReveloScraper(),
    new VagasComScraper()
  ];

  const repo = new JobsRepository();
  const notifier = createNotifier();

  console.log(`[${label}] Iniciando pipeline de vagas...`);

  let allJobs: Job[] = [];

  for (const scraper of scrapers) {
    const scraperName = scraper.constructor.name;
    console.log(`[${label}] Rodando scraper: ${scraperName}`);
    try {
      const jobs = await scraper.scrape();
      allJobs = allJobs.concat(jobs);
    } catch (error) {
      const context = `[${label}] Scraper ${scraperName}`;
      console.error(context, error);
      await notifier.sendError(context, error);
    }
  }

  console.log(`[${label}] Total de vagas raspadas: ${allJobs.length}`);

  const filteredJobs = filterJobs(allJobs);
  console.log(`[${label}] Total após filtros: ${filteredJobs.length}`);

  const newJobs: Job[] = [];
  for (const job of filteredJobs) {
    const isSent = await repo.isJobAlreadySent(job.link);
    if (!isSent) newJobs.push(job);
  }

  console.log(`[${label}] Total após deduplicação: ${newJobs.length}`);

  const sortedJobs = sortJobsBySeniority(newJobs);

  await notifier.sendJobs(sortedJobs, { notifyWhenEmpty });

  if (sortedJobs.length > 0) {
    await repo.markJobsAsSent(sortedJobs);
    console.log(`[${label}] Vagas salvas no banco de dados.`);
  }

  console.log(`[${label}] Pipeline finalizado com sucesso.`);
}

/**
 * Executa o pipeline e registra a run no banco.
 * @param scheduledHour - O slot horário agendado (8, 13 ou 20)
 */
export async function main(scheduledHour: number): Promise<void> {
  const repo = new JobsRepository();
  const label = `cron-${scheduledHour}h`;
  try {
    await runPipeline(label);
    await repo.recordRun(scheduledHour, 'success');
  } catch (error) {
    await repo.recordRun(scheduledHour, 'error');
    throw error;
  }
}

/**
 * Catch-up no boot: verifica quais slots horários já passaram mas não foram executados hoje
 * e roda o pipeline para cada um deles.
 */
export async function catchUp(): Promise<void> {
  const repo = new JobsRepository();
  const notifier = createNotifier();
  const nowHour = new Date().toLocaleString('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    hour12: false
  });
  const currentHour = parseInt(nowHour, 10);

  const ranHours = await repo.getRanHoursToday();
  const pendingSlots = SCHEDULED_HOURS.filter(
    (h) => h <= currentHour && !ranHours.includes(h)
  );

  if (pendingSlots.length === 0) {
    console.log('[catch-up] Todos os slots previstos para agora já foram executados hoje.');
    return;
  }

  console.log(`[catch-up] Slots pendentes: ${pendingSlots.join(', ')}h. Executando...`);

  for (const slot of pendingSlots) {
    try {
      await runPipeline(`catch-up-${slot}h`);
      await repo.recordRun(slot, 'success');
      console.log(`[catch-up] Slot ${slot}h concluído.`);
    } catch (error) {
      await repo.recordRun(slot, 'error');
      console.error(`[catch-up] Erro no slot ${slot}h:`, error);
      await notifier.sendError(`catch-up-${slot}h`, error);
    }
  }
}

/**
 * Execução avulsa: pipeline completo, envia vagas ao Slack e não notifica quando vazio.
 */
export async function runOnceLoose(): Promise<void> {
  await runPipeline('once-loose', { notifyWhenEmpty: false });
}

/**
 * Ponto de entrada da CLI.
 * Uso:
 *   --scheduled-hour 8   → slot das 8h (cron)
 *   --catch-up           → catch-up no boot (cron)
 *   --once-loose         → execução avulsa sem aviso de lista vazia
 */
async function cli(): Promise<void> {
  const argv = process.argv;

  if (argv.includes('--once-loose')) {
    await runOnceLoose();
    return;
  }

  if (argv.includes('--catch-up')) {
    await catchUp();
    return;
  }

  const hourFlagIdx = argv.indexOf('--scheduled-hour');
  if (hourFlagIdx !== -1) {
    const hour = parseInt(argv[hourFlagIdx + 1], 10);
    if (!SCHEDULED_HOURS.includes(hour as typeof SCHEDULED_HOURS[number])) {
      console.error(`Hora inválida: ${hour}. Use um dos slots: ${SCHEDULED_HOURS.join(', ')}`);
      process.exit(1);
    }
    await main(hour);
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
    const notifier = createNotifier();
    await notifier.sendError('Falha fatal', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
