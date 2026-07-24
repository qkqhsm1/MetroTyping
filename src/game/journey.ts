import { onwardStations,transferOptionsAt } from './transfers'

export type Position={line:string;station:string;direction?:string}
export type Journey={position:Position;visited:string[];lines:string[];transfers:number}

export function nextStation(position:Position):string|null{
  return position.direction??null
}

// The station reached by continuing past `station` when we arrived there from `from`: the onward
// neighbour that is not the one we came from. At a terminus there is none.
const continueFrom=(line:string,station:string,from:string|undefined):string|undefined=>
  onwardStations(line,station).find(candidate=>candidate!==from)

export function boardJourney(line:string,station:string,toward:string):Journey{
  return {position:{line,station,direction:toward},visited:[station],lines:[line],transfers:0}
}

export function advance(journey:Journey,typed:string):Journey|null{
  const {line,station,direction}=journey.position
  const target=typed.normalize('NFC').trim()
  // With a decided direction only that station is valid; undecided (post-transfer) accepts either
  // onward neighbour and the typed one becomes the direction.
  const valid=direction!==undefined?[direction]:onwardStations(line,station)
  if(!valid.includes(target))return null
  // We are leaving `station` for `target`, so the next heading is target's onward neighbour that is
  // not the station we just left — the same whether direction was decided or reopened by a transfer.
  const next:Position={line,station:target,direction:continueFrom(line,target,station)}
  return {...journey,position:next,visited:[...journey.visited,target]}
}

export function beginTransfer(journey:Journey,toLine:string):Journey{
  return {
    ...journey,
    position:{line:toLine,station:journey.position.station,direction:undefined},
    lines:journey.lines.at(-1)===toLine?journey.lines:[...journey.lines,toLine],
    transfers:journey.transfers+1,
  }
}

// A dead end is a terminus of the current line with no other line to switch to. A transfer option
// always reopens travel (its neighbour is a fresh direction), so the presence of any option means the
// journey can continue. A loop line has two neighbours everywhere, so it is never a terminus.
export function isDeadEnd(position:Position):boolean{
  const atTerminus=onwardStations(position.line,position.station).length<=1
  return atTerminus&&transferOptionsAt(position.station,position.line).length===0
}
