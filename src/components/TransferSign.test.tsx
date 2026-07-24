import { expect,test } from 'vitest'
import { render } from '@testing-library/react'
import TransferSign,{ lineBadgeLabel } from './TransferSign'

test('badge labels are the line number, or a short tag for unnumbered lines',()=>{
  expect(lineBadgeLabel('seoul-5')).toBe('5')
  expect(lineBadgeLabel('arex')).toBe('A')
  expect(lineBadgeLabel('suin-bundang')).toBe('수인')
  expect(lineBadgeLabel('incheon-2')).toBe('I2')
})

test('renders nothing at a non-transfer station',()=>{
  const {container}=render(<TransferSign currentLine="seoul-2" station="강남" menuOpen={false} holdProgress={0} />)
  expect(container.firstChild).toBeNull()
})

test('collapsed shows the current line then the priority option',()=>{
  const {container}=render(<TransferSign currentLine="seoul-5" station="김포공항" menuOpen={false} holdProgress={0} />)
  const badges=[...container.querySelectorAll('.transfer-badge')].map(node=>node.textContent)
  expect(badges).toEqual(['5','9'])
})

test('the open menu lists every option numbered by priority',()=>{
  const {container}=render(<TransferSign currentLine="seoul-5" station="김포공항" menuOpen={true} holdProgress={1} />)
  const rows=[...container.querySelectorAll('.transfer-option')].map(node=>node.textContent)
  expect(rows[0]).toContain('1')
  expect(rows[0]).toContain('9호선')
  expect(rows[1]).toContain('2')
  expect(rows[1]).toContain('공항철도')
})
