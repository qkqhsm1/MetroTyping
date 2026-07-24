// Rebuilds src/game/lineShapes.ts from the official route vectors in
// public/assets/seoul-supported-lines.svg, which were extracted from the bundled
// Seoul Metropolitan Government map (2025-09-29).
// Run: node scripts/build-line-shapes.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { baseRoutes, line1Legs, topologyRoutes } from './reference-shapes.mjs'

const svg = readFileSync('public/assets/seoul-supported-lines.svg', 'utf8')
const matrixOf = attrs => {
  const found = attrs.match(/matrix\(([^)]+)\)/)
  return found ? found[1].split(',').map(Number) : [1, 0, 0, 1, 0, 0]
}
const apply = ([a, b, c, d, e, f], x, y) => [a * x + c * y + e, b * x + d * y + f]
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const lengthOf = chain => chain.slice(1).reduce((sum, point, index) => sum + dist(point, chain[index]), 0)

const flatten = (d, matrix) => {
  const tokens = d.match(/[MLCZmlcz]|-?[\d.]+(?:e-?\d+)?/g) ?? []
  const points = []
  let i = 0, cx = 0, cy = 0
  const push = (x, y) => points.push(apply(matrix, x, y))
  while (i < tokens.length) {
    const command = tokens[i++]
    if (command === 'M' || command === 'L') {
      cx = +tokens[i++]; cy = +tokens[i++]; push(cx, cy)
    } else if (command === 'C') {
      const x1 = +tokens[i++], y1 = +tokens[i++], x2 = +tokens[i++], y2 = +tokens[i++], x3 = +tokens[i++], y3 = +tokens[i++]
      for (let step = 1; step <= 8; step++) {
        const t = step / 8, u = 1 - t
        push(
          u ** 3 * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
          u ** 3 * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3,
        )
      }
      cx = x3; cy = y3
    } else if (command !== 'Z' && command !== 'z') i++
  }
  return points
}

// The map draws each station as a small circle in the line colour; only the route survives this.
const isRoute = points => {
  const xs = points.map(point => point[0]), ys = points.map(point => point[1])
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) > 20
}

function chainsFor(id) {
  const group = svg.match(new RegExp(`<g id="${id}">(.*?)</g>`, 's'))?.[1]
  if (!group) throw new Error(`no official group for ${id}`)
  let fragments = [...group.matchAll(/<path d="([^"]+)"([^>]*)\/>/g)]
    .map(match => flatten(match[1], matrixOf(match[2])))
    .filter(points => points.length > 1 && isRoute(points))
  const chains = []
  while (fragments.length) {
    let chain = fragments.shift()
    for (;;) {
      let best = null
      for (const [index, fragment] of fragments.entries())
        for (const tail of [true, false]) for (const end of [true, false]) {
          const gap = dist(tail ? chain.at(-1) : chain[0], end ? fragment.at(-1) : fragment[0])
          if (!best || gap < best.gap) best = { index, tail, end, gap }
        }
      if (!best || best.gap > 14) break
      const [fragment] = fragments.splice(best.index, 1)
      const piece = best.end ? [...fragment].reverse() : fragment
      chain = best.tail ? [...chain, ...piece.slice(1)] : [...[...piece].reverse().slice(0, -1), ...chain]
    }
    chains.push(chain)
  }
  return chains.filter(chain => lengthOf(chain) > 120).sort((a, b) => lengthOf(b) - lengthOf(a))
}

// Ramer-Douglas-Peucker: keep the corners the map actually draws, drop curve-flattening noise.
const simplify = (points, tolerance) => {
  if (points.length < 3) return points
  const first = points[0], last = points.at(-1)
  let index = 0, worst = 0
  for (let i = 1; i < points.length - 1; i++) {
    const px = points[i][0], py = points[i][1]
    const dx = last[0] - first[0], dy = last[1] - first[1]
    const norm = Math.hypot(dx, dy) || 1
    const deviation = Math.abs(dy * px - dx * py + last[0] * first[1] - last[1] * first[0]) / norm
    if (deviation > worst) { worst = deviation; index = i }
  }
  return worst > tolerance
    ? [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)]
    : [first, last]
}

const normalize = points => {
  const xs = points.map(point => point[0]), ys = points.map(point => point[1])
  const minX = Math.min(...xs), minY = Math.min(...ys)
  const scale = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1
  return points.map(([x, y]) => [(x - minX) / scale, (y - minY) / scale])
}

// The hand-digitised polylines are coarse, but their DIRECTION is covered by the route tests, so they
// decide which way each freshly traced chain should run.
const orientLike = (chain, reference) => {
  const a = normalize(chain), b = normalize(reference)
  const forward = dist(a[0], b[0]) + dist(a.at(-1), b.at(-1))
  const backward = dist(a.at(-1), b[0]) + dist(a[0], b.at(-1))
  return backward < forward ? [...chain].reverse() : chain
}

// A ring has no endpoints, so it is rotated until it starts where the reference starts, then turned to
// match the reference's direction of travel.
const orientRing = (chain, reference) => {
  const closed = dist(chain[0], chain.at(-1)) < 14 ? chain.slice(0, -1) : chain
  const a = normalize(closed), b = normalize(reference)
  let start = 0
  for (let i = 1; i < a.length; i++) if (dist(a[i], b[0]) < dist(a[start], b[0])) start = i
  const rotated = closed.map((_, i) => closed[(start + i) % closed.length])
  const mirrored = [rotated[0], ...rotated.slice(1).reverse()]
  const quarter = Math.floor(closed.length / 4)
  const target = normalize(reference)[Math.floor(reference.length / 4)] ?? b[1]
  return dist(normalize(mirrored)[quarter], target) < dist(normalize(rotated)[quarter], target) ? mirrored : rotated
}

const splitAt = (chain, point) => {
  let index = 0
  for (let i = 1; i < chain.length; i++) if (dist(chain[i], point) < dist(chain[index], point)) index = i
  return [chain.slice(0, index + 1), chain.slice(index)]
}

const TOLERANCE = 9
const round = points => points.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10])
const shape = (chain, reference) => round(simplify(orientLike(chain, reference), TOLERANCE))
const ring = (chain, reference) => round(simplify(orientRing(chain, reference), TOLERANCE))

const shapes = {}

{ // Seoul 1: one chain runs Incheon → Guro → Yeoncheon; the Sinchang leg meets it at Guro.
  const [spine, sinchang] = chainsFor('seoul-1')
  const [toJunction, fromJunction] = splitAt(spine, sinchang[0])
  shapes['seoul-1-north'] = round(simplify(orientLike(fromJunction, line1Legs[0]), TOLERANCE))
  shapes['seoul-1-incheon'] = round(simplify(orientLike(toJunction, line1Legs[1]), TOLERANCE))
  shapes['seoul-1-sinchang'] = shape(sinchang, line1Legs[2])
}
{ // Seoul 5: the spine runs Banghwa → Gangdong → Hanam; the Macheon leg meets it at Gangdong.
  const [spine, macheon] = chainsFor('seoul-5')
  const [toGangdong, toHanam] = splitAt(orientLike(spine, topologyRoutes['seoul-5-hanam'].path), macheon[0])
  shapes['seoul-5-trunk'] = round(simplify(toGangdong, TOLERANCE))
  shapes['seoul-5-hanam-leg'] = round(simplify(toHanam, TOLERANCE))
  shapes['seoul-5-macheon-leg'] = round(simplify(orientLike(macheon, topologyRoutes['seoul-5-macheon'].path.slice(-3)), TOLERANCE))
}
{ // Seoul 6: a trunk plus the closed one-way Eungam ring hanging off its western end.
  const [trunk, loop] = chainsFor('seoul-6')
  shapes['seoul-6-trunk'] = shape(trunk, topologyRoutes['seoul-6-trunk'].path)
  shapes['seoul-6-loop'] = ring(loop, topologyRoutes['seoul-6-loop'].path)
}
// Seoul 2 is a closed ring; its other chains are the Seongsu and Sinjeong spurs, which are not played.
shapes['seoul-2'] = ring(chainsFor('seoul-2')[0], baseRoutes['seoul-2'])

for (const id of ['seoul-3', 'seoul-4', 'seoul-7', 'seoul-8', 'seoul-9', 'suin-bundang', 'incheon-1', 'incheon-2', 'arex']) {
  shapes[id] = shape(chainsFor(id)[0], topologyRoutes[id]?.path ?? baseRoutes[id])
}
// Yamanote is not drawn on a Seoul map, so it keeps the smooth ring the game already shipped, sampled
// here as an open point list that closes implicitly like every other loop.
shapes.yamanote = round(Array.from({ length: 48 }, (_, step) => {
  const angle = step / 48 * Math.PI * 2 - Math.PI / 2
  return [500 + Math.cos(angle) * 500, 500 + Math.sin(angle) * 500]
}))

const body = Object.entries(shapes)
  .map(([key, points]) => `  ${JSON.stringify(key)}:[${points.map(([x, y]) => `[${x},${y}]`).join(',')}],`)
  .join('\n')

writeFileSync('src/game/lineShapes.ts', `// Generated by scripts/build-line-shapes.mjs on ${new Date().toISOString().slice(0, 10)}.
// Route shapes traced from the official vectors in public/assets/seoul-supported-lines.svg, which were
// extracted from the bundled Seoul Metropolitan Government map (2025-09-29). Coordinates are in that
// map's own space; lineWorld scales them uniformly, so only their proportions matter.
import type { Point } from './geometry'

export const LINE_SHAPES:Record<string,Point[]>={
${body}
}
`)
console.log(Object.entries(shapes).map(([key, points]) => `${key}: ${points.length}pts`).join('\n'))
