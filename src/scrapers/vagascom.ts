import axios from 'axios';
import * as cheerio from 'cheerio';
import { Scraper } from './base.js';
import { Job } from '../types/index.js';
import { parseSeniority, parseWorkModel } from '../utils/parserUtils.js';

export class VagasComScraper implements Scraper {
  async scrape(): Promise<Job[]> {
    const jobs: Job[] = [];
    try {
      const response = await axios.get('https://www.vagas.com.br/vagas-de-frontend');
      const $ = cheerio.load(response.data);

      $('.vaga').each((_, element) => {
        const title = $(element).find('.link-detalhes-vaga').text().trim();
        const link = 'https://www.vagas.com.br' + $(element).find('.link-detalhes-vaga').attr('href');
        const company = $(element).find('.emprVaga').text().trim();
        const locationText = $(element).find('.vaga-local').text().toLowerCase();

        let model = parseWorkModel(locationText);
        if (model === 'Outro') model = parseWorkModel(title);
        
        jobs.push({
          title,
          company,
          link,
          model,
          city: model === 'Híbrido' ? locationText : undefined,
          seniority: parseSeniority(title),
          publishedAt: new Date()
        });
      });
    } catch (error) {
      console.error('Erro no VagasComScraper:', error);
    }
    return jobs;
  }
}
