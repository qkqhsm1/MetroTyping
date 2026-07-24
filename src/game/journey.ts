import { onwardStations,transferOptionsAt } from './transfers'

// `station` is the stop you are standing at right now and must type — the train sits here, the sign
// shows it, and a transfer happens here. `from` is the stop you came from, so onward is the neighbour
// that is not `from`. `undecided` is set only just after a transfer, when both neighbours are open and
// the first one you type picks the way. `arrived` is set when you have typed a terminus and cannot go
// further on this line.
export type Position={line:string;station:string;from?:string;undecided?:boolean;arrived?:boolean}
export type Journey={position:Position;typed:string[];lines:string[];transfers:number}

// The station(s) a correct answer accepts now: an undecided transfer takes either neighbour; an
// arrival takes nothing (you must transfer or stop); otherwise you type the stop you are standing at.
export function nextTargets(position:Position):string[]{
  if(position.arrived)return []
  if(position.undecided)return onwardStations(position.line,position.station)
  return [position.station]
}

const onwardOf=(line:string,station:string,from:string|undefined):string|undefined=>
  onwardStations(line,station).find(name=>name!==from)

// You board standing at `station` and type it first; `from` is chosen so that onward is `toward`.
export function boardJourney(line:string,station:string,toward:string):Journey{
  const from=onwardStations(line,station).find(name=>name!==toward)
  return {position:{line,station,from},typed:[],lines:[line],transfers:0}
}

export function advance(journey:Journey,input:string):Journey|null{
  const {line,station,from,undecided}=journey.position
  const target=input.normalize('NFC').trim()
  if(undecided){
    // Pick the direction: typing a neighbour steps you onto it, coming from the transfer station.
    if(!onwardStations(line,station).includes(target))return null
    return {...journey,position:{line,station:target,from:station},typed:[...journey.typed,target]}
  }
  if(target!==station)return null
  // Typed the stop you were standing at; step onto its onward neighbour, or mark an arrival at a
  // terminus where there is none.
  const onward=onwardOf(line,station,from)
  const position:Position=onward?{line,station:onward,from:station}:{line,station,from,arrived:true}
  return {...journey,position,typed:[...journey.typed,station]}
}

export function beginTransfer(journey:Journey,toLine:string):Journey{
  // You are already standing at the station; on the new line the direction reopens.
  const here=journey.position.station,onward=onwardStations(toLine,here)
  const lines=journey.lines.at(-1)===toLine?journey.lines:[...journey.lines,toLine]
  const transfers=journey.transfers+1
  // A terminus on the new line has one onward neighbour, so the direction is forced: step straight
  // onto it rather than opening an undecided fork the camera would then crop against the dead end.
  const position:Position=onward.length===1
    ?{line:toLine,station:onward[0]!,from:here}
    :{line:toLine,station:here,undecided:true}
  return {...journey,position,lines,transfers}
}

// A dead end is a terminus you have arrived at with no line to switch to. A transfer option always
// reopens travel, so any option means the journey can continue.
export function isDeadEnd(position:Position):boolean{
  return position.arrived===true&&transferOptionsAt(position.station,position.line).length===0
}
