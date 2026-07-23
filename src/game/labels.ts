import { pointAt, type Point } from './geometry'

export type LabelBox = { x: number; y: number; width: number; height: number }
export type StationLabel = {
  point: { x: number; y: number; angle: number }
  split: number
  position: 'above' | 'below' | 'left' | 'right'
  x: number
  y: number
  anchor: 'middle' | 'start' | 'end'
}

const overlaps = (a: LabelBox, b: LabelBox) =>
  a.x < b.x + b.width + 4 && a.x + a.width + 4 > b.x && a.y < b.y + b.height + 4 && a.y + a.height + 4 > b.y

const inBounds = (box: LabelBox) =>
  box.x >= 10 && box.x + box.width <= 590 && box.y >= 12 && box.y + box.height <= 348

const pointInBox = (px: number, py: number, box: LabelBox) =>
  px >= box.x && px <= box.x + box.width && py >= box.y && py <= box.y + box.height

const cross = (p: Point, q: Point, r: Point) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])
const segmentsCross = (a: Point, b: Point, c: Point, d: Point) => {
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d)
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

// A route segment "hits" a label box when either endpoint sits inside the box or
// the segment crosses one of the box edges. Margin keeps labels clear of the line.
const routeHitsBox = (route: readonly Point[], box: LabelBox) => {
  const m = 3
  const b: LabelBox = { x: box.x - m, y: box.y - m, width: box.width + 2 * m, height: box.height + 2 * m }
  const tl: Point = [b.x, b.y], tr: Point = [b.x + b.width, b.y]
  const br: Point = [b.x + b.width, b.y + b.height], bl: Point = [b.x, b.y + b.height]
  const edges: [Point, Point][] = [[tl, tr], [tr, br], [br, bl], [bl, tl]]
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]!, c = route[i + 1]!
    if (pointInBox(a[0], a[1], b) || pointInBox(c[0], c[1], b)) return true
    if (edges.some(([e0, e1]) => segmentsCross(a, c, e0, e1))) return true
  }
  return false
}

// The moving train pill covers its station; treat it as an obstacle so nearby
// labels step aside instead of hiding under it. Approximated as an axis-aligned
// box around the train point, large enough to cover the rotated body.
export const trainBox = (x: number, y: number): LabelBox => ({ x: x - 30, y: y - 22, width: 60, height: 44 })

export function computeLabels(route: readonly Point[], stations: readonly string[], avoid?: LabelBox): StationLabel[] {
  const trainObstacle: LabelBox[] = avoid ? [avoid] : []
  // Every other station's marker is an obstacle: a label placed on top of a
  // neighboring node reads as belonging to that node (당산 vs 영등포구청).
  const points = stations.map((_, index) => pointAt(route, index / Math.max(1, stations.length - 1)))
  const nodeBoxes = points.map(p => ({ x: p.x - 13, y: p.y - 13, width: 26, height: 26 }))
  const boxes: LabelBox[] = []
  return stations.map((station, index) => {
    const p = points[index]!
    const split = station.length > 6 ? Math.ceil(station.length / 2) : station.length
    const width = Math.max(split, station.length - split) * 9
    const height = split < station.length ? 22 : 12
    const candidates = [
      { position: 'above', x: p.x, y: p.y - 32, anchor: 'middle', box: { x: p.x - width / 2, y: p.y - 44, width, height } },
      { position: 'below', x: p.x, y: p.y + 38, anchor: 'middle', box: { x: p.x - width / 2, y: p.y + 28, width, height } },
      { position: 'left', x: p.x - 16, y: p.y + 4, anchor: 'end', box: { x: p.x - width - 16, y: p.y - 7, width, height } },
      { position: 'right', x: p.x + 16, y: p.y + 4, anchor: 'start', box: { x: p.x + 16, y: p.y - 7, width, height } },
    ] as const
    const otherNodes = nodeBoxes.filter((_, other) => other !== index)
    // A label must read as belonging to its own station: its box center must be
    // closest to this node, not to a neighbouring node above/below it.
    const ownClosest = (box: LabelBox) => {
      const cx = box.x + box.width / 2, cy = box.y + box.height / 2
      const dist = (q: { x: number; y: number }) => (cx - q.x) ** 2 + (cy - q.y) ** 2
      const own = dist(p)
      return points.every((q, other) => other === index || dist(q) >= own)
    }
    const noLabelHit = (c: (typeof candidates)[number]) => inBounds(c.box) && !boxes.some(box => overlaps(c.box, box))
    const noObstacle = (c: (typeof candidates)[number]) =>
      !trainObstacle.some(box => overlaps(c.box, box)) && !otherNodes.some(box => overlaps(c.box, box))
    const label =
      candidates.find(c => noLabelHit(c) && noObstacle(c) && ownClosest(c.box) && !routeHitsBox(route, c.box)) ??
      candidates.find(c => noLabelHit(c) && noObstacle(c) && ownClosest(c.box)) ??
      candidates.find(c => noLabelHit(c) && noObstacle(c)) ??
      candidates.find(c => noLabelHit(c) && !trainObstacle.some(box => overlaps(c.box, box))) ??
      candidates.find(noLabelHit) ??
      candidates[0]
    boxes.push(label.box)
    return { point: p, split, position: label.position, x: label.x, y: label.y, anchor: label.anchor }
  })
}
