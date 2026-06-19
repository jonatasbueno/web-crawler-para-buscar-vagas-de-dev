import { SourceScraper } from '../../domain/ports/SourceScraper.js';
import { Job } from '../../domain/entities/Job.js';
import { parseSeniority, parseWorkModel } from './support/parsing.js';
import { renderAndExtract } from './support/spaSupport.js';

const BASE = 'https://hipsters.jobs';

/**
 * Hipsters.jobs é uma SPA de vagas de tecnologia. Adaptador best-effort via
 * Playwright (o board é renderizado client-side).
 */
export class HipstersScraper implements SourceScraper {
  readonly name: string = 'Hipsters.Jobs';

  constructor(private readonly listUrl: string = `${BASE}/jobs`) {}

  async scrape(): Promise<Job[]> {
    return renderAndExtract(
      this.name,
      this.listUrl,
      ($) => {
        const jobs: Job[] = [];
        $('a[href*="/job/"], a[href*="/vaga"]').each((_, el) => {
          const anchor = $(el);
          const href = anchor.attr('href') ?? '';
          const title = anchor.find('h2, h3, [class*="title"]').first().text().trim() ||
            anchor.text().trim();
          if (!href || !title) return;

          const context = anchor.text().toLowerCase();
          const model = parseWorkModel(context);
          jobs.push({
            title,
            link: href.startsWith('http') ? href : `${BASE}${href}`,
            model,
            city: model === 'Híbrido' ? context : undefined,
            seniority: parseSeniority(title),
            source: this.name,
          });
        });
        return jobs;
      },
      { scrollRounds: 4, waitForSelector: 'a[href*="/job"]' }
    );
  }
}

/**
 * Remotar cura vagas 100% remotas e publica seu board através do Hipsters.jobs.
 * Reutiliza o extractor do Hipsters apontando para a página da empresa Remotar.
 */
export class RemotarScraper extends HipstersScraper {
  readonly name = 'Remotar';

  constructor() {
    super(`${BASE}/company/3669/remotar-jobs`);
  }
}
