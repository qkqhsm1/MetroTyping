import { expect,test } from 'vitest'
import { render } from '@testing-library/react'
import DirectionSign from './DirectionSign'

test('a balanced sign shows previous, current and next with numbers and english names',()=>{
  const {container}=render(<DirectionSign lineId="seoul-3" previous="경복궁" current="안국" next="종로3가" />)
  const positions=[...container.querySelectorAll('[data-position]')].map(node=>node.getAttribute('data-position'))
  expect(positions).toEqual(['previous','current','next'])
  expect(container.textContent).toContain('안국')
  expect(container.textContent).toContain('Anguk')
  expect(container.querySelector('[data-position="current"] .direction-number')?.textContent).toBe('328')
})

test('the run start has no previous region content',()=>{
  const {container}=render(<DirectionSign lineId="seoul-3" current="대화" next="주엽" />)
  expect(container.querySelector('[data-position="previous"]')?.textContent).toBe('')
})

test('solo mode renders only the current pill',()=>{
  const {container}=render(<DirectionSign lineId="seoul-4" current="사당" solo />)
  expect(container.querySelectorAll('[data-position]')).toHaveLength(1)
  expect(container.querySelector('[data-position="current"]')?.textContent).toContain('사당')
})
