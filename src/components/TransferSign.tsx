import { getLine } from '../data/lines'
import { nextLineAt,transferOptionsAt } from '../game/transfers'

const SHORT:Record<string,string>={arex:'A','suin-bundang':'수인','incheon-1':'I1','incheon-2':'I2'}

export function lineBadgeLabel(lineId:string):string{
  const numbered=lineId.match(/^seoul-(\d)$/)
  return numbered?numbered[1]!:SHORT[lineId]??lineId
}

const Badge=({lineId}:{lineId:string})=>
  <span className="transfer-badge" style={{background:getLine(lineId).color}}>{lineBadgeLabel(lineId)}</span>

export default function TransferSign({currentLine,station,menuOpen,holdProgress}:{currentLine:string;station:string;menuOpen:boolean;holdProgress:number}) {
  const options=transferOptionsAt(station,currentLine)
  if(!options.length)return null
  // The collapsed badge shows where a quick Tab actually lands (the next line in the rotation), which is
  // not always the top-priority option — otherwise it would promise a line Tab never takes you to.
  const quick=nextLineAt(station,currentLine)??options[0]!
  if(menuOpen)return <div className="transfer-sign" data-open="true" role="listbox" aria-label="환승 노선 선택">
    {options.map((lineId,index)=><div className="transfer-option" key={lineId} role="option" aria-selected={false}><span className="transfer-key">{index+1}</span><Badge lineId={lineId} />{getLine(lineId).name}</div>)}
  </div>
  return <div className="transfer-sign" style={{'--hold':holdProgress} as React.CSSProperties} aria-label={`${getLine(quick).name}으로 환승 · Tab`}>
    <Badge lineId={currentLine} /><span className="transfer-arrow">→</span><Badge lineId={quick} />
    <span className="transfer-hold" data-progress={holdProgress>0||undefined} />
  </div>
}
