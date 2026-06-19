export type WorkModel = 'Home Office' | 'Híbrido' | 'Outro';
export type Seniority = 'Júnior' | 'Pleno' | 'Sênior' | 'Não Informado';

/**
 * Entidade central do domínio: uma vaga normalizada, independente da fonte.
 * `source` identifica o portal de origem (observabilidade / dedupe / analytics).
 * `publishedAt` é a data de publicação quando conhecida — base para recência e ordenação.
 */
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
  source?: string;
  /** Texto descritivo (sem HTML) usado para casar a stack quando o título é genérico. */
  description?: string;
}
