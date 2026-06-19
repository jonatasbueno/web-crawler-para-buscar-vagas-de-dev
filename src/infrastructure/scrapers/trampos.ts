import { SourceScraper } from '../../domain/ports/SourceScraper.js'
import { Job } from '../../domain/entities/Job.js'
import { cleanTitle, parseSeniority, parseWorkModel } from './support/parsing.js'
import { renderAndExtract } from './support/spaSupport.js'

const BASE = 'https://trampos.co'

/**
 * Trampos.co é uma SPA de oportunidades em Comunicação e TI, renderizada
 * client-side. Cada card (`/oportunidades/<id>`) traz título, modalidade e local.
 */
export class TramposScraper implements SourceScraper {
  readonly name = 'Trampos.co'

  async scrape (): Promise<Job[]> {
    return await renderAndExtract(
      this.name,
      `${BASE}/oportunidades?q=desenvolvedor`,
      ($) => {
        const jobs: Job[] = []
        const seen = new Set<string>()

        $('a[href*="/oportunidades/"]').each((_, el) => {
          const anchor = $(el)
          const href = (anchor.attr('href') ?? '').split('?')[0]

          if (!href || seen.has(href) || !/\/oportunidades\/\d/.test(href)) return
          seen.add(href)

          const heading = anchor.find('h2, h3, [class*="title"]').first().text()
          // Sem heading, o texto do card é "<título> Emprego <local> DESTAQUE":
          // corta no marcador "Emprego" para isolar o título.
          const raw = heading || anchor.text().split(/\bEmprego\b/)[0]
          const title = cleanTitle(raw)

          if (!title) return

          const context = anchor.text()
          const model = parseWorkModel(context)

          jobs.push({
            title,
            link: href.startsWith('http') ? href : `${BASE}${href}`,
            model,
            city: model === 'Híbrido' ? context.replace(/\s+/g, ' ').trim() : undefined,
            seniority: parseSeniority(title),
            source: this.name
          })
        })

        return jobs
      },
      { scrollRounds: 4, waitForSelector: 'a[href*="/oportunidades/"]' }
    )
  }
}
