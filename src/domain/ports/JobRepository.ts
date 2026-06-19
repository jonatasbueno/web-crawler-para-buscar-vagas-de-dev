import { Job } from '../entities/Job.js'

export type RunStatus = 'success' | 'error'

/**
 * Porta de saída para persistência: deduplicação de vagas enviadas e
 * registro de execuções agendadas (usado pelo catch-up).
 */
export interface JobRepository {
  isJobAlreadySent: (link: string) => Promise<boolean>
  markJobsAsSent: (jobs: Job[]) => Promise<void>
  /** Registra que um slot horário rodou hoje. Deve ser chamado APÓS a consolidação. */
  recordRun: (scheduledHour: number, status?: RunStatus) => Promise<void>
  /** Slots horários já registrados com sucesso hoje (BRT). */
  getRanHoursToday: () => Promise<number[]>
}
