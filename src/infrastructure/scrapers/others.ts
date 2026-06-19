import { SourceScraper } from '../../domain/ports/SourceScraper.js';
import { Job } from '../../domain/entities/Job.js';

/**
 * GeekHunter é fechado e exige login/token pesado; mantido como adaptador
 * best-effort (retorna vazio) até que uma fonte pública viável seja identificada.
 */
export class GeekHunterScraper implements SourceScraper {
  readonly name = 'GeekHunter';

  async scrape(): Promise<Job[]> {
    console.log('[GeekHunter] fonte sem coleta pública disponível — pulando.');
    return [];
  }
}

/**
 * Revelo opera majoritariamente no modelo "talento recebe propostas" e exige
 * autenticação; mantido como adaptador best-effort.
 */
export class ReveloScraper implements SourceScraper {
  readonly name = 'Revelo';

  async scrape(): Promise<Job[]> {
    console.log('[Revelo] fonte sem coleta pública disponível — pulando.');
    return [];
  }
}
