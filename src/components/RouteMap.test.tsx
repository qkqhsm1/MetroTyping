import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { Point } from '../game/geometry'
import RouteMap from './RouteMap'

const parsePoints = (value: string): Point[] => value.split(' ').map(pair => {
  const [x,y] = pair.split(',').map(Number)
  return [x!,y!]
})
const distanceToSegment = ([x,y]: Point, [x1,y1]: Point, [x2,y2]: Point) => {
  const dx=x2-x1,dy=y2-y1,lengthSquared=dx*dx+dy*dy
  const t=lengthSquared?Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/lengthSquared)):0
  return Math.hypot(x-(x1+t*dx),y-(y1+t*dy))
}

test('uses line-specific geometry and normalized progress on one coordinate system', () => {
  const { container, rerender } = render(<RouteMap lineId="seoul-1" stations={['구로','인천']} color="#0052A4" progress={0.5} />)
  const first = container.querySelector('polyline')?.getAttribute('points')
  expect(container.querySelectorAll('polyline')[1]).toHaveAttribute('stroke-dasharray', '0.5 1')
  rerender(<RouteMap lineId="seoul-2" stations={['신도림','문래']} color="#00A84D" progress={0.5} />)
  expect(container.querySelector('polyline')?.getAttribute('points')).not.toBe(first)
})

test('labels every station on the route', () => {
  const stations = ['신도림','문래','영등포구청','당산']
  const { container } = render(<RouteMap lineId="seoul-2" stations={stations} color="#00A84D" progress={0.25} />)
  expect([...container.querySelectorAll('text')].map(node => node.textContent)).toEqual(stations)
})

test('anchors the front of the train at the current station', () => {
  const { container } = render(<RouteMap lineId="seoul-2" stations={['신도림','문래']} color="#00A84D" progress={0} />)
  expect(container.querySelector('.train-body')).toHaveAttribute('transform', 'translate(-22 0)')
})

test('renders train visibility and entrance state from props', () => {
  const props={lineId:'seoul-2',stations:['신도림','문래'],color:'#00A84D',progress:0}
  const { container,rerender }=render(<RouteMap {...props} trainVisible={false} />)
  expect(container.querySelector('.train')).not.toBeInTheDocument()
  rerender(<RouteMap {...props} trainVisible trainEntering />)
  expect(container.querySelector('.train')).toHaveClass('train-entering')
  expect(container.querySelector('.train-light')).toHaveAttribute('stroke','#00A84D')
  expect(container.querySelector('.train-light')).toHaveAttribute('stroke-width','3')
  expect(container.querySelector('.train-light')).toHaveAttribute('stroke-linecap','round')
})

test.each(['seoul-3', 'suin-bundang'])('%s uses distinct focused geometry with sampled stations on its path', lineId => {
  const stations = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const { container, rerender } = render(<RouteMap lineId={lineId} stations={stations} color="#f58220" progress={0.5} />)
  const pointsValue = container.querySelector('polyline')!.getAttribute('points')!
  const points = parsePoints(pointsValue)

  expect([...container.querySelectorAll('text')].map(node => node.textContent)).toEqual(stations)
  for (const station of container.querySelectorAll('g:not(.train) > circle:not(.target-ring)')) {
    const point: Point = [Number(station.getAttribute('cx')), Number(station.getAttribute('cy'))]
    expect(Math.min(...points.slice(1).map((end,index)=>distanceToSegment(point,points[index]!,end)))).toBeLessThan(0.01)
  }

  rerender(<RouteMap lineId="seoul-2" stations={stations} color="#00A84D" progress={0.5} />)
  expect(container.querySelector('polyline')).not.toHaveAttribute('points', pointsValue)
})
