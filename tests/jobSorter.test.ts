import { sortJobsBySeniority } from '../src/sorters/jobSorter.js';
import { Job } from '../src/types/index.js';

describe('jobSorter', () => {
  it('should sort jobs by Pleno, Sênior, Júnior and Não Informado', () => {
    const jobs: Job[] = [
      { title: 'A', seniority: 'Não Informado', model: 'Home Office', link: '1' },
      { title: 'B', seniority: 'Júnior', model: 'Home Office', link: '2' },
      { title: 'C', seniority: 'Sênior', model: 'Home Office', link: '3' },
      { title: 'D', seniority: 'Pleno', model: 'Home Office', link: '4' }
    ];

    const sorted = sortJobsBySeniority(jobs);
    expect(sorted[0].seniority).toBe('Pleno');
    expect(sorted[1].seniority).toBe('Sênior');
    expect(sorted[2].seniority).toBe('Júnior');
    expect(sorted[3].seniority).toBe('Não Informado');
  });
});
