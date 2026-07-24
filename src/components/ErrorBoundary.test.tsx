import { expect,test,vi } from 'vitest'
import { fireEvent,render,screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

const Boom=()=>{throw new Error('render blew up')}

test('a render crash shows a way back instead of a blank page, and reset is offered',()=>{
  vi.spyOn(console,'error').mockImplementation(()=>{})
  const onReset=vi.fn()
  render(<ErrorBoundary onReset={onReset}><Boom /></ErrorBoundary>)
  expect(screen.getByText('이 구간은 운행할 수 없어요')).not.toBeNull()
  fireEvent.click(screen.getByText('다른 노선 운행'))
  expect(onReset).toHaveBeenCalledTimes(1)
})

test('a healthy child renders normally',()=>{
  render(<ErrorBoundary onReset={()=>{}}><p>정상</p></ErrorBoundary>)
  expect(screen.getByText('정상')).not.toBeNull()
})
