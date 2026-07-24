import { stationInfo } from '../data/stationInfo'

function Region({lineId,name,position,ctrl=false}:{lineId:string;name?:string;position:'previous'|'current'|'next';ctrl?:boolean}) {
  const info=name?stationInfo(lineId,name):undefined
  return <div className="direction-station" data-position={position} data-ctrl={ctrl||undefined}>{info&&<><span className="direction-number" data-long={info.number.length>3||undefined}>{info.number}</span><span className="direction-names"><b data-long={info.korean.length>6||undefined} role="heading" aria-level={position==='current'?1:2}>{info.korean}</b><small data-long={info.english.length>20||undefined}>{info.english}</small></span>{ctrl&&<span className="direction-ctrl" aria-label={`Ctrl로 ${name} 방향`}>Ctrl</span>}</>}</div>
}

// `ctrlSide` marks the direction you can flip to by pressing Ctrl, shown only on a fresh transfer leg
// before you have moved: that side gets a Ctrl badge so you know the other way is one keypress away.
// (Ctrl, not Shift — some station names like 총신대입구(이수) need Shift to type the parentheses.)
export default function DirectionSign({lineId,previous,current,next,solo=false,ctrlSide}:{lineId:string;previous?:string;current:string;next?:string;solo?:boolean;ctrlSide?:'previous'|'next'}) {
  return <div className="target direction-wrap">
    <p className="eyebrow">{solo?'TYPE STATION · 역명 입력':'TRAVEL DIRECTION · 진행 방향'}</p>
    <div className="direction-panel" data-travel-side="next" data-layout={solo?'solo':'balanced'} key={current} aria-label={`현재 입력 역 ${current}`} aria-live="polite">
      {!solo&&<Region lineId={lineId} name={previous} position="previous" ctrl={ctrlSide==='previous'} />}
      <Region lineId={lineId} name={current} position="current" />
      {!solo&&<Region lineId={lineId} name={next} position="next" ctrl={ctrlSide==='next'} />}
    </div>
  </div>
}
