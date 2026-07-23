import { stationInfo } from '../data/stationInfo'

function Region({lineId,name,position}:{lineId:string;name?:string;position:'previous'|'current'|'next'}) {
  const info=name?stationInfo(lineId,name):undefined
  return <div className="direction-station" data-position={position}>{info&&<><span className="direction-number">{info.number}</span><span className="direction-names"><b data-long={info.korean.length>6||undefined} role="heading" aria-level={position==='current'?1:2}>{info.korean}</b><small data-long={info.english.length>20||undefined}>{info.english}</small></span></>}</div>
}

export default function DirectionSign({lineId,previous,current,next,solo=false}:{lineId:string;previous?:string;current:string;next?:string;solo?:boolean}) {
  return <div className="target direction-wrap">
    <p className="eyebrow">{solo?'TYPE STATION · 역명 입력':'TRAVEL DIRECTION · 진행 방향'}</p>
    <div className="direction-panel" data-travel-side="next" data-layout={solo?'solo':'balanced'} key={current} aria-label={`현재 입력 역 ${current}`} aria-live="polite">
      {!solo&&<Region lineId={lineId} name={previous} position="previous" />}
      <Region lineId={lineId} name={current} position="current" />
      {!solo&&<Region lineId={lineId} name={next} position="next" />}
    </div>
  </div>
}
