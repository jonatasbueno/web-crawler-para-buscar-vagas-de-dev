import { Seniority, WorkModel } from '../../../domain/entities/Job.js'

/** Heurística para inferir senioridade a partir de texto livre (título/descrição/labels). */
export function parseSeniority (text: string): Seniority {
  const t = ` ${text.toLowerCase()} `

  if (t.includes('júnior') || t.includes('junior') || t.includes(' jr')) return 'Júnior'
  if (t.includes('sênior') || t.includes('senior') || t.includes(' sr')) return 'Sênior'
  if (t.includes('pleno') || t.includes(' pl')) return 'Pleno'

  return 'Não Informado'
}

/**
 * Heurística para inferir o modelo de trabalho a partir de texto livre.
 * Usa radicais para cobrir variações de gênero/idioma ("remoto", "remota",
 * "remote", "híbrido", "híbrida", "hybrid").
 */
export function parseWorkModel (text: string): WorkModel {
  const t = text.toLowerCase()

  if (t.includes('remot') || t.includes('home office') || t.includes('home-office')) { return 'Home Office' }
  if (t.includes('híbrid') || t.includes('hibrid') || t.includes('hybrid')) return 'Híbrido'

  return 'Outro'
}

/**
 * Converte datas relativas em português ("há 2 dias", "Postada há 1 dia",
 * "há 3 horas") em uma data absoluta. Retorna `undefined` se não reconhecer.
 */
export function parseRelativeDate (text: string, now: Date = new Date()): Date | undefined {
  const t = text.toLowerCase()

  if (t.includes('hoje') || t.includes('agora')) return new Date(now)
  const m = t.match(/h[áa]\s+(\d+)\s+(hora|dia|semana|m[êe]s|mes)/)

  if (m == null) return undefined
  const n = parseInt(m[1], 10)
  const unit = m[2]
  const d = new Date(now)

  if (unit.startsWith('hora')) d.setHours(d.getHours() - n)
  else if (unit.startsWith('dia')) d.setDate(d.getDate() - n)
  else if (unit.startsWith('semana')) d.setDate(d.getDate() - n * 7)
  else d.setMonth(d.getMonth() - n)

  return d
}

/** Converte um slug de URL ("desenvolvedor-react-123") em título legível. */
export function slugToTitle (slug: string): string {
  return slug
    .replace(/-\d+$/, '')
    .replace(/-and-/g, ' & ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Remove tags HTML e decodifica entidades comuns, colapsando espaços. */
export function stripHtml (html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&(quot|#34);/gi, '"')
    .replace(/&(#39|apos);/gi, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Colapsa espaços em branco e remove rótulos de destaque comuns. */
export function cleanTitle (text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^(destaque|patrocinad[oa]|novo)\s*[|:-]?\s*/i, '')
    .trim()
}

/** Extrai o primeiro e-mail encontrado em um texto, se houver. */
export function parseEmail (text: string): string | undefined {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)

  return match?.[0]
}

/** Extrai a primeira URL http(s) encontrada em um texto, se houver. */
export function parseFirstUrl (text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s)>\]]+/)

  return match?.[0]
}
