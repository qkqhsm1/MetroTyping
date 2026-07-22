import { getLine } from '../data/lines'

export type QuickRoute = {
  id: string
  label: string
  from: string
  to: string
  direction: string
  stationIds: string[]
}

export type QuickRoutePair = {
  id: string
  title: string
  routes: readonly QuickRoute[]
}

function graphFor(sequences: string[][], oneWaySequences: string[][] = []) {
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

  for (const sequence of oneWaySequences) {
    sequence.slice(0, -1).forEach((station, index) => {
      const next = sequence[index + 1]
      if (!next) return
      const links = graph.get(station) ?? new Set<string>()
      links.add(next)
      graph.set(station, links)
    })
  }

  return graph
}

function serviceFor(lineId: string, serviceId?: string) {
  const line = getLine(lineId)
  if (!serviceId) return undefined
  const service = line.services?.find(item => item.id === serviceId)
  if (!service) throw new Error('Invalid service')
  return service
}

export function getStations(lineId: string, serviceId?: string) {
  const line = getLine(lineId)
  const service = serviceFor(lineId, serviceId)
  return service
    ? [...service.sequence]
    : [...new Set([...line.sequences.flat(), ...(line.oneWaySequences?.flat() ?? [])])]
}

export function getRoute(lineId: string, from: string, to: string, direction = 'forward', serviceId?: string) {
  const line = getLine(lineId)
  const service = serviceFor(lineId, serviceId)
  const stations = new Set(getStations(lineId, serviceId))
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

  const graph = service ? graphFor([service.sequence]) : graphFor(line.sequences, line.oneWaySequences)
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

export function getFullLoopRoute(lineId: string, origin: string, direction: string) {
  const line = getLine(lineId)
  const sequence = line.sequences[0]
  if (!line.loop || !sequence) throw new Error('Not a loop line')
  const originIndex = sequence.indexOf(origin)
  if (originIndex < 0) throw new Error('Invalid station')
  const step = direction === 'clockwise' || direction === 'outer' ? 1 : -1
  const stationIds = Array.from({ length: sequence.length }, (_, offset) => {
    const station = sequence[(originIndex + offset * step + sequence.length) % sequence.length]
    if (!station) throw new Error('Invalid line data')
    return station
  })
  return { stationIds, direction, pathId: lineId }
}

export function getQuickRoutePairs(lineId: string, serviceId?: string): QuickRoutePair[] {
  const line = getLine(lineId)
  const service = serviceFor(lineId, serviceId)
  if (line.loopPreset) {
    const [first, second] = line.loopPreset.directions
    const routeFor = (item: typeof first): QuickRoute => {
      const route = getFullLoopRoute(lineId, line.loopPreset!.origin, item.value)
      return {
        ...route,
        id: `${lineId}:${item.value}`,
        label: `${line.loopPreset!.origin} · ${item.label} 한 바퀴`,
        from: line.loopPreset!.origin,
        to: route.stationIds.at(-1)!,
      }
    }
    const routes: readonly [QuickRoute, QuickRoute] = [routeFor(first), routeFor(second)]
    return [{ id: `${lineId}:loop`, title: `${line.loopPreset.origin} 한 바퀴`, routes }]
  }

  const pairs: QuickRoutePair[] = []
  const termini = line.serviceTermini ?? []
  const candidates = service
    ? [[service.sequence[0]!, service.sequence.at(-1)!] as const]
    : line.quickRoutePairs ?? termini.flatMap(({ station: from }, leftIndex) =>
      termini.slice(leftIndex + 1).map(({ station: to }) => [from, to] as const),
    )
  const seen = new Set<string>()
  for (const [from, to] of candidates) {
      const id = [from, to].sort().join(':')
      if (seen.has(id)) continue
      try {
        const forward = getRoute(lineId, from, to, 'forward', serviceId)
        const reverse = getRoute(lineId, to, from, 'reverse', serviceId)
        const routes: readonly [QuickRoute, QuickRoute] = [
          { ...forward, id: `${lineId}:${from}:${to}`, label: `${from} → ${to}`, from, to },
          { ...reverse, id: `${lineId}:${to}:${from}`, label: `${to} → ${from}`, from: to, to: from },
        ]
        pairs.push({ id: `${lineId}:${id}`, title: `${from} ↔ ${to}`, routes })
        seen.add(id)
      } catch (error) {
        if (!(error instanceof Error) || error.message !== 'No route') throw error
      }
  }
  for (const route of line.quickOneWayRoutes ?? []) {
    const from = route.stations[0]
    const to = route.stations.at(-1)
    if (!from || !to) continue
    pairs.push({
      id: `${lineId}:${route.title}`,
      title: route.title,
      routes: [{ id:`${lineId}:${route.title}`, label:`${route.title} →`, from, to, direction:'forward', stationIds:[...route.stations] }],
    })
  }
  return pairs
}

export function dailyStations(lineId: string, dateKey: string, serviceId?: string) {
  const stations = getStations(lineId, serviceId)
  let seed = [...`${lineId}:${dateKey}:${serviceId ?? 'all'}`].reduce(
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
