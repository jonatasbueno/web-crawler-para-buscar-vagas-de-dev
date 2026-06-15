import axios from 'axios';
import * as cheerio from 'cheerio';
import { Scraper } from './base.js';
import { Job } from '../types/index.js';
import { parseSeniority, parseWorkModel } from '../utils/parserUtils.js';

export class GupyScraper implements Scraper {
  async scrape(): Promise<Job[]> {
    const jobs: Job[] = [];
    try {
      // Gupy geralmente fornece vagas via API JSON no portal de vagas.
      // Simulamos a chamada na API genérica ou usando cheerio em uma página.
      const response = await axios.get('https://portal.gupy.io/api/v1/jobs?jobName=frontend&limit=50');
      
      const items = response.data.data || [];
      for (const item of items) {
        const title = item.name;
        const company = item.careerPageName;
        const link = item.jobUrl;
        const isRemote = item.isRemoteWork;
        const city = item.city;
        
        const model = isRemote ? 'Home Office' : (city ? 'Híbrido' : 'Outro');
        
        jobs.push({
          title,
          company,
          link,
          model,
          city: model === 'Híbrido' ? city : undefined,
          seniority: parseSeniority(title),
          publishedAt: new Date(item.publishedDate)
        });
      }
    } catch (error) {
      console.error('Erro no GupyScraper:', error);
    }
    return jobs;
  }
}
