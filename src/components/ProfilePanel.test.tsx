import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import ProfilePanel from './ProfilePanel'

test('registers a local practice nickname when Firebase is not configured', async () => {
  const onSave=vi.fn()
  render(<ProfilePanel onSave={onSave} onClose={()=>{}} />)
  fireEvent.change(screen.getByLabelText('플레이 닉네임'),{target:{value:'메트로'}})
  fireEvent.click(screen.getByRole('button',{name:'닉네임 등록'}))
  expect(await screen.findByText('연습용 닉네임으로 저장했습니다.')).toBeInTheDocument()
  expect(onSave).toHaveBeenCalledWith('메트로')
})
