import { expect,test } from 'vitest'
import { LINES } from './lines'
import { STATION_INFO,stationInfo } from './stationInfo'

const allStationsOf=(line:typeof LINES[number])=>new Set([
  ...line.sequences.flat(),
  ...(line.oneWaySequences?.flat()??[]),
  ...(line.services?.flatMap(service=>[...service.sequence])??[]),
])

test('every declared station has an english name and a station number',()=>{
  const missing:string[]=[]
  for(const line of LINES)for(const korean of allStationsOf(line)){
    const info=STATION_INFO[line.id]?.[korean]
    if(!info?.english||!info.number)missing.push(`${line.id}/${korean}`)
  }
  expect(missing).toEqual([])
})

test('the same station keeps a line-specific number',()=>{
  expect(stationInfo('seoul-1','서울역').number).toBe('133')
  expect(stationInfo('seoul-4','서울역').number).toBe('426')
  expect(stationInfo('arex','서울역').number).toBe('A01')
})

test('seoul line 2 keeps its existing numbers and english names',()=>{
  expect(stationInfo('seoul-2','신도림')).toEqual({korean:'신도림',english:'Sindorim',number:'234'})
  expect(stationInfo('seoul-2','교대').english).toBe("Seoul Nat'l Univ. of Education")
})

test('yamanote uses JY numbers',()=>{
  expect(stationInfo('yamanote','도쿄')).toEqual({korean:'도쿄',english:'Tokyo',number:'JY01'})
})

test('an unknown station degrades instead of throwing',()=>{
  expect(stationInfo('seoul-2','없는역')).toEqual({korean:'없는역',english:'',number:''})
})
