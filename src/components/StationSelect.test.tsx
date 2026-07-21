import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import StationSelect from './StationSelect'

const stations = ['신도림','문래','영등포구청','당산','합정','홍대입구','신촌','이대','아현','충정로','시청']

test('opens a bounded list below the trigger and selects a station', () => {
  const onChange = vi.fn()
  render(<StationSelect label="출발역" value="" options={stations} onChange={onChange} />)

  const trigger = screen.getByRole('combobox', { name: '출발역' })
  fireEvent.click(trigger)

  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('listbox', { name: '출발역' })).toHaveClass('station-menu')
  fireEvent.click(screen.getByRole('option', { name: '시청' }))
  expect(onChange).toHaveBeenCalledWith('시청')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('closes the station list with Escape', () => {
  render(<StationSelect label="도착역" value="" options={stations} onChange={vi.fn()} />)
  const trigger = screen.getByRole('combobox', { name: '도착역' })
  fireEvent.click(trigger)
  fireEvent.keyDown(trigger, { key: 'Escape' })
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})
