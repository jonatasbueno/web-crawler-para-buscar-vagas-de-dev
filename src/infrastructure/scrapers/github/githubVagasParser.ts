import { Job, Seniority, WorkModel } from '../../../domain/entities/Job.js'
import { parseEmail, parseSeniority } from '../support/parsing.js'

export interface GithubLabel {
  name: string
}

export interface GithubIssue {
  title: string
  body: string | null
  html_url: string
  created_at: string
  labels: GithubLabel[]
  /** Presente apenas quando o "issue" é, na verdade, um pull request. */
  pull_request?: unknown
}

function modelFromText (text: string): WorkModel | undefined {
  const t = text.toLowerCase()

  if (t.includes('remoto') || t.includes('remote') || t.includes('home office')) return 'Home Office'
  if (t.includes('híbrido') || t.includes('hibrido') || t.includes('hybrid')) return 'Híbrido'
  if (t.includes('presencial') || t.includes('alocado') || t.includes('on-site')) return 'Outro'

  return undefined
}

function seniorityFromLabels (labels: GithubLabel[]): Seniority | undefined {
  for (const { name } of labels) {
    const s = parseSeniority(name)

    if (s !== 'Não Informado') return s
  }

  return undefined
}

/** Tenta extrair o nome da empresa do título (após "-", "@" ou "na "). */
function companyFromTitle (title: string): string | undefined {
  const cleaned = title.replace(/\[[^\]]*\]/g, '').trim()
  const dash = cleaned.split(/\s[-–|@]\s/)

  if (dash.length > 1) return dash[dash.length - 1].trim() || undefined

  return undefined
}

function salaryFromBody (body: string): string | undefined {
  const line = body
    .split('\n')
    .find((l) => /sal[áa]rio|remunera|faixa|R\$\s?\d/i.test(l))

  if (!line) return undefined

  return line.replace(/[*#>_\x60-]/g, '').replace(/sal[áa]rio:?/i, '').trim().slice(0, 120) || undefined
}

/**
 * Converte uma issue de um repositório de vagas (org/vagas) do GitHub em uma vaga normalizada.
 * Detecta modelo e senioridade a partir de labels (mais confiável) e, na falta,
 * do título; extrai empresa, salário, e-mail e link externo do corpo em markdown.
 */
export function parseIssueToJob (issue: GithubIssue, source: string): Job {
  const labelText = issue.labels.map((l) => l.name).join(' ')
  const body = issue.body ?? ''

  const model: WorkModel =
    modelFromText(labelText) ?? modelFromText(issue.title) ?? modelFromText(body) ?? 'Home Office'

  const seniority: Seniority =
    seniorityFromLabels(issue.labels) ?? parseSeniority(issue.title) ?? 'Não Informado'

  return {
    title: issue.title,
    company: companyFromTitle(issue.title),
    link: issue.html_url,
    model,
    city: model === 'Híbrido' ? labelText : undefined,
    seniority,
    salary: salaryFromBody(body),
    contactEmail: parseEmail(body),
    publishedAt: new Date(issue.created_at),
    source
  }
}
