import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
// @ts-expect-error Node types are intentionally excluded from the browser build.
import { readFileSync } from 'node:fs'
import MapExplorer from './MapExplorer'
import { getLine } from '../data/lines'

afterEach(() => vi.useRealTimers())

test('uses page scrolling on desktop and touch panning on mobile', () => {
  const styles = readFileSync('src/styles.css', 'utf8')

  expect(styles).toMatch(/\.map-frame\{[^}]*height:auto[^}]*overflow:visible/s)
  expect(styles).toMatch(/\.map-stage\{[^}]*min-width:0/s)
  expect(styles).toMatch(/@media \(max-width:640px\)[\s\S]*\.map-frame\{[^}]*overflow:auto/s)
  expect(styles).toMatch(/\.explorer \.map-stage img\{[^}]*filter:none!important/s)
})

test('switches between the official Seoul map and original Tokyo map', () => {
  render(<MapExplorer onSelect={vi.fn()} />)
  expect(screen.getByText('어느 노선에서 시작할까요?')).toHaveClass('explorer-title')
  expect(screen.getByText('노선을 고르고 타이핑 여행을 시작해 보세요.')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: '서울 수도권 지하철 노선도' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '도쿄' }))
  expect(screen.getByText('どの路線から始めますか？')).toBeInTheDocument()
  expect(screen.getByText('路線を選んで、タイピングの旅を始めましょう。')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'JR 야마노테선 노선도' })).toBeInTheDocument()
  expect(document.querySelectorAll('[data-station-label]')).toHaveLength(30)
})

test('selects supported lines', () => {
  const onSelect = vi.fn()
  render(<MapExplorer onSelect={onSelect} />)
  fireEvent.click(screen.getByRole('button', { name: '서울 2호선 선택' }))
  expect(onSelect).toHaveBeenCalledWith('seoul-2')
  fireEvent.click(screen.getByRole('button', { name: '지도에서 서울 1호선 선택' }))
  expect(onSelect).toHaveBeenCalledWith('seoul-1')
  fireEvent.click(screen.getByRole('button', { name: '서울 4호선 선택' }))
  expect(onSelect).toHaveBeenCalledWith('seoul-4')
})

test('selects Seoul lines 5 through 9 from dock and exact map symbols', () => {
  const onSelect = vi.fn()
  render(<MapExplorer onSelect={onSelect} />)

  for (const id of ['seoul-5', 'seoul-6', 'seoul-7', 'seoul-8', 'seoul-9']) {
    const line = getLine(id)
    const mapLine = screen.getByRole('button', { name: `지도에서 ${line.name} 선택` })
    expect(mapLine.querySelector('.line-highlight')).toHaveAttribute('href', expect.stringContaining(`#${id}`))
    fireEvent.click(screen.getByRole('button', { name: `${line.name} 선택` }))
    expect(onSelect).toHaveBeenLastCalledWith(id)
  }

  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

test.each([
  ['서울 3호선', 'seoul-3'],
  ['서울 4호선', 'seoul-4'],
  ['수인·분당선', 'suin-bundang'],
])('selects %s from its official map geometry', (name, id) => {
  const onSelect = vi.fn()
  render(<MapExplorer onSelect={onSelect} />)

  const mapLine = screen.getByRole('button', { name: `지도에서 ${name} 선택` })
  expect(mapLine.querySelector('.line-highlight')).toHaveAttribute('href', expect.stringContaining(`#${id}`))
  fireEvent.click(mapLine)

  expect(onSelect).toHaveBeenCalledWith(id)
})

test('offers the PDF-rendered high-resolution Seoul map when needed', () => {
  render(<MapExplorer onSelect={vi.fn()} />)
  expect(screen.getByRole('img', { name: '서울 수도권 지하철 노선도' })).toHaveAttribute('srcSet',
    expect.stringContaining('seoul-metro-map-20250929@2x.webp 10205w'))
})

test('links dock hover to the matching map highlight', () => {
  vi.useFakeTimers()
  render(<MapExplorer onSelect={vi.fn()} />)

  fireEvent.mouseEnter(screen.getByRole('button', { name: '서울 2호선 선택' }))
  expect(screen.getByTestId('seoul-map')).not.toHaveAttribute('data-active-line')
  act(() => vi.advanceTimersByTime(150))

  expect(screen.getByTestId('seoul-map')).toHaveAttribute('data-active-line', 'seoul-2')
  expect(screen.getByTestId('seoul-map').querySelector('.map-dimmer')).toBeInTheDocument()
  const mapLine = screen.getByRole('button', { name: '지도에서 서울 2호선 선택' })
  expect(mapLine).toHaveAttribute('data-active', 'true')
  expect(mapLine.querySelector('.line-halo')).toBeInTheDocument()
  expect(mapLine.querySelector('.line-highlight')).toBeInTheDocument()
  expect(mapLine.querySelector('.line-hit')).toBeInTheDocument()
})

test('uses lightweight brighter hover layers without filtering the full route vector', () => {
  const styles=readFileSync('src/styles.css','utf8')
  expect(styles).toMatch(/\.map-frame\[data-active-line\] \.map-dimmer\{opacity:\.13\}/)
  expect(styles).toMatch(/\.map-hitareas g\[data-active="true"\] \.line-highlight\{opacity:1;stroke-width:10\.1\}/)
  expect(styles).toMatch(/\.line-halo\{[^}]*stroke:#fff[^}]*stroke-width:14/s)
  expect(styles).not.toMatch(/\.line-highlight\{[^}]*drop-shadow/s)
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
