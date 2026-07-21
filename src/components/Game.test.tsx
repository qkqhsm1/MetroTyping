import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import Game from './Game'

afterEach(() => vi.useRealTimers())

test('does not submit Enter during Korean composition', () => {
  render(<Game stations={['신도림', '문래']} color="#00A84D" onExit={() => {}} />)
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: '신도림' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
  expect(screen.getByRole('heading', { name: '신도림' })).toBeInTheDocument()
})

test('finishes after a correct composed answer', () => {
  render(<Game stations={['신도림', '문래']} color="#00A84D" onExit={() => {}} />)
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: '신도림' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: false })
  fireEvent.change(input, { target: { value: '문래' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: false })
  expect(screen.getByText('운행 완료')).toBeInTheDocument()
})

test('shows Japanese reference labels while accepting Korean', () => {
  render(<Game lineId="yamanote" stations={['요요기', '신주쿠']} color="#9ACD32" onExit={() => {}} />)
  expect(screen.getByText('代々木')).toBeInTheDocument()
  expect(screen.getByText('よよぎ')).toBeInTheDocument()
})

test('finishes a timed random game exactly when the clock reaches zero', () => {
  vi.useFakeTimers()
  render(<Game stations={['출발', '서울역', '시청']} color="#0052A4" durationSeconds={1} onExit={() => {}} />)

  expect(screen.getByText('1초')).toBeInTheDocument()
  expect(screen.getByText('노선 전체에서 무작위 출제')).toBeInTheDocument()
  expect(screen.queryByRole('img', { name: '전체 노선도' })).not.toBeInTheDocument()
  act(() => vi.advanceTimersByTime(1000))

  expect(screen.getByText('랜덤 도전 완료')).toBeInTheDocument()
})

test('asks for the departure station first, then advances to the next station', () => {
  render(<Game stations={['신도림', '문래', '영등포구청']} color="#00A84D" onExit={() => {}} />)
  expect(screen.getByText('출발 준비 · 신도림')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '신도림' })).toBeInTheDocument()

  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: '신도림' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: false })

  expect(screen.getByText('현재 신도림')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '문래' })).toBeInTheDocument()
  expect(document.querySelector('[data-target="true"]')?.textContent).toContain('문래')
})

test('reveals the train after departure without blocking the next answer', () => {
  vi.useFakeTimers()
  const { container,unmount }=render(<Game stations={['신도림','문래','영등포구청']} color="#00A84D" onExit={() => {}} />)
  const input=screen.getByRole('textbox')

  expect(container.querySelector('.train')).not.toBeInTheDocument()
  fireEvent.change(input,{target:{value:'신도림'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(container.querySelector('.train')).toHaveClass('train-entering')

  fireEvent.change(input,{target:{value:'문래'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(screen.getByRole('heading',{name:'영등포구청'})).toBeInTheDocument()
  expect(container.querySelector('.train')).toBeInTheDocument()
  act(()=>vi.advanceTimersByTime(259))
  expect(container.querySelector('.train')).toHaveClass('train-entering')
  act(()=>vi.advanceTimersByTime(1))
  expect(container.querySelector('.train')).not.toHaveClass('train-entering')
  unmount()

  const error=vi.spyOn(console,'error').mockImplementation(()=>{})
  const pending=render(<Game stations={['신도림','문래']} color="#00A84D" onExit={() => {}} />)
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'신도림'}})
  fireEvent.keyDown(screen.getByRole('textbox'),{key:'Enter',isComposing:false})
  pending.unmount()
  act(()=>vi.advanceTimersByTime(260))
  expect(error).not.toHaveBeenCalled()
  error.mockRestore()
})

test('starts Korean keystrokes per minute at the first printable key', () => {
  vi.useFakeTimers()
  render(<Game stations={['신도림', '문래']} color="#00A84D" onExit={() => {}} />)
  act(() => vi.advanceTimersByTime(30_000))
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: 'ㅁ' } })
  act(() => vi.advanceTimersByTime(6_000))
  fireEvent.change(input, { target: { value: '무' } })
  fireEvent.change(input, { target: { value: '문' } })
  expect(screen.getByRole('status', { name: '실시간 타수 30 타/분' })).toBeInTheDocument()
})

test('shows a readable eight-station segment and swaps segments without blocking input', () => {
  const stations=Array.from({length:12},(_,index)=>`역${index}`)
  const { container }=render(<Game stations={stations} color="#0052A4" onExit={() => {}} />)
  expect([...container.querySelectorAll('.route-map text')].map(node=>node.textContent)).toEqual(stations.slice(0,8))

  const input=screen.getByRole('textbox')
  stations.slice(0,8).forEach(station=>{
    fireEvent.change(input,{target:{value:station}})
    fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  })

  expect([...container.querySelectorAll('.route-map text')].map(node=>node.textContent)).toEqual(stations.slice(7))
  expect(screen.getByRole('heading',{name:'역8'})).toBeInTheDocument()
})

test('shows the final Korean typing speed on the result screen', () => {
  vi.useFakeTimers()
  render(<Game stations={['신도림','문래']} color="#00A84D" onExit={() => {}} />)
  const input=screen.getByRole('textbox')
  fireEvent.change(input,{target:{value:'신도림'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  act(()=>vi.advanceTimersByTime(6_000))
  fireEvent.change(input,{target:{value:'문래'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})

  expect(screen.getByRole('status',{name:'최종 타수 130 타/분'})).toBeInTheDocument()
})
