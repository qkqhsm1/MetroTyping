import { expect,test } from 'vitest'
import { getRoute,getFullLoopRoute } from './routes'
import { getLineWorld,STATION_SPACING } from './lineWorld'

const spacings=(distances:number[])=>distances.slice(1).map((distance,index)=>Math.abs(distance-distances[index]!))

test('every station on a line is one constant arc length apart',()=>{
  const stations=getRoute('seoul-3','대화','오금').stationIds
  const world=getLineWorld('seoul-3',stations)
  for(const spacing of spacings(world.stationDistances))expect(spacing).toBeCloseTo(STATION_SPACING,6)
})

test('spacing does not jump where line 1 legs join at guro',()=>{
  const stations=getRoute('seoul-1','인천','연천').stationIds
  const world=getLineWorld('seoul-1',stations)
  const gaps=spacings(world.stationDistances)
  expect(Math.max(...gaps)-Math.min(...gaps)).toBeLessThan(1e-6)
  expect(world.stationNames).toHaveLength(stations.length)
})

test('a partial run is clipped to its own stations but keeps whole-line spacing',()=>{
  const partial=getRoute('seoul-3','경복궁','교대').stationIds
  const world=getLineWorld('seoul-3',partial)
  expect(world.stationNames).toEqual(partial)
  for(const spacing of spacings(world.stationDistances))expect(spacing).toBeCloseTo(STATION_SPACING,6)
})

test('the rendered path starts and ends on the run endpoints',()=>{
  const stations=getRoute('incheon-2','검단오류','운연').stationIds
  const world=getLineWorld('incheon-2',stations)
  const first=world.pointAt(world.stationDistances[0]!)
  const last=world.pointAt(world.stationDistances.at(-1)!)
  const numbers=world.pathD.match(/-?\d+(\.\d+)?/g)!.map(Number)
  expect(Math.hypot(numbers[0]!-first.x,numbers[1]!-first.y)).toBeLessThan(0.5)
  expect(Math.hypot(numbers.at(-2)!-last.x,numbers.at(-1)!-last.y)).toBeLessThan(0.5)
})

test('station points lie on the rendered path',()=>{
  const stations=getRoute('seoul-7','장암','석남').stationIds
  const world=getLineWorld('seoul-7',stations)
  for(const distance of world.stationDistances){
    const point=world.pointAt(distance)
    expect(Number.isFinite(point.x)&&Number.isFinite(point.y)).toBe(true)
  }
})

test.each([['clockwise'],['counterclockwise']])('a loop run unwraps monotonically (%s)',direction=>{
  const stations=getFullLoopRoute('seoul-2','신도림',direction).stationIds
  const world=getLineWorld('seoul-2',stations)
  expect(world.loop).toBe(true)
  for(const spacing of spacings(world.stationDistances))expect(spacing).toBeCloseTo(STATION_SPACING,6)
  // Travel runs backwards around the ring in one of the two directions, so the span is signed.
  const span=world.stationDistances.at(-1)!-world.stationDistances[0]!
  expect(Math.abs(span)).toBeCloseTo(STATION_SPACING*(stations.length-1),6)
  expect(Math.sign(span)).toBe(direction==='clockwise'?1:-1)
})

test.each([[{min:360,max:620}],[{min:240,max:400}]])('camera width stays inside the caller band %j',limits=>{
  const stations=getRoute('suin-bundang','인천','청량리').stationIds
  const world=getLineWorld('suin-bundang',stations)
  for(let index=0;index<world.stationNames.length;index++){
    const width=world.cameraWidth(index,limits)
    expect(width).toBeGreaterThanOrEqual(limits.min)
    expect(width).toBeLessThanOrEqual(limits.max)
  }
})

test('a narrower band shows fewer stations than a wide one',()=>{
  const world=getLineWorld('suin-bundang',getRoute('suin-bundang','인천','청량리').stationIds)
  expect(world.cameraWidth(6,{min:240,max:400})).toBeLessThan(world.cameraWidth(6,{min:360,max:620}))
})

test('a single-station run does not divide by zero',()=>{
  const world=getLineWorld('arex',['서울역'])
  expect(world.stationDistances).toHaveLength(1)
  expect(Number.isFinite(world.cameraWidth(0,{min:360,max:620}))).toBe(true)
})

// The spacing tests above hold for any arithmetic distance table; these two pin the geometry itself.
test('the polyline is scaled once so its far end lands on the last station of the line',()=>{
  const stations=getRoute('seoul-3','대화','오금').stationIds
  const world=getLineWorld('seoul-3',stations)
  const end=world.pointAt(world.stationDistances.at(-1)!)
  const past=world.pointAt(world.stationDistances.at(-1)!+STATION_SPACING)
  expect(Math.hypot(past.x-end.x,past.y-end.y)).toBeLessThan(1e-6)
})

test('the angle at the world origin follows the track',()=>{
  const world=getLineWorld('seoul-7',getRoute('seoul-7','장암','석남').stationIds)
  const start=world.pointAt(0),ahead=world.pointAt(1)
  expect(start.angle).toBeCloseTo(Math.atan2(ahead.y-start.y,ahead.x-start.x)*180/Math.PI,3)
  expect(start.angle).not.toBe(0)
})

test('a loop station keeps one seat on the ring whichever way the run travels',()=>{
  const clockwise=getLineWorld('seoul-2',getFullLoopRoute('seoul-2','신도림','clockwise').stationIds)
  const counter=getLineWorld('seoul-2',getFullLoopRoute('seoul-2','신도림','counterclockwise').stationIds)
  const seatOf=(world:ReturnType<typeof getLineWorld>,name:string)=>world.pointAt(world.stationDistances[world.stationNames.indexOf(name)]!)
  for(const name of ['신도림','강남','시청','합정']){
    const left=seatOf(clockwise,name),right=seatOf(counter,name)
    expect(Math.hypot(left.x-right.x,left.y-right.y)).toBeLessThan(1e-6)
  }
})

test('choosing the opposite loop direction reverses travel around the ring',()=>{
  const clockwise=getLineWorld('seoul-2',getFullLoopRoute('seoul-2','신도림','clockwise').stationIds)
  const counter=getLineWorld('seoul-2',getFullLoopRoute('seoul-2','신도림','counterclockwise').stationIds)
  expect(clockwise.stationDistances[1]!-clockwise.stationDistances[0]!).toBeCloseTo(STATION_SPACING,6)
  expect(counter.stationDistances[1]!-counter.stationDistances[0]!).toBeCloseTo(-STATION_SPACING,6)
  const heading=(world:ReturnType<typeof getLineWorld>)=>world.pointAt(world.stationDistances[0]!).angle
  const apart=Math.abs(((heading(clockwise)-heading(counter))%360+540)%360-180)
  expect(apart).toBeGreaterThan(179)
})
