import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import MapExplorer from './MapExplorer'

afterEach(() => vi.useRealTimers())

test('switches between the official Seoul map and original Tokyo map', () => {
  render(<MapExplorer onSelect={vi.fn()} />)
  expect(screen.getByRole('img', { name: '서울 수도권 지하철 노선도' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '도쿄' }))
  expect(screen.getByRole('img', { name: 'JR 야마노테선 노선도' })).toBeInTheDocument()
  expect(document.querySelectorAll('[data-station-label]')).toHaveLength(30)
})

test('selects supported lines and explains unsupported lines', () => {
  const onSelect = vi.fn()
  render(<MapExplorer onSelect={onSelect} />)
  fireEvent.click(screen.getByRole('button', { name: '서울 2호선 선택' }))
  expect(onSelect).toHaveBeenCalledWith('seoul-2')
  fireEvent.click(screen.getByRole('button', { name: '지도에서 서울 1호선 선택' }))
  expect(onSelect).toHaveBeenCalledWith('seoul-1')
  fireEvent.click(screen.getByRole('button', { name: '서울 4호선' }))
  expect(screen.getByText('현재 공사 중인 노선입니다.')).toBeInTheDocument()
})

test.each([
  ['서울 3호선', 'seoul-3'],
  ['수인·분당선', 'suin-bundang'],
])('selects %s from its official map geometry', (name, id) => {
  const onSelect = vi.fn()
  render(<MapExplorer onSelect={onSelect} />)

  const mapLine = screen.getByRole('button', { name: `지도에서 ${name} 선택` })
  expect(mapLine.querySelector('.line-highlight')).toHaveAttribute('href', expect.stringContaining(`#${id}`))
  fireEvent.click(mapLine)

  expect(onSelect).toHaveBeenCalledWith(id)
})

test('links dock hover to the matching map highlight', () => {
  vi.useFakeTimers()
  render(<MapExplorer onSelect={vi.fn()} />)

  fireEvent.mouseEnter(screen.getByRole('button', { name: '서울 2호선 선택' }))
  expect(screen.getByTestId('seoul-map')).not.toHaveAttribute('data-active-line')
  act(() => vi.advanceTimersByTime(150))

  expect(screen.getByTestId('seoul-map')).toHaveAttribute('data-active-line', 'seoul-2')
  const mapLine = screen.getByRole('button', { name: '지도에서 서울 2호선 선택' })
  expect(mapLine).toHaveAttribute('data-active', 'true')
  expect(mapLine.querySelector('.line-highlight')).toBeInTheDocument()
  expect(mapLine.querySelector('.line-hit')).toBeInTheDocument()
})

test('ignores a pointer that leaves before the highlight delay', () => {
  vi.useFakeTimers()
  render(<MapExplorer onSelect={vi.fn()} />)
  const button = screen.getByRole('button', { name: '서울 1호선 선택' })

  fireEvent.mouseEnter(button)
  fireEvent.mouseLeave(button)
  act(() => vi.advanceTimersByTime(150))

  expect(screen.getByTestId('seoul-map')).not.toHaveAttribute('data-active-line')
})
