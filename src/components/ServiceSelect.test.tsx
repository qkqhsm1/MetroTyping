import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { getLine } from '../data/lines'
import ServiceSelect from './ServiceSelect'

test('selects a Line 9 service', () => {
  const onChange = vi.fn()
  render(<ServiceSelect value="local" services={getLine('seoul-9').services!} onChange={onChange} />)

  expect(screen.getByRole('group', { name: '운행 종류' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: '일반' })).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: '급행' }))
  expect(onChange).toHaveBeenCalledWith('express')
})
