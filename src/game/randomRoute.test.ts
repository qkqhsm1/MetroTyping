import { expect, test } from 'vitest'
import type { Point } from './geometry'
import { hasSelfIntersection, randomizeRoute } from './randomRoute'

const source:Point[]=[[45,250],[180,210],[330,120],[555,55]]

test('creates a reproducible bounded route without moving its endpoints',()=>{
  const route=randomizeRoute(source,17)
  expect(route).toEqual(randomizeRoute(source,17))
  expect(route).not.toEqual(randomizeRoute(source,18))
  expect(route[0]).toEqual(source[0])
  expect(route.at(-1)).toEqual(source.at(-1))
  expect(route.every(([x,y])=>x>=35&&x<=565&&y>=35&&y<=325)).toBe(true)
  expect(hasSelfIntersection(route)).toBe(false)
})

test('falls back safely for a two-point route',()=>{
  const route:Point[]=[[45,145],[555,145]]
  expect(randomizeRoute(route,5)[0]).toEqual(route[0])
  expect(randomizeRoute(route,5).at(-1)).toEqual(route.at(-1))
  expect(hasSelfIntersection(randomizeRoute(route,5))).toBe(false)
})
