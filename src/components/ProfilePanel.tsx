import { useState } from 'react'
import { firebaseAvailable, registerNickname } from '../firebase/client'

export default function ProfilePanel({onSave,onClose}:{onSave:(nickname:string)=>void;onClose:()=>void}) {
  const [nickname,setNickname]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  const submit=async()=>{
    const value=nickname.normalize('NFC').trim()
    if(value.length<2||value.length>12||!/^[가-힣A-Za-z0-9 ]+$/.test(value)){setMessage('한글·영문·숫자 2~12자로 입력해 주세요.');return}
    setBusy(true)
    try{
      if(firebaseAvailable) await registerNickname(value)
      localStorage.setItem('metrotyping:nickname',value)
      onSave(value)
      setMessage(firebaseAvailable?'고유 닉네임을 등록했습니다.':'연습용 닉네임으로 저장했습니다.')
    }catch(error){setMessage(error instanceof Error?error.message:'닉네임을 등록하지 못했습니다.')}finally{setBusy(false)}
  }
  return <div className="profile-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className="profile-panel" role="dialog" aria-modal="true" aria-labelledby="profile-title"><button className="profile-close" onClick={onClose} aria-label="닫기">×</button><p className="eyebrow">PASSENGER PROFILE</p><h2 id="profile-title">플레이할 이름을<br/>등록하세요.</h2><label>닉네임<input aria-label="플레이 닉네임" value={nickname} onChange={event=>setNickname(event.target.value)} maxLength={12}/></label><button className="primary" onClick={submit} disabled={busy}>닉네임 등록</button>{message&&<p className="profile-message" role="status">{message}</p>}<small>{firebaseAvailable?'온라인 전체 랭킹에 사용됩니다.':'Firebase 연결 전에는 이 기기의 연습 기록에만 사용됩니다.'}</small></section></div>
}
