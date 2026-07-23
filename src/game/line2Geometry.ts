import { LINE_2_STATIONS } from '../data/line2'

type Point={x:number;y:number}
type Cubic=[Point,Point,Point,Point]
type Sample=Point&{distance:number}

export const LINE_2_PATH_D='M 0.000360661 0.00123244 C 0.000360661 -289.884882 -235.00093 -524.886173 -524.887044 -524.886173 C -814.773158 -524.886173 -1049.770542 -289.884882 -1049.770542 0.00123244 C -1049.770542 279.821612 -830.809561 508.500559 -554.873242 524.044616 C -544.948178 524.60339 -534.948871 524.88473 -524.887044 524.88473 C -477.94618 524.88473 -432.447186 518.726501 -389.148117 507.164192 C -165.056581 447.34419 0.000360661 242.946482 0.000360661 0.00123244 Z'

const p=(x:number,y:number):Point=>({x,y})
const curves:Cubic[]=[
  [p(.000360661,.00123244),p(.000360661,-289.884882),p(-235.00093,-524.886173),p(-524.887044,-524.886173)],
  [p(-524.887044,-524.886173),p(-814.773158,-524.886173),p(-1049.770542,-289.884882),p(-1049.770542,.00123244)],
  [p(-1049.770542,.00123244),p(-1049.770542,279.821612),p(-830.809561,508.500559),p(-554.873242,524.044616)],
  [p(-554.873242,524.044616),p(-544.948178,524.60339),p(-534.948871,524.88473),p(-524.887044,524.88473)],
  [p(-524.887044,524.88473),p(-477.94618,524.88473),p(-432.447186,518.726501),p(-389.148117,507.164192)],
  [p(-389.148117,507.164192),p(-165.056581,447.34419),p(.000360661,242.946482),p(.000360661,.00123244)],
]
const cubic=(curve:Cubic,t:number)=>{
  const u=1-t,[a,b,c,d]=curve
  return p(u**3*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t**3*d.x,u**3*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t**3*d.y)
}
const samples:Sample[]=[]
for(const curve of curves)for(let step=0;step<=128;step++){
  if(samples.length&&step===0)continue
  const point=cubic(curve,step/128),previous=samples.at(-1)
  samples.push({...point,distance:(previous?.distance??0)+(previous?Math.hypot(point.x-previous.x,point.y-previous.y):0)})
}
export const LINE_2_TOTAL_LENGTH=samples.at(-1)!.distance
const wrap=(distance:number)=>(distance%LINE_2_TOTAL_LENGTH+LINE_2_TOTAL_LENGTH)%LINE_2_TOTAL_LENGTH

export function line2PointAt(distance:number){
  const target=wrap(distance)
  let low=0,high=samples.length-1
  while(low<high){const middle=Math.floor((low+high)/2);if(samples[middle]!.distance<target)low=middle+1;else high=middle}
  const next=samples[low]!,previous=samples[Math.max(0,low-1)]!,span=next.distance-previous.distance||1,ratio=(target-previous.distance)/span
  const x=previous.x+(next.x-previous.x)*ratio,y=previous.y+(next.y-previous.y)*ratio
  return {x,y,angle:Math.atan2(next.y-previous.y,next.x-previous.x)*180/Math.PI}
}
const stationStep=LINE_2_TOTAL_LENGTH/LINE_2_STATIONS.length
const sindorimDistance=LINE_2_TOTAL_LENGTH*.7
export function line2StationDistance(name:string){
  const index=LINE_2_STATIONS.findIndex(station=>station.korean===name)
  if(index<0)throw new Error(`Unknown Line 2 station: ${name}`)
  return wrap(sindorimDistance-index*stationStep)
}
export function unwrapLine2Route(stations:string[]){
  return stations.reduce<number[]>((result,name,index)=>{
    const distance=line2StationDistance(name)
    if(index===0)return [distance]
    const previousCanonical=line2StationDistance(stations[index-1]!)
    let delta=distance-previousCanonical
    if(delta>LINE_2_TOTAL_LENGTH/2)delta-=LINE_2_TOTAL_LENGTH
    if(delta<-LINE_2_TOTAL_LENGTH/2)delta+=LINE_2_TOTAL_LENGTH
    return [...result,result[index-1]!+delta]
  },[])
}
export function line2CameraWidth(distances:number[],index:number){
  const nearby=distances.slice(Math.max(0,index-2),Math.min(distances.length,index+3)).map(line2PointAt)
  const xs=nearby.map(point=>point.x),ys=nearby.map(point=>point.y)
  const span=Math.max(Math.max(...xs)-Math.min(...xs),(Math.max(...ys)-Math.min(...ys))*1.55)
  return Math.max(360,Math.min(620,span*1.45+150))
}
