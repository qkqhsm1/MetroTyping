import { useEffect,useMemo,useRef,useState,type CSSProperties } from 'react'
import { LINE_2_STATIONS } from '../data/line2'
import { LINE_2_PATH_D,line2CameraWidth,line2PointAt,line2StationDistance,unwrapLine2Route } from '../game/line2Geometry'

const easeOut=(progress:number)=>1-(1-progress)**3
const smooth=(progress:number)=>progress*progress*(3-2*progress)

export default function Line2TrackingMap({stations,targetIndex,color}:{stations:string[];targetIndex:number;color:string}) {
  const routeDistances=useMemo(()=>unwrapLine2Route(stations),[stations])
  const targetDistance=routeDistances[targetIndex]!,targetWidth=line2CameraWidth(routeDistances,targetIndex)
  const [motion,setMotion]=useState(()=>({train:targetDistance,camera:targetDistance,width:targetWidth,moving:false}))
  const motionRef=useRef(motion),frame=useRef<number|undefined>(undefined)
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useEffect(()=>{motionRef.current=motion},[motion])
  useEffect(()=>{
    window.cancelAnimationFrame(frame.current!)
    if(reducedMotion)return
    const from=motionRef.current,start={value:undefined as number|undefined}
    const stationSpan=Math.abs(targetDistance-from.train)/(Math.abs(routeDistances[1]!-routeDistances[0]!)||1)
    const duration=Math.max(320,Math.min(520,320+stationSpan*70))
    const tick=(timestamp:number)=>{
      start.value??=timestamp
      const progress=Math.min(1,(timestamp-start.value)/duration)
      const next={
        train:from.train+(targetDistance-from.train)*easeOut(progress),
        camera:from.camera+(targetDistance-from.camera)*smooth(progress),
        width:from.width+(targetWidth-from.width)*smooth(progress),
        moving:progress<1,
      }
      motionRef.current=next
      setMotion(next)
      if(progress<1)frame.current=window.requestAnimationFrame(tick)
    }
    if(from.train!==targetDistance||from.camera!==targetDistance||from.width!==targetWidth)frame.current=window.requestAnimationFrame(tick)
    return()=>window.cancelAnimationFrame(frame.current!)
  },[reducedMotion,routeDistances,targetDistance,targetWidth])
  const rendered=reducedMotion?{train:targetDistance,camera:targetDistance,width:targetWidth,moving:false}:motion
  const current=stations[targetIndex]!,train=line2PointAt(rendered.train),camera=line2PointAt(rendered.camera),height=rendered.width*.625
  const currentPoint=line2PointAt(line2StationDistance(current)),currentRadians=currentPoint.angle*Math.PI/180
  const tangent={x:Math.cos(currentRadians),y:Math.sin(currentRadians)},normal={x:-tangent.y,y:tangent.x}
  const haloStyle={'--halo-from-x':`${-normal.x*22}px`,'--halo-from-y':`${-normal.y*22}px`,'--halo-to-x':`${normal.x*22}px`,'--halo-to-y':`${normal.y*22}px`} as CSSProperties
  return <svg className="route-map line2-tracking-map" data-camera-station={current} data-camera-width={rendered.width} data-train-distance={rendered.train} data-motion-state={rendered.moving?'moving':'settled'} viewBox={`${camera.x-rendered.width/2} ${camera.y-height/2} ${rendered.width} ${height}`} role="img" aria-label="서울 2호선 추적 노선도">
    <path d={LINE_2_PATH_D} fill="none" stroke="#deddd7" strokeWidth="22" strokeLinecap="round" />
    <path d={LINE_2_PATH_D} fill="none" stroke={color} strokeWidth="13" strokeLinecap="round" />
    <circle className="target-ring line2-target-halo" data-halo-normal={`${normal.x},${normal.y}`} data-route-tangent={`${tangent.x},${tangent.y}`} style={haloStyle} cx={currentPoint.x} cy={currentPoint.y} r="20" fill="white" stroke={color} strokeWidth="4" />
    {LINE_2_STATIONS.map((station,index)=>{
      const point=line2PointAt(line2StationDistance(station.korean)),isCurrent=station.korean===current
      const radians=point.angle*Math.PI/180,side=index%2===0?1:-1,offset=30+(index%3)*9
      const labelX=point.x-Math.sin(radians)*offset*side,labelY=point.y+Math.cos(radians)*offset*side
      return <g key={station.korean} data-station={station.korean} data-current={isCurrent||undefined}>
        <circle cx={point.x} cy={point.y} r="13" fill="white" stroke={color} strokeWidth="4" />
        <text className="line2-node-number" x={point.x} y={point.y} textAnchor="middle" dominantBaseline="middle">{station.number}</text>
        <text className="line2-station-label" x={labelX} y={labelY} textAnchor="middle"><tspan className="line2-station-ko" x={labelX}>{station.korean}</tspan><tspan className="line2-station-en" x={labelX} dy="13">{station.english}</tspan></text>
      </g>
    })}
    <g className="train line2-train" transform={`translate(${train.x} ${train.y}) rotate(${train.angle})`}>
      <rect x="-23" y="-14" width="46" height="28" rx="9" fill="white" stroke="#111" strokeWidth="3" />
      <rect x="-14" y="-8" width="10" height="8" rx="2" fill="#20252a" /><rect x="4" y="-8" width="10" height="8" rx="2" fill="#20252a" />
      <path d="M-17 7 H17" stroke={color} strokeWidth="5" />
    </g>
  </svg>
}
