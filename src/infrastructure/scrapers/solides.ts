import { SourceScraper } from '../../domain/ports/SourceScraper.js'
import { Job } from '../../domain/entities/Job.js'
import { cleanTitle, parseRelativeDate, parseSeniority, parseWorkModel } from './support/parsing.js'
import { renderAndExtract } from './support/spaSupport.js'

const BASE = 'https://vagas.solides.com.br'
const LOCATION_RE = /([A-Za-zÀ-ú.]+(?: [A-Za-zÀ-ú.]+)*)\s-\s([A-Z]{2})\b/

/**
 * Sólides Vagas é um app Next.js que carrega as vagas via API client-side.
 * Renderizado com Playwright; os cards (`/vaga/<id>`) trazem título, empresa,
 * localização, modalidade, senioridade e a data relativa de publicação.
 */
export class SolidesScraper implements SourceScraper {
  readonly name = 'Sólides Vagas'

  async scrape (): Promise<Job[]> {
    return await renderAndExtract(
      this.name,
      `${BASE}/vagas?occupationAreas=tecnologia`,
      ($) => {
        const jobs: Job[] = []
        const seen = new Set<string>()

        $('a[href*="/vaga/"]').each((_, el) => {
          const anchor = $(el)
          const title = cleanTitle(anchor.text())
          const href = (anchor.attr('href') ?? '').split('?')[0]

          if (!title || !href || seen.has(href)) return
          seen.add(href)

          const card = anchor.closest('article, li, [class*="card"], [class*="vaga"]')
          const cardText = (card.length ? card : anchor).text().replace(/\s+/g, ' ').trim()
          const model = parseWorkModel(cardText)
          const loc = cardText.match(LOCATION_RE)

          jobs.push({
            title,
            link: href.startsWith('http') ? href : `${BASE}${href}`,
            model,
            city: model === 'Híbrido' && (loc != null) ? loc[0] : undefined,
            seniority: parseSeniority(cardText),
            publishedAt: parseRelativeDate(cardText),
            source: this.name
          })
        })

        return jobs
      },
      { scrollRounds: 4, waitForSelector: 'a[href*="/vaga/"]' }
    )
  }
}
