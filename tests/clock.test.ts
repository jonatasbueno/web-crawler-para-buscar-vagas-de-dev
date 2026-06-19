import { systemClock } from '../src/domain/ports/Clock.js'

describe('systemClock', () => {
  it('now() retorna uma data', () => {
    expect(systemClock.now()).toBeInstanceOf(Date)
  })

  it('currentHourBRT() retorna uma hora válida (0–23)', () => {
    const hour = systemClock.currentHourBRT()
    expect(Number.isInteger(hour)).toBe(true)
    expect(hour).toBeGreaterThanOrEqual(0)
    expect(hour).toBeLessThanOrEqual(23)
  })
})
