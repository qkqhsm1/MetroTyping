import { act,render } from '@testing-library/react'
import { afterEach,expect,test,vi } from 'vitest'
import Line2TrackingMap from './Line2TrackingMap'

afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals()})

test('centres the target and shows previous one, current one, and next two stations', () => {
  const { container,rerender }=render(<Line2TrackingMap stations={['신도림','문래','영등포구청','당산','합정']} targetIndex={0} color="#00A84D" />)
  expect(container.querySelector('svg')).toHaveAttribute('data-camera-station','신도림')
  expect(container.querySelectorAll('[data-station]')).toHaveLength(3)
  expect([...container.querySelectorAll('[data-station]')].map(node=>node.getAttribute('data-station'))).toEqual(['신도림','문래','영등포구청'])

  rerender(<Line2TrackingMap stations={['신도림','문래','영등포구청','당산','합정']} targetIndex={1} color="#00A84D" />)
  expect(container.querySelector('svg')).toHaveAttribute('data-camera-station','문래')
  expect([...container.querySelectorAll('[data-station]')].map(node=>node.getAttribute('data-station'))).toEqual(['신도림','문래','영등포구청','당산'])
  expect(container.querySelector('[data-station="문래"]')).toHaveAttribute('data-current','true')
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
  act(()=>callback?.(440))
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
