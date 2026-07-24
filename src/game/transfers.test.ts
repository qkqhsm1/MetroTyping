import { expect,test } from 'vitest'
import { LINE_PRIORITY,onwardStations,transferOptionsAt } from './transfers'

test('priority lists numbered lines first, then the rest, and excludes yamanote',()=>{
  expect(LINE_PRIORITY).toEqual(['seoul-1','seoul-2','seoul-3','seoul-4','seoul-5','seoul-6','seoul-7','seoul-8','seoul-9','arex','suin-bundang','incheon-1','incheon-2'])
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
