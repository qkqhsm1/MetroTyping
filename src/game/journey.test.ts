import { expect,test } from 'vitest'
import { advance,beginTransfer,boardJourney,isDeadEnd,nextStation } from './journey'

test('boarding heads toward the chosen neighbour and advances one station',()=>{
  const journey=boardJourney('seoul-1','소요산','동두천')
  expect(nextStation(journey.position)).toBe('동두천')
  const moved=advance(journey,'동두천')!
  expect(moved.position.station).toBe('동두천')
  expect(nextStation(moved.position)).toBe('보산')
  expect(moved.visited).toEqual(['소요산','동두천'])
})

test('a wrong answer does not advance',()=>{
  const journey=boardJourney('seoul-1','소요산','동두천')
  expect(advance(journey,'보산')).toBeNull()
})

test('after a transfer either neighbour is valid and the first typed sets direction',()=>{
  const start=boardJourney('seoul-5','방화','개화산')
  const atGimpo={...start,position:{line:'seoul-5',station:'김포공항',direction:'송정'as string|undefined}}
  const transferred=beginTransfer(atGimpo,'seoul-9')
  expect(transferred.position.line).toBe('seoul-9')
  expect(transferred.position.direction).toBeUndefined()
  expect(nextStation(transferred.position)).toBeNull()
  // 김포공항 on Line 9 sits between 개화 and 공항시장; either resolves direction.
  const toward개화=advance(transferred,'개화')!
  expect(toward개화.position.station).toBe('개화')
  const toward공항시장=advance(transferred,'공항시장')!
  expect(toward공항시장.position.station).toBe('공항시장')
  expect(transferred.lines).toEqual(['seoul-5','seoul-9'])
  expect(transferred.transfers).toBe(1)
})

test('a terminus with no transfer option ends the run',()=>{
  // 연천 is the Line 1 north terminus and no other supported line serves it.
  expect(isDeadEnd({line:'seoul-1',station:'연천',direction:undefined})).toBe(true)
})

test('a terminus a transfer line continues from is not a dead end',()=>{
  // 인천 ends Line 1 but Suin·Bundang runs on from it; 오금 ends Line 3 but Line 5 continues.
  expect(isDeadEnd({line:'seoul-1',station:'인천',direction:undefined})).toBe(false)
  expect(isDeadEnd({line:'seoul-3',station:'오금',direction:undefined})).toBe(false)
})

test('a loop line never dead-ends',()=>{
  expect(isDeadEnd({line:'seoul-2',station:'신도림',direction:undefined})).toBe(false)
})

test('a terminus you boarded with a decided direction is not a dead end',()=>{
  expect(isDeadEnd({line:'seoul-1',station:'연천',direction:'전곡'})).toBe(false)
})
