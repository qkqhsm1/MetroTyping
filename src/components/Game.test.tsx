import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import Game from './Game'
import { playSound } from '../audio/sounds'

vi.mock('../audio/sounds',()=>({playSound:vi.fn()}))

afterEach(() => {vi.useRealTimers();vi.mocked(playSound).mockClear()})

test('routes key, error, correct, and complete sounds through gameplay and honors sound=false', () => {
  const inputFor=()=>screen.getByRole('textbox')
  render(<Game stations={['신도림','문래']} color="#00A84D" onExit={() => {}} />)
  fireEvent.change(inputFor(),{target:{value:'틀림'}})
  fireEvent.keyDown(inputFor(),{key:'Enter',isComposing:false})
  fireEvent.change(inputFor(),{target:{value:'신도림'}})
  fireEvent.keyDown(inputFor(),{key:'Enter',isComposing:false})
  fireEvent.change(inputFor(),{target:{value:'문래'}})
  fireEvent.keyDown(inputFor(),{key:'Enter',isComposing:false})
  expect(vi.mocked(playSound).mock.calls).toEqual([
    ['key',true],['error',true],['key',true],['correct',true],['key',true],['complete',true],
  ])

  vi.mocked(playSound).mockClear()
  render(<Game stations={['신도림']} color="#00A84D" sound={false} onExit={() => {}} />)
  const muted=screen.getAllByRole('textbox').at(-1)!
  fireEvent.change(muted,{target:{value:'신도림'}})
  fireEvent.keyDown(muted,{key:'Enter',isComposing:false})
  expect(playSound).toHaveBeenCalledWith('key',false)
  expect(playSound).toHaveBeenCalledWith('complete',false)
})

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
  const pendingTimers=vi.getTimerCount()
  pending.unmount()
  expect(vi.getTimerCount()).toBeLessThan(pendingTimers)
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
  const firstWindow=container.querySelector('polyline[data-route]')?.getAttribute('data-global-start')
  const firstShape=container.querySelector('polyline[data-route]')?.getAttribute('points')

  const input=screen.getByRole('textbox')
  fireEvent.change(input,{target:{value:'typing'}})
  expect(container.querySelector('polyline[data-route]')).toHaveAttribute('points',firstShape)
  fireEvent.change(input,{target:{value:''}})
  stations.slice(0,8).forEach(station=>{
    fireEvent.change(input,{target:{value:station}})
    fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  })

  expect([...container.querySelectorAll('.route-map text')].map(node=>node.textContent)).toEqual(stations.slice(8)) // 역7 is the current station, hidden under the train
  expect(container.querySelector('polyline[data-route]')).not.toHaveAttribute('data-global-start',firstWindow)
  expect(container.querySelector('polyline[data-route]')).not.toHaveAttribute('points',firstShape)
  expect(screen.getByRole('heading',{name:'역8'})).toBeInTheDocument()
})

test.each([
  {name:'forward Hanam after 길동 leaves',stations:['강동','길동','A','B','C','D','E','F','G','H'],answers:8,key:'seoul-5-hanam'},
  {name:'forward Macheon after 둔촌동 leaves',stations:['강동','둔촌동','A','B','C','D','E','F','G','H'],answers:8,key:'seoul-5-macheon'},
  {name:'reverse Hanam before 길동 enters',stations:['하남검단산','A','B','C','D','E','F','G','길동','강동'],answers:0,key:'seoul-5-hanam'},
  {name:'reverse Macheon before 둔촌동 enters',stations:['마천','A','B','C','D','E','F','G','둔촌동','강동'],answers:0,key:'seoul-5-macheon'},
])('keeps Line 5 geometry stable for $name the visible segment', ({stations,answers,key}) => {
  const {container}=render(<Game lineId="seoul-5" stations={stations} color="#996CAC" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  stations.slice(0,answers).forEach(station=>{
    fireEvent.change(input,{target:{value:station}})
    fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  })
  expect(container.querySelector('polyline[data-route]')).toHaveAttribute('data-geometry',key)
  expect(container.querySelectorAll('.route-map text')).toHaveLength(Math.min(8,stations.length-7*(answers>0?1:0))-(answers>0?1:0)) // train hides the current station label once it appears
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
