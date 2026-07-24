import type { Point } from './geometry'
import { getLine } from '../data/lines'
import { LINE_SHAPES } from './lineShapes'

export type Topology={key:string;sequence:string[];path:Point[];loop:boolean}
type Candidate={key:string;sequence:string[];path:Point[]}

const reverse=<T>(items:T[])=>[...items].reverse()
const join=(head:string[],tail:string[])=>[...head,...tail.slice(1)]
const joinPath=(head:Point[],tail:Point[])=>[...head,...tail.slice(1)]

// Every full-line world a run on this line could belong to, each polyline oriented to its sequence.
// Only one orientation per world is listed; resolveTopology tries the reverse of each anyway.
const shapeOf=(key:string):Point[]=>LINE_SHAPES[key]??(()=>{throw new Error(`Missing route geometry: ${key}`)})()

function candidatesFor(lineId:string):Candidate[]{
  const line=getLine(lineId)
  if(lineId==='seoul-1'){
    const [north,incheon,sinchang]=line.sequences as [string[],string[],string[]]
    const northLeg=shapeOf('seoul-1-north'),incheonLeg=shapeOf('seoul-1-incheon'),sinchangLeg=shapeOf('seoul-1-sinchang')
    return [
      {key:'seoul-1-north-incheon',sequence:join(north,incheon),path:joinPath(northLeg,incheonLeg)},
      {key:'seoul-1-north-sinchang',sequence:join(north,sinchang),path:joinPath(northLeg,sinchangLeg)},
      {key:'seoul-1-incheon-sinchang',sequence:join(reverse(incheon),sinchang),path:joinPath(reverse(incheonLeg),sinchangLeg)},
      {key:'seoul-1-north',sequence:north,path:northLeg},
      {key:'seoul-1-incheon',sequence:incheon,path:incheonLeg},
      {key:'seoul-1-sinchang',sequence:sinchang,path:sinchangLeg},
    ]
  }
  if(lineId==='seoul-5'){
    const [trunk,hanam,macheon]=line.sequences as [string[],string[],string[]]
    // Both branch legs are traced from 강동 outwards, so the trunk joins onto either one directly and
    // a branch-to-branch world is one leg reversed back through 강동 into the other.
    const trunkLeg=shapeOf('seoul-5-trunk'),hanamLeg=shapeOf('seoul-5-hanam-leg'),macheonLeg=shapeOf('seoul-5-macheon-leg')
    return [
      {key:'seoul-5-hanam-macheon',sequence:join(reverse(hanam),macheon),path:joinPath(reverse(hanamLeg),macheonLeg)},
      {key:'seoul-5-hanam',sequence:join(trunk,hanam),path:joinPath(trunkLeg,hanamLeg)},
      {key:'seoul-5-macheon',sequence:join(trunk,macheon),path:joinPath(trunkLeg,macheonLeg)},
      {key:'seoul-5-trunk',sequence:trunk,path:trunkLeg},
    ]
  }
  if(lineId==='seoul-6'){
    // The Eungam loop is one-way and closes back onto 응암, so its world carries 응암 at both ends and
    // its ring is closed. Without the closing edge a legitimate trip such as 구산 → 응암 resolves to
    // nothing at all.
    const ring=shapeOf('seoul-6-loop')
    return [
      {key:'seoul-6-loop',sequence:line.oneWaySequences![0]!,path:[...ring,ring[0]!]},
      {key:'seoul-6-trunk',sequence:line.sequences[0]!,path:shapeOf('seoul-6-trunk')},
    ]
  }
  if(lineId==='seoul-9')return (line.services??[]).map(service=>({
    key:`seoul-9-${service.id}`,sequence:[...service.sequence],path:shapeOf('seoul-9'),
  }))
  const path=shapeOf(lineId)
  return line.sequences.map((sequence,index)=>({key:index?`${lineId}-${index}`:lineId,sequence,path}))
}

// Every occurrence is tried, not just the first: a closed one-way loop names its junction twice, so
// matching only the first occurrence would reject a run that starts at the second one.
const fits=(sequence:string[],stations:string[])=>
  sequence.some((station,start)=>station===stations[0]&&stations.every((name,offset)=>sequence[start+offset]===name))
const rotate=(sequence:string[],start:number)=>sequence.map((_,offset)=>sequence[(start+offset)%sequence.length]!)

export function resolveTopology(lineId:string,stations:string[]):Topology{
  const line=getLine(lineId)
  const candidates=candidatesFor(lineId)
  if(line.loop){
    const {key,sequence,path}=candidates[0]!
    const forwardStart=sequence.indexOf(stations[0]!)
    if(forwardStart<0)throw new Error(`Unknown station on ${lineId}: ${stations[0]}`)
    const reversed=stations.length>1&&sequence[(forwardStart+1)%sequence.length]!==stations[1]
    const oriented=reversed?rotate(reverse(sequence),sequence.length-1-forwardStart):rotate(sequence,forwardStart)
    // The ring is a fixed piece of track: riding it the other way changes the order the seats are
    // visited, never the map. Reversing the polyline instead would mirror every station's position.
    return {key,sequence:oriented,path,loop:true}
  }
  // Widest world that still holds the whole run: the world is the whole line the run travels on,
  // so a run inside one branch keeps trunk plus that branch rather than a junction-to-junction stub.
  const worlds=candidates.flatMap(({key,sequence,path})=>[{key,sequence,path},{key,sequence:reverse(sequence),path:reverse(path)}])
  const best=worlds.filter(world=>fits(world.sequence,stations)).sort((left,right)=>right.sequence.length-left.sequence.length)[0]
  if(!best)throw new Error(`Unresolvable run on ${lineId}: ${stations[0]} → ${stations.at(-1)}`)
  return {...best,loop:false}
}
