import * as cheerio from 'cheerio'
import { extractIndeedJobs, isMechanicalRole } from '../src/infrastructure/scrapers/indeed.js'

const HTML = `
<div class="job_seen_beacon">
  <h2 class="jobTitle"><a class="jcs-JobTitle" data-jk="abc123">Desenvolvedor(a) Full Stack React</a></h2>
  <span data-testid="company-name">Acme</span>
  <div data-testid="text-location">Remoto</div>
</div>
<div class="job_seen_beacon">
  <h2 class="jobTitle"><a class="jcs-JobTitle" data-jk="def456">Programador CNC Torno</a></h2>
  <span data-testid="company-name">MetalCorp</span>
  <div data-testid="text-location">Híbrido em Campinas, SP</div>
</div>
<div class="job_seen_beacon">
  <h2 class="jobTitle"><a class="jcs-JobTitle">Sem JK</a></h2>
</div>`

describe('extractIndeedJobs', () => {
  it('extrai título, empresa, link (viewjob?jk) e modelo', () => {
    const jobs = extractIndeedJobs(cheerio.load(HTML))
    expect(jobs).toHaveLength(2) // o terceiro card não tem jk → ignorado
    const fullstack = jobs[0]
    expect(fullstack.title).toBe('Desenvolvedor(a) Full Stack React')
    expect(fullstack.company).toBe('Acme')
    expect(fullstack.link).toBe('https://br.indeed.com/viewjob?jk=abc123')
    expect(fullstack.model).toBe('Home Office')
    expect(fullstack.source).toBe('Indeed')
  })

  it('reconhece modelo híbrido com cidade', () => {
    const jobs = extractIndeedJobs(cheerio.load(HTML))
    expect(jobs[1].model).toBe('Híbrido')
    expect(jobs[1].city).toContain('Campinas')
  })
})

describe('isMechanicalRole', () => {
  it('detecta vagas de torno CNC / mecânica', () => {
    expect(isMechanicalRole('Programador CNC Torno')).toBe(true)
    expect(isMechanicalRole('Operador de usinagem')).toBe(true)
    expect(isMechanicalRole('Técnico em soldagem')).toBe(true)
    expect(isMechanicalRole('Engenheiro Mecânico de Produto')).toBe(true)
  })

  it('não descarta vagas de software', () => {
    expect(isMechanicalRole('Desenvolvedor Full Stack React')).toBe(false)
    expect(isMechanicalRole('Programador Node.js')).toBe(false)
  })
})
