import {
  latestPendingSlot,
  isScheduledHour,
  SCHEDULED_HOURS,
} from '../src/domain/services/Schedule.js';

describe('Schedule', () => {
  it('SCHEDULED_HOURS são 8, 13 e 20', () => {
    expect([...SCHEDULED_HOURS]).toEqual([8, 13, 20]);
  });

  describe('isScheduledHour', () => {
    it('reconhece slots válidos e rejeita inválidos', () => {
      expect(isScheduledHour(8)).toBe(true);
      expect(isScheduledHour(13)).toBe(true);
      expect(isScheduledHour(20)).toBe(true);
      expect(isScheduledHour(9)).toBe(false);
      expect(isScheduledHour(0)).toBe(false);
    });
  });

  describe('latestPendingSlot', () => {
    it('retorna apenas o último slot pendente do dia (exemplo do spec)', () => {
      // São 14h; 08h e 13h passaram e estão pendentes (20h ainda não chegou).
      // Deve escolher apenas 13h — o último pendente de hoje.
      expect(latestPendingSlot(14, [])).toBe(13);
    });

    it('ignora slots futuros (ainda não chegou a hora)', () => {
      expect(latestPendingSlot(10, [])).toBe(8);
    });

    it('pula slots já executados hoje', () => {
      expect(latestPendingSlot(21, [8, 13])).toBe(20);
      expect(latestPendingSlot(14, [8])).toBe(13);
    });

    it('retorna null quando não há pendência', () => {
      expect(latestPendingSlot(21, [8, 13, 20])).toBeNull();
      expect(latestPendingSlot(7, [])).toBeNull();
    });
  });
});
