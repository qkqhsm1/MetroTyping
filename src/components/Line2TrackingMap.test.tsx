import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import Line2TrackingMap from './Line2TrackingMap'

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
