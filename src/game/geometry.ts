export type Point = readonly [number, number]

export function pointAt(points: readonly Point[], rawProgress: number) {
  if (points.length < 2) throw new Error('A route needs at least two points')

  const segments = points.slice(1).map((point, index) => {
    const start = points[index]!
    const length = Math.hypot(point[0] - start[0], point[1] - start[1])
    return { start, end: point, length }
  })
  const total = segments.reduce((sum, segment) => sum + segment.length, 0)
  let remaining = Math.min(1, Math.max(0, rawProgress)) * total

  for (const [index, segment] of segments.entries()) {
    if (remaining <= segment.length || index === segments.length - 1) {
      const ratio = segment.length ? Math.min(1, remaining / segment.length) : 0
      const dx = segment.end[0] - segment.start[0]
      const dy = segment.end[1] - segment.start[1]
      return {
        x: segment.start[0] + dx * ratio,
        y: segment.start[1] + dy * ratio,
        angle: Math.round((Math.atan2(dy, dx) * 180) / Math.PI),
      }
    }
    remaining -= segment.length
  }

  throw new Error('Invalid route geometry')
}
