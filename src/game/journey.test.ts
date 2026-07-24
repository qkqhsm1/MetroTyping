import { expect,test } from 'vitest'
import { advance,beginTransfer,boardJourney,isDeadEnd,nextTargets } from './journey'

test('boarding stands at the departure and types it first, then heads toward the chosen neighbour',()=>{
  const journey=boardJourney('seoul-1','소요산','동두천')
  // The departure is typed first, matching ordered play, not skipped to its neighbour.
  expect(nextTargets(journey.position)).toEqual(['소요산'])
  const atDeparture=advance(journey,'소요산')!
  expect(atDeparture.position.station).toBe('동두천')
  expect(nextTargets(atDeparture.position)).toEqual(['동두천'])
  const moved=advance(atDeparture,'동두천')!
  expect(moved.position.station).toBe('보산')
  expect(moved.typed).toEqual(['소요산','동두천'])
})

test('a wrong answer does not advance',()=>{
  const journey=boardJourney('seoul-1','소요산','동두천')
  expect(advance(journey,'보산')).toBeNull()
})

test('boarding a terminus rides inward from it',()=>{
  const journey=boardJourney('seoul-1','연천','전곡')
  expect(nextTargets(journey.position)).toEqual(['연천'])
  const moved=advance(journey,'연천')!
  expect(moved.position.station).toBe('전곡')
})

test('after a transfer either neighbour is valid and the first typed sets direction',()=>{
  const boarded=boardJourney('seoul-5','방화','개화산')
  const atGimpo:typeof boarded={...boarded,position:{line:'seoul-5',station:'김포공항',from:'송정'}}
  const transferred=beginTransfer(atGimpo,'seoul-9')
  expect(transferred.position.line).toBe('seoul-9')
  expect(transferred.position.undecided).toBe(true)
  // 김포공항 on Line 9 sits between 개화 and 공항시장; either resolves direction.
  expect(nextTargets(transferred.position).sort()).toEqual(['개화','공항시장'])
  expect(advance(transferred,'개화')!.position.station).toBe('개화')
  const toward공항시장=advance(transferred,'공항시장')!
  expect(toward공항시장.position.station).toBe('공항시장')
  expect(toward공항시장.position.from).toBe('김포공항')
  expect(transferred.lines).toEqual(['seoul-5','seoul-9'])
  expect(transferred.transfers).toBe(1)
})

test('transferring onto a line where the station is a terminus forces the one open direction',()=>{
  // 인천 is the Suin·Bundang terminus, so its only onward neighbour is 신포; the fork is skipped and
  // the run heads straight down the line with a full onward world instead of a cropped window.
  const boarded=boardJourney('seoul-1','동인천','인천')
  const atIncheon:typeof boarded={...boarded,position:{line:'seoul-1',station:'인천',from:'동인천'}}
  const transferred=beginTransfer(atIncheon,'suin-bundang')
  expect(transferred.position.line).toBe('suin-bundang')
  expect(transferred.position.undecided).toBeUndefined()
  expect(transferred.position.station).toBe('신포')
  expect(transferred.position.from).toBe('인천')
  expect(nextTargets(transferred.position)).toEqual(['신포'])
})

test('typing a terminus marks an arrival with nothing left to type',()=>{
  // 오금 is the Line 3 terminus. Riding to it and typing it leaves no onward on Line 3.
  let journey=boardJourney('seoul-3','경찰병원','오금')
  journey=advance(journey,'경찰병원')!
  expect(journey.position.station).toBe('오금')
  const arrived=advance(journey,'오금')!
  expect(arrived.position.arrived).toBe(true)
  expect(nextTargets(arrived.position)).toEqual([])
})

test('an arrival at a terminus with no transfer is a dead end; with a transfer it is not',()=>{
  // 연천 arrival: Line 1 only, no transfer → dead end. 오금 arrival: Line 5 continues → not.
  expect(isDeadEnd({line:'seoul-1',station:'연천',arrived:true})).toBe(true)
  expect(isDeadEnd({line:'seoul-3',station:'오금',arrived:true})).toBe(false)
})

test('standing at a station is never a dead end until you have arrived at a terminus',()=>{
  // Boarding 연천 (before arriving anywhere) is playable; a loop station is never a dead end.
  expect(isDeadEnd(boardJourney('seoul-1','연천','전곡').position)).toBe(false)
  expect(isDeadEnd({line:'seoul-2',station:'신도림'})).toBe(false)
})
