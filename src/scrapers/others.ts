import { Scraper } from './base.js';
import { Job } from '../types/index.js';

export class GeekHunterScraper implements Scraper {
  async scrape(): Promise<Job[]> {
    // GeekHunter é fechado e exige login/auth token pesado.
    // Implementação simulando o formato esperado.
    console.log('GeekHunter Scraper (Simulado) executando...');
    return [];
  }
}

export class ReveloScraper implements Scraper {
  async scrape(): Promise<Job[]> {
    // Revelo também exige auth e o modelo de "talento recebe propostas" é mais comum.
    // Porém eles possuem boards públicos ocasionalmente.
    console.log('Revelo Scraper (Simulado) executando...');
    return [];
  }
}
