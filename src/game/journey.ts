import { onwardStations,transferOptionsAt } from './transfers'

// `station` is the stop you are standing at right now and must type — the train sits here, the sign
// shows it, and a transfer happens here. `from` is the stop you came from, so onward is the neighbour
// that is not `from`; on a fresh leg (board/transfer) `from` is the neighbour you chose to leave behind,
// so onward is the way you head. `arrived` is set when you have typed a terminus and cannot go further
// on this line.
export type Position={line:string;station:string;from?:string;arrived?:boolean}
export type Journey={position:Position;typed:string[];lines:string[];transfers:number}

// You always type the stop you are standing at; an arrival takes nothing (you must transfer or stop).
export function nextTargets(position:Position):string[]{
  if(position.arrived)return []
  return [position.station]
}

const onwardOf=(line:string,station:string,from:string|undefined):string|undefined=>
  onwardStations(line,station).find(name=>name!==from)

// Stations reachable ahead of `station` when heading toward `first`, not turning back. Used to pick the
// meatier default direction at a transfer: whichever neighbour has the longer run to its terminus.
const runLength=(line:string,station:string,first:string|undefined):number=>{
  let previous=station,current=first,count=0
  const seen=new Set<string>([station])
  while(current&&!seen.has(current)){seen.add(current);count++;const onward=onwardStations(line,current).find(name=>name!==previous);previous=current;current=onward}
  return count
}

// You board standing at `station` and type it first; `from` is chosen so that onward is `toward`.
export function boardJourney(line:string,station:string,toward:string):Journey{
  const from=onwardStations(line,station).find(name=>name!==toward)
  return {position:{line,station,from},typed:[],lines:[line],transfers:0}
}

export function advance(journey:Journey,input:string):Journey|null{
  const {line,station,from}=journey.position
  const target=input.normalize('NFC').trim()
  if(target!==station)return null
  // Typed the stop you were standing at; step onto its onward neighbour, or mark an arrival at a
  // terminus where there is none.
  const onward=onwardOf(line,station,from)
  const position:Position=onward?{line,station:onward,from:station}:{line,station,from,arrived:true}
  return {...journey,position,typed:[...journey.typed,station]}
}

export function beginTransfer(journey:Journey,toLine:string):Journey{
  // You stay standing at the station and type it again on the new line; the default direction heads the
  // longer way (more stations ahead), and `from` is the neighbour left behind so onward is that way.
  const here=journey.position.station,neighbours=onwardStations(toLine,here)
  const lines=journey.lines.at(-1)===toLine?journey.lines:[...journey.lines,toLine]
  const transfers=journey.transfers+1
  // `from` = the shorter-run neighbour, so onward (the way you head) is the longer one. A terminus has a
  // single neighbour, so `from` is undefined and onward is forced onto it.
  const [a,b]=neighbours
  const from=b!==undefined?(runLength(toLine,here,b)>runLength(toLine,here,a)?a:b):undefined
  return {...journey,position:{line:toLine,station:here,from},lines,transfers}
}

// Flip the travel direction before you have moved off a fresh leg: `from` becomes the current onward, so
// onward becomes the old `from`. A terminus (one neighbour) has nothing to flip and is left unchanged.
export function flipDirection(journey:Journey):Journey{
  const {line,station,from}=journey.position
  if(onwardStations(line,station).length<2)return journey
  return {...journey,position:{line,station,from:onwardOf(line,station,from)}}
}

// A dead end is a terminus you have arrived at with no line to switch to. A transfer option always
// reopens travel, so any option means the journey can continue.
export function isDeadEnd(position:Position):boolean{
  return position.arrived===true&&transferOptionsAt(position.station,position.line).length===0
}
