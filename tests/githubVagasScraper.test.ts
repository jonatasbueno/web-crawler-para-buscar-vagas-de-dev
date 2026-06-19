import { jest } from '@jest/globals';
import {
  GithubVagasScraper,
  createGithubVagasScrapers,
  GITHUB_VAGAS_ORGS,
} from '../src/infrastructure/scrapers/github/GithubVagasScraper.js';
import { GithubIssue } from '../src/infrastructure/scrapers/github/githubVagasParser.js';
import { HttpClient } from '../src/infrastructure/http/HttpClient.js';

function issue(daysAgo: number, extra: Partial<GithubIssue> = {}): GithubIssue {
  return {
    title: 'Frontend Dev',
    body: '',
    html_url: `https://github.com/org/vagas/issues/${Math.random()}`,
    created_at: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    labels: [],
    ...extra,
  };
}

function fakeHttp(getJson: (url: string, opts?: any) => Promise<unknown>): HttpClient {
  return { getJson } as unknown as HttpClient;
}

describe('GithubVagasScraper', () => {
  it('para de paginar ao encontrar issues mais antigas que a janela de recência', async () => {
    const page1 = [issue(2), issue(3), issue(20)]; // a de 20 dias corta
    const getJson = jest.fn(async () => page1);
    const scraper = new GithubVagasScraper('frontendbr', fakeHttp(getJson as any), undefined, 15);

    const jobs = await scraper.scrape();

    expect(jobs).toHaveLength(2);
    expect(getJson).toHaveBeenCalledTimes(1);
  });

  it('ignora pull requests retornados pela API de issues', async () => {
    const getJson = jest.fn(async () => [issue(1), issue(1, { pull_request: {} })]);
    const scraper = new GithubVagasScraper('frontendbr', fakeHttp(getJson as any), undefined, 15);

    const jobs = await scraper.scrape();
    expect(jobs).toHaveLength(1);
  });

  it('inclui o header Authorization quando há token', async () => {
    let capturedHeaders: any;
    const getJson = jest.fn(async (_url: string, opts: any) => {
      capturedHeaders = opts.headers;
      return [];
    });
    const scraper = new GithubVagasScraper('frontendbr', fakeHttp(getJson as any), 'tkn-123', 15);

    await scraper.scrape();
    expect(capturedHeaders.Authorization).toBe('Bearer tkn-123');
    expect(scraper.name).toBe('GitHub:frontendbr/vagas');
  });

  it('retorna vazio quando o repositório não tem issues', async () => {
    const scraper = new GithubVagasScraper('frontendbr', fakeHttp(async () => []), undefined, 15);
    expect(await scraper.scrape()).toEqual([]);
  });

  it('createGithubVagasScrapers instancia um scraper por organização', () => {
    const scrapers = createGithubVagasScrapers(fakeHttp(async () => []));
    expect(scrapers).toHaveLength(GITHUB_VAGAS_ORGS.length);
    expect(scrapers[0].name).toBe(`GitHub:${GITHUB_VAGAS_ORGS[0]}/vagas`);
  });
});
