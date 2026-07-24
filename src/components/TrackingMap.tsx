import { useEffect,useMemo,useRef,useState,type CSSProperties } from 'react'
import { stationInfo } from '../data/stationInfo'
import { STATION_SPACING,getLineWorld } from '../game/lineWorld'

// A phone and a desktop get their own camera rather than one compromise: the narrower compact band
// trades stations on screen for labels worth reading. The query is the 640px breakpoint styles.css
// already uses.
const COMPACT_QUERY='(max-width: 640px)'
const DESKTOP_CAMERA={min:540,max:860}
const COMPACT_CAMERA={min:340,max:520}
const DEFAULT_ASPECT=.625

const easeOut=(progress:number)=>1-(1-progress)**3
const smooth=(progress:number)=>progress*progress*(3-2*progress)

// Label geometry, in SVG units, kept beside the font sizes in styles.css that they describe.
const LABEL_KOREAN=15,LABEL_ENGLISH=9
const LABEL_BLOCK=LABEL_KOREAN*.75+LABEL_ENGLISH+3+LABEL_ENGLISH*.25
// Past the 22-wide casing and the 13+4 station circle, with room for the train riding the track.
const LABEL_CLEARANCE=32
const NODE_RADIUS=17
type Box={left:number;right:number;top:number;bottom:number}
const overlaps=(a:Box,b:Box)=>a.left<b.right+4&&b.left<a.right+4&&a.top<b.bottom+2&&b.top<a.bottom+2
const hitsNode=(box:Box,node:{x:number;y:number})=>
  Math.hypot(node.x-Math.min(Math.max(node.x,box.left),box.right),node.y-Math.min(Math.max(node.y,box.top),box.bottom))<NODE_RADIUS
// A label has to read as belonging to its own station, so its centre stays nearer that station than
// any other. Without this a pushed-aside label ends up sitting beside its neighbour instead.
const ownsBox=(box:Box,nodes:readonly {x:number;y:number}[],index:number)=>{
  const x=(box.left+box.right)/2,y=(box.top+box.bottom)/2
  const own=Math.hypot(nodes[index]!.x-x,nodes[index]!.y-y)
  return nodes.every((node,other)=>other===index||Math.hypot(node.x-x,node.y-y)>=own)
}
// Korean glyphs are close to square; Latin averages a little over half its size.
const labelWidth=(korean:string,english:string,shrunk:boolean)=>
  Math.max([...korean].length*LABEL_KOREAN,english.length*(shrunk?LABEL_ENGLISH*.83:LABEL_ENGLISH)*.55)

export default function TrackingMap({lineId,stations,targetIndex,color}:{lineId:string;stations:string[];targetIndex:number;color:string}) {
  const world=useMemo(()=>getLineWorld(lineId,stations),[lineId,stations])
  const [compact,setCompact]=useState(()=>window.matchMedia?.(COMPACT_QUERY).matches??false)
  useEffect(()=>{
    const query=window.matchMedia?.(COMPACT_QUERY)
    if(!query)return
    const sync=()=>setCompact(query.matches)
    sync()
    query.addEventListener('change',sync)
    return()=>query.removeEventListener('change',sync)
  },[])
  // The view is shaped from the element the browser actually laid out, so it fills its box on every
  // screen instead of letterboxing against a ratio guessed here.
  const surface=useRef<SVGSVGElement>(null)
  const [aspect,setAspect]=useState(DEFAULT_ASPECT)
  useEffect(()=>{
    const node=surface.current
    if(!node||typeof ResizeObserver==='undefined')return
    const observer=new ResizeObserver(entries=>{
      const box=entries[0]?.contentRect
      if(box&&box.width>0&&box.height>0)setAspect(box.height/box.width)
    })
    observer.observe(node)
    return()=>observer.disconnect()
  },[])
  const view=compact?COMPACT_CAMERA:DESKTOP_CAMERA
  const targetDistance=world.stationDistances[targetIndex]!,targetWidth=world.cameraWidth(targetIndex,view)
  const [motion,setMotion]=useState(()=>({train:targetDistance,camera:targetDistance,width:targetWidth,moving:false}))
  const motionRef=useRef(motion),frame=useRef<number|undefined>(undefined)
  const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  useEffect(()=>{motionRef.current=motion},[motion])
  // A transfer swaps in a whole new line, so distances measured on the old map mean nothing on the
  // new one. Snap to the new target rather than gliding the train across the fresh map — that glide is
  // what read as a sudden spin through every corner in between.
  const worldKey=`${lineId}|${world.key}`
  const worldRef=useRef(worldKey)
  useEffect(()=>{
    window.cancelAnimationFrame(frame.current!)
    if(worldRef.current!==worldKey){
      worldRef.current=worldKey
      const snap={train:targetDistance,camera:targetDistance,width:targetWidth,moving:false}
      motionRef.current=snap;setMotion(snap);return
    }
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
  },[reducedMotion,targetDistance,targetWidth,worldKey])
  const rendered=reducedMotion?{train:targetDistance,camera:targetDistance,width:targetWidth,moving:false}:motion
  const current=world.stationNames[targetIndex]!,train=world.pointAt(rendered.train),camera=world.pointAt(rendered.camera),height=rendered.width*aspect
  const currentPoint=world.pointAt(targetDistance),currentRadians=currentPoint.angle*Math.PI/180
  const tangent={x:Math.cos(currentRadians),y:Math.sin(currentRadians)},normal={x:-tangent.y,y:tangent.x}
  // A chevron on the track between the current stop and the next one shows which way the train travels.
  // Anchored at the midpoint with pointAt's angle (already turned to face increasing-index travel, so a
  // reversed run points back the way it came); hidden at a terminus where there is no next stop.
  const nextDistance=world.stationDistances[targetIndex+1]
  const heading=nextDistance!==undefined?world.pointAt((targetDistance+nextDistance)/2):undefined
  const haloStyle={'--halo-from-x':`${-normal.x*22}px`,'--halo-from-y':`${-normal.y*22}px`,'--halo-to-x':`${normal.x*22}px`,'--halo-to-y':`${normal.y*22}px`} as CSSProperties
  // Placed once for the whole run rather than per camera frame, so a label never shifts as the camera
  // slides past it. Sides alternate by default; where a bend puts two labels in the same place, the
  // second takes the far side or steps further out until it clears every node and earlier label.
  const labels=useMemo(()=>{
    const nodes=world.stationNames.map((_,index)=>world.pointAt(world.stationDistances[index]!))
    const placed:Box[]=[]
    return world.stationNames.map((name,index)=>{
      const info=stationInfo(lineId,name),point=nodes[index]!
      const radians=point.angle*Math.PI/180
      const width=labelWidth(info.korean,info.english,info.english.length>18)
      const preferred=index%2===0?1:-1
      let fallback
      // Distance is tried before side, so a label takes the near seat on either side before it is
      // pushed outward. Reaching far on one side first is what makes a label look like it belongs to
      // the neighbouring station.
      for(const stretch of [1,1.3,1.7])for(const side of [preferred,-preferred]){
        const away={x:-Math.sin(radians)*side,y:Math.cos(radians)*side}
        // Only the part of the block facing the track is added: a steep segment pushes labels
        // sideways, where the block's height costs nothing.
        const distance=(LABEL_CLEARANCE+LABEL_BLOCK/2*Math.abs(away.y))*stretch
        const x=point.x+away.x*distance,y=point.y+away.y*distance
        // Anchoring the inner edge keeps a long name clear of steep track without guessing its width.
        const anchor:'start'|'end'|'middle'=away.x>.3?'start':away.x<-.3?'end':'middle'
        const left=anchor==='start'?x:anchor==='end'?x-width:x-width/2
        const box={left,right:left+width,top:y-LABEL_BLOCK/2,bottom:y+LABEL_BLOCK/2}
        // The two lines hang below their anchor, so it is raised to centre the block on the offset
        // point; otherwise every label above the track leans back into it.
        const candidate={name,info,point,labelX:x,labelY:y-LABEL_BLOCK/2+LABEL_KOREAN*.75,anchor,index,box,hidden:false}
        fallback??=candidate
        if(!placed.some(other=>overlaps(box,other))&&!nodes.some(node=>hitsNode(box,node))&&ownsBox(box,nodes,index)){
          placed.push(box)
          return candidate
        }
      }
      placed.push(fallback!.box)
      return fallback!
    })
  },[lineId,world])
  return <svg ref={surface} className="route-map tracking-map" data-line={lineId} data-camera-station={current} data-camera-width={rendered.width} data-train-distance={rendered.train} data-motion-state={rendered.moving?'moving':'settled'} viewBox={`${camera.x-rendered.width/2} ${camera.y-height/2} ${rendered.width} ${height}`} role="img" aria-label={`${lineId} 추적 노선도`}>
    <path d={world.pathD} fill="none" stroke="#deddd7" strokeWidth="22" strokeLinecap="round" />
    <path d={world.pathD} fill="none" stroke={color} strokeWidth="13" strokeLinecap="round" />
    {heading&&<g className="route-heading" data-heading-angle={heading.angle} transform={`translate(${heading.x} ${heading.y}) rotate(${heading.angle})`}>
      <path d="M-5 -8 L7 0 L-5 8" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>}
    <circle className="target-ring tracking-target-halo" data-halo-normal={`${normal.x},${normal.y}`} data-route-tangent={`${tangent.x},${tangent.y}`} style={haloStyle} cx={currentPoint.x} cy={currentPoint.y} r="20" fill="white" stroke={color} strokeWidth="4" />
    {labels.map(({name,info,point,labelX,labelY,anchor,index,hidden})=>
      // Paired by index, never by name: a full loop lap legitimately visits the same name twice.
      <g key={index} data-station={name} data-current={index===targetIndex||undefined}>
        <circle cx={point.x} cy={point.y} r="13" fill="white" stroke={color} strokeWidth="4" />
        <text className="node-number" data-long={info.number.length>3||undefined} x={point.x} y={point.y} textAnchor="middle" dominantBaseline="middle">{info.number}</text>
        {!hidden&&<text className="station-label" x={labelX} y={labelY} textAnchor={anchor}><tspan className="station-ko" x={labelX}>{info.korean}</tspan><tspan className="station-en" data-long={info.english.length>18||undefined} x={labelX} dy={LABEL_ENGLISH+3}>{info.english}</tspan></text>}
      </g>)}
    <g className="train tracking-train" transform={`translate(${train.x} ${train.y}) rotate(${train.angle})`}>
      <rect x="-23" y="-14" width="46" height="28" rx="9" fill="white" stroke="#111" strokeWidth="3" />
      <rect x="-14" y="-8" width="10" height="8" rx="2" fill="#20252a" /><rect x="4" y="-8" width="10" height="8" rx="2" fill="#20252a" />
      <path d="M-17 7 H17" stroke={color} strokeWidth="5" />
    </g>
  </svg>
}
