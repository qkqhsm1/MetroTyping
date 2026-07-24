import type { Point } from './geometry'
import { getLine } from '../data/lines'
import { resolveTopology } from './lineTopology'

export const STATION_SPACING=110
const CORNER=0.28
const SAMPLES_PER_SEGMENT=24

export type LineWorld={
  key:string
  loop:boolean
  pathD:string
  stationNames:string[]
  stationDistances:number[]
  pointAt(distance:number):{x:number;y:number;angle:number}
  cameraWidth(index:number,limits:CameraLimits):number
}
// How wide a view the surface can carry. A phone holds far fewer stations than a desktop at a size
// worth reading, so the caller supplies its own bounds rather than sharing one compromise.
export type CameraLimits={min:number;max:number}
type Sample={x:number;y:number;distance:number}

const lerp=(a:Point,b:Point,t:number):Point=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]
const quadratic=(a:Point,b:Point,c:Point,t:number):Point=>{
  const u=1-t
  return [u*u*a[0]+2*u*t*b[0]+t*t*c[0],u*u*a[1]+2*u*t*b[1]+t*t*c[1]]
}
// Round every interior corner so the world reads as track rather than as a chevron. A loop is closed,
// so its first and last point are corners too and are rounded like any other.
const roundCorners=(points:readonly Point[],closed:boolean):Point[]=>{
  if(points.length<3)return [...points]
  const count=closed?points.length:points.length-1
  const result:Point[]=closed?[]:[points[0]!]
  for(let index=closed?0:1;index<count;index++){
    const current=points[(index+points.length)%points.length]!
    const previous=points[(index-1+points.length)%points.length]!
    const next=points[(index+1)%points.length]!
    const entry=lerp(current,previous,CORNER),exit=lerp(current,next,CORNER)
    result.push(entry)
    for(let step=1;step<=SAMPLES_PER_SEGMENT;step++)result.push(quadratic(entry,current,exit,step/SAMPLES_PER_SEGMENT))
  }
  result.push(closed?result[0]!:points.at(-1)!)
  return result
}

// One scale for the whole sequence, never per leg, so camera speed never jumps at a leg join.
const measure=(points:readonly Point[],factor:number):Sample[]=>{
  const samples:Sample[]=[{x:points[0]![0]*factor,y:points[0]![1]*factor,distance:0}]
  for(let index=1;index<points.length;index++){
    const previous=samples.at(-1)!
    const x=points[index]![0]*factor,y=points[index]![1]*factor
    samples.push({x,y,distance:previous.distance+Math.hypot(x-previous.x,y-previous.y)})
  }
  return samples
}
const length=(points:readonly Point[])=>measure(points,1).at(-1)!.distance

export function getLineWorld(lineId:string,stations:string[]):LineWorld{
  const topology=resolveTopology(lineId,stations)
  const shape=roundCorners(topology.path,topology.loop)
  // A loop closes, so it holds one gap per station; an open line holds one fewer than its stations.
  const gaps=Math.max(1,topology.loop?topology.sequence.length:topology.sequence.length-1)
  const factor=STATION_SPACING*gaps/(length(shape)||1)
  const samples=measure(shape,factor)
  const total=samples.at(-1)!.distance
  // Rounding a closed ring moves its polyline start off the first station, and by a different amount
  // in each direction of travel, so seats are measured from where that station actually sits.
  const anchor={x:topology.path[0]![0]*factor,y:topology.path[0]![1]*factor}
  const origin=!topology.loop?0:samples.reduce((best,sample)=>
    Math.hypot(sample.x-anchor.x,sample.y-anchor.y)<Math.hypot(best.x-anchor.x,best.y-anchor.y)?sample:best).distance

  // A loop station keeps one fixed seat on the ring whichever way the run travels, so choosing the
  // opposite direction actually reverses the on-screen rotation. Consecutive seats are unwrapped by
  // the shorter way round, which keeps distance continuous across the seam.
  const seat=(name:string)=>origin+getLine(lineId).sequences[0]!.indexOf(name)*STATION_SPACING
  const unwrapped=(names:string[])=>names.reduce<number[]>((result,name,index)=>{
    if(!index)return [seat(name)]
    let delta=seat(name)-seat(names[index-1]!)
    if(delta>total/2)delta-=total
    if(delta<-total/2)delta+=total
    return [...result,result[index-1]!+delta]
  },[])
  // The offset is the seat where the whole run matches, not merely where its first name appears: a
  // closed one-way loop names its junction twice.
  const offset=Math.max(0,topology.sequence.findIndex((name,start)=>name===stations[0]&&stations.every((station,index)=>topology.sequence[start+index]===station)))
  const stationDistances=topology.loop?unwrapped(stations):stations.map((_,index)=>(offset+index)*STATION_SPACING)
  const backwards=stationDistances.length>1&&stationDistances[1]!<stationDistances[0]!

  const pointAt=(distance:number)=>{
    const target=topology.loop?(distance%total+total)%total:Math.min(total,Math.max(0,distance))
    let low=1,high=samples.length-1
    while(low<high){const middle=Math.floor((low+high)/2);if(samples[middle]!.distance<target)low=middle+1;else high=middle}
    const next=samples[low]!,previous=samples[low-1]!
    const span=next.distance-previous.distance||1,ratio=(target-previous.distance)/span
    return {
      x:previous.x+(next.x-previous.x)*ratio,
      y:previous.y+(next.y-previous.y)*ratio,
      // The tangent follows the ring, so a run travelling against it needs the train turned around.
      angle:Math.atan2(next.y-previous.y,next.x-previous.x)*180/Math.PI+(backwards?180:0),
    }
  }

  // Framed on the stations within two stops, so the view tightens where the track bunches up and opens
  // where it runs straight. At a run's first stop only the stops ahead exist, which is what starts a
  // journey close in and pulls back over its opening stations; the coefficients keep that reveal off
  // the upper limit, since a clamped view would hold one width from the very first stop.
  const cameraWidth=(index:number,limits:CameraLimits)=>{
    const nearby=stationDistances.slice(Math.max(0,index-2),index+3).map(pointAt)
    const xs=nearby.map(point=>point.x),ys=nearby.map(point=>point.y)
    const span=Math.max(Math.max(...xs)-Math.min(...xs),(Math.max(...ys)-Math.min(...ys))*1.55)
    return Math.max(limits.min,Math.min(limits.max,span*.86+240))
  }

  // Clipped to the run. Walking the interval rather than filtering world vertices keeps this correct
  // when a loop run travels backwards or crosses the seam, where the endpoints are not in order.
  const from=stationDistances[0]!,to=stationDistances.at(-1)!
  const steps=Math.max(SAMPLES_PER_SEGMENT,(stations.length-1)*8)
  const drawn=Array.from({length:steps+1},(_,step)=>pointAt(from+(to-from)*step/steps))
  const pathD=drawn.map((point,index)=>`${index?'L':'M'} ${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' ')

  return {key:topology.key,loop:topology.loop,pathD,stationNames:[...stations],stationDistances,pointAt,cameraWidth}
}
