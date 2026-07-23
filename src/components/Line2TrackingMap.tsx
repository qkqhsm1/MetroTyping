import { useEffect,useMemo,useRef,useState } from 'react'
import { LINE_2_BY_NAME,LINE_2_STATIONS } from '../data/line2'

type Point={x:number;y:number}
type Cubic=[Point,Point,Point,Point]

// Official Seoul map's Line 2 loop in its native vector coordinate system.
const LOOP_D='M 0.000360661 0.00123244 C 0.000360661 -289.884882 -235.00093 -524.886173 -524.887044 -524.886173 C -814.773158 -524.886173 -1049.770542 -289.884882 -1049.770542 0.00123244 C -1049.770542 279.821612 -830.809561 508.500559 -554.873242 524.044616 C -544.948178 524.60339 -534.948871 524.88473 -524.887044 524.88473 C -477.94618 524.88473 -432.447186 518.726501 -389.148117 507.164192 C -165.056581 447.34419 0.000360661 242.946482 0.000360661 0.00123244 Z'
const curves:Cubic[]=[
  [{x:0,y:0},{x:0,y:-289.885},{x:-235.001,y:-524.886},{x:-524.887,y:-524.886}],
  [{x:-524.887,y:-524.886},{x:-814.773,y:-524.886},{x:-1049.771,y:-289.885},{x:-1049.771,y:0}],
  [{x:-1049.771,y:0},{x:-1049.771,y:279.822},{x:-830.81,y:508.501},{x:-554.873,y:524.045}],
  [{x:-554.873,y:524.045},{x:-432.447,y:518.727},{x:-165.057,y:447.344},{x:0,y:0}],
]
const cubic=(curve:Cubic,t:number):Point=>{
  const u=1-t,[a,b,c,d]=curve
  return {x:u**3*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t**3*d.x,y:u**3*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t**3*d.y}
}
const stationPhase=(name:string)=>{
  const index=LINE_2_STATIONS.findIndex(station=>station.korean===name)
  return (0.7-index/LINE_2_STATIONS.length+1)%1
}
const pointAtPhase=(phase:number)=>{
  const loop=(phase%1+1)%1,part=loop*4,segment=Math.floor(part)%4
  return cubic(curves[segment]!,part-Math.floor(part))
}
const stationPoint=(name:string)=>pointAtPhase(stationPhase(name))
const routePhases=(stations:string[])=>stations.reduce<number[]>((phases,name,index)=>{
  const phase=stationPhase(name)
  if(index===0)return [phase]
  const previousCanonical=stationPhase(stations[index-1]!),delta=((phase-previousCanonical+.5)%1+1)%1-.5
  return [...phases,phases[index-1]!+delta]
},[])
const easeOut=(progress:number)=>1-(1-progress)**3
const smooth=(progress:number)=>progress*progress*(3-2*progress)

export default function Line2TrackingMap({stations,targetIndex,color}:{stations:string[];targetIndex:number;color:string}) {
  const phases=useMemo(()=>routePhases(stations),[stations]),targetPhase=phases[targetIndex]!
  const [motion,setMotion]=useState(()=>({train:targetPhase,camera:targetPhase,moving:false}))
  const motionRef=useRef(motion),frame=useRef<number|undefined>(undefined)
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useEffect(()=>{motionRef.current=motion},[motion])
  useEffect(()=>{
    window.cancelAnimationFrame(frame.current!)
    if(reducedMotion)return
    const from=motionRef.current,start={value:undefined as number|undefined}
    const tick=(timestamp:number)=>{
      start.value??=timestamp
      const progress=Math.min(1,(timestamp-start.value)/220)
      const next={train:from.train+(targetPhase-from.train)*easeOut(progress),camera:from.camera+(targetPhase-from.camera)*smooth(progress),moving:progress<1}
      motionRef.current=next
      setMotion(next)
      if(progress<1)frame.current=window.requestAnimationFrame(tick)
    }
    if(from.train!==targetPhase||from.camera!==targetPhase)frame.current=window.requestAnimationFrame(tick)
    return()=>window.cancelAnimationFrame(frame.current!)
  },[reducedMotion,targetPhase])
  const rendered=reducedMotion?{train:targetPhase,camera:targetPhase,moving:false}:motion
  const current=stations[targetIndex]!,train=pointAtPhase(rendered.train),camera=pointAtPhase(rendered.camera),visible=stations.slice(Math.max(0,targetIndex-1),targetIndex+3)
  return <svg className="route-map line2-tracking-map" data-camera-station={current} data-motion-state={rendered.moving?'moving':'settled'} viewBox={`${camera.x-215} ${camera.y-135} 430 270`} role="img" aria-label="서울 2호선 추적 노선도">
    <path d={LOOP_D} fill="none" stroke="#deddd7" strokeWidth="22" strokeLinecap="round" />
    <path d={LOOP_D} fill="none" stroke={color} strokeWidth="13" strokeLinecap="round" />
    {visible.map(name=>{
      const point=stationPoint(name),station=LINE_2_BY_NAME.get(name),isCurrent=name===current
      return <g key={name} data-station={name} data-current={isCurrent||undefined}>
        {isCurrent&&<circle className="target-ring" cx={point.x} cy={point.y} r="18" fill="white" stroke={color} strokeWidth="4" />}
        <circle cx={point.x} cy={point.y} r="9" fill="white" stroke={color} strokeWidth="5" />
        <g className="line2-station-label" transform={`translate(${point.x} ${point.y-22})`}>
          <text textAnchor="middle"><tspan className="line2-station-ko" x="0">{name}</tspan><tspan className="line2-station-en" x="0" dy="15">{station?.english}</tspan></text>
          <g className="line2-station-number" transform="translate(0 31)"><circle r="13" fill="white" stroke={color} strokeWidth="3" /><text y="4" textAnchor="middle">{station?.number}</text></g>
        </g>
      </g>
    })}
    <g className="train line2-train" transform={`translate(${train.x} ${train.y})`}>
      <rect x="-23" y="-14" width="46" height="28" rx="9" fill="white" stroke="#111" strokeWidth="3" />
      <rect x="-14" y="-8" width="10" height="8" rx="2" fill="#20252a" /><rect x="4" y="-8" width="10" height="8" rx="2" fill="#20252a" />
      <path d="M-17 7 H17" stroke={color} strokeWidth="5" />
    </g>
  </svg>
}
