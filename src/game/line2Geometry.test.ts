import { expect,test } from 'vitest'
import { LINE_2_STATIONS } from '../data/line2'
import { LINE_2_TOTAL_LENGTH,line2CameraWidth,line2PointAt,line2StationDistance,unwrapLine2Route } from './line2Geometry'

test('places every Line 2 station at an even measured interval on one closed path', () => {
  const distances=LINE_2_STATIONS.map(station=>line2StationDistance(station.korean))
  expect(new Set(distances.map(distance=>distance.toFixed(6)))).toHaveLength(43)
  expect(distances.every(distance=>distance>=0&&distance<LINE_2_TOTAL_LENGTH)).toBe(true)
  const intervals=distances.map((distance,index)=>(distance-(distances[(index+1)%distances.length]??0)+LINE_2_TOTAL_LENGTH)%LINE_2_TOTAL_LENGTH)
  expect(Math.max(...intervals)-Math.min(...intervals)).toBeLessThan(0.01)
  for(const distance of distances){
    const point=line2PointAt(distance)
    expect(Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.angle)).toBe(true)
  }
})

test('unwraps either travel direction continuously and bounds adaptive camera width', () => {
  const forward=unwrapLine2Route(['신도림','문래','영등포구청','당산'])
  const reverse=unwrapLine2Route(['당산','영등포구청','문래','신도림'])
  expect(forward[1]! - forward[0]!).toBeLessThan(0)
  expect(reverse[1]! - reverse[0]!).toBeGreaterThan(0)
  const widths=LINE_2_STATIONS.map((_,index)=>line2CameraWidth(LINE_2_STATIONS.map(station=>line2StationDistance(station.korean)),index))
  expect(Math.min(...widths)).toBeGreaterThanOrEqual(360)
  expect(Math.max(...widths)).toBeLessThanOrEqual(620)
  expect(Math.max(...widths)-Math.min(...widths)).toBeGreaterThan(10)
})
