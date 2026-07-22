import { expect, test } from 'vitest'
import { pointAt } from './geometry'
import { getFocusedRouteGeometry } from './routeGeometry'
import { getRoute } from './routes'

test('samples position and tangent on the same polyline', () => {
  const points = [[0, 0], [100, 0], [100, 100]] as const
  expect(pointAt(points, 0.75)).toEqual({ x: 100, y: 50, angle: 90 })
})

test('clamps progress to the route endpoints', () => {
  const points = [[10, 20], [30, 20]] as const
  expect(pointAt(points, -1)).toMatchObject({ x: 10, y: 20 })
  expect(pointAt(points, 2)).toMatchObject({ x: 30, y: 20 })
})

const focusedLine1=(from:string,to:string,start=0)=>{
  const stations=getRoute('seoul-1',from,to).stationIds
  return getFocusedRouteGeometry('seoul-1',stations,stations.length,start,Math.min(8,stations.length-start))
}

test('keeps Line 1 branch directions geographic in source space',()=>{
  const incheonNorth=focusedLine1('인천','연천')
  const northIncheon=focusedLine1('연천','인천')
  const guroSinchang=focusedLine1('구로','신창')
  expect(incheonNorth.globalStart![0]).toBeLessThan(incheonNorth.globalEnd![0])
  expect(northIncheon.globalStart![1]).toBeLessThan(northIncheon.globalEnd![1])
  expect(guroSinchang.globalStart![1]).toBeLessThan(guroSinchang.globalEnd![1])
})

test('keeps later Line 1 windows on their branch direction',()=>{
  const last=(from:string,to:string)=>{
    const count=getRoute('seoul-1',from,to).stationIds.length
    return focusedLine1(from,to,count-8)
  }
  const toNorth=last('인천','연천')
  const toIncheon=last('연천','인천')
  const toSinchang=last('연천','신창')
  expect(toNorth.globalStart![1]).toBeGreaterThan(toNorth.globalEnd![1])
  expect(toIncheon.globalStart![0]).toBeGreaterThan(toIncheon.globalEnd![0])
  expect(toSinchang.globalStart![1]).toBeLessThan(toSinchang.globalEnd![1])
})
