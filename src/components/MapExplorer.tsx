import { useEffect, useRef, useState } from 'react'
import { LINES } from '../data/lines'

const seoulLines = LINES.filter(line => line.id !== 'yamanote')
const unsupported = ['서울 5호선', '서울 7호선', '서울 8호선', '서울 9호선']
const yamanote = LINES.find(line => line.id === 'yamanote')!
const asset=(path:string)=>`${import.meta.env.BASE_URL}assets/${path}`
const hitPaths = [
  { id:'seoul-1', name:'서울 1호선', color:'#0052A4' },
  { id:'seoul-2', name:'서울 2호선', color:'#00A84D' },
  { id:'seoul-3', name:'서울 3호선', color:'#EF7C1C' },
  { id:'seoul-4', name:'서울 4호선', color:'#00A5DE' },
  { id:'seoul-6', name:'서울 6호선', color:'#A9431E' },
  { id:'suin-bundang', name:'수인·분당선', color:'#F5A200' },
  { id:'incheon-1', name:'인천 1호선', color:'#7CA8D5' },
  { id:'incheon-2', name:'인천 2호선', color:'#ED8B00' },
  { id:'arex', name:'공항철도', color:'#0090D2' },
]
const loopPoint=(angle:number,rx:number,ry:number)=>({
  x:600+rx*Math.sign(Math.cos(angle))*Math.abs(Math.cos(angle))**.42,
  y:350+ry*Math.sign(Math.sin(angle))*Math.abs(Math.sin(angle))**.42,
})
const yamanoteLoop=Array.from({length:160},(_,index)=>loopPoint(index/160*Math.PI*2,480,230)).map(point=>`${point.x},${point.y}`).join(' ')

export default function MapExplorer({ onSelect }:{ onSelect:(lineId:string)=>void }) {
  const [city,setCity]=useState<'seoul'|'tokyo'>('seoul')
  const [notice,setNotice]=useState(false)
  const [activeLine,setActiveLine]=useState<string|null>(null)
  const hoverTimer=useRef<number|null>(null)
  const cancelHover=()=>{if(hoverTimer.current!==null){window.clearTimeout(hoverTimer.current);hoverTimer.current=null}}
  const beginHover=(lineId:string)=>{cancelHover();hoverTimer.current=window.setTimeout(()=>{setActiveLine(lineId);hoverTimer.current=null},150)}
  const endHover=()=>{cancelHover();setActiveLine(null)}
  const focusLine=(lineId:string)=>{cancelHover();setActiveLine(lineId)}
  useEffect(()=>()=>{if(hoverTimer.current!==null)window.clearTimeout(hoverTimer.current)},[])
  return <section className="explorer">
    <div className="city-switch" aria-label="도시 선택">
      <button className={city==='seoul'?'active':''} onClick={()=>setCity('seoul')}>서울</button>
      <button className={city==='tokyo'?'active':''} onClick={()=>setCity('tokyo')}>도쿄</button>
    </div>
    <div className="explorer-copy"><p className="eyebrow">{city==='seoul'?'노선 선택':'路線選択'}</p><h1 className="explorer-title">{city==='seoul'?'어느 노선에서 시작할까요?':'どの路線から始めますか？'}</h1><p>{city==='seoul'?'노선을 고르고 타이핑 여행을 시작해 보세요.':'路線を選んで、タイピングの旅を始めましょう。'}</p></div>
    {city==='seoul' ? <>
      <div className="map-frame" data-testid="seoul-map" data-active-line={activeLine??undefined}>
        <div className="map-stage">
          <img src={asset('seoul-metro-map-20250929.jpg')} srcSet={`${asset('seoul-metro-map-20250929.jpg')} 5102w, ${asset('seoul-metro-map-20250929@2x.webp')} 10204w`} sizes="(max-width: 900px) 850px, 100vw" alt="서울 수도권 지하철 노선도" />
          <svg className="map-hitareas" viewBox="0 0 2551.18 2551.18" aria-label="지원 노선 선택">
            {hitPaths.map(line=><g key={line.id} role="button" tabIndex={0} aria-label={`지도에서 ${line.name} 선택`} data-active={activeLine===line.id} style={{'--line':line.color} as React.CSSProperties} onPointerEnter={()=>beginHover(line.id)} onPointerLeave={endHover} onFocus={()=>focusLine(line.id)} onBlur={endHover} onClick={()=>onSelect(line.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(line.id)}}}><use className="line-highlight" href={`${asset('seoul-supported-lines.svg')}#${line.id}`} /><use className="line-hit" href={`${asset('seoul-supported-lines.svg')}#${line.id}`} /></g>)}
          </svg>
        </div>
      </div>
      <div className="line-dock">{seoulLines.map(line=><button key={line.id} aria-label={`${line.name} 선택`} onMouseEnter={()=>beginHover(line.id)} onMouseLeave={endHover} onFocus={()=>focusLine(line.id)} onBlur={endHover} onClick={()=>onSelect(line.id)} style={{'--line':line.color} as React.CSSProperties}><i />{line.name}</button>)}{unsupported.map(name=><button key={name} onClick={()=>setNotice(true)} className="disabled-line">{name}</button>)}</div>
      <p className="attribution">출처: 서울교통공사 · 서울특별시, 공공누리 제1유형</p>
    </> : <div className="tokyo-map">
      <svg viewBox="0 0 1200 700" role="img" aria-label="JR 야마노테선 노선도">
        <polygon points={yamanoteLoop} fill="none" stroke="#e1e2dc" strokeWidth="32" strokeLinejoin="round" />
        <polygon points={yamanoteLoop} fill="none" stroke={yamanote.color} strokeWidth="17" strokeLinejoin="round" />
        {yamanote.sequences[0]?.map((station,index,all)=>{const angle=(index/all.length)*Math.PI*2-Math.PI/2;const point=loopPoint(angle,480,230),label=loopPoint(angle,535,280),cos=Math.cos(angle);return <g key={station}><circle cx={point.x} cy={point.y} r="8" fill="white" stroke={yamanote.color} strokeWidth="5" /><text data-station-label="" x={label.x} y={label.y} textAnchor={cos>.2?'start':cos<-.2?'end':'middle'} dominantBaseline="middle">{station}</text></g>})}
        <text x="600" y="335" textAnchor="middle" className="tokyo-title">山手線</text><text x="600" y="375" textAnchor="middle">JR YAMANOTE · 30 STATIONS</text>
      </svg>
      <button className="primary tokyo-start" onClick={()=>onSelect('yamanote')}>야마노테선 선택 →</button>
    </div>}
    {notice&&<div className="notice" role="status"><b>현재 공사 중인 노선입니다.</b><span>지원 노선을 먼저 완성하고 있어요.</span><button onClick={()=>setNotice(false)}>확인</button></div>}
  </section>
}
