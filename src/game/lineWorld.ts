import type { Point } from './geometry'
import { getLine } from '../data/lines'
import { resolveTopology } from './lineTopology'

export const STATION_SPACING=77
const CORNER=0.28
const SAMPLES_PER_SEGMENT=24

export type LineWorld={
  key:string
  loop:boolean
  pathD:string
  stationNames:string[]
  stationDistances:number[]
  pointAt(distance:number):{x:number;y:number;angle:number}
  cameraWidth(index:number):number
}
type Sample={x:number;y:number;distance:number}

const lerp=(a:Point,b:Point,t:number):Point=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]
const quadratic=(a:Point,b:Point,c:Point,t:number):Point=>{
  const u=1-t
  return [u*u*a[0]+2*u*t*b[0]+t*t*c[0],u*u*a[1]+2*u*t*b[1]+t*t*c[1]]
}
const cubic=(a:Point,b:Point,c:Point,d:Point,t:number):Point=>{
  const u=1-t
  return [
    u**3*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t**3*d[0],
    u**3*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t**3*d[1],
  ]
}

// The two loop lines (Seoul 2, Yamanote) keep the ring their map already ships: the cubics of the
// old LINE_2_PATH_D as anchor,control,control,anchor,… sampled into the same polyline every other
// line goes through, so there is one geometry pipeline rather than two.
const LOOP_CURVE:Point[]=[
  [0,0],
  [0,-289.885],[-235.001,-524.886],[-524.887,-524.886],
  [-814.773,-524.886],[-1049.771,-289.885],[-1049.771,0],
  [-1049.771,279.822],[-830.81,508.501],[-554.873,524.045],
  [-544.948,524.603],[-534.949,524.885],[-524.887,524.885],
  [-477.946,524.885],[-432.447,518.727],[-389.148,507.164],
  [-165.057,447.344],[0,242.946],[0,0],
]
const loopRing=():Point[]=>{
  const result:Point[]=[LOOP_CURVE[0]!]
  for(let start=0;start+3<LOOP_CURVE.length;start+=3){
    const [a,b,c,d]=[LOOP_CURVE[start]!,LOOP_CURVE[start+1]!,LOOP_CURVE[start+2]!,LOOP_CURVE[start+3]!]
    for(let step=1;step<=SAMPLES_PER_SEGMENT;step++)result.push(cubic(a,b,c,d,step/SAMPLES_PER_SEGMENT))
  }
  return result
}

// Round every interior corner so the world reads as track rather than as a chevron.
const roundCorners=(points:readonly Point[]):Point[]=>{
  if(points.length<3)return [...points]
  const result:Point[]=[points[0]!]
  for(let index=1;index<points.length-1;index++){
    const current=points[index]!
    const entry=lerp(current,points[index-1]!,CORNER),exit=lerp(current,points[index+1]!,CORNER)
    result.push(entry)
    for(let step=1;step<=SAMPLES_PER_SEGMENT;step++)result.push(quadratic(entry,current,exit,step/SAMPLES_PER_SEGMENT))
  }
  result.push(points.at(-1)!)
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
  const shape=topology.loop?loopRing():roundCorners(topology.path)
  // A loop closes, so it holds one gap per station; an open line holds one fewer than its stations.
  const gaps=Math.max(1,topology.loop?topology.sequence.length:topology.sequence.length-1)
  const samples=measure(shape,STATION_SPACING*gaps/(length(shape)||1))
  const total=samples.at(-1)!.distance

  // A loop station keeps one fixed seat on the ring whichever way the run travels, so choosing the
  // opposite direction actually reverses the on-screen rotation. Consecutive seats are unwrapped by
  // the shorter way round, which keeps distance continuous across the seam.
  const seat=(name:string)=>getLine(lineId).sequences[0]!.indexOf(name)*STATION_SPACING
  const unwrapped=(names:string[])=>names.reduce<number[]>((result,name,index)=>{
    if(!index)return [seat(name)]
    let delta=seat(name)-seat(names[index-1]!)
    if(delta>total/2)delta-=total
    if(delta<-total/2)delta+=total
    return [...result,result[index-1]!+delta]
  },[])
  const offset=topology.sequence.indexOf(stations[0]!)
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

  const cameraWidth=(index:number)=>{
    const nearby=stationDistances.slice(Math.max(0,index-2),index+3).map(pointAt)
    const xs=nearby.map(point=>point.x),ys=nearby.map(point=>point.y)
    const span=Math.max(Math.max(...xs)-Math.min(...xs),(Math.max(...ys)-Math.min(...ys))*1.55)
    return Math.max(360,Math.min(620,span*1.45+150))
  }

  // Clipped to the run. Walking the interval rather than filtering world vertices keeps this correct
  // when a loop run travels backwards or crosses the seam, where the endpoints are not in order.
  const from=stationDistances[0]!,to=stationDistances.at(-1)!
  const steps=Math.max(SAMPLES_PER_SEGMENT,(stations.length-1)*8)
  const drawn=Array.from({length:steps+1},(_,step)=>pointAt(from+(to-from)*step/steps))
  const pathD=drawn.map((point,index)=>`${index?'L':'M'} ${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' ')

  return {key:topology.key,loop:topology.loop,pathD,stationNames:[...stations],stationDistances,pointAt,cameraWidth}
}
