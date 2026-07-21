import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import RouteMap from './RouteMap'

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
