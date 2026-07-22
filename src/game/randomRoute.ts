import { pointAt, type Point } from './geometry'

const intersects=(a:Point,b:Point,c:Point,d:Point)=>{
  const cross=(p:Point,q:Point,r:Point)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])
  const abC=cross(a,b,c),abD=cross(a,b,d),cdA=cross(c,d,a),cdB=cross(c,d,b)
  return abC*abD<0&&cdA*cdB<0
}

export function hasSelfIntersection(path:readonly Point[]){
  for(let left=0;left<path.length-1;left++)for(let right=left+2;right<path.length-1;right++){
    if(left===0&&right===path.length-2)continue
    if(intersects(path[left]!,path[left+1]!,path[right]!,path[right+1]!))return true
  }
  return false
}

export function randomizeRoute(path:readonly Point[],seed:number):Point[]{
  const start=path[0],end=path.at(-1)
  if(!start||!end||path.length<2)return [...path]
  let state=seed>>>0
  const random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/0x100000000)*2-1
  const dx=end[0]-start[0],dy=end[1]-start[1],length=Math.hypot(dx,dy)||1
  const normal:[number,number]=[-dy/length,dx/length]
  const offsets=[0,random(),random(),random(),0]
  for(const amplitude of [58,44,32,20,0]){
    const candidate=offsets.map((offset,index)=>{
      const base=pointAt(path,index/(offsets.length-1))
      return [Math.max(35,Math.min(565,Math.round((base.x+normal[0]*offset*amplitude)*1000)/1000)),Math.max(35,Math.min(325,Math.round((base.y+normal[1]*offset*amplitude)*1000)/1000))] as Point
    })
    if(!hasSelfIntersection(candidate))return candidate
  }
  return [...path]
}
