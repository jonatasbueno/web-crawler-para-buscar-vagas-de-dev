import { Job, Seniority } from '../types/index.js';

const SENIORITY_WEIGHT: Record<Seniority, number> = {
  'Pleno': 1,
  'Sênior': 2,
  'Júnior': 3,
  'Não Informado': 4
};

export function sortJobsBySeniority(jobs: Job[]): Job[] {
  return jobs.sort((a, b) => SENIORITY_WEIGHT[a.seniority] - SENIORITY_WEIGHT[b.seniority]);
}
