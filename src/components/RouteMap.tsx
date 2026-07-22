import { pointAt } from '../game/geometry'
import { getFocusedRouteGeometry, getRouteGeometry } from '../game/routeGeometry'
import { randomizeRoute } from '../game/randomRoute'

type LabelBox={x:number;y:number;width:number;height:number}
const overlaps=(left:LabelBox,right:LabelBox)=>left.x<right.x+right.width+4&&left.x+left.width+4>right.x&&left.y<right.y+right.height+4&&left.y+left.height+4>right.y

export default function RouteMap({ lineId,progress,color,stations,geometryStations=stations,routeStationCount,segmentStart=0,shapeSeed,showAllLabels=true,targetIndex,trainVisible=true,trainEntering=false }:{ lineId:string; progress:number; color:string; stations:string[]; geometryStations?:string[]; routeStationCount?:number; segmentStart?:number; shapeSeed?:number; showAllLabels?:boolean; targetIndex?:number; trainVisible?:boolean; trainEntering?:boolean }) {
  const sourceGeometry=routeStationCount===undefined?getRouteGeometry(lineId,geometryStations):getFocusedRouteGeometry(lineId,geometryStations,routeStationCount,segmentStart,stations.length)
  const geometry=sourceGeometry
  const route = shapeSeed===undefined?geometry.path:randomizeRoute(geometry.path,shapeSeed)
  if (!route) throw new Error(`Missing route geometry: ${lineId}`)
  const train = pointAt(route, progress)
  const points = route.map(point => point.join(',')).join(' ')
  const labelBoxes:LabelBox[]=[]
  const labels=stations.map((station,index)=>{
    const point=pointAt(route,index/Math.max(1,stations.length-1)),split=station.length>6?Math.ceil(station.length/2):station.length
    const width=Math.max(split,station.length-split)*9,height=split<station.length?22:12
    const candidates=[
      {position:'above',x:point.x,y:point.y-32,anchor:'middle',box:{x:point.x-width/2,y:point.y-44,width,height}},
      {position:'below',x:point.x,y:point.y+38,anchor:'middle',box:{x:point.x-width/2,y:point.y+28,width,height}},
      {position:'left',x:point.x-16,y:point.y+4,anchor:'end',box:{x:point.x-width-16,y:point.y-7,width,height}},
      {position:'right',x:point.x+16,y:point.y+4,anchor:'start',box:{x:point.x+16,y:point.y-7,width,height}},
    ] as const
    const label=candidates.find(candidate=>candidate.box.x>=10&&candidate.box.x+candidate.box.width<=590&&candidate.box.y>=12&&candidate.box.y+candidate.box.height<=348&&!labelBoxes.some(box=>overlaps(candidate.box,box)))??candidates[0]
    labelBoxes.push(label.box)
    return {point,split,...label}
  })
  return <svg className="route-map" viewBox="0 0 600 360" role="img" aria-label="전체 노선도">
    <polyline data-route="" data-geometry={geometry.key} data-global-start={geometry.globalStart?.join(',')} data-global-end={geometry.globalEnd?.join(',')} points={points} fill="none" stroke="#deddd7" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    {geometry.context&&<polyline data-context="" data-directed-closure={geometry.directedClosure||undefined} points={geometry.context.map(point=>point.join(',')).join(' ')} fill="none" stroke="#deddd7" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />}
    <polyline points={points} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray={`${progress} 1`} />
    {stations.map((station,index) => {
      const {point,split,position,x,y,anchor}=labels[index]!
      const showLabel=showAllLabels||index===0||index===stations.length-1||index===Math.round(progress*(stations.length-1))
      const isTarget=index===targetIndex
      return <g key={`${station}-${index}`} data-target={isTarget||undefined}>{isTarget&&<circle className="target-ring" cx={point.x} cy={point.y} r="14" fill="none" stroke={color} strokeWidth="3" />}<circle cx={point.x} cy={point.y} r={isTarget?9:7} fill="white" stroke={index/(stations.length-1)<=progress||isTarget?color:'#b9bab5'} strokeWidth="5" />{showLabel&&<text className={isTarget?'target-label':undefined} data-label-position={position} x={x} y={y} textAnchor={anchor}><tspan x={x}>{station.slice(0,split)}</tspan>{split<station.length&&<tspan x={x} dy="10">{station.slice(split)}</tspan>}</text>}</g>
    })}
    {trainVisible&&<g className={`train${trainEntering?' train-entering':''}`} style={{transform:`translate(${train.x}px,${train.y}px) rotate(${train.angle}deg)`}}>
      <g className="train-entrance-shell">
        <g className="train-body" transform="translate(-22 0)">
          <rect x="-22" y="-14" width="44" height="28" rx="9" fill="white" stroke="#111" strokeWidth="3" />
          <rect x="-14" y="-8" width="10" height="8" rx="2" fill="#20252a" /><rect x="4" y="-8" width="10" height="8" rx="2" fill="#20252a" />
          <path d="M-17 7 H17" stroke={color} strokeWidth="5" />
        </g>
        <path className="train-light" d="M -2 -4 L 7 -4" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>}
  </svg>
}
