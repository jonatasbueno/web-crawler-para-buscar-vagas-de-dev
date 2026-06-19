import * as cheerio from 'cheerio'
import { SourceScraper } from '../../domain/ports/SourceScraper.js'
import { Job } from '../../domain/entities/Job.js'
import { parseSeniority, parseWorkModel } from './support/parsing.js'
import { HttpClient } from '../http/HttpClient.js'

const HOME = 'https://www.apinfo.com/'

/**
 * APInfo é um portal de TI legado (ColdFusion), server-rendered e codificado em
 * ISO-8859-1. A home lista as vagas mais recentes em `.bloco-vaga-unica`, o que
 * já se alinha ao filtro de recência.
 */
export class ApinfoScraper implements SourceScraper {
  readonly name = 'APInfo'

  constructor (private readonly http: HttpClient = new HttpClient()) {}

  async scrape (): Promise<Job[]> {
    const html = await this.http.getDecodedText(HOME, 'latin1')
    const $ = cheerio.load(html)
    const jobs: Job[] = []

    $('.bloco-vaga-unica').each((_, el) => {
      const block = $(el)
      const anchor = block.find('.nome-vaga a')
      const title = anchor.text().trim()
      const link = anchor.attr('href')

      if (!title || !link) return

      const locationText = block.find('.data').text().trim()
      const company = block.find('.empresa').text().trim()
      const model = parseWorkModel(locationText)

      jobs.push({
        title,
        company: company || undefined,
        link,
        model,
        city: model === 'Híbrido' ? locationText : undefined,
        seniority: parseSeniority(title),
        source: this.name
      })
    })

    return jobs
  }
}
