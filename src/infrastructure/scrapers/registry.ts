import { SourceScraper } from '../../domain/ports/SourceScraper.js'
import { HttpClient } from '../http/HttpClient.js'
import { createGithubVagasScrapers } from './github/GithubVagasScraper.js'
import { GupyScraper } from './gupy.js'
import { ProgramaThorScraper } from './programathor.js'
import { LinkedinScraper } from './linkedin.js'
import { VagasComScraper } from './vagascom.js'
import { ApinfoScraper } from './apinfo.js'
import { SolidesScraper } from './solides.js'
import { WorkanaScraper } from './workana.js'
import { CoodeshScraper } from './coodesh.js'
import { TramposScraper } from './trampos.js'
import { GeekHunterScraper, ReveloScraper } from './others.js'
import { createQuickinScrapers } from './quickin.js'
import { IndeedScraper } from './indeed.js'

/**
 * Composition de todas as fontes de vagas. A ordem é apenas informativa
 * (logs); o pipeline isola falhas por fonte.
 */
export function createAllScrapers (http: HttpClient = new HttpClient()): SourceScraper[] {
  return [
    // Fontes confiáveis baseadas em API/HTML server-rendered
    ...createGithubVagasScrapers(http),
    new GupyScraper(http),
    new ProgramaThorScraper(http),
    new VagasComScraper(http),
    new LinkedinScraper(http),
    new ApinfoScraper(http),
    // Fontes SPA (via Playwright)
    new SolidesScraper(),
    new WorkanaScraper(),
    new CoodeshScraper(),
    new TramposScraper(),
    // Boards de empresa hospedados no Quickin (ATS) — configurável por QUICKIN_COMPANIES
    ...createQuickinScrapers(http),
    // Indeed (busca pública via navegador headless por causa do Cloudflare)
    new IndeedScraper(),
    // Fontes fechadas (best-effort / stub)
    new GeekHunterScraper(),
    new ReveloScraper()
  ]
}
