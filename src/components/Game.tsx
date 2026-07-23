import { useEffect, useRef, useState, type ChangeEvent,type KeyboardEvent } from 'react'
import TrackingMap from './TrackingMap'
import StationTypingField from './StationTypingField'
import DirectionSign from './DirectionSign'
import { YAMANOTE_LABELS } from '../data/lines'
import { stationInfo } from '../data/stationInfo'
import { playSound } from '../audio/sounds'

function countJaso(value:string) {
  return Array.from(value.normalize('NFC')).reduce((count,character) => {
    const code=character.charCodeAt(0)
    if(code<0xac00||code>0xd7a3)return count+1
    return count+2+((code-0xac00)%28===0?0:1)
  },0)
}
const formatElapsed=(milliseconds:number)=>{
  const tenths=Math.floor(milliseconds/100),minutes=Math.floor(tenths/600),seconds=Math.floor(tenths/10)%60
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${tenths%10}`
}

export default function Game({ lineId,stations,color,sound=true,durationSeconds,onExit }:{ lineId?:string; stations:string[]; color:string; sound?:boolean; durationSeconds?:number; onExit:()=>void }) {
  const [index,setIndex]=useState(0), [value,setValue]=useState(''), [errors,setErrors]=useState(0)
  const [remaining,setRemaining]=useState(durationSeconds)
  const [startedAt,setStartedAt]=useState<number>(), [typedJaso,setTypedJaso]=useState(0)
  const [completedAt,setCompletedAt]=useState<number>()
  const [now,setNow]=useState(Date.now)
  const timed=durationSeconds!==undefined
  const tracking=!timed
  const lineKey=lineId??'seoul-2'
  const input=useRef<HTMLInputElement>(null), finished=remaining===0||(!timed&&index>=stations.length)
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
    if(event.key!=='Enter'||event.nativeEvent.isComposing) return
    if(value.normalize('NFC').trim()===stations[index%stations.length]){const timestamp=Date.now();playSound(!timed&&index===stations.length-1?'complete':'correct',sound);setValue('');if(!timed&&index===stations.length-1)setCompletedAt(timestamp);setNow(timestamp);setIndex(current=>current+1)}else{playSound('error',sound);setErrors(current=>current+1)}
  }
  const changeInput=(event:ChangeEvent<HTMLInputElement>)=>{
    const next=event.target.value,added=Math.max(0,countJaso(next)-countJaso(value))
    if(added){const timestamp=Date.now();playSound('key',sound);setStartedAt(start=>start??timestamp);setTypedJaso(count=>count+added);setNow(timestamp)}
    setValue(next)
  }
  const elapsed=startedAt===undefined?0:(now-startedAt)/60000
  const elapsedMilliseconds=startedAt===undefined?0:(completedAt??now)-startedAt
  const speed=elapsed<=0?0:Math.round(typedJaso/elapsed)
  if(finished&&tracking) return <section className="result" style={{'--line':color} as React.CSSProperties}><p className="eyebrow">ARRIVED</p><h1>운행 완료</h1><div className="final-time"><span>총 플레이 시간</span><b>{formatElapsed(elapsedMilliseconds)}</b></div><div className="final-speed" role="status" aria-label={`최종 타수 ${speed} 타/분`}><span>최종 타수</span><b>{speed}</b><small>타/분</small></div><p>오타 {errors}회 · {index}개 역 통과</p><button className="primary" onClick={onExit}>다른 노선 운행</button></section>
  if(finished) return <section className="result" style={{'--line':color} as React.CSSProperties}><p className="eyebrow">{timed?'TIME UP':'ARRIVED'}</p><h1>{timed?'랜덤 도전 완료':'운행 완료'}</h1><div className="final-speed" role="status" aria-label={`최종 타수 ${speed} 타/분`}><span>최종 타수</span><b>{speed}</b><small>타/분</small></div><p>오타 {errors}회 · {index}개 역 통과</p><button className="primary" onClick={onExit}>다른 노선 운행</button></section>
  const target=stations[index%stations.length]!
  const japanese=lineId==='yamanote' ? YAMANOTE_LABELS[target] : undefined
  const normalizedValue=value.normalize('NFC')
  const correctPrefix=Array.from(target).findIndex((character,position)=>normalizedValue[position]!==character)
  const matched=correctPrefix===-1?Math.min(normalizedValue.length,target.length):correctPrefix
  const signWidth=(name:string)=>Math.max(270,Math.min(680,170+name.length*50))
  const signInteractionWidth=tracking?Math.max(...stations.map(signWidth)):0,signTargetWidth=tracking?signWidth(target):0
  const gameStyle={'--line':color,'--sign-interaction-width':`${signInteractionWidth}px`,'--sign-target-width':`${signTargetWidth}px`} as React.CSSProperties
  return <section className="game" style={gameStyle}>
    <div className="game-top"><button className="back" onClick={onExit}>← 운행 종료</button><div className="game-metrics">{tracking&&<div className="live-time"><span>PLAY TIME</span><b>{formatElapsed(elapsedMilliseconds)}</b></div>}<div className="speed-meter" role="status" aria-label={`실시간 타수 ${speed} 타/분`}><span>실시간 타수</span><b>{speed}</b><small>타/분</small></div><div className="route-progress">{timed?<><b>{remaining}초</b> · {index}개</>:<><b>{index+1}</b> / {stations.length}</>}</div></div></div>
    {timed?<div className="random-stage"><span>RANDOM STATION · 60 SEC</span><b>노선 전체에서 무작위 출제</b><small>종착역 없이 제한 시간 동안 계속됩니다.</small></div>:<div className="map-stage route-segment"><TrackingMap lineId={lineKey} stations={stations} targetIndex={index} color={color} /><div className="current-station" role="status">{`다음 ${target}`}</div></div>}
    {tracking?<>{japanese&&<p className="japanese"><b>{japanese.kanji}</b><span>{japanese.kana}</span></p>}<DirectionSign lineId={lineKey} previous={stations[index-1]} current={target} next={stations[index+1]} /></>:<div className="target"><p className="eyebrow">TYPE STATION · 역명 입력</p>{japanese&&<p className="japanese"><b>{japanese.kanji}</b><span>{japanese.kana}</span></p>}<h1 data-long={target.length>6} aria-label={target}>{Array.from(target).map((character,position)=><span className={position<matched?'matched':normalizedValue[position]&&normalizedValue[position]!==character?'miss':''} key={`${index}-${position}`}>{character}</span>)}</h1></div>}
    {tracking?<StationTypingField target={target} number={stationInfo(lineKey,target).number} value={value} errorAttempt={errors} inputRef={input} onChange={changeInput} onKeyDown={submit} />:<input ref={input} value={value} onChange={changeInput} onKeyDown={submit} placeholder="역명을 입력하고 Enter" aria-label="역명 입력" autoComplete="off" />}
  </section>
}
