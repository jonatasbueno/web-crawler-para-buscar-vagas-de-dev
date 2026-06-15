import { isJobValid, filterJobs } from '../src/filters/jobFilter.js';
import { Job } from '../src/types/index.js';

describe('jobFilter', () => {
  const baseJob: Job = {
    title: 'Frontend Developer',
    model: 'Home Office',
    link: 'http://test.com',
    seniority: 'Pleno'
  };

  it('should invalidate old jobs (>28 days)', () => {
    const oldJob = { ...baseJob, publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    expect(isJobValid(oldJob)).toBe(false);
  });

  it('should validate recent jobs', () => {
    const recentJob = { ...baseJob, publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) };
    expect(isJobValid(recentJob)).toBe(true);
  });

  it('should invalidate hybrid outside campinas/piracicaba', () => {
    const invalidHybrid = { ...baseJob, model: 'Híbrido', city: 'São Paulo' } as Job;
    expect(isJobValid(invalidHybrid)).toBe(false);
  });

  it('should validate hybrid in campinas', () => {
    const validHybrid = { ...baseJob, model: 'Híbrido', city: 'Campinas - SP' } as Job;
    expect(isJobValid(validHybrid)).toBe(true);
  });

  it('should validate hybrid in piracicaba', () => {
    const validHybrid = { ...baseJob, model: 'Híbrido', city: 'Piracicaba' } as Job;
    expect(isJobValid(validHybrid)).toBe(true);
  });

  it('should invalidate non-frontend/mobile jobs', () => {
    const backendJob = { ...baseJob, title: 'Backend Developer Java' };
    expect(isJobValid(backendJob)).toBe(false);
  });

  it('should validate react native jobs', () => {
    const mobileJob = { ...baseJob, title: 'React Native Developer' };
    expect(isJobValid(mobileJob)).toBe(true);
  });

  it('should validate ios jobs', () => {
    const mobileJob = { ...baseJob, title: 'iOS Developer' };
    expect(isJobValid(mobileJob)).toBe(true);
  });

  it('should filter an array of jobs', () => {
    const jobs = [
      { ...baseJob, title: 'Backend' }, // invalid
      { ...baseJob, title: 'Frontend' } // valid
    ];
    expect(filterJobs(jobs).length).toBe(1);
    expect(filterJobs(jobs)[0].title).toBe('Frontend');
  });

  it('should invalidate if model is Outro', () => {
    const outroJob = { ...baseJob, model: 'Outro' } as Job;
    expect(isJobValid(outroJob)).toBe(false);
  });

  it('should invalidate hybrid without city', () => {
    const hybridNoCity = { ...baseJob, model: 'Híbrido', city: undefined } as Job;
    expect(isJobValid(hybridNoCity)).toBe(false);
  });
});
