import { useRef, useState } from 'react'
import { LINES } from './data/lines'
import { dailyStations, getQuickRoutePairs, getRoute, getStations, type QuickRoute } from './game/routes'
import { getLineWorld } from './game/lineWorld'
import { onwardStations } from './game/transfers'
import Game from './components/Game'
import MapExplorer from './components/MapExplorer'
import ProfilePanel from './components/ProfilePanel'
import QuickRoutes from './components/QuickRoutes'
import StationSelect from './components/StationSelect'
import ServiceSelect from './components/ServiceSelect'
import { playSound } from './audio/sounds'

export default function App() {
  const [mode,setMode]=useState<'route'|'random'|'transfer'|null>(null)
  const [lineId,setLineId]=useState<string|null>(null)
  const [playing,setPlaying]=useState(false)
  const [direction,setDirection]=useState('clockwise')
  const [sound,setSound]=useState(true)
  const [profileOpen,setProfileOpen]=useState(false)
  const [routeOverride,setRouteOverride]=useState<string[]|null>(null)
  const [serviceId,setServiceId]=useState<string|undefined>()
  const [setupError,setSetupError]=useState('')
  const [nickname,setNickname]=useState(()=>localStorage.getItem('metrotyping:nickname')??'')
  const selectedOnce=useRef(false)
  const line=LINES.find(item=>item.id===lineId)
  const stations=line ? getStations(line.id,serviceId) : []
  const [from,setFrom]=useState(''), [to,setTo]=useState('')
  const [toward,setToward]=useState('')
  const selectLine=(id:string)=>{
    if(!selectedOnce.current){selectedOnce.current=true;playSound('select',sound)}
    const selectedLine=LINES.find(item=>item.id===id)
    setLineId(id);setMode('route');setServiceId(selectedLine?.services?.[0]?.id);setFrom('');setTo('');setRouteOverride(null);setSetupError('')
  }
  const startRoute=(selection?:QuickRoute)=>{
    if(selection){setFrom(selection.from);setTo(selection.to);setDirection(selection.direction);setRouteOverride(selection.stationIds)}
    else setRouteOverride(null)
    setMode('route')
    setPlaying(true)
  }
  const tryStartRoute=()=>{
    try {
      setRouteOverride(null)
      // The world is built here too, so a pair the router can reach but the map cannot draw — riding
      // the one-way Eungam loop out onto the Line 6 trunk — reports the setup error instead of
      // throwing during render, where there is no boundary to catch it.
      getLineWorld(line!.id,getRoute(line!.id,from,to,line!.loop?direction:'forward',serviceId).stationIds)
      setSetupError('')
      setPlaying(true)
    } catch {
      setSetupError('선택한 구간을 운행할 수 없습니다. 출발역과 도착역을 다시 확인해 주세요.')
    }
  }
  if (playing && line) {
    if(mode==='transfer')return <main className="shell"><Game journey={{line:line.id,station:from,toward}} color={line.color} sound={sound} onExit={()=>setPlaying(false)} /></main>
    const dateKey=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date())
    const route=mode==='random' ? dailyStations(line.id,dateKey,serviceId) : routeOverride??getRoute(line.id,from,to,line.loop?direction:'forward',serviceId).stationIds
    return <main className="shell"><Game lineId={line.id} stations={route} color={line.color} sound={sound} durationSeconds={mode==='random'?60:undefined} onExit={()=>{setPlaying(false);setRouteOverride(null)}} /></main>
  }
  return (
    <main className="shell">
      <header><a className="brand" href={import.meta.env.BASE_URL}>METRO<span>/</span>TYPE</a><div className="header-actions"><button className="profile-button" onClick={()=>setProfileOpen(true)}>{nickname||'닉네임 등록'}</button><button onClick={()=>setSound(value=>!value)} className="icon-button" aria-label={sound?'사운드 끄기':'사운드 켜기'}>{sound?'♪':'×'}</button></div></header>
      {line ? <section className="hero setup">
        <button className="back" onClick={()=>{setLineId(null);setRouteOverride(null)}}>← 노선 선택</button>
        <h1 className="setup-line-title" style={{color:line.color}}>{line.name}</h1>
        <div className="setup-mode"><button className={mode==='route'?'active':''} onClick={()=>{setMode('route');setRouteOverride(null)}}>노선 운행</button><button className={mode==='random'?'active':''} onClick={()=>{setMode('random');setRouteOverride(null)}}>랜덤 역명</button><button className={mode==='transfer'?'active':''} onClick={()=>{setMode('transfer');setRouteOverride(null);setToward('')}}>환승 여행</button></div>
        {line.services&&serviceId&&<ServiceSelect value={serviceId} services={line.services} onChange={value=>{setServiceId(value);setFrom('');setTo('');setRouteOverride(null);setSetupError('')}}/>}
        <h2 className="setup-question">어디에서<br />출발할까요?</h2>
        {mode==='route'&&<><QuickRoutes pairs={getQuickRoutePairs(line.id,serviceId)} color={line.color} onStart={startRoute}/><div className="trip-form"><StationSelect label="출발역" value={from} options={stations} onChange={value=>{setFrom(value);setRouteOverride(null)}}/><StationSelect label="도착역" value={to} options={stations} onChange={value=>{setTo(value);setRouteOverride(null)}}/></div>{line.loop&&<div className="direction"><button className={direction==='clockwise'?'active':''} onClick={()=>{setDirection('clockwise');setRouteOverride(null)}}>{line.id==='yamanote'?'외선순환':'시계 방향'}</button><button className={direction==='counterclockwise'?'active':''} onClick={()=>{setDirection('counterclockwise');setRouteOverride(null)}}>{line.id==='yamanote'?'내선순환':'반시계 방향'}</button></div>}</>}
        {mode==='transfer'&&<><div className="trip-form"><StationSelect label="출발역" value={from} options={stations} onChange={value=>{setFrom(value);setToward('')}}/></div>{from&&<div className="direction">{onwardStations(line.id,from).map(neighbour=><button key={neighbour} className={toward===neighbour?'active':''} onClick={()=>setToward(neighbour)}>{neighbour} 방향</button>)}</div>}</>}
        {setupError&&<p className="setup-error" role="alert">{setupError}</p>}
        <button className="primary" style={{background:line.color}} disabled={(mode==='route'&&(!from||!to||from===to))||(mode==='transfer'&&(!from||!toward))} onClick={()=>{if(mode==='random'){setRouteOverride(null);setPlaying(true)}else if(mode==='transfer'){setPlaying(true)}else tryStartRoute()}}>운행 시작 →</button>
      </section> : <MapExplorer onSelect={selectLine} />}
      <footer><span>SEOUL · INCHEON · TOKYO</span><span>14 LINES</span></footer>
      {profileOpen&&<ProfilePanel onSave={setNickname} onClose={()=>setProfileOpen(false)}/>} 
    </main>
  )
}
