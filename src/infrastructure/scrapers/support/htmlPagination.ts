import * as cheerio from 'cheerio'
import { Job } from '../../../domain/entities/Job.js'
import { HttpClient } from '../../http/HttpClient.js'

export interface PaginatedHtmlOptions {
  /** Número máximo de páginas a varrer (trava de segurança). */
  maxPages?: number
  /** Índice da primeira página (1 para `?page=1`, 0 para offsets). */
  firstPage?: number
}

/**
 * Util compartilhado pelos scrapers HTML: busca páginas sequenciais via axios,
 * parseia cada uma com Cheerio e para quando uma página não retorna vagas ou ao
 * atingir `maxPages`. Centraliza o laço de paginação antes duplicado por scraper.
 */
export async function scrapePaginatedHtml (
  http: HttpClient,
  buildUrl: (page: number) => string,
  parsePage: ($: cheerio.CheerioAPI) => Job[],
  { maxPages = 5, firstPage = 1 }: PaginatedHtmlOptions = {}
): Promise<Job[]> {
  const jobs: Job[] = []
  for (let i = 0; i < maxPages; i++) {
    const html = await http.getText(buildUrl(firstPage + i))
    const parsed = parsePage(cheerio.load(html))

    if (parsed.length === 0) break
    jobs.push(...parsed)
  }

  return jobs
}
