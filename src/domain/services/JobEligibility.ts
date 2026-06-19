import { Job } from '../entities/Job.js'

/** Janela de recência: vagas publicadas há mais de 15 dias são descartadas. */
export const RECENCY_WINDOW_DAYS = 15

const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Keywords de stack consideradas elegíveis. Mantém o foco original
 * (Frontend / Mobile) e amplia para o ecossistema JavaScript e afins
 * (Node, Node-RED, Electron, Elixir, Backbone etc.).
 */
export const STACK_KEYWORDS: readonly string[] = [
  // Frontend
  'frontend', 'front-end', 'front end', 'react', 'reactjs', 'react.js',
  'vue', 'vuejs', 'vue.js', 'angular', 'svelte', 'next.js', 'nextjs',
  'nuxt', 'ember', 'backbone',
  // Mobile
  'mobile', 'react native', 'react-native', 'ios', 'android', 'flutter',
  'expo', 'electron',
  // Ecossistema JavaScript / Node e afins
  'javascript', 'typescript', 'js', 'node', 'nodejs', 'node.js', 'node-red',
  'nodered', 'express', 'nestjs', 'nest.js', 'fullstack', 'full-stack', 'full stack',
  'elixir', 'phoenix'
]

function escapeRegExp (s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Regex com fronteiras "alfanuméricas" para evitar falsos positivos por
 * substring (ex.: `ios` em "benefícios"/"negócios", `expo` em "exposição").
 */
const STACK_REGEX = new RegExp(
  `(?<![a-z0-9])(${STACK_KEYWORDS.map(escapeRegExp).join('|')})(?![a-z0-9])`,
  'i'
)

/** Cidades aceitas no modelo híbrido. */
const HYBRID_CITIES = ['campinas', 'piracicaba']

export function isRecent (
  job: Job,
  now: Date = new Date(),
  windowDays: number = RECENCY_WINDOW_DAYS
): boolean {
  if (job.publishedAt == null) return true // data desconhecida: não descarta por recência
  const diffDays = (now.getTime() - job.publishedAt.getTime()) / MS_PER_DAY

  return diffDays <= windowDays
}

export function matchesStack (job: Job): boolean {
  const text = `${job.title} ${job.description ?? ''}`

  return STACK_REGEX.test(text)
}

export function matchesModel (job: Job): boolean {
  if (job.model === 'Home Office') return true
  if (job.model === 'Híbrido') {
    const city = job.city?.toLowerCase() ?? ''

    return HYBRID_CITIES.some((c) => city.includes(c))
  }

  return false
}

/** Regra de negócio central: a vaga é elegível para notificação? */
export function isJobEligible (job: Job, now: Date = new Date()): boolean {
  return isRecent(job, now) && matchesModel(job) && matchesStack(job)
}

export function filterEligibleJobs (jobs: Job[], now: Date = new Date()): Job[] {
  return jobs.filter((job) => isJobEligible(job, now))
}
