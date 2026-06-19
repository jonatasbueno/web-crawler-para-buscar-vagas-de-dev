import { Job } from '../../domain/entities/Job.js';
import { SourceScraper } from '../../domain/ports/SourceScraper.js';
import { JobRepository } from '../../domain/ports/JobRepository.js';
import { Notifier } from '../../domain/ports/Notifier.js';
import { Clock, systemClock } from '../../domain/ports/Clock.js';
import { filterEligibleJobs } from '../../domain/services/JobEligibility.js';
import { sortJobsByRecency } from '../../domain/services/JobOrdering.js';

export interface PipelineResult {
  scraped: number;
  consolidated: number;
  eligible: number;
  fresh: number;
}

/** Remove duplicatas dentro do lote desta execução, usando o link como chave. */
function consolidate(jobs: Job[]): Job[] {
  const byLink = new Map<string, Job>();
  for (const job of jobs) {
    if (job.link && !byLink.has(job.link)) byLink.set(job.link, job);
  }
  return [...byLink.values()];
}

/**
 * Caso de uso central: coleta de todas as fontes → consolida → filtra (stack,
 * modalidade, recência) → deduplica contra o histórico → ordena por recência →
 * notifica → persiste. Falhas por fonte são isoladas e notificadas, sem
 * interromper as demais.
 */
export class RunPipeline {
  constructor(
    private readonly scrapers: SourceScraper[],
    private readonly repo: JobRepository,
    private readonly notifier: Notifier,
    private readonly clock: Clock = systemClock
  ) {}

  async execute(label: string): Promise<PipelineResult> {
    console.log(`[${label}] Iniciando pipeline de vagas...`);

    const allJobs: Job[] = [];
    for (const scraper of this.scrapers) {
      try {
        console.log(`[${label}] Rodando fonte: ${scraper.name}`);
        const jobs = await scraper.scrape();
        console.log(`[${label}] ${scraper.name}: ${jobs.length} vaga(s).`);
        allJobs.push(...jobs);
      } catch (error) {
        const context = `[${label}] Fonte ${scraper.name}`;
        console.error(context, error);
        await this.notifier.sendError(context, error);
      }
    }

    const consolidated = consolidate(allJobs);
    console.log(
      `[${label}] Raspadas: ${allJobs.length} | Consolidadas: ${consolidated.length}`
    );

    const eligible = filterEligibleJobs(consolidated, this.clock.now());
    console.log(`[${label}] Após filtros (stack/modalidade/recência ≤15d): ${eligible.length}`);

    const fresh: Job[] = [];
    for (const job of eligible) {
      if (!(await this.repo.isJobAlreadySent(job.link))) fresh.push(job);
    }
    console.log(`[${label}] Novas após deduplicação: ${fresh.length}`);

    const sorted = sortJobsByRecency(fresh);

    if (sorted.length > 0) {
      await this.notifier.sendJobs(sorted);
      await this.repo.markJobsAsSent(sorted);
      console.log(`[${label}] ${sorted.length} vaga(s) notificada(s) e persistida(s).`);
    } else {
      await this.notifier.sendEmpty();
      console.log(`[${label}] Nenhuma vaga nova — aviso de lista vazia enviado.`);
    }

    return {
      scraped: allJobs.length,
      consolidated: consolidated.length,
      eligible: eligible.length,
      fresh: sorted.length,
    };
  }
}
