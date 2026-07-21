import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'
import { playSound } from './audio/sounds'

vi.mock('./audio/sounds',()=>({playSound:vi.fn()}))
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
  expect(screen.getByText('8 LINES')).toBeInTheDocument()
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
