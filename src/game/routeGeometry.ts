import { pointAt, type Point } from './geometry'
import { getLine } from '../data/lines'

export type RouteGeometry={key:string;path:Point[];context?:Point[];directedClosure?:boolean;globalStart?:Point;globalEnd?:Point}

export const baseRoutes:Record<string,Point[]>={
  // 신도림(서쪽 끝)에서 위로 올라가 당산 부근에서 오른쪽으로 꺾이는 실제 지리 방향을 보존
  'seoul-2':[[70,255],[90,190],[450,35],[530,90],[530,210],[460,255]],
  'seoul-3':[[45,45],[180,45],[230,95],[230,205],[285,255],[455,255],[555,155]],
  'suin-bundang':[[555,45],[520,200],[470,285],[330,285],[230,285],[160,285],[45,220]],
  'incheon-1':[[75,35],[160,35],[160,85],[245,85],[245,145],[330,145],[330,210],[415,210],[480,255],[565,255]],
  'incheon-2':[[60,45],[130,45],[175,90],[245,90],[290,140],[360,140],[405,195],[475,195],[535,245]],
  arex:[[555,225],[465,225],[410,175],[320,175],[265,125],[175,125],[120,75],[40,75]],
  // Smooth loop shape (no sharp corner hook) so any sliced window reads cleanly
  yamanote:[[70,255],[90,190],[450,35],[530,90],[530,210],[460,255]],
}

export const line1Legs:Point[][]=[
  [[450,35],[410,90],[360,140],[300,180]], // Yeoncheon -> Guro
  [[300,180],[210,180],[125,220],[35,220]], // Guro -> Incheon
  [[300,180],[230,235],[160,325]], // Guro -> Sinchang
]
const line1Geometry=(stations:string[]):RouteGeometry=>{
  const sequences=getLine('seoul-1').sequences
  const branch=(ordered:string[])=>ordered.filter(station=>station!=='구로').map(station=>sequences.findIndex(sequence=>sequence.includes(station))).find(index=>index>=0)??0
  const startBranch=branch(stations),endBranch=branch([...stations].reverse())
  if(startBranch===endBranch){
    const path=line1Legs[startBranch]!
    const sequence=sequences[startBranch]!
    return {key:`seoul-1-${startBranch}`,path:sequence.indexOf(stations[0]!)<=sequence.indexOf(stations.at(-1)!)?path:[...path].reverse()}
  }
  const fromJunction=startBranch===0?line1Legs[0]!: [...line1Legs[startBranch]!].reverse()
  const toDestination=endBranch===0?[...line1Legs[0]!].reverse():line1Legs[endBranch]!
  return {key:`seoul-1-${startBranch}-${endBranch}`,path:[...fromJunction,...toDestination.slice(1)]}
}

// Source-guided normalized gameplay anchors, manually digitized into the
// 600x290 gameplay viewBox from the bundled official 2025-09-29 overview and
// public/assets/seoul-supported-lines.svg. They preserve recognizable bends,
// endpoints, junction choice, and loop direction; they are schematic, not
// geospatial coordinates. Named comments record the reference topology.
export const topologyRoutes:Record<string,Omit<RouteGeometry,'key'>>={
  'seoul-4':{path:[[530,35],[430,35],[365,95],[365,180],[270,250],[70,250]]}, // 진접 → 오이도
  'seoul-5-trunk':{path:[[45,145],[145,145],[230,105],[360,105],[455,145],[555,145]]}, // 방화 → 강동
  'seoul-5-hanam':{path:[[45,145],[145,145],[230,105],[360,105],[430,65],[555,65]],context:[[360,105],[430,200],[555,250]]}, // 강동 → 길동 → 하남검단산; sibling 마천 branch
  'seoul-5-macheon':{path:[[45,145],[145,145],[230,105],[360,105],[430,200],[555,250]],context:[[360,105],[430,65],[555,65]]}, // 강동 → 둔촌동 → 마천; sibling 하남 branch
  'seoul-5-hanam-macheon':{path:[[555,250],[430,200],[360,105],[430,65],[555,65]]}, // reversed before display: 하남검단산 → 강동 → 마천
  'seoul-5-macheon-hanam':{path:[[555,65],[430,65],[360,105],[430,200],[555,250]]}, // reversed before display: 마천 → 강동 → 하남검단산
  'seoul-6-trunk':{path:[[45,235],[110,190],[185,190],[250,125],[390,125],[470,55],[555,55]]}, // 응암 → 신내
  'seoul-6-loop':{path:[[300,250],[170,235],[90,145],[135,50],[270,30],[390,100],[365,210]],context:[[365,210],[300,250]],directedClosure:true}, // 응암 → 역촌 → ... → 구산 → 응암
  'seoul-7':{path:[[535,35],[465,80],[390,80],[315,145],[220,145],[145,205],[65,250]]}, // 장암 → 석남
  'seoul-8':{path:[[80,35],[155,80],[155,150],[255,150],[330,210],[445,210],[520,255]]}, // 별내 → 모란
  'seoul-9':{path:[[45,225],[135,225],[205,165],[300,165],[370,105],[465,105],[555,45]]}, // 개화/김포공항 → 중앙보훈병원
}

export function getRouteGeometry(lineId:string,stations:string[]):RouteGeometry{
  if(lineId==='seoul-1')return line1Geometry(stations)
  let key=lineId
  if(lineId==='seoul-5'){
    const hanamIndex=stations.indexOf('길동'),macheonIndex=stations.indexOf('둔촌동')
    key=hanamIndex>=0&&macheonIndex>=0
      ?hanamIndex<macheonIndex?'seoul-5-hanam-macheon':'seoul-5-macheon-hanam'
      :hanamIndex>=0?'seoul-5-hanam':macheonIndex>=0?'seoul-5-macheon':'seoul-5-trunk'
  }
  if(lineId==='seoul-6')key=stations.some(station=>['역촌','불광','독바위','연신내','구산'].includes(station))?'seoul-6-loop':'seoul-6-trunk'
  const topology=topologyRoutes[key]
  const path=topology?.path??baseRoutes[lineId]
  if(!path)throw new Error(`Missing route geometry: ${lineId}`)
  return topology?{key,...topology}:{key,path}
}

const isReverseRoute=(lineId:string,stations:string[])=>{
  const line=getLine(lineId)
  for(let index=0;index<stations.length-1;index++){
    const from=stations[index]!,to=stations[index+1]!
    for(const sequence of line.oneWaySequences??[]){
      if(sequence.some((station,sequenceIndex)=>station===from&&sequence[sequenceIndex+1]===to))return false
    }
    for(const sequence of line.sequences){
      const fromIndex=sequence.indexOf(from),toIndex=sequence.indexOf(to)
      if(fromIndex<0||toIndex<0)continue
      if(toIndex===fromIndex+1||(line.loop&&fromIndex===sequence.length-1&&toIndex===0))return false
      if(fromIndex===toIndex+1||(line.loop&&fromIndex===0&&toIndex===sequence.length-1))return true
    }
  }
  return false
}
const rounded=(value:number)=>Math.round(value*1e6)/1e6
const pathMetrics=(path:Point[])=>{
  const cumulative=[0]
  for(let index=1;index<path.length;index++)cumulative.push(cumulative[index-1]!+Math.hypot(path[index]![0]-path[index-1]![0],path[index]![1]-path[index-1]![1]))
  return cumulative
}
const focusedPath=(path:Point[],startProgress:number,endProgress:number)=>{
  const cumulative=pathMetrics(path),total=cumulative.at(-1)!,startDistance=startProgress*total,endDistance=endProgress*total
  const start=pointAt(path,startProgress),end=pointAt(path,endProgress)
  return [[start.x,start.y] as Point,...path.filter((_,index)=>cumulative[index]!>startDistance&&cumulative[index]!<endDistance),[end.x,end.y] as Point]
}
const normalizePath=(path:Point[])=>{
  const xs=path.map(([x])=>x),ys=path.map(([,y])=>y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys)
  const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY),scale=Math.min(540/width,290/height)
  const offsetX=300-(minX+maxX)/2*scale,offsetY=180-(minY+maxY)/2*scale
  return path.map(([x,y])=>[rounded(x*scale+offsetX),rounded(y*scale+offsetY)] as Point)
}

export function getFocusedRouteGeometry(lineId:string,stations:string[],routeStationCount:number,segmentStart:number,segmentLength:number){
  const geometry=getRouteGeometry(lineId,stations)
  const reversed=lineId!=='seoul-1'&&isReverseRoute(lineId,stations)
  const fullPath=reversed?[...geometry.path].reverse():geometry.path
  const denominator=Math.max(1,routeStationCount-1)
  const startProgress=Math.min(1,segmentStart/denominator)
  const endProgress=Math.min(1,(segmentStart+Math.max(0,segmentLength-1))/denominator)
  const globalPath=focusedPath(fullPath,startProgress,endProgress).map(([x,y])=>[rounded(x),rounded(y)] as Point)
  return {...geometry,path:normalizePath(globalPath),context:undefined,globalStart:globalPath[0]!,globalEnd:globalPath.at(-1)!}
}
