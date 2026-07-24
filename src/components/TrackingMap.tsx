import { useEffect,useMemo,useRef,useState,type CSSProperties } from 'react'
import { stationInfo } from '../data/stationInfo'
import { STATION_SPACING,getLineWorld } from '../game/lineWorld'

const easeOut=(progress:number)=>1-(1-progress)**3
const smooth=(progress:number)=>progress*progress*(3-2*progress)

// Label geometry, in SVG units, kept beside the font sizes in styles.css that they describe.
const LABEL_KOREAN=15,LABEL_ENGLISH=9
const LABEL_BLOCK=LABEL_KOREAN*.75+LABEL_ENGLISH+3+LABEL_ENGLISH*.25
// Past the 22-wide casing and the 13+4 station circle, with room for the train riding the track.
const LABEL_CLEARANCE=32

export default function TrackingMap({lineId,stations,targetIndex,color}:{lineId:string;stations:string[];targetIndex:number;color:string}) {
  const world=useMemo(()=>getLineWorld(lineId,stations),[lineId,stations])
  const targetDistance=world.stationDistances[targetIndex]!,targetWidth=world.cameraWidth(targetIndex)
  const [motion,setMotion]=useState(()=>({train:targetDistance,camera:targetDistance,width:targetWidth,moving:false}))
  const motionRef=useRef(motion),frame=useRef<number|undefined>(undefined)
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useEffect(()=>{motionRef.current=motion},[motion])
  useEffect(()=>{
    window.cancelAnimationFrame(frame.current!)
    if(reducedMotion)return
    const from=motionRef.current,start={value:undefined as number|undefined}
    // Distances are one STATION_SPACING apart whichever way the run travels, so this stays a station
    // count for a backwards loop run, where the distances themselves decrease.
    const stationSpan=Math.abs(targetDistance-from.train)/STATION_SPACING
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
  },[reducedMotion,targetDistance,targetWidth])
  const rendered=reducedMotion?{train:targetDistance,camera:targetDistance,width:targetWidth,moving:false}:motion
  const current=world.stationNames[targetIndex]!,train=world.pointAt(rendered.train),camera=world.pointAt(rendered.camera),height=rendered.width*.625
  const currentPoint=world.pointAt(targetDistance),currentRadians=currentPoint.angle*Math.PI/180
  const tangent={x:Math.cos(currentRadians),y:Math.sin(currentRadians)},normal={x:-tangent.y,y:tangent.x}
  const haloStyle={'--halo-from-x':`${-normal.x*22}px`,'--halo-from-y':`${-normal.y*22}px`,'--halo-to-x':`${normal.x*22}px`,'--halo-to-y':`${normal.y*22}px`} as CSSProperties
  return <svg className="route-map tracking-map" data-camera-station={current} data-camera-width={rendered.width} data-train-distance={rendered.train} data-motion-state={rendered.moving?'moving':'settled'} viewBox={`${camera.x-rendered.width/2} ${camera.y-height/2} ${rendered.width} ${height}`} role="img" aria-label={`${lineId} 추적 노선도`}>
    <path d={world.pathD} fill="none" stroke="#deddd7" strokeWidth="22" strokeLinecap="round" />
    <path d={world.pathD} fill="none" stroke={color} strokeWidth="13" strokeLinecap="round" />
    <circle className="target-ring tracking-target-halo" data-halo-normal={`${normal.x},${normal.y}`} data-route-tangent={`${tangent.x},${tangent.y}`} style={haloStyle} cx={currentPoint.x} cy={currentPoint.y} r="20" fill="white" stroke={color} strokeWidth="4" />
    {world.stationNames.map((name,index)=>{
      // Paired by index, never by name: a full loop lap legitimately visits the same name twice.
      const info=stationInfo(lineId,name),point=world.pointAt(world.stationDistances[index]!)
      const radians=point.angle*Math.PI/180,side=index%2===0?1:-1
      const away={x:-Math.sin(radians)*side,y:Math.cos(radians)*side}
      // One clearance for every label, so the column reads evenly instead of stepping in and out.
      // Only the part of the block that actually points at the track is added: a steep segment pushes
      // labels sideways, where the block's height costs nothing.
      const distance=LABEL_CLEARANCE+LABEL_BLOCK/2*Math.abs(away.y)
      const labelX=point.x+away.x*distance
      // The two lines hang below their anchor, so the anchor is raised to centre the block on the
      // offset point; otherwise every label above the track leans back into it.
      const labelY=point.y+away.y*distance-LABEL_BLOCK/2+LABEL_KOREAN*.75
      // Anchoring the inner edge keeps a long name clear of a steep track without guessing its width.
      const anchor=away.x>.3?'start':away.x<-.3?'end':'middle'
      return <g key={index} data-station={name} data-current={index===targetIndex||undefined}>
        <circle cx={point.x} cy={point.y} r="13" fill="white" stroke={color} strokeWidth="4" />
        <text className="node-number" data-long={info.number.length>3||undefined} x={point.x} y={point.y} textAnchor="middle" dominantBaseline="middle">{info.number}</text>
        <text className="station-label" x={labelX} y={labelY} textAnchor={anchor}><tspan className="station-ko" x={labelX}>{info.korean}</tspan><tspan className="station-en" data-long={info.english.length>18||undefined} x={labelX} dy={LABEL_ENGLISH+3}>{info.english}</tspan></text>
      </g>
    })}
    <g className="train tracking-train" transform={`translate(${train.x} ${train.y}) rotate(${train.angle})`}>
      <rect x="-23" y="-14" width="46" height="28" rx="9" fill="white" stroke="#111" strokeWidth="3" />
      <rect x="-14" y="-8" width="10" height="8" rx="2" fill="#20252a" /><rect x="4" y="-8" width="10" height="8" rx="2" fill="#20252a" />
      <path d="M-17 7 H17" stroke={color} strokeWidth="5" />
    </g>
  </svg>
}
