import { expect,test } from 'vitest'
import type { Point } from './geometry'
import { getRoute,getFullLoopRoute } from './routes'
import { resolveTopology } from './lineTopology'

const contiguous=(sequence:string[],stations:string[])=>{
  const start=sequence.indexOf(stations[0]!)
  return start>=0&&stations.every((station,offset)=>sequence[start+offset]===station)
}

test('a full single-sequence run resolves to the whole line',()=>{
  const stations=getRoute('seoul-3','대화','오금').stationIds
  const topology=resolveTopology('seoul-3',stations)
  expect(topology.sequence).toEqual(stations)
  expect(topology.loop).toBe(false)
})

test('a partial run keeps the whole line as its world',()=>{
  const stations=getRoute('seoul-3','경복궁','교대').stationIds
  const topology=resolveTopology('seoul-3',stations)
  expect(topology.sequence[0]).toBe('대화')
  expect(topology.sequence.at(-1)).toBe('오금')
  expect(contiguous(topology.sequence,stations)).toBe(true)
})

test('a reverse run reverses the world so travel reads forward',()=>{
  const stations=getRoute('seoul-3','오금','대화').stationIds
  const topology=resolveTopology('seoul-3',stations)
  expect(topology.sequence[0]).toBe('오금')
  expect(contiguous(topology.sequence,stations)).toBe(true)
})

test('incheon to yeoncheon joins both line 1 legs at guro',()=>{
  const stations=getRoute('seoul-1','인천','연천').stationIds
  const topology=resolveTopology('seoul-1',stations)
  expect(topology.sequence[0]).toBe('인천')
  expect(topology.sequence.at(-1)).toBe('연천')
  expect(topology.sequence.filter(station=>station==='구로')).toHaveLength(1)
  expect(contiguous(topology.sequence,stations)).toBe(true)
  expect(topology.path.length).toBeGreaterThanOrEqual(4)
})

test.each([
  ['방화','하남검단산'],['방화','마천'],['하남검단산','마천'],['마천','하남검단산'],
])('line 5 %s to %s resolves one continuous world',(from,to)=>{
  const stations=getRoute('seoul-5',from,to).stationIds
  const topology=resolveTopology('seoul-5',stations)
  expect(contiguous(topology.sequence,stations)).toBe(true)
  expect(new Set(topology.sequence).size).toBe(topology.sequence.length)
})

test('line 5 branch worlds agree on where each terminus sits',()=>{
  const hanam=resolveTopology('seoul-5',getRoute('seoul-5','방화','하남검단산').stationIds)
  const macheon=resolveTopology('seoul-5',getRoute('seoul-5','방화','마천').stationIds)
  const branch=resolveTopology('seoul-5',getRoute('seoul-5','하남검단산','마천').stationIds)
  expect(hanam.path[0]).toEqual(macheon.path[0])
  expect(branch.path[0]).toEqual(hanam.path.at(-1))
  expect(branch.path.at(-1)).toEqual(macheon.path.at(-1))
})

test('the line 1 joined path runs from the incheon end to the yeoncheon end',()=>{
  const joined=resolveTopology('seoul-1',getRoute('seoul-1','인천','연천').stationIds)
  const incheonLeg=resolveTopology('seoul-1',getRoute('seoul-1','인천','구로').stationIds)
  const northLeg=resolveTopology('seoul-1',getRoute('seoul-1','구로','연천').stationIds)
  expect(joined.path[0]).toEqual(incheonLeg.path[0])
  expect(joined.path.at(-1)).toEqual(northLeg.path.at(-1))
})

test('the line 6 eungam loop resolves to its one-way sequence',()=>{
  const stations=['응암','역촌','불광','독바위','연신내','구산']
  const topology=resolveTopology('seoul-6',stations)
  expect(topology.key).toBe('seoul-6-loop')
  expect(contiguous(topology.sequence,stations)).toBe(true)
})

test('line 9 express resolves to the express sequence, not the local one',()=>{
  const stations=getRoute('seoul-9','김포공항','중앙보훈병원','forward','express').stationIds
  const topology=resolveTopology('seoul-9',stations)
  expect(topology.sequence).toEqual(stations)
  expect(topology.sequence).not.toContain('개화')
})

test.each([['clockwise'],['counterclockwise']])('the line 2 loop rotates to the run origin (%s)',direction=>{
  const stations=getFullLoopRoute('seoul-2','신도림',direction).stationIds
  const topology=resolveTopology('seoul-2',stations)
  expect(topology.loop).toBe(true)
  expect(topology.sequence).toEqual(stations)
})

test('both directions of a line 2 loop run anchor their path at the same point',()=>{
  const clockwise=resolveTopology('seoul-2',getFullLoopRoute('seoul-2','신도림','clockwise').stationIds)
  const counter=resolveTopology('seoul-2',getFullLoopRoute('seoul-2','신도림','counterclockwise').stationIds)
  expect(counter.path[0]).toEqual(clockwise.path[0])
  expect(counter.path.length).toBe(clockwise.path.length)
  const sorted=(path:readonly Point[])=>[...path].map(point=>point.join(',')).sort()
  expect(sorted(counter.path)).toEqual(sorted(clockwise.path))
})

test('yamanote is a loop world',()=>{
  const stations=getFullLoopRoute('yamanote','도쿄','outer').stationIds
  expect(resolveTopology('yamanote',stations).loop).toBe(true)
})

test('an unknown line throws',()=>{
  expect(()=>resolveTopology('nope',['가'])).toThrow()
})

test('a run inside one line 1 leg still gets a whole-line world, not one ending at guro',()=>{
  const stations=getRoute('seoul-1','서울역','신도림').stationIds
  const topology=resolveTopology('seoul-1',stations)
  expect(topology.key).toBe('seoul-1-north-sinchang')
  expect(topology.sequence.at(-1)).toBe('신창')
  expect(contiguous(topology.sequence,stations)).toBe(true)
})

test('a run crossing guro resolves to the joined world',()=>{
  const stations=getRoute('seoul-1','신도림','부천').stationIds
  const topology=resolveTopology('seoul-1',stations)
  expect(topology.sequence[0]).toBe('연천')
  expect(topology.sequence.at(-1)).toBe('인천')
  expect(contiguous(topology.sequence,stations)).toBe(true)
})
