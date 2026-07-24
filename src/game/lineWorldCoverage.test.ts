import { expect,test } from 'vitest'
import { LINES } from '../data/lines'
import { stationInfo } from '../data/stationInfo'
import { dailyStations,getFullLoopRoute,getQuickRoutePairs,getRoute,getStations } from './routes'
import { STATION_SPACING,getLineWorld } from './lineWorld'

const servicesOf=(line:typeof LINES[number])=>line.services?.map(service=>service.id)??[undefined]

test('every quick route on every line builds a usable world',()=>{
  const failures:string[]=[]
  for(const line of LINES)for(const serviceId of servicesOf(line))
    for(const pair of getQuickRoutePairs(line.id,serviceId))for(const route of pair.routes){
      try{
        const world=getLineWorld(line.id,route.stationIds)
        if(world.stationNames.length!==route.stationIds.length)failures.push(`${route.id}: rendered ${world.stationNames.length} of ${route.stationIds.length} stations`)
        for(const [index,distance] of world.stationDistances.entries()){
          const gap=index?Math.abs(distance-world.stationDistances[index-1]!):STATION_SPACING
          if(Math.abs(gap-STATION_SPACING)>1e-6)failures.push(`${route.id}: uneven gap ${gap}`)
          const point=world.pointAt(distance)
          if(!Number.isFinite(point.x)||!Number.isFinite(point.y))failures.push(`${route.id}: non-finite station point`)
        }
      }catch(error){failures.push(`${route.id}: ${(error as Error).message}`)}
    }
  expect(failures).toEqual([])
})

test('every station a player can be asked to type carries sign data',()=>{
  const missing:string[]=[]
  for(const line of LINES){
    for(const serviceId of servicesOf(line))for(const station of getStations(line.id,serviceId)){
      const info=stationInfo(line.id,station)
      if(!info.english||!info.number)missing.push(`${line.id}/${station}`)
    }
    for(const station of dailyStations(line.id,'2026-07-24')){
      const info=stationInfo(line.id,station)
      if(!info.english||!info.number)missing.push(`${line.id}/${station} (random)`)
    }
  }
  expect(missing).toEqual([])
})

const pairFailures=(lineId:string)=>{
  const stations=getStations(lineId),failures:string[]=[]
  for(const from of stations)for(const to of stations){
    if(from===to)continue
    let route
    try{route=getRoute(lineId,from,to)}catch{continue}
    try{
      const world=getLineWorld(lineId,route.stationIds)
      if(world.stationNames[0]!==from||world.stationNames.at(-1)!==to)failures.push(`${lineId} ${from}→${to}: wrong endpoints`)
    }catch(error){failures.push(`${lineId} ${from}→${to}: ${(error as Error).message}`)}
  }
  return failures
}

test.each(['seoul-1','seoul-3','seoul-4','seoul-5','seoul-7','seoul-8','seoul-9','suin-bundang','incheon-1','incheon-2','arex'])(
  'every routable station pair on %s builds a world',lineId=>{expect(pairFailures(lineId)).toEqual([])})

test('a line 6 run that rides the eungam loop round to 응암 builds a world',()=>{
  for(const [from,to] of [['구산','응암'],['연신내','응암'],['독바위','응암'],['불광','구산']] as const){
    const world=getLineWorld('seoul-6',getRoute('seoul-6',from,to).stationIds)
    expect(world.stationNames[0]).toBe(from)
    expect(world.stationNames.at(-1)).toBe(to)
  }
})

// Known limitation: the one-way Eungam loop and the trunk have very different lengths per station, so
// joining them into one world would strand the ring's stations in its first quarter. Such a pair is
// refused in setup instead, which App does by building the world before it starts play.
test('a line 6 run that leaves the eungam loop for the trunk is refused, not mis-drawn',()=>{
  for(const [from,to] of [['구산','신내'],['구산','새절'],['새절','역촌']] as const)
    expect(()=>getLineWorld('seoul-6',getRoute('seoul-6',from,to).stationIds)).toThrow(/Unresolvable run/)
})

test('every loop origin and direction builds a full lap in the right order',()=>{
  const failures:string[]=[]
  for(const [lineId,directions] of [['seoul-2',['clockwise','counterclockwise']],['yamanote',['outer','inner']]] as const)
    for(const direction of directions)for(const origin of getStations(lineId)){
      const route=getFullLoopRoute(lineId,origin,direction)
      try{
        const world=getLineWorld(lineId,route.stationIds)
        if(world.stationNames[0]!==origin)failures.push(`${lineId}/${direction}/${origin}: origin`)
        if(world.stationNames.length!==route.stationIds.length)failures.push(`${lineId}/${direction}/${origin}: station count`)
      }catch(error){failures.push(`${lineId}/${direction}/${origin}: ${(error as Error).message}`)}
    }
  expect(failures).toEqual([])
})

test('every partial loop run builds a world in both directions, including across the seam',()=>{
  const failures:string[]=[]
  for(const [lineId,directions] of [['seoul-2',['clockwise','counterclockwise']],['yamanote',['outer','inner']]] as const){
    const stations=getStations(lineId)
    for(const from of stations)for(const direction of directions){
      const to=stations[(stations.indexOf(from)+7)%stations.length]!
      try{getLineWorld(lineId,getRoute(lineId,from,to,direction).stationIds)}
      catch(error){failures.push(`${lineId}/${direction} ${from}→${to}: ${(error as Error).message}`)}
    }
  }
  expect(failures).toEqual([])
})
