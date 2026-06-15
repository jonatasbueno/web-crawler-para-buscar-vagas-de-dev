import { Job } from '../types/index.js';

export interface Scraper {
  scrape(): Promise<Job[]>;
}
