/** Slots horários agendados (hora local, BRT). */
export const SCHEDULED_HOURS = [8, 13, 20] as const
export type ScheduledHour = (typeof SCHEDULED_HOURS)[number]

export function isScheduledHour (hour: number): hour is ScheduledHour {
  return (SCHEDULED_HOURS as readonly number[]).includes(hour)
}

/**
 * Regra do catch-up: dado a hora atual e os slots já executados hoje, retorna
 * **apenas o último slot pendente do dia atual** (o mais recente que já passou e
 * ainda não rodou), ou `null` se não houver pendência. Dias anteriores são
 * ignorados por definição — só consideramos os slots de hoje.
 */
export function latestPendingSlot (
  currentHour: number,
  ranHoursToday: number[]
): ScheduledHour | null {
  const pending = SCHEDULED_HOURS.filter(
    (hour) => hour <= currentHour && !ranHoursToday.includes(hour)
  )

  return pending.length > 0 ? pending[pending.length - 1] : null
}
