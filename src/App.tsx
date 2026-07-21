import { useState } from 'react'
import { LINES } from './data/lines'
import { dailyStations, getRoute } from './game/routes'
import Game from './components/Game'
import MapExplorer from './components/MapExplorer'
import ProfilePanel from './components/ProfilePanel'
import StationSelect from './components/StationSelect'

export default function App() {
  const [mode,setMode]=useState<'route'|'random'|null>(null)
  const [lineId,setLineId]=useState<string|null>(null)
  const [playing,setPlaying]=useState(false)
  const [direction,setDirection]=useState('clockwise')
  const [sound,setSound]=useState(true)
  const [profileOpen,setProfileOpen]=useState(false)
  const [nickname,setNickname]=useState(()=>localStorage.getItem('metrotyping:nickname')??'')
  const line=LINES.find(item=>item.id===lineId)
  const stations=line ? [...new Set(line.sequences.flat())] : []
  const [from,setFrom]=useState(''), [to,setTo]=useState('')
  if (playing && line) {
    const dateKey=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date())
    const route=mode==='random' ? dailyStations(line.id,dateKey) : getRoute(line.id,from,to,line.loop?direction:'forward').stationIds
    return <main className="shell"><Game lineId={line.id} stations={route} color={line.color} sound={sound} durationSeconds={mode==='random'?60:undefined} showAllStations={mode==='route'} onExit={()=>setPlaying(false)} /></main>
  }
  return (
    <main className="shell">
      <header><a className="brand" href="/">METRO<span>/</span>TYPE</a><div className="header-actions"><button className="profile-button" onClick={()=>setProfileOpen(true)}>{nickname||'닉네임 등록'}</button><button onClick={()=>setSound(value=>!value)} className="icon-button" aria-label={sound?'사운드 끄기':'사운드 켜기'}>{sound?'♪':'×'}</button></div></header>
      {line ? <section className="hero setup">
        <button className="back" onClick={()=>setLineId(null)}>← 노선 선택</button>
        <h1 className="setup-line-title" style={{color:line.color}}>{line.name}</h1>
        <div className="setup-mode"><button className={mode==='route'?'active':''} onClick={()=>setMode('route')}>노선 운행</button><button className={mode==='random'?'active':''} onClick={()=>setMode('random')}>랜덤 역명</button></div>
        <h2 className="setup-question">어디에서<br />출발할까요?</h2>
        {mode==='route'&&<><div className="trip-form"><StationSelect label="출발역" value={from} options={stations} onChange={setFrom}/><StationSelect label="도착역" value={to} options={stations} onChange={setTo}/></div>{line.loop&&<div className="direction"><button className={direction==='clockwise'?'active':''} onClick={()=>setDirection('clockwise')}>{line.id==='yamanote'?'외선순환':'시계 방향'}</button><button className={direction==='counterclockwise'?'active':''} onClick={()=>setDirection('counterclockwise')}>{line.id==='yamanote'?'내선순환':'반시계 방향'}</button></div>}</>}
        <button className="primary" style={{background:line.color}} disabled={mode==='route'&&(!from||!to||from===to)} onClick={()=>setPlaying(true)}>운행 시작 →</button>
      </section> : <MapExplorer onSelect={id=>{setLineId(id);setMode('route');setFrom('');setTo('')}} />}
      <footer><span>SEOUL · INCHEON · TOKYO</span><span>6 LINES</span></footer>
      {profileOpen&&<ProfilePanel onSave={setNickname} onClose={()=>setProfileOpen(false)}/>} 
    </main>
  )
}
