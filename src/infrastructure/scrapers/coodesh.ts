import { SourceScraper } from '../../domain/ports/SourceScraper.js'
import { Job } from '../../domain/entities/Job.js'
import { parseSeniority, parseWorkModel, slugToTitle } from './support/parsing.js'
import { renderAndExtract } from './support/spaSupport.js'

const BASE = 'https://coodesh.com'

/**
 * Coodesh é uma SPA cujo board (`/pt/jobs`) é renderizado client-side. Os links
 * de detalhe (`/pt/jobs/<slug>-<id>`) envolvem um ícone sem texto; o título vem
 * do slug e modalidade/senioridade/salário do texto do card (elemento pai).
 */
export class CoodeshScraper implements SourceScraper {
  readonly name = 'Coodesh'

  async scrape (): Promise<Job[]> {
    return await renderAndExtract(
      this.name,
      `${BASE}/pt/jobs`,
      ($) => {
        const jobs: Job[] = []
        const seen = new Set<string>()

        $('a[href*="/jobs/"]').each((_, el) => {
          const anchor = $(el)
          const href = (anchor.attr('href') ?? '').split('?')[0]

          if (!href || seen.has(href)) return
          seen.add(href)

          const slug = href.split('/').pop() ?? ''
          const title = slugToTitle(slug)
          const cardText = anchor.parent().text().replace(/\s+/g, ' ').trim()
          const model = parseWorkModel(cardText)
          const salary = cardText.match(/R\$[\s\d.,-]+/)?.[0]?.trim()

          jobs.push({
            title,
            link: href.startsWith('http') ? href : `${BASE}${href}`,
            model,
            city: model === 'Híbrido' ? cardText : undefined,
            seniority: parseSeniority(cardText),
            salary,
            source: this.name
          })
        })

        return jobs
      },
      { scrollRounds: 4, waitForSelector: 'a[href*="/jobs/"]' }
    )
  }
}
