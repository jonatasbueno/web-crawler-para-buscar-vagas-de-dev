export type WorkModel = 'Home Office' | 'Híbrido' | 'Outro';
export type Seniority = 'Júnior' | 'Pleno' | 'Sênior' | 'Não Informado';

export interface Job {
  title: string;
  salary?: string;
  company?: string;
  model: WorkModel;
  city?: string;
  link: string;
  contactEmail?: string;
  seniority: Seniority;
  publishedAt?: Date;
}
