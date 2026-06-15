import axios from 'axios';
import * as cheerio from 'cheerio';
import { Scraper } from './base.js';
import { Job } from '../types/index.js';
import { parseSeniority, parseWorkModel } from '../utils/parserUtils.js';

export class ProgramaThorScraper implements Scraper {
  async scrape(): Promise<Job[]> {
    const jobs: Job[] = [];
    try {
      const response = await axios.get('https://programathor.com.br/jobs');
      const $ = cheerio.load(response.data);

      $('.cell-list').each((_, element) => {
        const title = $(element).find('.text-24').text().trim();
        const link = 'https://programathor.com.br' + $(element).attr('href');
        const company = $(element).find('.text-16').first().text().trim();
        const infoText = $(element).find('.text-14').text().toLowerCase();

        const model = parseWorkModel(infoText);
        let seniority = parseSeniority(title);
        if (seniority === 'Não Informado') seniority = parseSeniority(infoText);

        jobs.push({
          title,
          company,
          link,
          model,
          city: model === 'Híbrido' ? 'Campinas' : undefined,
          seniority,
          publishedAt: new Date()
        });
      });
    } catch (error) {
      console.error('Erro no ProgramaThorScraper:', error);
    }
    return jobs;
  }
}
