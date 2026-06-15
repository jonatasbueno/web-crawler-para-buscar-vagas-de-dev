import { Job } from '../types/index.js';

export function isJobValid(job: Job): boolean {
  if (job.publishedAt) {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - job.publishedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 28) return false;
  }

  if (job.model === 'Híbrido') {
    const city = job.city?.toLowerCase() || '';
    if (!city.includes('campinas') && !city.includes('piracicaba')) {
      return false;
    }
  } else if (job.model !== 'Home Office') {
    return false;
  }

  const fullText = `${job.title}`.toLowerCase();
  const isFrontend = fullText.includes('frontend') || fullText.includes('front-end') || fullText.includes('front') || fullText.includes('react') || fullText.includes('vue') || fullText.includes('angular');
  const isMobile = fullText.includes('mobile') || fullText.includes('react native') || fullText.includes('ios') || fullText.includes('android');

  if (!isFrontend && !isMobile) return false;

  return true;
}

export function filterJobs(jobs: Job[]): Job[] {
  return jobs.filter(isJobValid);
}
