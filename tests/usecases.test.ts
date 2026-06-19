import { Job } from '../src/domain/entities/Job.js'
import { SourceScraper } from '../src/domain/ports/SourceScraper.js'
import { JobRepository, RunStatus } from '../src/domain/ports/JobRepository.js'
import { Notifier } from '../src/domain/ports/Notifier.js'
import { Clock } from '../src/domain/ports/Clock.js'
import { RunPipeline } from '../src/application/usecases/RunPipeline.js'
import { RunScheduledSlot } from '../src/application/usecases/RunScheduledSlot.js'
import { CatchUp } from '../src/application/usecases/CatchUp.js'
import { RunOnce } from '../src/application/usecases/RunOnce.js'

const NOW = new Date('2026-06-17T12:00:00Z')

function daysAgo (d: number): Date {
  return new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000)
}

function job (link: string, extra: Partial<Job> = {}): Job {
  return { title: 'Frontend React', model: 'Home Office', seniority: 'Pleno', link, ...extra }
}

class FakeScraper implements SourceScraper {
  constructor (public name: string, private readonly result: Job[] | Error) {}
  async scrape (): Promise<Job[]> {
    if (this.result instanceof Error) throw this.result

    return this.result
  }
}

class FakeRepo implements JobRepository {
  marked: Job[] = []
  runs: Array<{ hour: number, status: RunStatus }> = []
  constructor (private readonly sent = new Set<string>(), public ranHours: number[] = []) {}
  async isJobAlreadySent (link: string) {
    return this.sent.has(link)
  }

  async markJobsAsSent (jobs: Job[]) {
    jobs.forEach((j) => this.sent.add(j.link))
    this.marked.push(...jobs)
  }

  async recordRun (hour: number, status: RunStatus = 'success') {
    this.runs.push({ hour, status })
  }

  async getRanHoursToday () {
    return this.ranHours
  }
}

class FakeNotifier implements Notifier {
  jobsCalls: Job[][] = []
  emptyCalls = 0
  errors: string[] = []
  async sendJobs (jobs: Job[]) {
    this.jobsCalls.push(jobs)
  }

  async sendEmpty () {
    this.emptyCalls++
  }

  async sendError (context: string) {
    this.errors.push(context)
  }
}

const clockAt = (hour: number, now: Date = NOW): Clock => ({
  now: () => now,
  currentHourBRT: () => hour
})

describe('RunPipeline', () => {
  it('consolida, filtra, deduplica, ordena, notifica e persiste', async () => {
    const repo = new FakeRepo(new Set(['http://dup']))
    const notifier = new FakeNotifier()
    const scrapers: SourceScraper[] = [
      new FakeScraper('A', [job('http://recent', { publishedAt: daysAgo(2) })]),
      new FakeScraper('B', [job('http://recent', { publishedAt: daysAgo(2) })]), // duplicado no lote
      new FakeScraper('C', [job('http://old', { publishedAt: daysAgo(30) })]), // fora da recência
      new FakeScraper('D', [job('http://dup', { publishedAt: daysAgo(1) })]), // já enviado
      new FakeScraper('E', [job('http://backend', { title: 'Backend Java', publishedAt: daysAgo(1) })]), // stack inválida
      new FakeScraper('Boom', new Error('falha de rede'))
    ]

    const result = await new RunPipeline(scrapers, repo, notifier, clockAt(12)).execute('test')

    expect(notifier.errors).toContain('[test] Fonte Boom')
    expect(notifier.jobsCalls).toHaveLength(1)
    expect(notifier.jobsCalls[0].map((j) => j.link)).toEqual(['http://recent'])
    expect(repo.marked.map((j) => j.link)).toEqual(['http://recent'])
    expect(result.fresh).toBe(1)
  })

  it('envia aviso de lista vazia quando não há vagas novas', async () => {
    const repo = new FakeRepo()
    const notifier = new FakeNotifier()
    const scrapers = [new FakeScraper('A', [job('http://old', { publishedAt: daysAgo(40) })])]

    await new RunPipeline(scrapers, repo, notifier, clockAt(12)).execute('test')

    expect(notifier.emptyCalls).toBe(1)
    expect(notifier.jobsCalls).toHaveLength(0)
    expect(repo.marked).toHaveLength(0)
  })
})

describe('RunScheduledSlot', () => {
  it('registra o slot APÓS o pipeline (consolidação)', async () => {
    const repo = new FakeRepo()
    const notifier = new FakeNotifier()
    const pipeline = new RunPipeline([new FakeScraper('A', [])], repo, notifier, clockAt(8))

    await new RunScheduledSlot(pipeline, repo).execute(8)

    expect(repo.runs).toEqual([{ hour: 8, status: 'success' }])
  })

  it('registra status de erro e propaga quando o pipeline falha', async () => {
    const repo = new FakeRepo()
    const pipeline = {
      execute: async () => {
        throw new Error('pipeline quebrou')
      }
    } as unknown as RunPipeline

    await expect(new RunScheduledSlot(pipeline, repo).execute(13)).rejects.toThrow('pipeline quebrou')
    expect(repo.runs).toEqual([{ hour: 13, status: 'error' }])
  })
})

describe('CatchUp', () => {
  it('executa apenas o último slot pendente do dia e registra após consolidar', async () => {
    const repo = new FakeRepo(new Set(), []) // nada rodou hoje
    const notifier = new FakeNotifier()
    const pipeline = new RunPipeline([new FakeScraper('A', [])], repo, notifier, clockAt(14))

    await new CatchUp(pipeline, repo, notifier, clockAt(14)).execute()

    // 14h: 08h e 13h pendentes → roda só 13h
    expect(repo.runs).toEqual([{ hour: 13, status: 'success' }])
  })

  it('não faz nada quando não há slot pendente', async () => {
    const repo = new FakeRepo(new Set(), [8, 13, 20])
    const notifier = new FakeNotifier()
    const pipeline = new RunPipeline([new FakeScraper('A', [])], repo, notifier, clockAt(21))

    await new CatchUp(pipeline, repo, notifier, clockAt(21)).execute()
    expect(repo.runs).toHaveLength(0)
  })

  it('registra erro e notifica quando o pipeline falha', async () => {
    const repo = new FakeRepo(new Set(), [])
    const notifier = new FakeNotifier()
    const pipeline = {
      execute: async () => {
        throw new Error('boom')
      }
    } as unknown as RunPipeline

    await new CatchUp(pipeline, repo, notifier, clockAt(10)).execute()

    expect(repo.runs).toEqual([{ hour: 8, status: 'error' }])
    expect(notifier.errors).toContain('catch-up-8h')
  })
})

describe('RunOnce', () => {
  it('executa o pipeline (que avisa quando vazio)', async () => {
    const repo = new FakeRepo()
    const notifier = new FakeNotifier()
    const pipeline = new RunPipeline([new FakeScraper('A', [])], repo, notifier, clockAt(12))

    await new RunOnce(pipeline).execute()
    expect(notifier.emptyCalls).toBe(1)
  })
})
