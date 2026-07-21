import { expect, test } from 'vitest'
import { pointAt } from './geometry'

test('samples position and tangent on the same polyline', () => {
  const points = [[0, 0], [100, 0], [100, 100]] as const
  expect(pointAt(points, 0.75)).toEqual({ x: 100, y: 50, angle: 90 })
})

test('clamps progress to the route endpoints', () => {
  const points = [[10, 20], [30, 20]] as const
  expect(pointAt(points, -1)).toMatchObject({ x: 10, y: 20 })
  expect(pointAt(points, 2)).toMatchObject({ x: 30, y: 20 })
})
