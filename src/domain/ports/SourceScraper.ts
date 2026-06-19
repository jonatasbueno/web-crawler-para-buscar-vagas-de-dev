import { Job } from '../entities/Job.js'

/**
 * Porta de saída: cada fonte de vagas (portal/API/repo) implementa esta interface.
 * `name` é usado em logs e no campo `source` das vagas. Falhas devem ser lançadas
 * para que o caso de uso isole o erro sem interromper as demais fontes.
 */
export interface SourceScraper {
  readonly name: string
  scrape: () => Promise<Job[]>
}
