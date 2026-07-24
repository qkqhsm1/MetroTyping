import { useEffect, useMemo, useRef, useState, type ChangeEvent,type KeyboardEvent } from 'react'
import TrackingMap from './TrackingMap'
import StationTypingField from './StationTypingField'
import DirectionSign from './DirectionSign'
import TransferSign from './TransferSign'
import { YAMANOTE_LABELS, getLine } from '../data/lines'
import { stationInfo } from '../data/stationInfo'
import { playSound } from '../audio/sounds'
import { boardJourney,advance,beginTransfer,isDeadEnd,nextStation,type Journey,type Position } from '../game/journey'
import { onwardStations,transferOptionsAt } from '../game/transfers'

// Keystrokes per syllable, the 자소 unit Hancom Typing uses: 한 = ㅎ+ㅏ+ㄴ = 3, 값 = ㄱ+ㅏ+ㅂ+ㅅ = 4.
// A compound vowel (ㅘㅙㅚㅝㅞㅟㅢ) and a compound final (ㄳㄵㄶㄺㄻㄼㄽㄾㄿㅀㅄ) each take two keys.
const LIVE_WINDOW_MS=8000
const COMPOUND_MEDIAL=new Set([9,10,11,14,15,16,19])
const COMPOUND_FINAL=new Set([3,5,6,9,10,11,12,13,14,15,18])
function countJaso(value:string) {
  return Array.from(value.normalize('NFC')).reduce((count,character) => {
    const code=character.charCodeAt(0)
    if(code<0xac00||code>0xd7a3)return count+1
    const syllable=code-0xac00,medial=Math.floor(syllable/28)%21,final=syllable%28
    return count+1+(COMPOUND_MEDIAL.has(medial)?2:1)+(final?(COMPOUND_FINAL.has(final)?2:1):0)
  },0)
}
const formatElapsed=(milliseconds:number)=>{
  const tenths=Math.floor(milliseconds/100),minutes=Math.floor(tenths/600),seconds=Math.floor(tenths/10)%60
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${tenths%10}`
}
// The world fed to the transfer-mode map is the current line's stations from where the player stands
// to the terminus, so the unchanged map/sign/typing render along that forward path. The visited check
// closes a loop line after one lap so the walk always terminates.
const buildRoamPath=(position:Position):string[]=>{
  const path=[position.station]
  let current=position.station,heading=position.direction
  while(heading&&!path.includes(heading)){
    path.push(heading)
    const onward=onwardStations(position.line,heading).find(name=>name!==current)
    current=heading;heading=onward
  }
  return path
}

export default function Game({ lineId,stations=[],color,sound=true,durationSeconds,journey,onExit }:{ lineId?:string; stations?:string[]; color:string; sound?:boolean; durationSeconds?:number; journey?:{line:string;station:string;toward:string}; onExit:()=>void }) {
  const [index,setIndex]=useState(0), [value,setValue]=useState(''), [errors,setErrors]=useState(0)
  const [remaining,setRemaining]=useState(durationSeconds)
  const [startedAt,setStartedAt]=useState<number>(), [typedJaso,setTypedJaso]=useState(0)
  const [completedAt,setCompletedAt]=useState<number>()
  const [now,setNow]=useState(Date.now)
  const timed=durationSeconds!==undefined
  const tracking=!timed
  const lineKey=lineId??'seoul-2'
  const input=useRef<HTMLInputElement>(null)
  const [jasoLog,setJasoLog]=useState<number[]>([])
  const roaming=journey!==undefined
  const [trip,setTrip]=useState<Journey|null>(()=>journey?boardJourney(journey.line,journey.station,journey.toward):null)
  const [menuOpen,setMenuOpen]=useState(false)
  const holdStart=useRef<number|undefined>(undefined),holdRaf=useRef<number|undefined>(undefined)
  const [holdProgress,setHoldProgress]=useState(0)
  const roamStations=useMemo(()=>roaming&&trip?buildRoamPath(trip.position):[],[roaming,trip])
  const roamTarget=roaming&&trip?nextStation(trip.position):null
  const roamUndecided=roaming&&roamTarget===null
  const roamIndex=roamTarget?1:0
  const roamColor=roaming&&trip?getLine(trip.position.line).color:color
  const roamFinished=roaming&&trip?isDeadEnd(trip.position):false
  const finished=roaming?roamFinished:(remaining===0||(!timed&&index>=stations.length))
  useEffect(()=>input.current?.focus(),[index])
  useEffect(()=>{
    if(remaining===undefined||remaining===0)return
    const timer=window.setTimeout(()=>setRemaining(remaining-1),1000)
    return()=>window.clearTimeout(timer)
  },[remaining])
  useEffect(()=>{
    if(finished||startedAt===undefined)return
    const timer=window.setInterval(()=>setNow(Date.now()),tracking?100:1000)
    return()=>window.clearInterval(timer)
  },[finished,tracking,startedAt])
  const submit=(event:KeyboardEvent<HTMLInputElement>)=>{
    if(roaming&&trip){
      if(event.key!=='Enter'||event.nativeEvent.isComposing)return
      const moved=advance(trip,value)
      if(moved){playSound('correct',sound);setValue('');setTrip(moved);setStartedAt(start=>start??Date.now());setNow(Date.now())}
      else{playSound('error',sound);setErrors(current=>current+1)}
      return
    }
    if(event.key!=='Enter'||event.nativeEvent.isComposing) return
    if(value.normalize('NFC').trim()===stations[index%stations.length]){const timestamp=Date.now();playSound(!timed&&index===stations.length-1?'complete':'correct',sound);setValue('');if(!timed&&index===stations.length-1)setCompletedAt(timestamp);setNow(timestamp);setIndex(current=>current+1)}else{playSound('error',sound);setErrors(current=>current+1)}
  }
  const roamKeyDown=(event:KeyboardEvent<HTMLInputElement>)=>{
    if(!roaming||!trip)return submit(event)
    const options=transferOptionsAt(trip.position.station,trip.position.line)
    if(event.key==='Escape'&&menuOpen){setMenuOpen(false);return}
    if(menuOpen&&/^[1-9]$/.test(event.key)){
      const choice=options[Number(event.key)-1]
      if(choice){setTrip(beginTransfer(trip,choice));setMenuOpen(false)}
      event.preventDefault();return
    }
    if(event.key==='Tab'){
      event.preventDefault()
      if(!options.length)return
      if(holdStart.current===undefined){
        holdStart.current=performance.now()
        const tick=()=>{const held=performance.now()-holdStart.current!;setHoldProgress(Math.min(1,held/1500));if(held>=1500){setMenuOpen(true);return}holdRaf.current=window.requestAnimationFrame(tick)}
        holdRaf.current=window.requestAnimationFrame(tick)
      }
      return
    }
    submit(event)
  }
  const roamKeyUp=(event:KeyboardEvent<HTMLInputElement>)=>{
    if(event.key!=='Tab'||!roaming||!trip)return
    const held=holdStart.current!==undefined?performance.now()-holdStart.current:0
    window.cancelAnimationFrame(holdRaf.current!);holdStart.current=undefined;setHoldProgress(0)
    const options=transferOptionsAt(trip.position.station,trip.position.line)
    if(held<1500&&options.length){setTrip(beginTransfer(trip,options[0]!));setMenuOpen(false)}
  }
  const changeInput=(event:ChangeEvent<HTMLInputElement>)=>{
    const next=event.target.value,added=Math.max(0,countJaso(next)-countJaso(value))
    // The first jaso only starts the clock; counting it too would credit N jaso against N-1 keystroke
    // intervals, which reads roughly double early on. Speed is jaso entered *after* the first input.
    if(added){const timestamp=Date.now();playSound('key',sound);setStartedAt(start=>start??timestamp);if(startedAt!==undefined){setTypedJaso(count=>count+added);setJasoLog(log=>[...log,...Array<number>(added).fill(timestamp)].filter(stamp=>stamp>timestamp-LIVE_WINDOW_MS))}setNow(timestamp)}
    setValue(next)
  }
  const elapsed=startedAt===undefined?0:(now-startedAt)/60000
  const elapsedMilliseconds=startedAt===undefined?0:(completedAt??now)-startedAt
  // Final speed is the whole run's average, the way a typing test scores a completed passage.
  const speed=elapsed<=0?0:Math.round(typedJaso/elapsed)
  // The live meter reads the recent window instead, like a running typing test: it reflects the pace
  // of the last few seconds and falls to zero when the player stops, rather than lingering on a stale
  // lifetime average.
  const windowStart=now-LIVE_WINDOW_MS
  const recentJaso=jasoLog.reduce((count,stamp)=>stamp>windowStart?count+1:count,0)
  const liveMinutes=startedAt===undefined?0:(now-Math.max(startedAt,windowStart))/60000
  const liveSpeed=liveMinutes<=0?0:Math.round(recentJaso/liveMinutes)
  const signWidth=(name:string)=>Math.max(270,Math.min(680,170+name.length*50))
  if(finished&&roaming&&trip) return <section className="result" style={{'--line':roamColor} as React.CSSProperties}><p className="eyebrow">ARRIVED</p><h1>환승 여행 완료</h1><div className="final-time"><span>총 플레이 시간</span><b>{formatElapsed(elapsedMilliseconds)}</b></div><div className="final-speed" role="status" aria-label={`최종 타수 ${speed} 타/분`}><span>최종 타수</span><b>{speed}</b><small>타/분</small></div><p>오타 {errors}회 · 환승 {trip.transfers}회 · {trip.lines.length}개 노선</p><button className="primary" onClick={onExit}>다른 노선 운행</button></section>
  if(finished&&tracking) return <section className="result" style={{'--line':color} as React.CSSProperties}><p className="eyebrow">ARRIVED</p><h1>운행 완료</h1><div className="final-time"><span>총 플레이 시간</span><b>{formatElapsed(elapsedMilliseconds)}</b></div><div className="final-speed" role="status" aria-label={`최종 타수 ${speed} 타/분`}><span>최종 타수</span><b>{speed}</b><small>타/분</small></div><p>오타 {errors}회 · {index}개 역 통과</p><button className="primary" onClick={onExit}>다른 노선 운행</button></section>
  if(finished) return <section className="result" style={{'--line':color} as React.CSSProperties}><p className="eyebrow">{timed?'TIME UP':'ARRIVED'}</p><h1>{timed?'랜덤 도전 완료':'운행 완료'}</h1><div className="final-speed" role="status" aria-label={`최종 타수 ${speed} 타/분`}><span>최종 타수</span><b>{speed}</b><small>타/분</small></div><p>오타 {errors}회 · {index}개 역 통과</p><button className="primary" onClick={onExit}>다른 노선 운행</button></section>
  if(roaming&&trip){
    const onward=onwardStations(trip.position.line,trip.position.station)
    const roamCentre=roamTarget??trip.position.station
    const roamNumber=roamTarget?stationInfo(trip.position.line,roamTarget).number:''
    const roamStyle={'--line':roamColor,'--sign-interaction-width':`${Math.max(...roamStations.map(signWidth))}px`,'--sign-target-width':`${signWidth(roamCentre)}px`} as React.CSSProperties
    return <section className="game" style={roamStyle}>
      <div className="game-top"><button className="back" onClick={onExit}>← 운행 종료</button><div className="game-metrics"><div className="live-time"><span>PLAY TIME</span><b>{formatElapsed(elapsedMilliseconds)}</b></div><div className="speed-meter" role="status" aria-label={`실시간 타수 ${liveSpeed} 타/분`}><span>실시간 타수</span><b>{liveSpeed}</b><small>타/분</small></div><div className="route-progress"><b>{trip.visited.length}</b>개 역 · 환승 {trip.transfers}회</div></div></div>
      <div className="map-stage route-segment"><TrackingMap lineId={trip.position.line} stations={roamStations} targetIndex={roamIndex} color={roamColor} /><div className="current-station" role="status">{roamUndecided?`${trip.position.station} 환승`:`다음 ${roamTarget}`}</div></div>
      <TransferSign currentLine={trip.position.line} station={trip.position.station} menuOpen={menuOpen} holdProgress={holdProgress} />
      <DirectionSign lineId={trip.position.line} previous={roamTarget?roamStations[roamIndex-1]:onward[0]} current={roamCentre} next={roamTarget?roamStations[roamIndex+1]:onward[1]} />
      <StationTypingField target={roamTarget??''} number={roamNumber} value={value} errorAttempt={errors} inputRef={input} onChange={changeInput} onKeyDown={roamKeyDown} onKeyUp={roamKeyUp} />
    </section>
  }
  const target=stations[index%stations.length]!
  const japanese=lineId==='yamanote' ? YAMANOTE_LABELS[target] : undefined
  const signInteractionWidth=Math.max(...stations.map(signWidth)),signTargetWidth=signWidth(target)
  const gameStyle={'--line':color,'--sign-interaction-width':`${signInteractionWidth}px`,'--sign-target-width':`${signTargetWidth}px`} as React.CSSProperties
  return <section className="game" style={gameStyle}>
    <div className="game-top"><button className="back" onClick={onExit}>← 운행 종료</button><div className="game-metrics">{tracking&&<div className="live-time"><span>PLAY TIME</span><b>{formatElapsed(elapsedMilliseconds)}</b></div>}<div className="speed-meter" role="status" aria-label={`실시간 타수 ${liveSpeed} 타/분`}><span>실시간 타수</span><b>{liveSpeed}</b><small>타/분</small></div><div className="route-progress">{timed?<><b>{remaining}초</b> · {index}개</>:<><b>{index+1}</b> / {stations.length}</>}</div></div></div>
    {timed?<div className="random-stage"><span>RANDOM STATION · 60 SEC</span><b>노선 전체에서 무작위 출제</b><small>종착역 없이 제한 시간 동안 계속됩니다.</small></div>:<div className="map-stage route-segment"><TrackingMap lineId={lineKey} stations={stations} targetIndex={index} color={color} /><div className="current-station" role="status">{`다음 ${target}`}</div></div>}
    {japanese&&<p className="japanese"><b>{japanese.kanji}</b><span>{japanese.kana}</span></p>}
    <DirectionSign lineId={lineKey} previous={tracking?stations[index-1]:undefined} current={target} next={tracking?stations[index+1]:undefined} solo={!tracking} />
    <StationTypingField target={target} number={stationInfo(lineKey,target).number} value={value} errorAttempt={errors} inputRef={input} onChange={changeInput} onKeyDown={submit} />
  </section>
}
