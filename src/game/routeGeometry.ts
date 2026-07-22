import { pointAt, type Point } from './geometry'

export type RouteGeometry={key:string;path:Point[];context?:Point[];directedClosure?:boolean;globalStart?:Point;globalEnd?:Point}

const baseRoutes:Record<string,Point[]>={
  'seoul-1':[[35,250],[135,250],[210,190],[280,190],[340,115],[430,115],[520,35],[565,35]],
  'seoul-2':[[150,255],[70,210],[70,80],[150,35],[450,35],[530,90],[530,210],[460,255]],
  'seoul-3':[[45,45],[180,45],[230,95],[230,205],[285,255],[455,255],[555,155]],
  'suin-bundang':[[45,245],[165,245],[215,195],[335,195],[385,145],[385,65],[555,65]],
  'incheon-1':[[75,35],[160,35],[160,85],[245,85],[245,145],[330,145],[330,210],[415,210],[480,255],[565,255]],
  'incheon-2':[[60,45],[130,45],[175,90],[245,90],[290,140],[360,140],[405,195],[475,195],[535,245]],
  arex:[[45,225],[135,225],[190,175],[280,175],[335,125],[425,125],[480,75],[560,75]],
  yamanote:[[150,255],[70,210],[70,80],[150,35],[450,35],[530,90],[530,210],[460,255]],
}

// Source-guided normalized gameplay anchors, manually digitized into the
// 600x290 gameplay viewBox from the bundled official 2025-09-29 overview and
// public/assets/seoul-supported-lines.svg. They preserve recognizable bends,
// endpoints, junction choice, and loop direction; they are schematic, not
// geospatial coordinates. Named comments record the reference topology.
const topologyRoutes:Record<string,Omit<RouteGeometry,'key'>>={
  'seoul-4':{path:[[70,35],[170,35],[235,95],[235,180],[330,250],[530,250]]}, // 진접 → 오이도
  'seoul-5-trunk':{path:[[45,145],[145,145],[230,105],[360,105],[455,145],[555,145]]}, // 방화 → 강동
  'seoul-5-hanam':{path:[[45,145],[145,145],[230,105],[360,105],[430,65],[555,65]],context:[[360,105],[430,200],[555,250]]}, // 강동 → 길동 → 하남검단산; sibling 마천 branch
  'seoul-5-macheon':{path:[[45,145],[145,145],[230,105],[360,105],[430,200],[555,250]],context:[[360,105],[430,65],[555,65]]}, // 강동 → 둔촌동 → 마천; sibling 하남 branch
  'seoul-6-trunk':{path:[[45,235],[110,190],[185,190],[250,125],[390,125],[470,55],[555,55]]}, // 응암 → 신내
  'seoul-6-loop':{path:[[300,250],[170,235],[90,145],[135,50],[270,30],[390,100],[365,210]],context:[[365,210],[300,250]],directedClosure:true}, // 응암 → 역촌 → ... → 구산 → 응암
  'seoul-7':{path:[[65,35],[135,80],[210,80],[285,145],[380,145],[455,205],[535,250]]}, // 장암 → 석남
  'seoul-8':{path:[[80,35],[155,80],[155,150],[255,150],[330,210],[445,210],[520,255]]}, // 별내 → 모란
  'seoul-9':{path:[[45,225],[135,225],[205,165],[300,165],[370,105],[465,105],[555,45]]}, // 개화/김포공항 → 중앙보훈병원
}

export function getRouteGeometry(lineId:string,stations:string[]):RouteGeometry{
  let key=lineId
  if(lineId==='seoul-5')key=stations.includes('길동')?'seoul-5-hanam':stations.includes('둔촌동')?'seoul-5-macheon':'seoul-5-trunk'
  if(lineId==='seoul-6')key=stations.some(station=>['역촌','불광','독바위','연신내','구산'].includes(station))?'seoul-6-loop':'seoul-6-trunk'
  const topology=topologyRoutes[key]
  const path=topology?.path??baseRoutes[lineId]
  if(!path)throw new Error(`Missing route geometry: ${lineId}`)
  return topology?{key,...topology}:{key,path}
}

const reverseOrigins:Record<string,string>={
  'seoul-4':'오이도','seoul-5-hanam':'하남검단산','seoul-5-macheon':'마천','seoul-6-trunk':'신내',
  'seoul-7':'석남','seoul-8':'모란','seoul-9':'중앙보훈병원',
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
  const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY),scale=Math.min(510/width,220/height)
  const offsetX=300-(minX+maxX)/2*scale,offsetY=145-(minY+maxY)/2*scale
  return path.map(([x,y])=>[rounded(x*scale+offsetX),rounded(y*scale+offsetY)] as Point)
}

export function getFocusedRouteGeometry(lineId:string,stations:string[],routeStationCount:number,segmentStart:number,segmentLength:number){
  const geometry=getRouteGeometry(lineId,stations)
  const reversed=reverseOrigins[geometry.key]===stations[0]
  const fullPath=reversed?[...geometry.path].reverse():geometry.path
  const denominator=Math.max(1,routeStationCount-1)
  const startProgress=Math.min(1,segmentStart/denominator)
  const endProgress=Math.min(1,(segmentStart+Math.max(0,segmentLength-1))/denominator)
  const globalPath=focusedPath(fullPath,startProgress,endProgress).map(([x,y])=>[rounded(x),rounded(y)] as Point)
  return {...geometry,path:normalizePath(globalPath),context:undefined,globalStart:globalPath[0]!,globalEnd:globalPath.at(-1)!}
}
