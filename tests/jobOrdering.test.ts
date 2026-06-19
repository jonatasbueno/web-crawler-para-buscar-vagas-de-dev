import { sortJobsByRecency } from '../src/domain/services/JobOrdering.js'
import { Job } from '../src/domain/entities/Job.js'

const base: Omit<Job, 'link' | 'publishedAt'> = {
  title: 'Dev',
  model: 'Home Office',
  seniority: 'Não Informado'
}

describe('sortJobsByRecency', () => {
  it('ordena da mais recente para a menos recente', () => {
    const jobs: Job[] = [
      { ...base, link: '1', publishedAt: new Date('2026-06-01') },
      { ...base, link: '2', publishedAt: new Date('2026-06-15') },
      { ...base, link: '3', publishedAt: new Date('2026-06-10') }
    ]
    const sorted = sortJobsByRecency(jobs)
    expect(sorted.map((j) => j.link)).toEqual(['2', '3', '1'])
  })

  it('coloca vagas sem data no fim', () => {
    const jobs: Job[] = [
      { ...base, link: 'sem-data', publishedAt: undefined },
      { ...base, link: 'com-data', publishedAt: new Date('2026-06-10') }
    ]
    const sorted = sortJobsByRecency(jobs)
    expect(sorted.map((j) => j.link)).toEqual(['com-data', 'sem-data'])
  })

  it('desempata por senioridade quando a data é igual', () => {
    const date = new Date('2026-06-10')
    const jobs: Job[] = [
      { ...base, link: 'ni', seniority: 'Não Informado', publishedAt: date },
      { ...base, link: 'pleno', seniority: 'Pleno', publishedAt: date },
      { ...base, link: 'senior', seniority: 'Sênior', publishedAt: date }
    ]
    const sorted = sortJobsByRecency(jobs)
    expect(sorted.map((j) => j.link)).toEqual(['pleno', 'senior', 'ni'])
  })

  it('não muta o array original', () => {
    const jobs: Job[] = [
      { ...base, link: '1', publishedAt: new Date('2026-06-01') },
      { ...base, link: '2', publishedAt: new Date('2026-06-15') }
    ]
    const copy = [...jobs]
    sortJobsByRecency(jobs)
    expect(jobs).toEqual(copy)
  })
})
