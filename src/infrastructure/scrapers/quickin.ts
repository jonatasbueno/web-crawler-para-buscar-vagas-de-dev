import vm from 'node:vm';
import { SourceScraper } from '../../domain/ports/SourceScraper.js';
import { Job } from '../../domain/entities/Job.js';
import { parseSeniority, parseWorkModel, stripHtml } from './support/parsing.js';
import { HttpClient } from '../http/HttpClient.js';

const PAGE_CAP = 10; // trava de segurança por empresa

/** Empresas (slugs) com board hospedado no Quickin. Override via QUICKIN_COMPANIES. */
export const DEFAULT_QUICKIN_COMPANIES: readonly string[] = [
  'avanttibr', 'quickin', 'greentalents', 'pessoalizerh', 'gruponunchi', 'macfor',
  'nposistemas', 'inspin', 'cadmus', 'indt', 'fitoag', 'koin', 'opencircle', 'inoveben',
  'buddhaspa', 'recrutify', 'infovagas', 'triade', 'reply', 'globalti', 'registradores',
  'tagna', 'recrutiva', 'nexer', 'avvale', 'sek',
];

/** Documento de vaga conforme o estado `__NUXT__` do board Quickin. */
export interface QuickinDoc {
  _id: string;
  title: string;
  description?: string;
  requirements?: string;
  city?: string;
  region?: string;
  country?: string;
  workplace_type?: string;
  career_url?: string;
  created_at?: string;
  publicate?: string;
}

export interface QuickinJobsNode {
  docs: QuickinDoc[];
  total: number;
  page: number;
  pages: number;
}

/**
 * Extrai o nó de vagas do estado SSR `window.__NUXT__` embutido no HTML.
 * O valor é uma IIFE de serialização do Nuxt; é avaliado num contexto `vm`
 * isolado (sem acesso a globais) apenas para reconstruir o objeto de dados.
 */
export function extractQuickinJobsNode(html: string): QuickinJobsNode | null {
  const match = html.match(/window\.__NUXT__=(.*?)<\/script>/s);
  if (!match) return null;
  const expression = match[1].replace(/;\s*$/, '');
  try {
    const state = vm.runInNewContext(expression, Object.create(null), { timeout: 1000 }) as {
      data?: { jobs?: QuickinJobsNode }[];
    };
    return state?.data?.[0]?.jobs ?? null;
  } catch {
    return null;
  }
}

/** Converte um documento do Quickin em uma vaga normalizada (função pura). */
export function parseQuickinDoc(doc: QuickinDoc, company: string): Job {
  const location = [doc.city, doc.region].filter(Boolean).join(' - ');
  const model = parseWorkModel(`${doc.workplace_type ?? ''} ${location}`);
  const description = stripHtml(`${doc.description ?? ''} ${doc.requirements ?? ''}`).slice(0, 2000);

  return {
    title: doc.title,
    link: doc.career_url || `https://jobs.quickin.io/${company}/jobs/${doc._id}`,
    model,
    city: model === 'Híbrido' ? location || undefined : undefined,
    seniority: parseSeniority(`${doc.title} ${description}`),
    publishedAt: doc.created_at ? new Date(doc.created_at) : undefined,
    description,
    source: `Quickin:${company}`,
  };
}

/**
 * Coleta o board de vagas de uma empresa hospedado no Quickin (ATS, Nuxt).
 * Os dados vêm embutidos no estado SSR `window.__NUXT__` (lido via axios), com
 * paginação por `?page=N` (campo `pages` informa o total).
 */
export class QuickinScraper implements SourceScraper {
  readonly name: string;

  constructor(
    private readonly company: string,
    private readonly http: HttpClient = new HttpClient()
  ) {
    this.name = `Quickin:${company}`;
  }

  async scrape(): Promise<Job[]> {
    const jobs: Job[] = [];
    try {
      let pages = 1;
      for (let page = 1; page <= Math.min(pages, PAGE_CAP); page++) {
        const html = await this.http.getText(
          `https://jobs.quickin.io/${this.company}/jobs?page=${page}`
        );
        const node = extractQuickinJobsNode(html);
        if (!node) break;
        pages = node.pages ?? 1;

        const docs = node.docs ?? [];
        for (const doc of docs) {
          if (doc.publicate && doc.publicate !== 'published') continue;
          jobs.push(parseQuickinDoc(doc, this.company));
        }
        if (docs.length === 0) break;
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.log(`[${this.name}] coleta indisponível (best-effort): ${reason}`);
    }
    return jobs;
  }
}

/**
 * Cria um scraper por empresa configurada. Os slugs vêm de `QUICKIN_COMPANIES`
 * (separados por vírgula); na ausência, usa a lista padrão.
 */
export function createQuickinScrapers(http: HttpClient = new HttpClient()): QuickinScraper[] {
  const configured = process.env.QUICKIN_COMPANIES?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const slugs = configured && configured.length > 0 ? configured : [...DEFAULT_QUICKIN_COMPANIES];
  return slugs.map((slug) => new QuickinScraper(slug, http));
}
