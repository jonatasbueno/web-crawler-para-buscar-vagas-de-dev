import { Job, Seniority } from '../entities/Job.js'

const SENIORITY_WEIGHT: Record<Seniority, number> = {
  Pleno: 1,
  Sênior: 2,
  Júnior: 3,
  'Não Informado': 4
}

/**
 * Ordena as vagas da mais recente para a menos recente (requisito de exibição).
 * Vagas sem `publishedAt` vão para o fim. Em empate de data, usa a senioridade
 * como desempate (Pleno > Sênior > Júnior > Não Informado).
 */
export function sortJobsByRecency (jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const ta = a.publishedAt?.getTime() ?? -Infinity
    const tb = b.publishedAt?.getTime() ?? -Infinity

    if (tb !== ta) return tb - ta // mais recente primeiro

    return SENIORITY_WEIGHT[a.seniority] - SENIORITY_WEIGHT[b.seniority]
  })
}
