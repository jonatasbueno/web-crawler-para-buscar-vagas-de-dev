import { parseIssueToJob, GithubIssue } from '../src/infrastructure/scrapers/github/githubVagasParser.js'

function issue (overrides: Partial<GithubIssue>): GithubIssue {
  return {
    title: 'Vaga',
    body: '',
    html_url: 'https://github.com/frontendbr/vagas/issues/1',
    created_at: '2026-06-10T00:00:00Z',
    labels: [],
    ...overrides
  }
}

describe('parseIssueToJob', () => {
  it('mapeia campos básicos e usa created_at como publishedAt', () => {
    const job = parseIssueToJob(
      issue({ title: '[Remoto] Desenvolvedor React - Acme', created_at: '2026-06-10T00:00:00Z' }),
      'GitHub:frontendbr/vagas'
    )
    expect(job.title).toContain('Desenvolvedor React')
    expect(job.link).toBe('https://github.com/frontendbr/vagas/issues/1')
    expect(job.source).toBe('GitHub:frontendbr/vagas')
    expect(job.publishedAt).toEqual(new Date('2026-06-10T00:00:00Z'))
    expect(job.company).toBe('Acme')
  })

  it('detecta modelo e senioridade a partir das labels', () => {
    const job = parseIssueToJob(
      issue({ title: 'Dev', labels: [{ name: 'Remoto' }, { name: 'Sênior' }] }),
      'src'
    )
    expect(job.model).toBe('Home Office')
    expect(job.seniority).toBe('Sênior')
  })

  it('reconhece modelo híbrido e presencial', () => {
    expect(parseIssueToJob(issue({ labels: [{ name: 'Híbrido' }] }), 's').model).toBe('Híbrido')
    expect(parseIssueToJob(issue({ labels: [{ name: 'Presencial' }] }), 's').model).toBe('Outro')
  })

  it('extrai salário e e-mail do corpo markdown', () => {
    const body = '## Sobre\nSalário: R$ 12.000\nContato: jobs@acme.dev\n'
    const job = parseIssueToJob(issue({ body }), 's')
    expect(job.salary).toContain('12.000')
    expect(job.contactEmail).toBe('jobs@acme.dev')
  })

  it('faz fallback para Home Office quando nada indica o modelo', () => {
    const job = parseIssueToJob(issue({ title: 'Dev', body: '', labels: [] }), 's')
    expect(job.model).toBe('Home Office')
    expect(job.seniority).toBe('Não Informado')
  })
})
