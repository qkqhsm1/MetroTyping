import { pointAt, type Point } from '../game/geometry'

const routes: Record<string, Point[]> = {
  'seoul-1': [[35,250],[135,250],[210,190],[280,190],[340,115],[430,115],[520,35],[565,35]],
  'seoul-2': [[150,255],[70,210],[70,80],[150,35],[450,35],[530,90],[530,210],[460,255]],
  'incheon-1': [[75,35],[160,35],[160,85],[245,85],[245,145],[330,145],[330,210],[415,210],[480,255],[565,255]],
  'incheon-2': [[60,45],[130,45],[175,90],[245,90],[290,140],[360,140],[405,195],[475,195],[535,245]],
  arex: [[45,225],[135,225],[190,175],[280,175],[335,125],[425,125],[480,75],[560,75]],
  yamanote: [[150,255],[70,210],[70,80],[150,35],[450,35],[530,90],[530,210],[460,255]],
}

export default function RouteMap({ lineId,progress,color,stations,showAllLabels=true,targetIndex }:{ lineId:string; progress:number; color:string; stations:string[]; showAllLabels?:boolean; targetIndex?:number }) {
  const route = routes[lineId]
  if (!route) throw new Error(`Missing route geometry: ${lineId}`)
  const train = pointAt(route, progress)
  const points = route.map(point => point.join(',')).join(' ')
  return <svg className="route-map" viewBox="0 0 600 290" role="img" aria-label="전체 노선도">
    <polyline points={points} fill="none" stroke="#deddd7" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={points} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray={`${progress} 1`} />
    {stations.map((station,index) => {
      const point=pointAt(route,index/Math.max(1,stations.length-1))
      const labelY=point.y+(index%2===0?-31:40)
      const showLabel=showAllLabels||index===0||index===stations.length-1||index===Math.round(progress*(stations.length-1))
      const split=station.length>6?Math.ceil(station.length/2):station.length
      const isTarget=index===targetIndex
      return <g key={`${station}-${index}`} data-target={isTarget||undefined}>{isTarget&&<circle className="target-ring" cx={point.x} cy={point.y} r="14" fill="none" stroke={color} strokeWidth="3" />}<circle cx={point.x} cy={point.y} r={isTarget?9:7} fill="white" stroke={index/(stations.length-1)<=progress||isTarget?color:'#b9bab5'} strokeWidth="5" />{showLabel&&<text className={isTarget?'target-label':undefined} x={point.x} y={labelY} textAnchor="middle"><tspan x={point.x}>{station.slice(0,split)}</tspan>{split<station.length&&<tspan x={point.x} dy="10">{station.slice(split)}</tspan>}</text>}</g>
    })}
    <g className="train" style={{transform:`translate(${train.x}px,${train.y}px) rotate(${train.angle}deg)`}}>
      <g className="train-body" transform="translate(-22 0)">
        <rect x="-22" y="-14" width="44" height="28" rx="9" fill="white" stroke="#111" strokeWidth="3" />
        <rect x="-14" y="-8" width="10" height="8" rx="2" fill="#20252a" /><rect x="4" y="-8" width="10" height="8" rx="2" fill="#20252a" />
        <path d="M-17 7 H17" stroke={color} strokeWidth="5" />
      </g>
    </g>
  </svg>
}
