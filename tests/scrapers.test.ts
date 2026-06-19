import { HttpClient } from '../src/infrastructure/http/HttpClient.js'
import { GupyScraper } from '../src/infrastructure/scrapers/gupy.js'
import { ProgramaThorScraper } from '../src/infrastructure/scrapers/programathor.js'
import { LinkedinScraper } from '../src/infrastructure/scrapers/linkedin.js'
import { VagasComScraper } from '../src/infrastructure/scrapers/vagascom.js'
import { ApinfoScraper } from '../src/infrastructure/scrapers/apinfo.js'
import { GeekHunterScraper, ReveloScraper } from '../src/infrastructure/scrapers/others.js'

/** HttpClient falso: retorna o conteúdo na primeira chamada e vazio nas seguintes. */
function fakeHttp (opts: { text?: string, json?: unknown, decoded?: string }): HttpClient {
  let t = 0
  let j = 0
  let d = 0

  return {
    async getText () {
      return t++ === 0 ? opts.text ?? '' : ''
    },
    async getJson () {
      return j++ === 0 ? opts.json ?? { data: [] } : { data: [] }
    },
    async getDecodedText () {
      return d++ === 0 ? opts.decoded ?? '' : ''
    }
  } as unknown as HttpClient
}

describe('GupyScraper', () => {
  it('parseia vagas da API JSON e detecta modelo', async () => {
    const json = {
      data: [
        { name: 'Frontend Sênior', careerPageName: 'Acme', jobUrl: 'http://gupy/1', isRemoteWork: true, publishedDate: '2026-06-10' },
        { name: 'Dev Node', careerPageName: 'Beta', jobUrl: 'http://gupy/2', isRemoteWork: false, city: 'Campinas', publishedDate: '2026-06-11' }
      ]
    }
    const jobs = await new GupyScraper(fakeHttp({ json })).scrape()
    expect(jobs).toHaveLength(2)
    expect(jobs[0].model).toBe('Home Office')
    expect(jobs[1].model).toBe('Híbrido')
    expect(jobs[0].source).toBe('Gupy')
  })

  it('trata vaga não-remota e sem cidade como modelo Outro e ignora itens sem URL', async () => {
    const json = {
      data: [
        { name: 'Dev Outro', careerPageName: 'X', jobUrl: 'http://gupy/3', isRemoteWork: false },
        { name: 'Sem URL', careerPageName: 'Y', jobUrl: '' }
      ]
    }
    const jobs = await new GupyScraper(fakeHttp({ json })).scrape()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].model).toBe('Outro')
    expect(jobs[0].city).toBeUndefined()
  })

  it('propaga erro de rede (isolado pelo pipeline)', async () => {
    const http = { async getJson () { throw new Error('net') } } as unknown as HttpClient
    await expect(new GupyScraper(http).scrape()).rejects.toThrow('net')
  })
})

describe('ProgramaThorScraper', () => {
  it('parseia vagas do HTML', async () => {
    const text = `
      <a class="cell-list" href="/job/123">
        <div class="text-24">Frontend Pleno</div>
        <div class="text-16">Thor Tech</div>
        <div class="text-14">Híbrido em São Paulo</div>
      </a>`
    const jobs = await new ProgramaThorScraper(fakeHttp({ text })).scrape()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('Frontend Pleno')
    expect(jobs[0].model).toBe('Híbrido')
    expect(jobs[0].link).toBe('https://programathor.com.br/job/123')
  })

  it('ignora células sem título/href e infere senioridade do infoText', async () => {
    const text = `
      <a class="cell-list" href="/job/1">
        <div class="text-24">Desenvolvedor</div>
        <div class="text-16">Tech</div>
        <div class="text-14">Remoto - Sênior</div>
      </a>
      <a class="cell-list">
        <div class="text-24"></div>
      </a>`
    const jobs = await new ProgramaThorScraper(fakeHttp({ text })).scrape()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].seniority).toBe('Sênior')
    expect(jobs[0].model).toBe('Home Office')
  })
})

describe('LinkedinScraper', () => {
  it('parseia cards e limpa tracking do link', async () => {
    const text = `
      <ul><li>
        <div class="base-search-card__title">React Native Developer</div>
        <div class="base-search-card__subtitle">Tech Corp</div>
        <a class="base-card__full-link" href="http://linkedin.com/job1?trk=123"></a>
        <span class="job-search-card__location">Brasil</span>
        <time datetime="2026-06-12"></time>
      </li></ul>`
    const jobs = await new LinkedinScraper(fakeHttp({ text })).scrape()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].link).toBe('http://linkedin.com/job1')
    expect(jobs[0].model).toBe('Home Office')
    expect(jobs[0].publishedAt).toEqual(new Date('2026-06-12'))
  })
})

describe('VagasComScraper', () => {
  it('parseia vagas do HTML', async () => {
    const text = `
      <div class="vaga">
        <a class="link-detalhes-vaga" href="/vaga/123">Desenvolvedor React</a>
        <span class="emprVaga">Vagas Tech</span>
        <span class="vaga-local">Remoto</span>
      </div>`
    const jobs = await new VagasComScraper(fakeHttp({ text })).scrape()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('Desenvolvedor React')
    expect(jobs[0].model).toBe('Home Office')
    expect(jobs[0].link).toBe('https://www.vagas.com.br/vaga/123')
  })
})

describe('ApinfoScraper', () => {
  it('parseia a home server-rendered (ISO-8859-1)', async () => {
    const decoded = `
      <div class="bloco-vaga-unica">
        <div class="nome-vaga"><a href="https://www.apinfo.com/x?codvaga=1">Desenvolvedor Frontend</a></div>
        <div class="data">Home Office - HO</div>
        <div class="empresa">Acme</div>
      </div>`
    const jobs = await new ApinfoScraper(fakeHttp({ decoded })).scrape()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('Desenvolvedor Frontend')
    expect(jobs[0].company).toBe('Acme')
    expect(jobs[0].model).toBe('Home Office')
  })
})

describe('Fontes best-effort (GeekHunter / Revelo)', () => {
  it('retornam vazio sem quebrar', async () => {
    expect(await new GeekHunterScraper().scrape()).toEqual([])
    expect(await new ReveloScraper().scrape()).toEqual([])
  })
})
