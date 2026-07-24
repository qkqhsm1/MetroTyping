import { expect,test } from 'vitest'
import { LINES } from '../data/lines'
import { getLineWorld } from './lineWorld'
import { LINE_PRIORITY,nextLineAt,onwardStations,transferOptionsAt } from './transfers'

test('priority lists numbered lines first, then the rest; excludes yamanote and the one-way seoul-6',()=>{
  expect(LINE_PRIORITY).toEqual(['seoul-1','seoul-2','seoul-3','seoul-4','seoul-5','seoul-7','seoul-8','seoul-9','arex','suin-bundang','incheon-1','incheon-2'])
})

// A transfer boards the new line and lays out its forward run to the terminus; that run must resolve to a
// drawable world for every station on every transferable line, or the transfer blanks the map.
const walkForward=(line:string,station:string,from:string|undefined):string[]=>{
  const path=[station]
  let previous=from,current=onwardStations(line,station).find(name=>name!==from)
  while(current&&path.length<80&&!path.includes(current)&&current!==station){
    path.push(current)
    const onward=onwardStations(line,current).find(name=>name!==previous)
    previous=current;current=onward
  }
  return path
}

test('every station on every transferable line boards into a drawable forward run',()=>{
  const failures:string[]=[]
  for(const id of LINE_PRIORITY){
    const line=LINES.find(item=>item.id===id)!
    const stations=new Set([...line.sequences.flat(),...(line.oneWaySequences?.flat()??[])])
    for(const station of stations)for(const from of [undefined,...onwardStations(id,station)]){
      try{getLineWorld(id,walkForward(id,station,from))}
      catch(error){failures.push(`${id} @ ${station} from=${from}: ${(error as Error).message}`)}
    }
  }
  expect(failures.slice(0,20).join('\n')).toBe('')
})

test('transfer options exclude the current line and sort by priority',()=>{
  expect(transferOptionsAt('김포공항','seoul-5')).toEqual(['seoul-9','arex'])
  expect(transferOptionsAt('김포공항','arex')).toEqual(['seoul-5','seoul-9'])
  expect(transferOptionsAt('종로3가','seoul-1')).toEqual(['seoul-3','seoul-5'])
  expect(transferOptionsAt('인천','seoul-1')).toEqual(['suin-bundang'])
})

test('a non-transfer station has no options',()=>{
  expect(transferOptionsAt('신도림','seoul-2')).toEqual(['seoul-1'])
  expect(transferOptionsAt('강남','seoul-2')).toEqual([])
})

test('quick Tab rotates through every line and wraps back to the one you came from',()=>{
  // 왕십리 is served by Lines 2, 5 and 수인·분당. Tapping Tab cycles them all instead of bouncing 2↔5,
  // so 수인·분당 is reachable again after you transfer away from it.
  expect(nextLineAt('왕십리','suin-bundang')).toBe('seoul-2')
  expect(nextLineAt('왕십리','seoul-2')).toBe('seoul-5')
  expect(nextLineAt('왕십리','seoul-5')).toBe('suin-bundang')
  // A station on a single line has nowhere to rotate to.
  expect(nextLineAt('강남','seoul-2')).toBeUndefined()
})

test('onward stations give both neighbours mid-line and one at a terminus',()=>{
  expect(onwardStations('seoul-2','강남').sort()).toEqual(['교대','역삼'])
  expect(onwardStations('seoul-3','대화')).toEqual(['주엽'])
  expect(onwardStations('seoul-3','오금')).toEqual(['경찰병원'])
})

test('a loop line wraps, so its first station still has two neighbours',()=>{
  // 신도림 opens the Line 2 array, but the loop closes onto it from 대림.
  expect(onwardStations('seoul-2','신도림').sort()).toEqual(['대림','문래'])
})

test('the eungam one-way loop advances in its single direction',()=>{
  expect(onwardStations('seoul-6','구산')).toEqual(['응암'])
})
