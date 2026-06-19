import * as cheerio from 'cheerio'
import { Job } from '../../../domain/entities/Job.js'
import { renderHtml, RenderOptions } from '../../http/BrowserClient.js'

export type CheerioRoot = cheerio.CheerioAPI
export type JobExtractor = ($: CheerioRoot) => Job[]

/**
 * Helper para fontes SPA: renderiza a página com Playwright (fallback headless),
 * roda o extractor sobre o DOM final e degrada graciosamente — se o Playwright
 * não estiver instalado ou a página falhar, registra o motivo e retorna `[]`
 * sem interromper o pipeline.
 */
export async function renderAndExtract (
  sourceName: string,
  url: string,
  extract: JobExtractor,
  options: RenderOptions = {}
): Promise<Job[]> {
  try {
    const html = await renderHtml(url, options)
    const $ = cheerio.load(html)

    return extract($)
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.log(`[${sourceName}] coleta indisponível (best-effort): ${reason}`)

    return []
  }
}
