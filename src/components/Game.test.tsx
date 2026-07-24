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

test('the first keystroke starts the clock and is not itself counted', () => {
  vi.useFakeTimers()
  render(<Game stations={['신도림', '문래']} color="#00A84D" onExit={() => {}} />)
  act(() => vi.advanceTimersByTime(30_000))
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: 'ㅁ' } })
  act(() => vi.advanceTimersByTime(6_000))
  fireEvent.change(input, { target: { value: '무' } })
  fireEvent.change(input, { target: { value: '문' } })
  // ㅁ is the zero mark, so two jaso (ㅜ, ㄴ) span 6s: 2 / 0.1min = 20, not the inflated 30 that
  // counting the first jaso against zero elapsed time would report.
  expect(screen.getByRole('status', { name: '실시간 타수 20 타/분' })).toBeInTheDocument()
})

test('the live meter falls to zero after the player stops typing', () => {
  vi.useFakeTimers()
  render(<Game stations={['신도림', '문래']} color="#00A84D" onExit={() => {}} />)
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: 'ㅁ' } })
  act(() => vi.advanceTimersByTime(1_000))
  fireEvent.change(input, { target: { value: '무' } })
  fireEvent.change(input, { target: { value: '문' } })
  expect(Number(screen.getByRole('status', { name: /실시간 타수/ }).querySelector('b')?.textContent)).toBeGreaterThan(0)
  // Idle well past the 8s window; the interval keeps advancing `now`, so the recent-window count empties.
  act(() => vi.advanceTimersByTime(20_000))
  expect(screen.getByRole('status', { name: '실시간 타수 0 타/분' })).toBeInTheDocument()
})

test('counts a compound vowel and a compound final as two keystrokes each, matching Hancom', () => {
  vi.useFakeTimers()
  // 왕 = ㅇ+ㅗ+ㅏ+ㅇ = 4, 뚫 = ㄸ+ㅜ+ㅀ = 4 (ㅀ compound final); both share the loop with the zero-mark
  // 신도림. Line 2 does not contain 왕/뚫, so this drives speed through a real single-word transcription
  // instead: 홍대입구 has no compounds, so we compare it against 왕십리's compounds below via countJaso.
  // Simplest faithful check: type a compound word as one Line 2 station name and read the final speed.
  render(<Game stations={['신도림', '왕십리']} color="#00A84D" onExit={() => {}} />)
  const input = screen.getByRole('textbox')
  fireEvent.change(input, { target: { value: '신도림' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: false })
  act(() => vi.advanceTimersByTime(60_000))
  fireEvent.change(input, { target: { value: '왕십리' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: false })
  // 신도림 is the zero mark; 왕십리 = 왕(ㅇ+ㅗ+ㅏ+ㅇ = 4) + 십(ㅅ+ㅣ+ㅂ = 3) + 리(ㄹ+ㅣ = 2) = 9 over 60s.
  // The old count treated 왕's compound vowel as one key (8), so this pins the corrected 9.
  expect(screen.getByRole('status', { name: '최종 타수 9 타/분' })).toBeInTheDocument()
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

  // 신도림 is the zero mark; only 문래's five jaso count, over 6s: 5 / 0.1min = 50.
  expect(screen.getByRole('status',{name:'최종 타수 50 타/분'})).toBeInTheDocument()
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

test('timed random play shows the solo station sign and the typing field but no tracking map',()=>{
  const {container}=render(<Game lineId="seoul-2" stations={['신도림','강남','시청']} color="#00A84D" durationSeconds={60} onExit={()=>{}} />)
  expect(container.querySelector('.random-stage')).not.toBeNull()
  expect(container.querySelector('.tracking-map')).toBeNull()
  expect(container.querySelector('.direction-panel[data-layout="solo"]')).not.toBeNull()
  expect(container.querySelector('.typing-field')).not.toBeNull()
  expect(container.querySelectorAll('.direction-panel [data-position]')).toHaveLength(1)
})

test('random play accepts a correct answer through the typing field and moves to the next station',()=>{
  const {container}=render(<Game lineId="seoul-2" stations={['신도림','강남','시청']} color="#00A84D" durationSeconds={60} onExit={()=>{}} />)
  const feedback=()=>container.querySelector('.typing-feedback')?.textContent
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'신도림'}})
  expect(feedback()).toContain('신도림')
  fireEvent.keyDown(screen.getByRole('textbox'),{key:'Enter',isComposing:false})
  expect(screen.getByRole('textbox')).toHaveValue('')
  expect(container.querySelector('.direction-panel [data-position="current"]')?.textContent).toContain('강남')
})

test('boarding a no-transfer terminus with a direction plays instead of ending instantly',()=>{
  const {container}=render(<Game journey={{line:'seoul-1',station:'연천',toward:'전곡'}} color="#0052A4" onExit={()=>{}} />)
  expect(container.querySelector('.tracking-map')).not.toBeNull()
  expect(screen.queryByText('환승 여행 완료')).toBeNull()
  // The departure terminus itself is the first thing you type.
  expect(container.querySelector('.direction-panel [data-position="current"]')?.textContent).toContain('연천')
})

test('transfer mode types the departure first, then advances along the line',()=>{
  const {container}=render(<Game journey={{line:'seoul-1',station:'소요산',toward:'동두천'}} color="#0052A4" onExit={()=>{}} />)
  const current=()=>container.querySelector('.direction-panel [data-position="current"]')?.textContent
  expect(container.querySelector('.tracking-map')).not.toBeNull()
  // Departure typed first, not skipped to its neighbour.
  expect(current()).toContain('소요산')
  const input=screen.getByRole('textbox')
  fireEvent.change(input,{target:{value:'소요산'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(current()).toContain('동두천')
  fireEvent.change(input,{target:{value:'동두천'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(current()).toContain('보산')
})

test('a mid-line leg shows the whole line, including the stops behind you',()=>{
  // Boarding 창동 toward 녹천 on Line 1: 방학·도봉 sit behind 창동 and must still be drawn, not clipped to
  // the way ahead. Reversing with Ctrl keeps them — it only flips the direction, never drops the line.
  const {container}=render(<Game journey={{line:'seoul-1',station:'창동',toward:'녹천'}} color="#0052A4" onExit={()=>{}} />)
  const behind=()=>container.querySelector('.tracking-map [data-station="방학"]')
  expect(behind()).not.toBeNull()
  expect(container.querySelector('.direction-panel [data-position="current"]')?.textContent).toContain('창동')
  const input=screen.getByRole('textbox')
  fireEvent.keyDown(input,{key:'Control'})
  expect(behind()).not.toBeNull()
  expect(container.querySelector('.direction-panel [data-position="current"]')?.textContent).toContain('창동')
})

test('Enter at a terminus that still offers a transfer ends the journey',()=>{
  render(<Game journey={{line:'seoul-3',station:'경찰병원',toward:'오금'}} color="#EF7C1C" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  fireEvent.change(input,{target:{value:'경찰병원'}});fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  fireEvent.change(input,{target:{value:'오금'}});fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  // Arrived at 오금 (Line 3 terminus, transfers to Line 5 so it is not a dead end). Enter ends it here.
  expect(screen.queryByText('환승 여행 완료')).toBeNull()
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(screen.getByText('환승 여행 완료')).not.toBeNull()
})

test('Tab at a transfer station switches the line and recolours; ignored elsewhere',()=>{
  const {container}=render(<Game journey={{line:'seoul-1',station:'구로',toward:'가산디지털단지'}} color="#0052A4" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  // 구로 is Line 1 only among supported lines here, so no transfer sign.
  expect(container.querySelector('.transfer-sign')).toBeNull()
  fireEvent.keyDown(input,{key:'Tab'})
  expect(container.querySelector('.tracking-map')).not.toBeNull()
})

test('quick Tab transfers to the priority line and you type the station you stand at',()=>{
  const {container}=render(<Game journey={{line:'seoul-5',station:'김포공항',toward:'송정'}} color="#996CAC" onExit={()=>{}} />)
  expect(container.querySelector('.transfer-sign')).not.toBeNull()
  const input=screen.getByRole('textbox')
  fireEvent.keyDown(input,{key:'Tab'})
  fireEvent.keyUp(input,{key:'Tab'})
  // Priority option at 김포공항 from seoul-5 is seoul-9.
  expect(container.querySelector('.tracking-map[data-line="seoul-9"]')).not.toBeNull()
  // You still type the station you stand at, 김포공항 — not a neighbour.
  expect(container.querySelector('.direction-panel [data-position="current"]')?.textContent).toContain('김포공항')
  // The way behind carries a Ctrl badge, so the other direction is one keypress away.
  expect(container.querySelector('.direction-station[data-ctrl] .direction-ctrl')).not.toBeNull()
})

test('after a transfer the default heads the longer way; typing the station advances it',()=>{
  const {container}=render(<Game journey={{line:'seoul-5',station:'김포공항',toward:'송정'}} color="#996CAC" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  fireEvent.keyDown(input,{key:'Tab'})
  fireEvent.keyUp(input,{key:'Tab'})
  // 김포공항 on Line 9: 개화 is a terminus one stop away, so the longer default heads toward 공항시장.
  fireEvent.change(input,{target:{value:'김포공항'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(container.querySelector('.direction-panel [data-position="current"]')?.textContent).toContain('공항시장')
})

test('Ctrl after a transfer flips the direction before you move',()=>{
  const {container}=render(<Game journey={{line:'seoul-5',station:'김포공항',toward:'송정'}} color="#996CAC" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  fireEvent.keyDown(input,{key:'Tab'})
  fireEvent.keyUp(input,{key:'Tab'})
  // Flip toward the short way, then typing 김포공항 steps onto 개화 instead of 공항시장.
  fireEvent.keyDown(input,{key:'Control'})
  fireEvent.change(input,{target:{value:'김포공항'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(container.querySelector('.direction-panel [data-position="current"]')?.textContent).toContain('개화')
})

test('after a transfer, advancing keeps the stations you passed on the map',()=>{
  const {container}=render(<Game journey={{line:'seoul-5',station:'김포공항',toward:'송정'}} color="#996CAC" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  fireEvent.keyDown(input,{key:'Tab'})
  fireEvent.keyUp(input,{key:'Tab'})
  // Type 김포공항 (steps onto 공항시장), then 공항시장 (steps onto 신방화). 김포공항 must remain drawn.
  fireEvent.change(input,{target:{value:'김포공항'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  fireEvent.change(input,{target:{value:'공항시장'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(container.querySelector('.direction-panel [data-position="current"]')?.textContent).toContain('신방화')
  expect(container.querySelector('.tracking-map [data-station="김포공항"]')).not.toBeNull()
})

test('Tab plus a number transfers straight to that option',()=>{
  const {container}=render(<Game journey={{line:'seoul-5',station:'김포공항',toward:'송정'}} color="#996CAC" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  // Options at 김포공항 from seoul-5 are [seoul-9, arex]; hold Tab and press 2 → arex directly.
  fireEvent.keyDown(input,{key:'Tab'})
  fireEvent.keyDown(input,{key:'2'})
  fireEvent.keyUp(input,{key:'Tab'})
  expect(container.querySelector('.tracking-map[data-line="arex"]')).not.toBeNull()
})

test('the hold menu picks a transfer line by number key and Esc closes it',()=>{
  let frame:FrameRequestCallback|undefined
  vi.spyOn(window,'requestAnimationFrame').mockImplementation(callback=>{frame=callback;return 1})
  vi.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{})
  let clock=0
  vi.spyOn(performance,'now').mockImplementation(()=>clock)
  const {container}=render(<Game journey={{line:'seoul-5',station:'김포공항',toward:'송정'}} color="#996CAC" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  // Hold Tab past the 1.5s threshold: the raf tick opens the menu.
  fireEvent.keyDown(input,{key:'Tab'})
  clock=1600
  act(()=>frame?.(1600))
  expect(container.querySelector('.transfer-sign[data-open="true"]')).not.toBeNull()
  // Options at 김포공항 from seoul-5 are [seoul-9, arex]; Esc closes without transferring.
  fireEvent.keyDown(input,{key:'Escape'})
  expect(container.querySelector('.transfer-sign[data-open="true"]')).toBeNull()
  expect(container.querySelector('.tracking-map')?.getAttribute('data-line')).toBe('seoul-5')
  // Re-open and press 2 to transfer to the second option, 공항철도.
  fireEvent.keyUp(input,{key:'Tab'})
  fireEvent.keyDown(input,{key:'Tab'})
  clock=3300
  act(()=>frame?.(3300))
  fireEvent.keyDown(input,{key:'2'})
  expect(container.querySelector('.tracking-map')?.getAttribute('data-line')).toBe('arex')
})
