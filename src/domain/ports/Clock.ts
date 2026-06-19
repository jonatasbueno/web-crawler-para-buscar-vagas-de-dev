/**
 * Porta para acesso ao tempo — injetável para tornar o catch-up e a recência
 * determinísticos nos testes.
 */
export interface Clock {
  now(): Date;
  /** Hora atual (0–23) no fuso de Brasília. */
  currentHourBRT(): number;
}

export const systemClock: Clock = {
  now: () => new Date(),
  currentHourBRT: () => {
    const hour = new Date().toLocaleString('en-US', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      hour12: false,
    });
    // "24" pode aparecer à meia-noite em alguns runtimes; normaliza para 0.
    return parseInt(hour, 10) % 24;
  },
};
