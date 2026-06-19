import { SourceScraper } from '../../domain/ports/SourceScraper.js'
import { Job } from '../../domain/entities/Job.js'
import { parseSeniority } from './support/parsing.js'
import { HttpClient } from '../http/HttpClient.js'

interface GupyJob {
  name: string
  careerPageName?: string
  jobUrl: string
  isRemoteWork?: boolean
  city?: string
  publishedDate?: string
}

const SEARCH_TERMS = ['frontend', 'react native', 'node']
const PAGE_LIMIT = 50
const MAX_OFFSET = 200 // trava de segurança por termo

export class GupyScraper implements SourceScraper {
  readonly name = 'Gupy'

  constructor (private readonly http: HttpClient = new HttpClient()) {}

  async scrape (): Promise<Job[]> {
    const jobs: Job[] = []
    const seen = new Set<string>()

    for (const term of SEARCH_TERMS) {
      for (let offset = 0; offset <= MAX_OFFSET; offset += PAGE_LIMIT) {
        const url =
          `https://portal.gupy.io/api/v1/jobs?jobName=${encodeURIComponent(term)}` +
          `&limit=${PAGE_LIMIT}&offset=${offset}`

        const data = await this.http.getJson<{ data?: GupyJob[] }>(url)
        const items = data.data ?? []

        if (items.length === 0) break

        for (const item of items) {
          if (!item.jobUrl || seen.has(item.jobUrl)) continue
          seen.add(item.jobUrl)

          const model = item.isRemoteWork ? 'Home Office' : item.city ? 'Híbrido' : 'Outro'
          jobs.push({
            title: item.name,
            company: item.careerPageName,
            link: item.jobUrl,
            model,
            city: model === 'Híbrido' ? item.city : undefined,
            seniority: parseSeniority(item.name),
            publishedAt: item.publishedDate ? new Date(item.publishedDate) : undefined,
            source: this.name
          })
        }

        if (items.length < PAGE_LIMIT) break
      }
    }

    return jobs
  }
}
