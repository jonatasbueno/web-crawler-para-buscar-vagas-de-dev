import { SourceScraper } from '../../domain/ports/SourceScraper.js';
import { Job } from '../../domain/entities/Job.js';
import { parseSeniority, parseWorkModel } from './support/parsing.js';
import { scrapePaginatedHtml } from './support/htmlPagination.js';
import { HttpClient } from '../http/HttpClient.js';

export class ProgramaThorScraper implements SourceScraper {
  readonly name = 'Programathor';

  constructor(private readonly http: HttpClient = new HttpClient()) {}

  async scrape(): Promise<Job[]> {
    return scrapePaginatedHtml(
      this.http,
      (page) => `https://programathor.com.br/jobs?page=${page}`,
      ($) => {
        const jobs: Job[] = [];
        $('.cell-list').each((_, element) => {
          const el = $(element);
          const title = el.find('.text-24').text().trim();
          const href = el.attr('href');
          if (!title || !href) return;

          const company = el.find('.text-16').first().text().trim();
          const infoText = el.find('.text-14').text().toLowerCase();
          const model = parseWorkModel(infoText);
          let seniority = parseSeniority(title);
          if (seniority === 'Não Informado') seniority = parseSeniority(infoText);

          jobs.push({
            title,
            company,
            link: `https://programathor.com.br${href}`,
            model,
            city: model === 'Híbrido' ? 'Campinas' : undefined,
            seniority,
            source: this.name,
          });
        });
        return jobs;
      }
    );
  }
}
