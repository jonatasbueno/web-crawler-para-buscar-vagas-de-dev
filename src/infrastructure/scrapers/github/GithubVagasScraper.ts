import { Job } from '../../../domain/entities/Job.js';
import { SourceScraper } from '../../../domain/ports/SourceScraper.js';
import { RECENCY_WINDOW_DAYS } from '../../../domain/services/JobEligibility.js';
import { HttpClient } from '../../http/HttpClient.js';
import { GithubIssue, parseIssueToJob } from './githubVagasParser.js';

const PER_PAGE = 100;
const MAX_PAGES = 5; // trava de segurança (até 500 issues por repo)
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Organizações com repositório `vagas` baseado em issues. */
export const GITHUB_VAGAS_ORGS: readonly string[] = [
  'frontendbr',
  'react-brasil',
  'flutterbr',
  'nodejsdevbr',
  'rustdevbr',
  'gommunity',
  'pydevbr',
  'phpdevbr',
  'rubydevbr',
  'frontend-ao',
  'frontend-pt',
];

/**
 * Scraper genérico para repositórios `{org}/vagas` do GitHub.
 * Usa a API REST de issues (JSON, com corpo em markdown), pagina por `created`
 * desc e para assim que encontra issues mais antigas que a janela de recência,
 * evitando varrer o histórico inteiro.
 */
export class GithubVagasScraper implements SourceScraper {
  readonly name: string;

  constructor(
    private readonly org: string,
    private readonly http: HttpClient = new HttpClient(),
    private readonly token: string | undefined = process.env.GITHUB_TOKEN,
    private readonly windowDays: number = RECENCY_WINDOW_DAYS
  ) {
    this.name = `GitHub:${org}/vagas`;
  }

  async scrape(): Promise<Job[]> {
    const cutoff = Date.now() - this.windowDays * MS_PER_DAY;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const jobs: Job[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url =
        `https://api.github.com/repos/${this.org}/vagas/issues` +
        `?state=open&sort=created&direction=desc&per_page=${PER_PAGE}&page=${page}`;

      const issues = await this.http.getJson<GithubIssue[]>(url, { headers });
      if (!Array.isArray(issues) || issues.length === 0) break;

      let reachedOld = false;
      for (const issue of issues) {
        if (issue.pull_request) continue; // a API mistura PRs entre as issues
        if (new Date(issue.created_at).getTime() < cutoff) {
          reachedOld = true;
          break; // ordenado por created desc: tudo a partir daqui é mais antigo
        }
        jobs.push(parseIssueToJob(issue, this.name));
      }

      if (reachedOld || issues.length < PER_PAGE) break;
    }

    return jobs;
  }
}

/** Instancia um scraper por organização configurada. */
export function createGithubVagasScrapers(
  http: HttpClient = new HttpClient(),
  token: string | undefined = process.env.GITHUB_TOKEN
): GithubVagasScraper[] {
  return GITHUB_VAGAS_ORGS.map((org) => new GithubVagasScraper(org, http, token));
}
