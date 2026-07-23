import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import Game from './Game'
import { getRoute } from '../game/routes'
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

test('restarts the Line 2 sign shake on every incorrect Enter without replacing the input', () => {
  const {container}=render(<Game lineId="seoul-2" stations={['신도림','문래']} color="#00A84D" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  fireEvent.change(input,{target:{value:'신도림X'}})

  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(container.querySelector('.typing-visual')).toHaveAttribute('data-error-attempt','1')
  expect(screen.getByRole('textbox')).toBe(input)
  expect(input).toHaveValue('신도림X')

  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(container.querySelector('.typing-visual')).toHaveAttribute('data-error-attempt','2')
  expect(screen.getByRole('textbox')).toBe(input)
  expect(input).toHaveValue('신도림X')
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
  const {container}=render(<Game stations={['신도림', '문래', '영등포구청']} color="#00A84D" onExit={() => {}} />)
  expect(screen.getByText('다음 신도림')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '신도림' })).toBeInTheDocument()

  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: '신도림' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: false })

  expect(screen.getByText('다음 문래')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '문래' })).toBeInTheDocument()
  expect(container.querySelector('.direction-panel [data-position="current"]')?.textContent).toContain('문래')
})

test('moves the Line 2 tracking camera to Mullae immediately after Sindorim is correct', () => {
  const { container }=render(<Game lineId="seoul-2" stations={['신도림','문래','영등포구청','당산']} color="#00A84D" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  expect(container.querySelector('.tracking-map')).toHaveAttribute('data-camera-station','신도림')
  fireEvent.change(input,{target:{value:'신도림'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(container.querySelector('.tracking-map')).toHaveAttribute('data-camera-station','문래')
  expect(screen.getByRole('heading',{name:'문래'})).toBeInTheDocument()
})

test('shows numbered previous, current, and next Line 2 stations in travel order', () => {
  const { container }=render(<Game lineId="seoul-2" stations={['신도림','문래','영등포구청']} color="#00A84D" onExit={()=>{}} />)
  const game=container.querySelector<HTMLElement>('.game')!,stableInteractionWidth=game.style.getPropertyValue('--sign-interaction-width')
  const firstTargetWidth=game.style.getPropertyValue('--sign-target-width')
  const panel=()=>container.querySelector('.direction-panel')!
  expect(panel()).toHaveAttribute('data-travel-side','next')
  expect(panel()).toHaveAttribute('data-layout','balanced')
  expect(panel().querySelector('[data-position="previous"]')).toBeEmptyDOMElement()
  expect(panel().querySelector('[data-position="current"]')).toHaveTextContent('234신도림Sindorim')
  expect(panel().querySelector('[data-position="next"]')).toHaveTextContent('235문래Mullae')

  const input=screen.getByRole('textbox')
  fireEvent.change(input,{target:{value:'신도림'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})

  expect(panel().querySelector('[data-position="previous"]')).toHaveTextContent('234신도림Sindorim')
  expect(panel().querySelector('[data-position="current"]')).toHaveTextContent('235문래Mullae')
  expect(panel().querySelector('[data-position="next"]')).toHaveTextContent('236영등포구청Yeongdeungpo-gu Office')
  expect(container.querySelector('.typing-field')).toBeInTheDocument()
  fireEvent.change(input,{target:{value:'문래'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(game.style.getPropertyValue('--sign-interaction-width')).toBe(stableInteractionWidth)
  expect(game.style.getPropertyValue('--sign-target-width')).not.toBe(firstTargetWidth)
})

test('sizes a two-character Line 2 sign from its Korean name, not its long English name', () => {
  const {container}=render(<Game lineId="seoul-2" stations={['교대','서초']} color="#00A84D" onExit={()=>{}} />)

  expect(container.querySelector<HTMLElement>('.game')!.style.getPropertyValue('--sign-target-width')).toBe('270px')
  expect(container.querySelector('[data-position="current"] small')).toHaveAttribute('data-long','true')
})

test('measures Line 2 gameplay time from the first typed character through arrival', () => {
  vi.useFakeTimers()
  render(<Game lineId="seoul-2" stations={['신도림','문래']} color="#00A84D" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  fireEvent.change(input,{target:{value:'신도림'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  act(()=>vi.advanceTimersByTime(1_230))
  fireEvent.change(input,{target:{value:'문래'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(screen.getByText('00:01.2')).toBeInTheDocument()
})

test('keeps the train on the map and never blocks the next answer', () => {
  const { container }=render(<Game stations={['신도림','문래','영등포구청']} color="#00A84D" onExit={() => {}} />)
  const input=screen.getByRole('textbox')

  expect(container.querySelector('.train')).toBeInTheDocument()
  fireEvent.change(input,{target:{value:'신도림'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(screen.getByRole('heading',{name:'문래'})).toBeInTheDocument()

  fireEvent.change(input,{target:{value:'문래'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(screen.getByRole('heading',{name:'영등포구청'})).toBeInTheDocument()
  expect(container.querySelector('.train')).toBeInTheDocument()
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

test('runs a long ordered route through one persistent world without blocking input', () => {
  const stations=getRoute('seoul-1','인천','연천').stationIds
  const { container }=render(<Game lineId="seoul-1" stations={stations} color="#0052A4" onExit={() => {}} />)
  expect(container.querySelector('.tracking-map')).toBeInTheDocument()

  const input=screen.getByRole('textbox')
  fireEvent.change(input,{target:{value:'typing'}})
  expect(input).toHaveValue('typing')
  expect(screen.getByRole('heading',{name:stations[0]})).toBeInTheDocument()
  fireEvent.change(input,{target:{value:''}})
  stations.slice(0,8).forEach(station=>{
    fireEvent.change(input,{target:{value:station}})
    fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  })

  expect(container.querySelector('.tracking-map')).toBeInTheDocument()
  expect(screen.getByRole('heading',{name:stations[8]})).toBeInTheDocument()
})

test.each([
  {name:'forward Hanam',from:'방화',to:'하남검단산'},
  {name:'forward Macheon',from:'방화',to:'마천'},
  {name:'reverse Hanam',from:'하남검단산',to:'방화'},
  {name:'reverse Macheon',from:'마천',to:'방화'},
])('renders the Line 5 tracking world and advances for $name', ({from,to}) => {
  const stations=getRoute('seoul-5',from,to).stationIds
  const {container}=render(<Game lineId="seoul-5" stations={stations} color="#996CAC" onExit={()=>{}} />)
  expect(container.querySelector('.tracking-map')).toBeInTheDocument()
  const input=screen.getByRole('textbox')
  fireEvent.change(input,{target:{value:stations[0]}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(screen.getByRole('heading',{name:stations[1]})).toBeInTheDocument()
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

test.each([
  ['seoul-1','인천','연천'],
  ['seoul-5','방화','마천'],
  ['seoul-9','김포공항','중앙보훈병원'],
  ['incheon-1','검단호수공원','송도달빛축제공원'],
  ['yamanote','도쿄','신주쿠'],
])('%s ordered play uses the tracking world and the platform sign',(lineId,from,to)=>{
  const stations=getRoute(lineId,from,to).stationIds
  const {container}=render(<Game lineId={lineId} stations={stations} color="#0052A4" onExit={()=>{}} />)
  expect(container.querySelector('.tracking-map')).not.toBeNull()
  expect(container.querySelector('.direction-panel[data-layout="balanced"]')).not.toBeNull()
  expect(container.querySelector('.typing-field')).not.toBeNull()
  expect(container.querySelector('.route-segment .train')).not.toBeNull()
})

test('ordered play shows a live play time that starts on the first jaso',()=>{
  const stations=getRoute('seoul-4','진접','오이도').stationIds
  const {container}=render(<Game lineId="seoul-4" stations={stations} color="#00A5DE" onExit={()=>{}} />)
  expect(container.querySelector('.live-time')?.textContent).toContain('00:00.0')
})
