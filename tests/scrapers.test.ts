import { jest } from '@jest/globals';
import axios from 'axios';
import {
  LinkedinScraper,
  GupyScraper,
  ProgramaThorScraper,
  GeekHunterScraper,
  ReveloScraper,
  VagasComScraper
} from '../src/scrapers/index.js';

describe('Scrapers', () => {
  let getSpy: any;

  beforeEach(() => {
    getSpy = jest.spyOn(axios, 'get').mockResolvedValue({ data: '' });
    jest.clearAllMocks();
  });

  afterAll(() => {
    getSpy.mockRestore();
  });

  describe('LinkedinScraper', () => {
    it('should handle errors gracefully', async () => {
      getSpy.mockRejectedValueOnce(new Error('Network Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const scraper = new LinkedinScraper();
      const result = await scraper.scrape();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should parse jobs from html', async () => {
      const html = `
        <div class="base-card">
          <h3 class="base-search-card__title">React Native Developer</h3>
          <h4 class="base-search-card__subtitle">Tech Corp</h4>
          <a class="base-card__full-link" href="http://linkedin.com/job1?tracking=123"></a>
          <span class="job-search-card__location">Brasil</span>
        </div>
        <div class="base-card">
          <h3 class="base-search-card__title">Backend</h3>
          <h4 class="base-search-card__subtitle">Tech Corp 2</h4>
          <a class="base-card__full-link"></a>
          <span class="job-search-card__location">Campinas</span>
        </div>
      `;
      getSpy.mockResolvedValueOnce({ data: html });

      const scraper = new LinkedinScraper();
      const result = await scraper.scrape();
      
      expect(result.length).toBe(2);
      expect(result[0].title).toBe('React Native Developer');
      expect(result[0].company).toBe('Tech Corp');
      expect(result[0].link).toBe('http://linkedin.com/job1');
      expect(result[0].model).toBe('Home Office');
      expect(result[1].model).toBe('Outro');
      expect(result[1].city).toBeUndefined();
    });
  });

  describe('GupyScraper', () => {
    it('should parse jobs from json api', async () => {
      const apiResponse = {
        data: [
          {
            name: 'Frontend Sênior',
            careerPageName: 'Gupy Company',
            jobUrl: 'http://gupy/1',
            isRemoteWork: true,
            publishedDate: new Date().toISOString()
          },
          {
            name: 'Backend',
            careerPageName: 'Gupy Company 2',
            jobUrl: 'http://gupy/2',
            isRemoteWork: false,
            city: 'Campinas',
            publishedDate: new Date().toISOString()
          }
        ]
      };
      getSpy.mockResolvedValueOnce({ data: apiResponse });

      const scraper = new GupyScraper();
      const result = await scraper.scrape();
      
      expect(result.length).toBe(2);
      expect(result[0].model).toBe('Home Office');
      expect(result[1].model).toBe('Híbrido');
    });
    
    it('should handle errors gracefully', async () => {
      getSpy.mockRejectedValueOnce(new Error('Network Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const scraper = new GupyScraper();
      const result = await scraper.scrape();
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('ProgramaThorScraper', () => {
    it('should parse jobs from html', async () => {
      const html = `
        <a class="cell-list" href="/job/123">
          <h3 class="text-24">Frontend Pleno</h3>
          <h4 class="text-16">Thor Tech</h4>
          <span class="text-14">Híbrido em São Paulo</span>
        </a>
      `;
      getSpy.mockResolvedValueOnce({ data: html });

      const scraper = new ProgramaThorScraper();
      const result = await scraper.scrape();
      
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('Frontend Pleno');
      expect(result[0].model).toBe('Híbrido');
      expect(result[0].link).toBe('https://programathor.com.br/job/123');
    });

    it('should handle errors gracefully', async () => {
      getSpy.mockRejectedValueOnce(new Error('Network Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const scraper = new ProgramaThorScraper();
      const result = await scraper.scrape();
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('VagasComScraper', () => {
    it('should parse jobs from html', async () => {
      const html = `
        <div class="vaga">
          <a class="link-detalhes-vaga" href="/vaga/123">Desenvolvedor React</a>
          <span class="emprVaga">Vagas Tech</span>
          <span class="vaga-local">Remoto</span>
        </div>
        <div class="vaga">
          <a class="link-detalhes-vaga" href="/vaga/124">Backend Presencial</a>
          <span class="emprVaga">Old Tech</span>
          <span class="vaga-local">Híbrido</span>
        </div>
        `;
        getSpy.mockResolvedValueOnce({ data: html });

        const scraper = new VagasComScraper();
        const result = await scraper.scrape();

        expect(result.length).toBe(2);
        expect(result[0].model).toBe('Home Office');
        expect(result[1].model).toBe('Híbrido');
        expect(result[1].city).toBe('híbrido');
      expect(result[0].title).toBe('Desenvolvedor React');
      expect(result[0].model).toBe('Home Office');
      expect(result[0].link).toBe('https://www.vagas.com.br/vaga/123');
    });

    it('should handle errors gracefully', async () => {
      getSpy.mockRejectedValueOnce(new Error('Network Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const scraper = new VagasComScraper();
      const result = await scraper.scrape();
      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('Others (GeekHunter / Revelo)', () => {
    it('should run GeekHunter simlated scraper', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const scraper = new GeekHunterScraper();
      const result = await scraper.scrape();
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('GeekHunter Scraper (Simulado) executando...');
      consoleSpy.mockRestore();
    });

    it('should run Revelo simlated scraper', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const scraper = new ReveloScraper();
      const result = await scraper.scrape();
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Revelo Scraper (Simulado) executando...');
      consoleSpy.mockRestore();
    });
  });
});
