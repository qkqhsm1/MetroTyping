import { expect, test } from 'vitest'
import { LINE_2_STATIONS } from './line2'

test('keeps official English names and station numbers for all 43 Line 2 loop stations', () => {
  expect(LINE_2_STATIONS).toHaveLength(43)
  expect(LINE_2_STATIONS[0]).toEqual({ korean:'신도림', english:'Sindorim', number:'234' })
  expect(LINE_2_STATIONS[1]).toEqual({ korean:'문래', english:'Mullae', number:'235' })
  expect(LINE_2_STATIONS.at(-1)).toEqual({ korean:'대림', english:'Daerim', number:'233' })
  expect(LINE_2_STATIONS.every(station=>station.english&&/^2\d\d$/.test(station.number))).toBe(true)
})
