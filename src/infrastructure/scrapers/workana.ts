import { SourceScraper } from '../../domain/ports/SourceScraper.js';
import { Job } from '../../domain/entities/Job.js';
import { cleanTitle, parseSeniority } from './support/parsing.js';
import { renderAndExtract } from './support/spaSupport.js';

const BASE = 'https://www.workana.com';

/**
 * Workana lista projetos freelancer de TI renderizados client-side.
 * Adaptador best-effort via Playwright. Projetos são sempre remotos (freelance),
 * então o modelo é tratado como Home Office.
 */
export class WorkanaScraper implements SourceScraper {
  readonly name = 'Workana';

  async scrape(): Promise<Job[]> {
    return renderAndExtract(
      this.name,
      `${BASE}/jobs?category=it-programming&language=pt`,
      ($) => {
        const jobs: Job[] = [];
        $('.project-item').each((_, el) => {
          const item = $(el);
          const anchor = item.find('h2 a, .project-title a').first();
          const title = cleanTitle(anchor.text());
          const href = anchor.attr('href');
          if (!title || !href) return;

          const budget = item.find('.budget, .values').text().trim();
          jobs.push({
            title,
            link: href.startsWith('http') ? href : `${BASE}${href}`,
            model: 'Home Office',
            seniority: parseSeniority(title),
            salary: budget || undefined,
            source: this.name,
          });
        });
        return jobs;
      },
      { scrollRounds: 3, waitForSelector: '.project-item' }
    );
  }
}
