import { SourceScraper } from '../../domain/ports/SourceScraper.js';
import { Job } from '../../domain/entities/Job.js';
import { parseSeniority, parseWorkModel } from './support/parsing.js';
import { scrapePaginatedHtml } from './support/htmlPagination.js';
import { HttpClient } from '../http/HttpClient.js';

const PAGE_SIZE = 25;

/**
 * Busca pública de vagas do LinkedIn (endpoint "guest" que retorna fragmentos
 * HTML paginados por `start`). Scraping autenticado real exige sessão complexa.
 */
export class LinkedinScraper implements SourceScraper {
  readonly name = 'LinkedIn';

  constructor(private readonly http: HttpClient = new HttpClient()) {}

  async scrape(): Promise<Job[]> {
    return scrapePaginatedHtml(
      this.http,
      (page) =>
        'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search' +
        `?keywords=React%20Native%20OR%20Frontend&location=Brasil&f_TPR=r1296000&start=${page * PAGE_SIZE}`,
      ($) => {
        const jobs: Job[] = [];
        $('li').each((_, element) => {
          const el = $(element);
          const title = el.find('.base-search-card__title').text().trim();
          const link = el.find('.base-card__full-link').attr('href') || '';
          if (!title || !link) return;

          const company = el.find('.base-search-card__subtitle').text().trim();
          const locationText = el.find('.job-search-card__location').text().trim();
          const dateAttr = el.find('time').attr('datetime');

          let model = parseWorkModel(`${title} ${locationText}`);
          if (model === 'Outro' && locationText.toLowerCase().includes('brasil')) {
            model = 'Home Office';
          }

          jobs.push({
            title,
            company,
            link: link.split('?')[0],
            model,
            city: model === 'Híbrido' ? locationText : undefined,
            seniority: parseSeniority(title),
            publishedAt: dateAttr ? new Date(dateAttr) : undefined,
            source: this.name,
          });
        });
        return jobs;
      },
      { maxPages: 4, firstPage: 0 }
    );
  }
}
