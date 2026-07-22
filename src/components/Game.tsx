import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import RouteMap from './RouteMap'
import { YAMANOTE_LABELS } from '../data/lines'
import { playSound } from '../audio/sounds'

function countJaso(value:string) {
  return Array.from(value.normalize('NFC')).reduce((count,character) => {
    const code=character.charCodeAt(0)
    if(code<0xac00||code>0xd7a3)return count+1
    return count+2+((code-0xac00)%28===0?0:1)
  },0)
}

export default function Game({ lineId,stations,color,sound=true,durationSeconds,showAllStations=true,onExit }:{ lineId?:string; stations:string[]; color:string; sound?:boolean; durationSeconds?:number; showAllStations?:boolean; onExit:()=>void }) {
  const [index,setIndex]=useState(0), [value,setValue]=useState(''), [errors,setErrors]=useState(0)
  const [remaining,setRemaining]=useState(durationSeconds)
  const [startedAt,setStartedAt]=useState<number>(), [typedJaso,setTypedJaso]=useState(0)
  const [now,setNow]=useState(Date.now)
  const [trainVisible,setTrainVisible]=useState(false), [trainEntering,setTrainEntering]=useState(false)
  const timed=durationSeconds!==undefined
  const input=useRef<HTMLInputElement>(null), entranceTimer=useRef<number|undefined>(undefined), finished=remaining===0||(!timed&&index>=stations.length)
  useEffect(()=>()=>window.clearTimeout(entranceTimer.current),[])
  useEffect(()=>input.current?.focus(),[index])
  useEffect(()=>{
    if(remaining===undefined||remaining===0)return
    const timer=window.setTimeout(()=>setRemaining(remaining-1),1000)
    return()=>window.clearTimeout(timer)
  },[remaining])
  useEffect(()=>{
    if(finished||startedAt===undefined)return
    const timer=window.setInterval(()=>setNow(Date.now()),1000)
    return()=>window.clearInterval(timer)
  },[finished,startedAt])
  const submit=(event:KeyboardEvent<HTMLInputElement>)=>{
    if(event.key!=='Enter'||event.nativeEvent.isComposing) return
    if(value.normalize('NFC').trim()===stations[index%stations.length]){playSound(!timed&&index===stations.length-1?'complete':'correct',sound);setValue('');setIndex(current=>current+1);if(!timed&&index===0){setTrainVisible(true);setTrainEntering(true);entranceTimer.current=window.setTimeout(()=>setTrainEntering(false),260)}}else{playSound('error',sound);setErrors(current=>current+1)}
  }
  const elapsed=startedAt===undefined?0:(now-startedAt)/60000
  const speed=elapsed<=0?0:Math.round(typedJaso/elapsed)
  if(finished) return <section className="result" style={{'--line':color} as React.CSSProperties}><p className="eyebrow">{timed?'TIME UP':'ARRIVED'}</p><h1>{timed?'랜덤 도전 완료':'운행 완료'}</h1><div className="final-speed" role="status" aria-label={`최종 타수 ${speed} 타/분`}><span>최종 타수</span><b>{speed}</b><small>타/분</small></div><p>오타 {errors}회 · {index}개 역 통과</p><button className="primary" onClick={onExit}>다른 노선 운행</button></section>
  const target=stations[index%stations.length]!
  const completedIndex=Math.max(0,index-1)
  const currentStation=stations[completedIndex%stations.length]!
  const segmentStart=Math.floor(completedIndex/7)*7
  const visibleStations=stations.slice(segmentStart,segmentStart+8)
  const japanese=lineId==='yamanote' ? YAMANOTE_LABELS[target] : undefined
  const normalizedValue=value.normalize('NFC')
  const correctPrefix=Array.from(target).findIndex((character,position)=>normalizedValue[position]!==character)
  const matched=correctPrefix===-1?Math.min(normalizedValue.length,target.length):correctPrefix
  return <section className="game" style={{'--line':color} as React.CSSProperties}>
    <div className="game-top"><button className="back" onClick={onExit}>← 운행 종료</button><div className="game-metrics"><div className="speed-meter" role="status" aria-label={`실시간 타수 ${speed} 타/분`}><span>실시간 타수</span><b>{speed}</b><small>타/분</small></div><div className="route-progress">{timed?<><b>{remaining}초</b> · {index}개</>:<><b>{index+1}</b> / {stations.length}</>}</div></div></div>
    {timed?<div className="random-stage"><span>RANDOM STATION · 60 SEC</span><b>노선 전체에서 무작위 출제</b><small>종착역 없이 제한 시간 동안 계속됩니다.</small></div>:<div className="map-stage route-segment" key={segmentStart}><RouteMap lineId={lineId ?? 'seoul-2'} stations={visibleStations} geometryStations={stations} color={color} progress={(completedIndex-segmentStart)/Math.max(1,visibleStations.length-1)} targetIndex={index-segmentStart} showAllLabels={showAllStations} trainVisible={trainVisible} trainEntering={trainEntering} /><div className="current-station" role="status">{index===0?`출발 준비 · ${target}`:`현재 ${currentStation}`}</div></div>}
    <div className="target"><p className="eyebrow">TYPE STATION · 역명 입력</p>{japanese&&<p className="japanese"><b>{japanese.kanji}</b><span>{japanese.kana}</span></p>}<h1 data-long={target.length>6} aria-label={target}>{Array.from(target).map((character,position)=><span className={position<matched?'matched':normalizedValue[position]&&normalizedValue[position]!==character?'miss':''} key={`${index}-${position}`}>{character}</span>)}</h1></div>
    <input ref={input} value={value} onChange={event=>{const next=event.target.value;const added=Math.max(0,countJaso(next)-countJaso(value));if(added){const timestamp=Date.now();playSound('key',sound);setStartedAt(start=>start??timestamp);setTypedJaso(count=>count+added);setNow(timestamp)}setValue(next)}} onKeyDown={submit} placeholder="역명을 입력하고 Enter" aria-label="역명 입력" autoComplete="off" />
  </section>
}
