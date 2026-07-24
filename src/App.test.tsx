import { fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'
import { playSound } from './audio/sounds'
import * as routes from './game/routes'

vi.mock('./audio/sounds',()=>({playSound:vi.fn()}))
vi.mock('./components/Game',async importOriginal=>{
  const {default:Game}=await importOriginal<typeof import('./components/Game')>()
  return {default:(props:ComponentProps<typeof Game>)=>props.lineId==='seoul-9'
    ? <section data-testid="line-9-game" data-stations={props.stations.join('|')}><h1>{props.stations[0]}</h1><div className="route-progress">1 / {props.stations.length}</div>{props.durationSeconds&&<span>노선 전체에서 무작위 출제</span>}</section>
    : <Game {...props}/>}
})
afterEach(()=>vi.mocked(playSound).mockClear())

test('passes the header mute state into gameplay sounds', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button',{name:'사운드 끄기'}))
  fireEvent.click(screen.getByRole('button',{name:'서울 1호선 선택'}))
  fireEvent.click(screen.getByRole('button',{name:'인천에서 신창까지 바로 시작'}))
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'인천'}})
  expect(playSound).toHaveBeenCalledWith('key',false)
})

test('shows the product and city map entry', () => {
  render(<App />)
  expect(screen.getByRole('link', { name: 'METRO/TYPE' })).toHaveAttribute('href', import.meta.env.BASE_URL)
  expect(screen.getByRole('button', { name: '서울' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '도쿄' })).toBeInTheDocument()
  expect(screen.getByText('14 LINES')).toBeInTheDocument()
  for (const name of ['서울 1호선','서울 2호선','서울 3호선','서울 4호선','서울 5호선','서울 6호선','서울 7호선','서울 8호선','서울 9호선']) {
    expect(screen.getByRole('button', { name: `${name} 선택` })).toBeEnabled()
  }
})

test('opens setup for Line 6', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 6호선 선택' }))
  expect(screen.getByRole('heading', { name: '서울 6호선' })).toBeInTheDocument()
})

test('plays the line-selection chime only on the first selection', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 1호선 선택' }))
  fireEvent.click(screen.getByRole('button', { name: '← 노선 선택' }))
  fireEvent.click(screen.getByRole('button', { name: '서울 2호선 선택' }))
  expect(vi.mocked(playSound).mock.calls.filter(([kind]) => kind === 'select')).toEqual([['select', true]])
})

test('starts a quick route by asking for its departure station first', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 1호선 선택' }))
  fireEvent.click(screen.getByRole('button', { name: '인천에서 신창까지 바로 시작' }))
  expect(screen.getByRole('heading', { name: '인천' })).toBeInTheDocument()
})

test('starts a clockwise loop once without repeating its origin', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 2호선 선택' }))
  fireEvent.click(screen.getByRole('button', { name: '신도림에서 대림까지 바로 시작' }))
  expect(screen.getByRole('heading', { name: '신도림' })).toBeInTheDocument()
  expect(document.querySelector('.route-progress')).toHaveTextContent('1 / 43')
})

test('keeps arbitrary custom station pairs available', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 2호선 선택' }))
  fireEvent.click(screen.getByRole('combobox', { name: '출발역' }))
  fireEvent.click(screen.getByRole('option', { name: '문래' }))
  fireEvent.click(screen.getByRole('combobox', { name: '도착역' }))
  fireEvent.click(screen.getByRole('option', { name: '당산' }))
  fireEvent.click(screen.getByRole('button', { name: '운행 시작 →' }))
  expect(screen.getByRole('heading', { name: '문래' })).toBeInTheDocument()
})

test('opens setup from a supported line', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 2호선 선택' }))
  expect(screen.getByRole('heading', { name: '서울 2호선', level: 1 })).toBeInTheDocument()
  expect(screen.queryByText(/TRIP SETUP/)).not.toBeInTheDocument()
})

test('switches Line 9 setup between local and express service', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 9호선 선택' }))
  expect(screen.getByRole('button', { name: '일반' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '급행' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: '급행' }))
  fireEvent.click(screen.getByRole('combobox', { name: '출발역' }))
  expect(screen.queryByText('개화', { selector: '[role="option"]' })).not.toBeInTheDocument()
  expect(screen.getByText('김포공항 ↔ 중앙보훈병원')).toBeInTheDocument()
})

test('does not show service selection for Line 8', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 8호선 선택' }))
  expect(screen.queryByRole('button', { name: '일반' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '급행' })).not.toBeInTheDocument()
})

test('starts the full Line 9 express quick route', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 9호선 선택' }))
  fireEvent.click(screen.getByRole('button', { name: '급행' }))
  fireEvent.click(screen.getByRole('button', { name: '김포공항에서 중앙보훈병원까지 바로 시작' }))

  expect(screen.getByRole('heading', { name: '김포공항' })).toBeInTheDocument()
  expect(document.querySelector('.route-progress')).toHaveTextContent('1 / 16')
  expect(screen.getByTestId('line-9-game')).toHaveAttribute('data-stations','김포공항|마곡나루|가양|염창|당산|여의도|노량진|동작|고속터미널|신논현|선정릉|봉은사|종합운동장|석촌|올림픽공원|중앙보훈병원')
})

test('starts a custom route using only Line 9 express stops', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 9호선 선택' }))
  fireEvent.click(screen.getByRole('button', { name: '급행' }))
  fireEvent.click(screen.getByRole('combobox', { name: '출발역' }))
  fireEvent.click(screen.getByRole('option', { name: '김포공항' }))
  fireEvent.click(screen.getByRole('combobox', { name: '도착역' }))
  fireEvent.click(screen.getByRole('option', { name: '가양' }))
  fireEvent.click(screen.getByRole('button', { name: '운행 시작 →' }))

  expect(screen.getByRole('heading', { name: '김포공항' })).toBeInTheDocument()
  expect(document.querySelector('.route-progress')).toHaveTextContent('1 / 3')
  expect(screen.getByTestId('line-9-game')).toHaveAttribute('data-stations','김포공항|마곡나루|가양')
})

test('uses Line 9 express stops for random gameplay', () => {
  const dateKey=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date())
  const expected=routes.dailyStations('seoul-9',dateKey,'express')[0]!
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 9호선 선택' }))
  fireEvent.click(screen.getByRole('button', { name: '급행' }))
  fireEvent.click(screen.getByRole('button', { name: '랜덤 역명' }))
  fireEvent.click(screen.getByRole('button', { name: '운행 시작 →' }))

  expect(screen.getByRole('heading', { name: expected })).toBeInTheDocument()
  expect(screen.getByText('노선 전체에서 무작위 출제')).toBeInTheDocument()
  expect(screen.getByTestId('line-9-game')).toHaveAttribute('data-stations',routes.dailyStations('seoul-9',dateKey,'express').join('|'))
})

test('keeps setup usable when custom route calculation fails', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 9호선 선택' }))
  fireEvent.click(screen.getByRole('combobox', { name: '출발역' }))
  fireEvent.click(screen.getByRole('option', { name: '개화' }))
  fireEvent.click(screen.getByRole('combobox', { name: '도착역' }))
  fireEvent.click(screen.getByRole('option', { name: '김포공항' }))
  const failure=vi.spyOn(routes,'getRoute').mockImplementationOnce(()=>{throw new Error('route unavailable')})
  fireEvent.click(screen.getByRole('button', { name: '운행 시작 →' }))

  expect(screen.getByRole('alert')).toHaveTextContent('선택한 구간을 운행할 수 없습니다.')
  expect(screen.getByRole('heading', { name: '서울 9호선' })).toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: '출발역' })).toBeInTheDocument()
  failure.mockRestore()
})

test('refuses a Line 6 trip that rides the Eungam loop out onto the trunk instead of crashing', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 6호선 선택' }))
  fireEvent.click(screen.getByRole('combobox', { name: '출발역' }))
  fireEvent.click(screen.getByRole('option', { name: '구산' }))
  fireEvent.click(screen.getByRole('combobox', { name: '도착역' }))
  fireEvent.click(screen.getByRole('option', { name: '신내' }))
  fireEvent.click(screen.getByRole('button', { name: '운행 시작 →' }))

  expect(screen.getByRole('alert')).toHaveTextContent('선택한 구간을 운행할 수 없습니다.')
  expect(screen.getByRole('heading', { name: '서울 6호선' })).toBeInTheDocument()
})

test('starts a Line 6 trip that closes the Eungam loop back onto 응암', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 6호선 선택' }))
  fireEvent.click(screen.getByRole('combobox', { name: '출발역' }))
  fireEvent.click(screen.getByRole('option', { name: '구산' }))
  fireEvent.click(screen.getByRole('combobox', { name: '도착역' }))
  fireEvent.click(screen.getByRole('option', { name: '응암' }))
  fireEvent.click(screen.getByRole('button', { name: '운행 시작 →' }))

  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByRole('heading', { name: '구산' })).toBeInTheDocument()
})
