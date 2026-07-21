import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('shows the product and city map entry', () => {
  render(<App />)
  expect(screen.getByRole('link', { name: 'METRO/TYPE' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '서울' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '도쿄' })).toBeInTheDocument()
})

test('opens setup from a supported line', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 2호선 선택' }))
  expect(screen.getByRole('heading', { name: '서울 2호선', level: 1 })).toBeInTheDocument()
  expect(screen.queryByText(/TRIP SETUP/)).not.toBeInTheDocument()
})
