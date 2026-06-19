import {
  isJobEligible,
  filterEligibleJobs,
  isRecent,
  matchesStack,
  matchesModel,
} from '../src/domain/services/JobEligibility.js';
import { Job } from '../src/domain/entities/Job.js';

const NOW = new Date('2026-06-17T12:00:00Z');

const baseJob: Job = {
  title: 'Frontend Developer',
  model: 'Home Office',
  link: 'http://test.com',
  seniority: 'Pleno',
};

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

describe('JobEligibility - recência (15 dias)', () => {
  it('descarta vagas com mais de 15 dias', () => {
    expect(isRecent({ ...baseJob, publishedAt: daysAgo(16) }, NOW)).toBe(false);
  });

  it('mantém vagas dentro de 15 dias', () => {
    expect(isRecent({ ...baseJob, publishedAt: daysAgo(15) }, NOW)).toBe(true);
    expect(isRecent({ ...baseJob, publishedAt: daysAgo(1) }, NOW)).toBe(true);
  });

  it('mantém vagas sem data de publicação', () => {
    expect(isRecent({ ...baseJob, publishedAt: undefined }, NOW)).toBe(true);
  });
});

describe('JobEligibility - stack ampliada', () => {
  const eligibleTitles = [
    'Frontend Developer',
    'Desenvolvedor React',
    'Vue.js Engineer',
    'Angular Dev',
    'React Native Developer',
    'iOS Developer',
    'Android Engineer',
    'Flutter Dev',
    'Node.js Backend',
    'Especialista Node-RED',
    'Electron Desktop Engineer',
    'Desenvolvedor Elixir',
    'Backbone Maintainer',
    'TypeScript Fullstack',
  ];

  it.each(eligibleTitles)('considera elegível: %s', (title) => {
    expect(matchesStack({ ...baseJob, title })).toBe(true);
  });

  it('rejeita stacks fora do escopo', () => {
    expect(matchesStack({ ...baseJob, title: 'Desenvolvedor Java Spring' })).toBe(false);
    expect(matchesStack({ ...baseJob, title: 'Analista de Dados Python' })).toBe(false);
  });

  it('casa a stack pela descrição quando o título é genérico', () => {
    expect(matchesStack({ ...baseJob, title: 'Pessoa Desenvolvedora', description: 'vaga com React e Node' })).toBe(true);
    expect(matchesStack({ ...baseJob, title: 'Tech Lead', description: 'projeto em Java e Spring' })).toBe(false);
  });

  it('não casa por substring em palavras comuns (benefícios/negócios/exposição)', () => {
    expect(matchesStack({ ...baseJob, title: 'Consultor SAP', description: 'ótimos benefícios e negócios na área' })).toBe(false);
    expect(matchesStack({ ...baseJob, title: 'Analista de Exposição de Riscos' })).toBe(false);
    // mas reconhece os tokens reais isolados
    expect(matchesStack({ ...baseJob, title: 'iOS Developer' })).toBe(true);
    expect(matchesStack({ ...baseJob, title: 'Vaga JS', description: 'projeto em Express e Expo' })).toBe(true);
  });
});

describe('JobEligibility - modalidade', () => {
  it('aceita Home Office', () => {
    expect(matchesModel({ ...baseJob, model: 'Home Office' })).toBe(true);
  });

  it('aceita Híbrido em Campinas/Piracicaba', () => {
    expect(matchesModel({ ...baseJob, model: 'Híbrido', city: 'Campinas - SP' })).toBe(true);
    expect(matchesModel({ ...baseJob, model: 'Híbrido', city: 'Piracicaba' })).toBe(true);
  });

  it('rejeita Híbrido fora de Campinas/Piracicaba e sem cidade', () => {
    expect(matchesModel({ ...baseJob, model: 'Híbrido', city: 'São Paulo' })).toBe(false);
    expect(matchesModel({ ...baseJob, model: 'Híbrido', city: undefined })).toBe(false);
  });

  it('rejeita modelo Outro', () => {
    expect(matchesModel({ ...baseJob, model: 'Outro' })).toBe(false);
  });
});

describe('JobEligibility - composição', () => {
  it('isJobEligible combina recência, modalidade e stack', () => {
    expect(isJobEligible({ ...baseJob, publishedAt: daysAgo(5) }, NOW)).toBe(true);
    expect(isJobEligible({ ...baseJob, title: 'Backend Java' }, NOW)).toBe(false);
    expect(isJobEligible({ ...baseJob, publishedAt: daysAgo(20) }, NOW)).toBe(false);
  });

  it('filterEligibleJobs filtra a lista', () => {
    const jobs: Job[] = [
      { ...baseJob, title: 'Backend Java', link: 'a' },
      { ...baseJob, title: 'Frontend React', link: 'b' },
    ];
    const result = filterEligibleJobs(jobs, NOW);
    expect(result).toHaveLength(1);
    expect(result[0].link).toBe('b');
  });
});
