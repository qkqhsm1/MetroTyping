import { afterEach,expect,test,vi } from 'vitest'
import { act,render } from '@testing-library/react'
import TrackingMap from './TrackingMap'
import { STATION_SPACING } from '../game/lineWorld'
import { getRoute } from '../game/routes'

const renderLine=(lineId:string,from:string,to:string,targetIndex=0)=>{
  const stations=getRoute(lineId,from,to).stationIds
  const {container}=render(<TrackingMap lineId={lineId} stations={stations} targetIndex={targetIndex} color="#0052A4" />)
  return {container,stations}
}

test.each([
  ['seoul-1','인천','연천'],
  ['seoul-3','대화','오금'],
  ['seoul-5','방화','하남검단산'],
  ['seoul-7','장암','석남'],
  ['suin-bundang','인천','청량리'],
  ['incheon-2','검단오류','운연'],
  ['arex','서울역','인천공항2터미널'],
])('%s renders one persistent node per station with a number',(lineId,from,to)=>{
  const {container,stations}=renderLine(lineId,from,to)
  expect(container.querySelectorAll('[data-station]')).toHaveLength(stations.length)
  const numbers=[...container.querySelectorAll('.node-number')].map(node=>node.textContent)
  expect(numbers.every(text=>text&&text.length>0)).toBe(true)
})

test('every visible station, including the current one, shows its map label',()=>{
  const {container,stations}=renderLine('seoul-3','대화','오금',5)
  const current=container.querySelector('[data-station][data-current]')
  expect(current?.getAttribute('data-station')).toBe(stations[5])
  expect(current?.querySelector('.node-number')).not.toBeNull()
  expect(current?.querySelector('.station-label')).not.toBeNull()
  const labelled=[...container.querySelectorAll('[data-station]')].filter(node=>node.querySelector('.station-label'))
  expect(labelled).toHaveLength(stations.length)
})

test('the camera focuses the current target',()=>{
  const {container,stations}=renderLine('seoul-3','대화','오금',5)
  expect(container.querySelector('svg')?.getAttribute('data-camera-station')).toBe(stations[5])
})

test('the target halo sits on the current station and moves along the route normal',()=>{
  const {container}=renderLine('seoul-4','진접','오이도',3)
  const halo=container.querySelector('.tracking-target-halo')
  expect(halo).not.toBeNull()
  expect(halo?.getAttribute('data-halo-normal')).toMatch(/^-?\d/)
})

test('the train renders inside the same svg coordinate system',()=>{
  const {container}=renderLine('seoul-8','별내','모란',2)
  expect(container.querySelector('svg .tracking-train')).not.toBeNull()
})

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()})

// 신도림 → 대림 runs the loop backwards, so the run's distances decrease as the player advances.
const backwards=['신도림','대림','구로디지털단지','신대방']

test('morphs continuously and retargets rapid answers even when the run travels backwards',()=>{
  let callback:FrameRequestCallback|undefined,id=0
  vi.spyOn(window,'requestAnimationFrame').mockImplementation(next=>{callback=next;return ++id})
  vi.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{})
  vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}))
  const {container,rerender}=render(<TrackingMap lineId="seoul-2" stations={backwards} targetIndex={0} color="#00A84D" />)
  const svg=container.querySelector('svg')!
  const start=svg.getAttribute('viewBox'),distanceAt=()=>Number(svg.getAttribute('data-train-distance'))
  // Seats are measured from where the run's first station sits on the ring, not from the polyline's
  // own start, so progress is asserted relative to that origin.
  const origin=distanceAt()
  expect(Number.isFinite(origin)).toBe(true)

  rerender(<TrackingMap lineId="seoul-2" stations={backwards} targetIndex={1} color="#00A84D" />)
  expect(container.querySelector('svg')).toBe(svg)
  expect(svg).toHaveAttribute('viewBox',start)
  act(()=>callback?.(100))
  act(()=>callback?.(210))
  const intermediate=svg.getAttribute('viewBox')
  expect(distanceAt()).toBeGreaterThan(origin-STATION_SPACING)
  expect(distanceAt()).toBeLessThan(origin)
  expect(svg).toHaveAttribute('data-motion-state','moving')

  rerender(<TrackingMap lineId="seoul-2" stations={backwards} targetIndex={2} color="#00A84D" />)
  expect(svg).toHaveAttribute('viewBox',intermediate)
  act(()=>callback?.(220))
  act(()=>callback?.(800))
  expect(svg).toHaveAttribute('data-camera-station','구로디지털단지')
  expect(svg).toHaveAttribute('data-motion-state','settled')
  expect(distanceAt()).toBeCloseTo(origin-STATION_SPACING*2,6)
})

test('settles immediately when reduced motion is requested',()=>{
  const request=vi.spyOn(window,'requestAnimationFrame')
  vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:()=>{},removeEventListener:()=>{}}))
  const {container,rerender}=render(<TrackingMap lineId="seoul-2" stations={backwards} targetIndex={0} color="#00A84D" />)
  rerender(<TrackingMap lineId="seoul-2" stations={backwards} targetIndex={1} color="#00A84D" />)
  expect(container.querySelector('svg')).toHaveAttribute('data-camera-station','대림')
  expect(container.querySelector('svg')).toHaveAttribute('data-motion-state','settled')
  expect(request).not.toHaveBeenCalled()
})
