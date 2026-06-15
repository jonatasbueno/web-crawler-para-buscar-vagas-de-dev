import axios from 'axios';
import * as cheerio from 'cheerio';
import { Scraper } from './base.js';
import { Job } from '../types/index.js';
import { parseSeniority, parseWorkModel } from '../utils/parserUtils.js';

export class LinkedinScraper implements Scraper {
  async scrape(): Promise<Job[]> {
    const jobs: Job[] = [];
    try {
      // Nota: Scraping real do LinkedIn exige gerenciamento complexo de sessão.
      // Aqui utilizamos uma abordagem simplificada de busca pública.
      const response = await axios.get('https://br.linkedin.com/jobs/search?keywords=React%20Native%20OR%20Frontend&location=Brasil&f_TPR=r2592000', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      const $ = cheerio.load(response.data);
      
      $('.base-card').each((_, element) => {
        const title = $(element).find('.base-search-card__title').text().trim();
        const company = $(element).find('.base-search-card__subtitle').text().trim();
        const link = $(element).find('.base-card__full-link').attr('href') || '';
        const locationText = $(element).find('.job-search-card__location').text().trim();
        
        const fullText = `${title} ${locationText}`;
        const seniority = parseSeniority(title);
        let model = parseWorkModel(fullText);
        if (model === 'Outro' && locationText.toLowerCase().includes('brasil')) {
          model = 'Home Office';
        }

        jobs.push({
          title,
          company,
          link: link.split('?')[0], // Limpa tracking
          model,
          city: model === 'Híbrido' ? locationText : undefined,
          seniority,
          publishedAt: new Date() // Simplificação
        });
      });
    } catch (error) {
      console.error('Erro no LinkedinScraper:', error);
    }
    return jobs;
  }
}
