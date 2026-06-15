import { Seniority, WorkModel } from '../types/index.js';

export function parseSeniority(text: string): Seniority {
  const t = text.toLowerCase();
  if (t.includes('júnior') || t.includes('junior') || t.includes(' jr')) return 'Júnior';
  if (t.includes('sênior') || t.includes('senior') || t.includes(' sr')) return 'Sênior';
  if (t.includes('pleno') || t.includes(' pl')) return 'Pleno';
  return 'Não Informado';
}

export function parseWorkModel(text: string): WorkModel {
  const t = text.toLowerCase();
  if (t.includes('remoto') || t.includes('home office')) return 'Home Office';
  if (t.includes('híbrido') || t.includes('hibrido')) return 'Híbrido';
  return 'Outro';
}
