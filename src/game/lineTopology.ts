import type { Point } from './geometry'
import { getLine } from '../data/lines'
import { baseRoutes,line1Legs,topologyRoutes } from './routeGeometry'

export type Topology={key:string;sequence:string[];path:Point[];loop:boolean}
type Candidate={key:string;sequence:string[];path:Point[]}

const reverse=<T>(items:T[])=>[...items].reverse()
const join=(head:string[],tail:string[])=>[...head,...tail.slice(1)]
const joinPath=(head:Point[],tail:Point[])=>[...head,...tail.slice(1)]

// Every full-line world a run on this line could belong to, each polyline oriented to its sequence.
// Only one orientation per world is listed; resolveTopology tries the reverse of each anyway.
function candidatesFor(lineId:string):Candidate[]{
  const line=getLine(lineId)
  if(lineId==='seoul-1'){
    const [north,incheon,sinchang]=line.sequences as [string[],string[],string[]]
    const [northLeg,incheonLeg,sinchangLeg]=line1Legs as [Point[],Point[],Point[]]
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
    // The branch-to-branch polylines are stored against the legacy renderer, which reversed them
    // before display, so 'seoul-5-hanam-macheon' runs 마천 → 강동 → 하남검단산 and needs reversing here.
    return [
      {key:'seoul-5-hanam-macheon',sequence:join(reverse(hanam),macheon),path:reverse(topologyRoutes['seoul-5-hanam-macheon']!.path)},
      {key:'seoul-5-hanam',sequence:join(trunk,hanam),path:topologyRoutes['seoul-5-hanam']!.path},
      {key:'seoul-5-macheon',sequence:join(trunk,macheon),path:topologyRoutes['seoul-5-macheon']!.path},
      {key:'seoul-5-trunk',sequence:trunk,path:topologyRoutes['seoul-5-trunk']!.path},
    ]
  }
  if(lineId==='seoul-6')return [
    {key:'seoul-6-loop',sequence:line.oneWaySequences![0]!.slice(0,-1),path:topologyRoutes['seoul-6-loop']!.path},
    {key:'seoul-6-trunk',sequence:line.sequences[0]!,path:topologyRoutes['seoul-6-trunk']!.path},
  ]
  if(lineId==='seoul-9')return (line.services??[]).map(service=>({
    key:`seoul-9-${service.id}`,sequence:[...service.sequence],path:topologyRoutes['seoul-9']!.path,
  }))
  const path=topologyRoutes[lineId]?.path??baseRoutes[lineId]
  if(!path)throw new Error(`Missing route geometry: ${lineId}`)
  return line.sequences.map((sequence,index)=>({key:index?`${lineId}-${index}`:lineId,sequence,path}))
}

const fits=(sequence:string[],stations:string[])=>{
  const start=sequence.indexOf(stations[0]!)
  return start>=0&&stations.every((station,offset)=>sequence[start+offset]===station)
}
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
    // The polyline is an open list closed implicitly, so reversing cyclically keeps the anchor
    // point at index 0 instead of dropping the closing edge off the front.
    return {key,sequence:oriented,path:reversed?[path[0]!,...reverse(path.slice(1))]:path,loop:true}
  }
  // Widest world that still holds the whole run: the world is the whole line the run travels on,
  // so a run inside one branch keeps trunk plus that branch rather than a junction-to-junction stub.
  const worlds=candidates.flatMap(({key,sequence,path})=>[{key,sequence,path},{key,sequence:reverse(sequence),path:reverse(path)}])
  const best=worlds.filter(world=>fits(world.sequence,stations)).sort((left,right)=>right.sequence.length-left.sequence.length)[0]
  if(!best)throw new Error(`Unresolvable run on ${lineId}: ${stations[0]} → ${stations.at(-1)}`)
  return {...best,loop:false}
}
