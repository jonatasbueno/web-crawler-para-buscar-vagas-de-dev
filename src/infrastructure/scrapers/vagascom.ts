import { SourceScraper } from '../../domain/ports/SourceScraper.js';
import { Job } from '../../domain/entities/Job.js';
import { parseSeniority, parseWorkModel } from './support/parsing.js';
import { scrapePaginatedHtml } from './support/htmlPagination.js';
import { HttpClient } from '../http/HttpClient.js';

export class VagasComScraper implements SourceScraper {
  readonly name = 'Vagas.com';

  constructor(private readonly http: HttpClient = new HttpClient()) {}

  async scrape(): Promise<Job[]> {
    return scrapePaginatedHtml(
      this.http,
      (page) => `https://www.vagas.com.br/vagas-de-frontend?pagina=${page}`,
      ($) => {
        const jobs: Job[] = [];
        $('.vaga').each((_, element) => {
          const el = $(element);
          const anchor = el.find('.link-detalhes-vaga');
          const title = anchor.text().trim();
          const href = anchor.attr('href');
          if (!title || !href) return;

          const company = el.find('.emprVaga').text().trim();
          const locationText = el.find('.vaga-local').text().toLowerCase();
          let model = parseWorkModel(locationText);
          if (model === 'Outro') model = parseWorkModel(title);

          jobs.push({
            title,
            company,
            link: `https://www.vagas.com.br${href}`,
            model,
            city: model === 'Híbrido' ? locationText : undefined,
            seniority: parseSeniority(title),
            source: this.name,
          });
        });
        return jobs;
      }
    );
  }
}
