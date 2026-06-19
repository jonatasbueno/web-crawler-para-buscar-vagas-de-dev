import { Job } from '../entities/Job.js';

/**
 * Porta de saída para notificações (Slack na implementação atual).
 * `sendEmpty` é chamado quando o pipeline termina sem vagas novas — todos os
 * modos de execução (agendado, catch-up e avulso) avisam quando vazio.
 */
export interface Notifier {
  sendJobs(jobs: Job[]): Promise<void>;
  sendEmpty(): Promise<void>;
  sendError(context: string, error: unknown): Promise<void>;
}
