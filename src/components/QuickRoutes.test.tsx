import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import type { QuickRoutePair } from '../game/routes'
import QuickRoutes from './QuickRoutes'

const pair: QuickRoutePair = {
  id: 'seoul-1:인천:신창',
  title: '인천 ↔ 신창',
  routes: [
    { id: 'outbound', label: '인천 → 신창', from: '인천', to: '신창', direction: 'forward', stationIds: ['인천', '신창'] },
    { id: 'inbound', label: '신창 → 인천', from: '신창', to: '인천', direction: 'reverse', stationIds: ['신창', '인천'] },
  ],
}

test('starts either quick route from keyboard-reachable buttons', () => {
  const onStart = vi.fn()
  render(<QuickRoutes pairs={[pair]} color="#0052A4" onStart={onStart} />)

  expect(screen.getByRole('heading', { name: '빠른 운행' })).toBeInTheDocument()
  expect(screen.getByText('인천 ↔ 신창')).toBeInTheDocument()

  const outbound = screen.getByRole('button', { name: '인천에서 신창까지 바로 시작' })
  const inbound = screen.getByRole('button', { name: '신창에서 인천까지 바로 시작' })
  expect(outbound).not.toHaveAttribute('tabindex', '-1')
  expect(inbound).not.toHaveAttribute('tabindex', '-1')

  fireEvent.click(outbound)
  fireEvent.click(inbound)
  expect(onStart).toHaveBeenNthCalledWith(1, pair.routes[0])
  expect(onStart).toHaveBeenNthCalledWith(2, pair.routes[1])
})
