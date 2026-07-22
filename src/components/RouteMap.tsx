import { pointAt, type Point } from '../game/geometry'

const routes: Record<string, Point[]> = {
  'seoul-1': [[35,250],[135,250],[210,190],[280,190],[340,115],[430,115],[520,35],[565,35]],
  'seoul-2': [[150,255],[70,210],[70,80],[150,35],[450,35],[530,90],[530,210],[460,255]],
  'seoul-3': [[45,45],[180,45],[230,95],[230,205],[285,255],[455,255],[555,155]],
  'seoul-4': [[45,245],[135,245],[210,190],[300,190],[375,125],[465,125],[555,45]],
  'seoul-5': [[45,225],[150,225],[210,170],[315,170],[375,105],[480,105],[555,45]],
  'seoul-6': [[45,155],[115,75],[220,45],[330,45],[440,90],[515,175],[555,245]],
  'seoul-7': [[45,45],[120,100],[225,100],[300,155],[405,155],[480,210],[555,210]],
  'seoul-8': [[75,35],[150,80],[150,155],[250,155],[325,215],[450,215],[525,255]],
  'seoul-9': [[45,215],[135,215],[205,155],[300,155],[370,95],[465,95],[555,35]],
  'suin-bundang': [[45,245],[165,245],[215,195],[335,195],[385,145],[385,65],[555,65]],
  'incheon-1': [[75,35],[160,35],[160,85],[245,85],[245,145],[330,145],[330,210],[415,210],[480,255],[565,255]],
  'incheon-2': [[60,45],[130,45],[175,90],[245,90],[290,140],[360,140],[405,195],[475,195],[535,245]],
  arex: [[45,225],[135,225],[190,175],[280,175],[335,125],[425,125],[480,75],[560,75]],
  yamanote: [[150,255],[70,210],[70,80],[150,35],[450,35],[530,90],[530,210],[460,255]],
}

export default function RouteMap({ lineId,progress,color,stations,showAllLabels=true,targetIndex,trainVisible=true,trainEntering=false }:{ lineId:string; progress:number; color:string; stations:string[]; showAllLabels?:boolean; targetIndex?:number; trainVisible?:boolean; trainEntering?:boolean }) {
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
