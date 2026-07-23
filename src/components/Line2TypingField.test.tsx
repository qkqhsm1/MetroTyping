import { render,screen } from '@testing-library/react'
import { createRef } from 'react'
import { expect,test,vi } from 'vitest'
import Line2TypingField from './Line2TypingField'

const renderField=(value:string)=>render(<Line2TypingField target="구로디지털단지" number="232" value={value} inputRef={createRef<HTMLInputElement>()} onChange={vi.fn()} onKeyDown={vi.fn()} />)

test('shows remaining target, correct characters, an isolated typo, and extra input distinctly', () => {
  const empty=renderField('')
  expect(empty.container.querySelector('.line2-typing-number')).toHaveTextContent('232')
  expect(empty.container.querySelector('.line2-typing-number')).not.toHaveClass('remaining','correct','wrong')
  expect(empty.container.querySelectorAll('.remaining')).toHaveLength(7)
  empty.unmount()

  const prefix=renderField('구로디지')
  expect([...prefix.container.querySelectorAll('.correct')].map(node=>node.textContent).join('')).toBe('구로디지')
  expect([...prefix.container.querySelectorAll('.remaining')].map(node=>node.textContent).join('')).toBe('털단지')
  prefix.unmount()

  const typo=renderField('구로디지덜단지')
  expect([...typo.container.querySelectorAll('.wrong')].map(node=>node.textContent).join('')).toBe('덜')
  expect([...typo.container.querySelectorAll('.correct')].map(node=>node.textContent).join('')).toBe('구로디지단지')
  typo.unmount()

  const extra=renderField('구로디지털단지X')
  expect([...extra.container.querySelectorAll('.wrong')].map(node=>node.textContent).join('')).toBe('X')
  expect(screen.getByRole('textbox')).toHaveValue('구로디지털단지X')
})
