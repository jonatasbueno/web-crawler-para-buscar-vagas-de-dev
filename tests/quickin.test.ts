import {
  parseQuickinDoc,
  createQuickinScrapers,
  extractQuickinJobsNode,
  QuickinScraper,
  QuickinDoc,
  DEFAULT_QUICKIN_COMPANIES
} from '../src/infrastructure/scrapers/quickin.js'
import { HttpClient } from '../src/infrastructure/http/HttpClient.js'

function doc (overrides: Partial<QuickinDoc> = {}): QuickinDoc {
  return {
    _id: 'abc123',
    title: 'Desenvolvedor',
    description: '<ul><li>Stack: <strong>React</strong> &amp; Node</li></ul>',
    requirements: '<p>Experi&ecirc;ncia com TypeScript</p>',
    city: 'Campinas',
    region: 'SP',
    workplace_type: 'remote',
    career_url: 'https://jobs.quickin.io/avanttibr/jobs/abc123',
    created_at: '2026-06-12T00:00:00Z',
    publicate: 'published',
    ...overrides
  }
}

const SAMPLE_HTML = `<html><head></head><body>
<script>window.__NUXT__=(function(){return {layout:"default",data:[{jobs:{docs:[
{_id:"1",title:"Desenvolvedor React",workplace_type:"remote",career_url:"https://jobs.quickin.io/avanttibr/jobs/1",created_at:"2026-06-12T00:00:00Z",publicate:"published"},
{_id:"2",title:"Rascunho",workplace_type:"remote",publicate:"draft"}
],total:2,page:1,pages:1}}]};}());</script>
</body></html>`

describe('parseQuickinDoc', () => {
  it('mapeia os campos e limpa o HTML da descrição', () => {
    const job = parseQuickinDoc(doc(), 'avanttibr')
    expect(job.title).toBe('Desenvolvedor')
    expect(job.link).toBe('https://jobs.quickin.io/avanttibr/jobs/abc123')
    expect(job.model).toBe('Home Office')
    expect(job.source).toBe('Quickin:avanttibr')
    expect(job.publishedAt).toEqual(new Date('2026-06-12T00:00:00Z'))
    expect(job.description).toContain('React & Node')
    expect(job.description).toContain('TypeScript')
    expect(job.description).not.toContain('<')
  })

  it('detecta híbrido e preenche a cidade', () => {
    const job = parseQuickinDoc(doc({ workplace_type: 'hybrid' }), 'avanttibr')
    expect(job.model).toBe('Híbrido')
    expect(job.city).toBe('Campinas - SP')
  })

  it('infere senioridade e constrói o link sem career_url', () => {
    expect(parseQuickinDoc(doc({ title: 'Tech Lead Sênior' }), 'x').seniority).toBe('Sênior')
    expect(parseQuickinDoc(doc({ career_url: undefined }), 'avanttibr').link).toBe(
      'https://jobs.quickin.io/avanttibr/jobs/abc123'
    )
  })
})

describe('extractQuickinJobsNode', () => {
  it('extrai o nó de vagas do __NUXT__ embutido', () => {
    const node = extractQuickinJobsNode(SAMPLE_HTML)
    expect(node?.total).toBe(2)
    expect(node?.pages).toBe(1)
    expect(node?.docs).toHaveLength(2)
  })

  it('retorna null sem __NUXT__ ou com expressão inválida', () => {
    expect(extractQuickinJobsNode('<html>sem nuxt</html>')).toBeNull()
    expect(extractQuickinJobsNode('<script>window.__NUXT__=({{</script>')).toBeNull()
  })
})

describe('QuickinScraper.scrape', () => {
  function fakeHttp (html: string | Error): HttpClient {
    return {
      async getText () {
        if (html instanceof Error) throw html

        return html
      }
    } as unknown as HttpClient
  }

  it('coleta vagas publicadas e ignora rascunhos', async () => {
    const jobs = await new QuickinScraper('avanttibr', fakeHttp(SAMPLE_HTML)).scrape()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('Desenvolvedor React')
    expect(jobs[0].source).toBe('Quickin:avanttibr')
  })

  it('degrada para [] em erro de rede (best-effort)', async () => {
    const jobs = await new QuickinScraper('x', fakeHttp(new Error('timeout'))).scrape()
    expect(jobs).toEqual([])
  })
})

describe('createQuickinScrapers', () => {
  const original = process.env.QUICKIN_COMPANIES
  afterEach(() => {
    if (original === undefined) delete process.env.QUICKIN_COMPANIES
    else process.env.QUICKIN_COMPANIES = original
  })

  it('usa a lista padrão quando QUICKIN_COMPANIES não está definida', () => {
    delete process.env.QUICKIN_COMPANIES
    const scrapers = createQuickinScrapers()
    expect(scrapers).toHaveLength(DEFAULT_QUICKIN_COMPANIES.length)
    expect(scrapers[0].name).toBe('Quickin:avanttibr')
  })

  it('lê empresas de QUICKIN_COMPANIES', () => {
    process.env.QUICKIN_COMPANIES = 'avanttibr, koin ,sek'
    expect(createQuickinScrapers().map((s) => s.name)).toEqual([
      'Quickin:avanttibr',
      'Quickin:koin',
      'Quickin:sek'
    ])
  })
})
