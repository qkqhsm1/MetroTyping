import { pointAt } from '../game/geometry'
import { getRouteGeometry } from '../game/routeGeometry'

export default function RouteMap({ lineId,progress,color,stations,geometryStations=stations,showAllLabels=true,targetIndex,trainVisible=true,trainEntering=false }:{ lineId:string; progress:number; color:string; stations:string[]; geometryStations?:string[]; showAllLabels?:boolean; targetIndex?:number; trainVisible?:boolean; trainEntering?:boolean }) {
  const geometry=getRouteGeometry(lineId,geometryStations)
  const route = geometry.path
  if (!route) throw new Error(`Missing route geometry: ${lineId}`)
  const train = pointAt(route, progress)
  const points = route.map(point => point.join(',')).join(' ')
  return <svg className="route-map" viewBox="0 0 600 290" role="img" aria-label="전체 노선도">
    <polyline data-route="" data-geometry={geometry.key} points={points} fill="none" stroke="#deddd7" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    {geometry.context&&<polyline data-context="" data-directed-closure={geometry.directedClosure||undefined} points={geometry.context.map(point=>point.join(',')).join(' ')} fill="none" stroke="#deddd7" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />}
    <polyline points={points} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray={`${progress} 1`} />
    {stations.map((station,index) => {
      const point=pointAt(route,index/Math.max(1,stations.length-1))
      const labelY=point.y+(index%2===0?-31:40)
      const showLabel=showAllLabels||index===0||index===stations.length-1||index===Math.round(progress*(stations.length-1))
      const split=station.length>6?Math.ceil(station.length/2):station.length
      const isTarget=index===targetIndex
      return <g key={`${station}-${index}`} data-target={isTarget||undefined}>{isTarget&&<circle className="target-ring" cx={point.x} cy={point.y} r="14" fill="none" stroke={color} strokeWidth="3" />}<circle cx={point.x} cy={point.y} r={isTarget?9:7} fill="white" stroke={index/(stations.length-1)<=progress||isTarget?color:'#b9bab5'} strokeWidth="5" />{showLabel&&<text className={isTarget?'target-label':undefined} x={point.x} y={labelY} textAnchor="middle"><tspan x={point.x}>{station.slice(0,split)}</tspan>{split<station.length&&<tspan x={point.x} dy="10">{station.slice(split)}</tspan>}</text>}</g>
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
