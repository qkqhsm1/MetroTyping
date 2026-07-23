import { describe, expect, it } from 'vitest'
import { computeLabels, trainBox, type LabelBox } from './labels'
import { pointAt, type Point } from './geometry'

const boxFor = (label: ReturnType<typeof computeLabels>[number], station: string): LabelBox => {
  const split = label.split
  const width = Math.max(split, station.length - split) * 9
  const height = split < station.length ? 22 : 12
  const { x, y, position } = label
  if (position === 'above') return { x: x - width / 2, y: y - 12, width, height }
  if (position === 'below') return { x: x - width / 2, y: y - 10, width, height }
  if (position === 'left') return { x: x - width, y: y - 11, width, height }
  return { x, y: y - 11, width, height }
}

const routeCrossesBox = (route: Point[], box: LabelBox) => {
  for (let i = 0; i < route.length - 1; i++) {
    const [ax, ay] = route[i]!, [bx, by] = route[i + 1]!
    const steps = 40
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, px = ax + (bx - ax) * t, py = ay + (by - ay) * t
      if (px >= box.x && px <= box.x + box.width && py >= box.y && py <= box.y + box.height) return true
    }
  }
  return false
}

describe('computeLabels', () => {
  const verticalThenBend: Point[] = [[210, 300], [210, 220], [210, 140], [210, 60], [300, 60], [400, 60], [500, 60], [560, 60]]
  const stations = ['신도림', '문래', '영등포구청', '당산', '합정', '홍대입구', '신촌', '이대']

  it('keeps every label off the route polyline', () => {
    const labels = computeLabels(verticalThenBend, stations)
    labels.forEach((label, index) => {
      expect(routeCrossesBox(verticalThenBend, boxFor(label, stations[index]!))).toBe(false)
    })
  })

  it('produces no overlapping label boxes', () => {
    const labels = computeLabels(verticalThenBend, stations)
    const boxes = labels.map((label, index) => boxFor(label, stations[index]!))
    for (let a = 0; a < boxes.length; a++)
      for (let b = a + 1; b < boxes.length; b++) {
        const x = boxes[a]!, y = boxes[b]!
        const hit = x.x < y.x + y.width && x.x + x.width > y.x && x.y < y.y + y.height && x.y + x.height > y.y
        expect(hit).toBe(false)
      }
  })

  it('keeps labels clear of the train box when it covers a station', () => {
    const p = pointAt(verticalThenBend, 2 / (stations.length - 1))
    const train = trainBox(p.x, p.y)
    const labels = computeLabels(verticalThenBend, stations, train)
    labels.forEach((label, index) => {
      const box = boxFor(label, stations[index]!)
      const hit = box.x < train.x + train.width && box.x + box.width > train.x && box.y < train.y + train.height && box.y + box.height > train.y
      expect(hit).toBe(false)
    })
  })

  it('anchors each label to its station point', () => {
    const labels = computeLabels(verticalThenBend, stations)
    labels.forEach((label, index) => {
      const p = pointAt(verticalThenBend, index / (stations.length - 1))
      expect(Math.hypot(label.point.x - p.x, label.point.y - p.y)).toBeLessThan(0.001)
    })
  })
})
