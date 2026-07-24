import { stationInfo } from '../data/stationInfo'

function Region({lineId,name,position,shift=false}:{lineId:string;name?:string;position:'previous'|'current'|'next';shift?:boolean}) {
  const info=name?stationInfo(lineId,name):undefined
  return <div className="direction-station" data-position={position} data-shift={shift||undefined}>{info&&<><span className="direction-number" data-long={info.number.length>3||undefined}>{info.number}</span><span className="direction-names"><b data-long={info.korean.length>6||undefined} role="heading" aria-level={position==='current'?1:2}>{info.korean}</b><small data-long={info.english.length>20||undefined}>{info.english}</small></span>{shift&&<span className="direction-shift" aria-label={`Shift로 ${name} 방향`}>Shift</span>}</>}</div>
}

// `shiftSide` marks the direction you can flip to by pressing Shift, shown only on a fresh transfer leg
// before you have moved: that side gets a Shift badge so you know the other way is one keypress away.
export default function DirectionSign({lineId,previous,current,next,solo=false,shiftSide}:{lineId:string;previous?:string;current:string;next?:string;solo?:boolean;shiftSide?:'previous'|'next'}) {
  return <div className="target direction-wrap">
    <p className="eyebrow">{solo?'TYPE STATION · 역명 입력':'TRAVEL DIRECTION · 진행 방향'}</p>
    <div className="direction-panel" data-travel-side="next" data-layout={solo?'solo':'balanced'} key={current} aria-label={`현재 입력 역 ${current}`} aria-live="polite">
      {!solo&&<Region lineId={lineId} name={previous} position="previous" shift={shiftSide==='previous'} />}
      <Region lineId={lineId} name={current} position="current" />
      {!solo&&<Region lineId={lineId} name={next} position="next" shift={shiftSide==='next'} />}
    </div>
  </div>
}
