import { describe, expect, test } from 'vitest'
import { LINES } from '../data/lines'
import { dailyStations, getRoute } from './routes'

describe('route data', () => {
  test('contains the six approved lines', () => {
    expect(LINES.map(line => line.id)).toEqual(['seoul-1', 'seoul-2', 'incheon-1', 'incheon-2', 'arex', 'yamanote'])
  })

  test('wraps Seoul line 2 in the selected direction', () => {
    expect(getRoute('seoul-2', '신도림', '문래', 'clockwise').stationIds).toEqual(['신도림', '문래'])
    expect(getRoute('seoul-2', '문래', '신도림', 'counterclockwise').stationIds).toEqual(['문래', '신도림'])
  })

  test('keeps Yamanote inner and outer directions opposite', () => {
    expect(getRoute('yamanote', '신주쿠', '신오쿠보', 'inner').stationIds).not.toEqual(
      getRoute('yamanote', '신주쿠', '신오쿠보', 'outer').stationIds,
    )
  })

  test('supports both Seoul line 1 branches from Guro', () => {
    expect(getRoute('seoul-1', '구로', '인천').stationIds.at(-1)).toBe('인천')
    expect(getRoute('seoul-1', '구로', '신창').stationIds.at(-1)).toBe('신창')
  })

  test('daily stations are deterministic without adjacent duplicates', () => {
    const first = dailyStations('arex', '2026-07-21')
    expect(first).toEqual(dailyStations('arex', '2026-07-21'))
    expect(first.every((station, index) => index === 0 || station !== first[index - 1])).toBe(true)
  })

  test('rejects stations outside the selected line', () => {
    expect(() => getRoute('seoul-2', '신도림', '인천')).toThrow('Invalid station')
  })

  test('allows a zero-stop route without looping', () => {
    expect(getRoute('seoul-2', '신도림', '신도림').stationIds).toEqual(['신도림'])
  })
})
