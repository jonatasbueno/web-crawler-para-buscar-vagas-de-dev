import * as cheerio from 'cheerio'
import { SourceScraper } from '../../domain/ports/SourceScraper.js'
import { Job } from '../../domain/entities/Job.js'
import { parseSeniority, parseWorkModel } from './support/parsing.js'
import { renderHtml } from '../http/BrowserClient.js'

const BASE = 'https://br.indeed.com'
// Busca: desenvolvedor, últimos 14 dias, filtro DSQF7 (remoto).
const SEARCH_PATH = '/jobs?q=desenvolvedor&l=&fromage=14&sc=0kf%3Aattr%28DSQF7%29%3B'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
// Botões de fechar do popup de confirmação de e-mail (fallback best-effort).
const POPUP_CLOSE_SELECTORS = [
  '#popover-x',
  '#mosaic-modal-close',
  'button[aria-label*="fechar" i]',
  'button[aria-label*="close" i]',
  '.icl-CloseButton',
  '[data-testid="closeIcon"]'
]
const MAX_PAGES = 3
const PAGE_SIZE = 10

/** Termos que indicam vaga de torno CNC / programador da área de mecânica. */
const MECHANICAL_KEYWORDS = [
  'torno', 'cnc', 'usinagem', 'fresadora', 'fresador', 'metalúrgic',
  'caldeiraria', 'ferramentaria', 'soldador', 'soldagem', 'mecânic'
]

/** Detecta vagas mecânicas/CNC que devem ser descartadas após a raspagem. */
export function isMechanicalRole (text: string): boolean {
  const t = text.toLowerCase()

  return MECHANICAL_KEYWORDS.some((kw) => t.includes(kw))
}

/** Extrai as vagas dos cards do Indeed (função pura sobre o DOM renderizado). */
export function extractIndeedJobs ($: cheerio.CheerioAPI): Job[] {
  const jobs: Job[] = []
  $('.job_seen_beacon').each((_, el) => {
    const card = $(el)
    const title = card.find('h2.jobTitle, [class*="jobTitle"]').first().text().replace(/\s+/g, ' ').trim()
    const jk = card.find('a[data-jk]').attr('data-jk') || card.find('[data-jk]').attr('data-jk')

    if (!title || !jk) return

    const company = card.find('[data-testid="company-name"], .companyName').first().text().trim()
    const locationText = card.find('[data-testid="text-location"], .companyLocation').first().text().trim()
    const model = parseWorkModel(locationText)

    jobs.push({
      title,
      company: company || undefined,
      link: `${BASE}/viewjob?jk=${jk}`,
      model,
      city: model === 'Híbrido' ? locationText : undefined,
      seniority: parseSeniority(title),
      source: 'Indeed'
    })
  })

  return jobs
}

/**
 * Coleta vagas de "desenvolvedor" no Indeed (Brasil). O Indeed protege as buscas
 * com Cloudflare, então a coleta é feita via navegador headless (Playwright) com
 * User-Agent de navegador real; um popup de confirmação de e-mail pode aparecer e
 * é fechado por fallback. Vagas de torno CNC / mecânica são removidas ao final.
 */
export class IndeedScraper implements SourceScraper {
  readonly name = 'Indeed'

  async scrape (): Promise<Job[]> {
    const jobs: Job[] = []
    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const url = `${BASE}${SEARCH_PATH}&start=${page * PAGE_SIZE}`
        const html = await renderHtml(url, {
          waitUntil: 'domcontentloaded',
          userAgent: USER_AGENT,
          locale: 'pt-BR',
          dismissSelectors: POPUP_CLOSE_SELECTORS,
          waitForSelector: '.job_seen_beacon',
          scrollRounds: 1
        })
        const parsed = extractIndeedJobs(cheerio.load(html))

        if (parsed.length === 0) break
        jobs.push(...parsed)
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.log(`[Indeed] coleta indisponível (best-effort): ${reason}`)
    }

    return jobs.filter((job) => !isMechanicalRole(`${job.title} ${job.company ?? ''}`))
  }
}
