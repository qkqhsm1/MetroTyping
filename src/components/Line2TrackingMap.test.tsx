import { act,render } from '@testing-library/react'
import { afterEach,expect,test,vi } from 'vitest'
import Line2TrackingMap from './Line2TrackingMap'

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()})

test('keeps all 43 stations mounted while the target and adaptive camera change', () => {
  const { container,rerender }=render(<Line2TrackingMap stations={['신도림','문래','영등포구청','당산','합정']} targetIndex={0} color="#00A84D" />)
  expect(container.querySelector('svg')).toHaveAttribute('data-camera-station','신도림')
  expect(container.querySelectorAll('[data-station]')).toHaveLength(43)
  const sindorim=container.querySelector('[data-station="신도림"]')
  const initialWidth=container.querySelector('svg')!.getAttribute('data-camera-width')

  rerender(<Line2TrackingMap stations={['신도림','문래','영등포구청','당산','합정']} targetIndex={1} color="#00A84D" />)
  expect(container.querySelector('svg')).toHaveAttribute('data-camera-station','문래')
  expect(container.querySelectorAll('[data-station]')).toHaveLength(43)
  expect(container.querySelector('[data-station="신도림"]')).toBe(sindorim)
  expect(container.querySelector('[data-station="문래"]')).toHaveAttribute('data-current','true')
  expect(Number(initialWidth)).toBeGreaterThanOrEqual(360)
})

test('morphs continuously and retargets rapid answers from the rendered frame', () => {
  let callback:FrameRequestCallback|undefined,id=0
  vi.spyOn(window,'requestAnimationFrame').mockImplementation(next=>{callback=next;return ++id})
  vi.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{})
  vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}))
  const stations=['신도림','문래','영등포구청','당산']
  const {container,rerender}=render(<Line2TrackingMap stations={stations} targetIndex={0} color="#00A84D" />)
  const svg=container.querySelector('svg')!
  const start=svg.getAttribute('viewBox')

  rerender(<Line2TrackingMap stations={stations} targetIndex={1} color="#00A84D" />)
  expect(container.querySelector('svg')).toBe(svg)
  expect(svg).toHaveAttribute('viewBox',start)
  act(()=>callback?.(100))
  act(()=>callback?.(210))
  const intermediate=svg.getAttribute('viewBox')
  expect(intermediate).not.toBe(start)
  expect(svg).toHaveAttribute('data-motion-state','moving')

  rerender(<Line2TrackingMap stations={stations} targetIndex={2} color="#00A84D" />)
  expect(svg).toHaveAttribute('viewBox',intermediate)
  act(()=>callback?.(220))
  act(()=>callback?.(800))
  expect(svg).toHaveAttribute('data-camera-station','영등포구청')
  expect(svg).toHaveAttribute('data-motion-state','settled')
})

test('settles immediately when reduced motion is requested', () => {
  const request=vi.spyOn(window,'requestAnimationFrame')
  vi.stubGlobal('matchMedia',()=>({matches:true,addEventListener:()=>{},removeEventListener:()=>{}}))
  const stations=['신도림','문래','영등포구청']
  const {container,rerender}=render(<Line2TrackingMap stations={stations} targetIndex={0} color="#00A84D" />)
  rerender(<Line2TrackingMap stations={stations} targetIndex={1} color="#00A84D" />)
  expect(container.querySelector('svg')).toHaveAttribute('data-camera-station','문래')
  expect(container.querySelector('svg')).toHaveAttribute('data-motion-state','settled')
  expect(request).not.toHaveBeenCalled()
})

test('moves the target halo symmetrically along the local route normal', () => {
  const {container}=render(<Line2TrackingMap stations={['잠실나루','잠실','잠실새내']} targetIndex={0} color="#00A84D" />)
  const halo=container.querySelector('.line2-target-halo')!
  const normal=halo.getAttribute('data-halo-normal')!.split(',').map(Number)
  const tangent=halo.getAttribute('data-route-tangent')!.split(',').map(Number)
  expect(normal[0]!*tangent[0]!+normal[1]!*tangent[1]!).toBeCloseTo(0,3)
  expect(halo).toHaveStyle({'--halo-from-x':`${-normal[0]!*22}px`,'--halo-to-x':`${normal[0]!*22}px`})
})
