import { getLine } from '../data/lines'

function graphFor(sequences: string[][]) {
  const graph = new Map<string, Set<string>>()

  for (const sequence of sequences) {
    sequence.forEach((station, index) => {
      const links = graph.get(station) ?? new Set<string>()
      const previous = sequence[index - 1]
      const next = sequence[index + 1]
      if (previous) links.add(previous)
      if (next) links.add(next)
      graph.set(station, links)
    })
  }

  return graph
}

export function getRoute(lineId: string, from: string, to: string, direction = 'forward') {
  const line = getLine(lineId)
  const stations = new Set(line.sequences.flat())
  if (!stations.has(from) || !stations.has(to)) throw new Error('Invalid station')
  if (from === to) return { stationIds: [from], direction, pathId: lineId }

  if (line.loop) {
    const sequence = line.sequences[0]
    if (!sequence) throw new Error('Invalid line data')

    const step = direction === 'clockwise' || direction === 'outer' ? 1 : -1
    const result = [from]
    let index = sequence.indexOf(from)

    while (result.at(-1) !== to) {
      index = (index + step + sequence.length) % sequence.length
      const station = sequence[index]
      if (!station) throw new Error('Invalid line data')
      result.push(station)
    }

    return { stationIds: result, direction, pathId: lineId }
  }

  const graph = graphFor(line.sequences)
  const queue: string[][] = [[from]]
  const seen = new Set([from])

  while (queue.length) {
    const path = queue.shift()
    const current = path?.at(-1)
    if (!path || !current) continue
    if (current === to) return { stationIds: path, direction, pathId: lineId }

    for (const next of graph.get(current) ?? []) {
      if (seen.has(next)) continue
      seen.add(next)
      queue.push([...path, next])
    }
  }

  throw new Error('No route')
}

export function dailyStations(lineId: string, dateKey: string) {
  const stations = [...new Set(getLine(lineId).sequences.flat())]
  let seed = [...`${lineId}:${dateKey}`].reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    2166136261,
  )

  for (let index = stations.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const swapIndex = seed % (index + 1)
    const current = stations[index]
    const swap = stations[swapIndex]
    if (!current || !swap) continue
    stations[index] = swap
    stations[swapIndex] = current
  }

  return stations
}
