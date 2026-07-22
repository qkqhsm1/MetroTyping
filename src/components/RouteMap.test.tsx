import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { Point } from '../game/geometry'
import { getFullLoopRoute, getRoute } from '../game/routes'
import RouteMap from './RouteMap'

const parsePoints = (value: string): Point[] => value.split(' ').map(pair => {
  const [x,y] = pair.split(',').map(Number)
  return [x!,y!]
})
const distanceToSegment = ([x,y]: Point, [x1,y1]: Point, [x2,y2]: Point) => {
  const dx=x2-x1,dy=y2-y1,lengthSquared=dx*dx+dy*dy
  const t=lengthSquared?Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/lengthSquared)):0
  return Math.hypot(x-(x1+t*dx),y-(y1+t*dy))
}

test('uses line-specific geometry and normalized progress on one coordinate system', () => {
  const { container, rerender } = render(<RouteMap lineId="seoul-1" stations={['구로','인천']} color="#0052A4" progress={0.5} />)
  const first = container.querySelector('polyline')?.getAttribute('points')
  expect(container.querySelectorAll('polyline')[1]).toHaveAttribute('stroke-dasharray', '0.5 1')
  rerender(<RouteMap lineId="seoul-2" stations={['신도림','문래']} color="#00A84D" progress={0.5} />)
  expect(container.querySelector('polyline')?.getAttribute('points')).not.toBe(first)
})

test('labels every station on the route', () => {
  const stations = ['신도림','문래','영등포구청','당산']
  const { container } = render(<RouteMap lineId="seoul-2" stations={stations} color="#00A84D" progress={0.25} />)
  expect([...container.querySelectorAll('text')].map(node => node.textContent)).toEqual(stations)
})

test('clips a Line 2 window to its first and last visible stations', () => {
  const full=getFullLoopRoute('seoul-2','신도림','clockwise').stationIds
  const visible=full.slice(0,8)
  const {container}=render(<RouteMap lineId="seoul-2" stations={visible} geometryStations={full} routeStationCount={full.length} segmentStart={0} color="#00A84D" progress={0} />)
  const route=parsePoints(container.querySelector('polyline[data-route]')!.getAttribute('points')!)
  const stations=[...container.querySelectorAll('circle:not(.target-ring)')]
  expect(route[0]).toEqual([Number(stations[0]!.getAttribute('cx')),Number(stations[0]!.getAttribute('cy'))])
  expect(route.at(-1)).toEqual([Number(stations.at(-1)!.getAttribute('cx')),Number(stations.at(-1)!.getAttribute('cy'))])
  expect(stations.map(station=>Number(station.getAttribute('cx')))).toEqual([...stations].map(station=>Number(station.getAttribute('cx'))).sort((a,b)=>a-b))
  expect([...container.querySelectorAll('text')].map(node=>node.textContent)).toEqual(visible)
})

test('places the first visible Incheon-origin station to the left of the next stations', () => {
  const full=getRoute('seoul-1','인천','연천').stationIds
  const visible=full.slice(0,8)
  const {container}=render(<RouteMap lineId="seoul-1" stations={visible} geometryStations={full} routeStationCount={full.length} segmentStart={0} color="#0052A4" progress={0} />)
  const stations=[...container.querySelectorAll('circle:not(.target-ring)')]
  expect(Number(stations[0]!.getAttribute('cx'))).toBeLessThan(Number(stations.at(-1)!.getAttribute('cx')))
})

test('anchors the front of the train at the current station', () => {
  const { container } = render(<RouteMap lineId="seoul-2" stations={['신도림','문래']} color="#00A84D" progress={0} />)
  expect(container.querySelector('.train-body')).toHaveAttribute('transform', 'translate(-22 0)')
})

test('renders train visibility and entrance state from props', () => {
  const props={lineId:'seoul-2',stations:['신도림','문래'],color:'#00A84D',progress:0}
  const { container,rerender }=render(<RouteMap {...props} trainVisible={false} />)
  expect(container.querySelector('.train')).not.toBeInTheDocument()
  rerender(<RouteMap {...props} trainVisible trainEntering />)
  expect(container.querySelector('.train')).toHaveClass('train-entering')
  expect(container.querySelector('.train-light')).toHaveAttribute('stroke','#00A84D')
  expect(container.querySelector('.train-light')).toHaveAttribute('stroke-width','3')
  expect(container.querySelector('.train-light')).toHaveAttribute('stroke-linecap','round')
})

test.each(['seoul-3', 'suin-bundang'])('%s uses distinct focused geometry with sampled stations on its path', lineId => {
  const stations = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const { container, rerender } = render(<RouteMap lineId={lineId} stations={stations} color="#f58220" progress={0.5} />)
  const pointsValue = container.querySelector('polyline')!.getAttribute('points')!
  const points = parsePoints(pointsValue)

  expect([...container.querySelectorAll('text')].map(node => node.textContent)).toEqual(stations)
  for (const station of container.querySelectorAll('g:not(.train) > circle:not(.target-ring)')) {
    const point: Point = [Number(station.getAttribute('cx')), Number(station.getAttribute('cy'))]
    expect(Math.min(...points.slice(1).map((end,index)=>distanceToSegment(point,points[index]!,end)))).toBeLessThan(0.01)
  }

  rerender(<RouteMap lineId="seoul-2" stations={stations} color="#00A84D" progress={0.5} />)
  expect(container.querySelector('polyline')).not.toHaveAttribute('points', pointsValue)
})

const topologyCases:Array<{key:string;lineId:string;stations:string[];endpoints:[Point,Point];anchors:Point[];context?:string}> = [
  { key:'seoul-4', lineId:'seoul-4', stations:['진접','오이도'], endpoints:[[70,35],[530,250]], anchors:[[70,35],[530,250]] },
  { key:'seoul-5-hanam', lineId:'seoul-5', stations:['강동','길동','하남검단산'], endpoints:[[45,145],[555,65]], anchors:[[45,145],[300.840553,105],[555,65]] },
  { key:'seoul-5-macheon', lineId:'seoul-5', stations:['강동','둔촌동','마천'], endpoints:[[45,145],[555,250]], anchors:[[45,145],[324.345943,105],[555,250]] },
  { key:'seoul-6-trunk', lineId:'seoul-6', stations:['응암','새절','신내'], endpoints:[[45,235],[555,55]], anchors:[[45,235],[292.660318,125],[555,55]] },
  { key:'seoul-6-loop', lineId:'seoul-6', stations:['응암','역촌','불광','독바위','연신내','구산'], endpoints:[[300,250],[365,210]], anchors:[[300,250],[158.003203,221.503603],[109.932436,102.920412],[224.387228,36.757448],[358.804666,81.802722],[365,210]], context:'365,210 300,250' },
  { key:'seoul-7', lineId:'seoul-7', stations:['장암','석남'], endpoints:[[65,35],[535,250]], anchors:[[65,35],[535,250]] },
  { key:'seoul-8', lineId:'seoul-8', stations:['별내','모란'], endpoints:[[80,35],[520,255]], anchors:[[80,35],[520,255]] },
  { key:'seoul-9', lineId:'seoul-9', stations:['개화','중앙보훈병원'], endpoints:[[45,225],[555,45]], anchors:[[45,225],[555,45]] },
]

test.each(topologyCases)('$key uses source-guided anchors with stations and train on its route', ({key,lineId,stations,endpoints,anchors,context}) => {
  const { container } = render(<RouteMap lineId={lineId} stations={[...stations]} color="#333" progress={0.5} />)
  const route=container.querySelector<SVGPolylineElement>('polyline[data-route]')!
  const points=parsePoints(route.getAttribute('points')!)
  expect(route).toHaveAttribute('data-geometry',key)
  expect(points[0]).toEqual(endpoints[0])
  expect(points.at(-1)).toEqual(endpoints[1])
  if(context) expect(container.querySelector('polyline[data-context]')).toHaveAttribute('points',context)

  for (const [index,station] of [...container.querySelectorAll('g:not(.train) > circle:not(.target-ring)')].entries()) {
    const point: Point = [Number(station.getAttribute('cx')), Number(station.getAttribute('cy'))]
    expect(Math.hypot(point[0]-anchors[index]![0],point[1]-anchors[index]![1])).toBeLessThan(0.001)
    expect(Math.min(...points.slice(1).map((end,index)=>distanceToSegment(point,points[index]!,end)))).toBeLessThan(0.01)
  }
  const transform=container.querySelector('.train')!.getAttribute('style')!
  const [,x,y]=transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)!
  const train:Point=[Number(x),Number(y)]
  expect(Math.min(...points.slice(1).map((end,index)=>distanceToSegment(train,points[index]!,end)))).toBeLessThan(0.01)
})

test('Line 5 branches share the Gangdong approach and then diverge', () => {
  const { container,rerender }=render(<RouteMap lineId="seoul-5" stations={['강동','길동','하남검단산']} color="#996CAC" progress={0} />)
  const hanam=parsePoints(container.querySelector('polyline[data-route]')!.getAttribute('points')!)
  rerender(<RouteMap lineId="seoul-5" stations={['강동','둔촌동','마천']} color="#996CAC" progress={0} />)
  const macheon=parsePoints(container.querySelector('polyline[data-route]')!.getAttribute('points')!)
  expect(hanam.slice(0,4)).toEqual(macheon.slice(0,4))
  expect(hanam.slice(4)).not.toEqual(macheon.slice(4))
})

test.each([
  {name:'forward Hanam after 길동 leaves',full:['강동','길동','미사','하남풍산','하남검단산'],visible:['미사','하남풍산','하남검단산'],key:'seoul-5-hanam'},
  {name:'forward Macheon after 둔촌동 leaves',full:['강동','둔촌동','올림픽공원','방이','오금','마천'],visible:['올림픽공원','방이','오금','마천'],key:'seoul-5-macheon'},
  {name:'reverse Hanam before 길동 enters',full:['하남검단산','하남풍산','미사','길동','강동'],visible:['하남검단산','하남풍산','미사'],key:'seoul-5-hanam'},
  {name:'reverse Macheon before 둔촌동 enters',full:['마천','오금','방이','올림픽공원','둔촌동','강동'],visible:['마천','오금','방이','올림픽공원'],key:'seoul-5-macheon'},
])('keeps $name branch identity outside the visible window', ({full,visible,key}) => {
  const {container}=render(<RouteMap lineId="seoul-5" stations={visible} geometryStations={full} color="#996CAC" progress={0} />)
  expect(container.querySelector('polyline[data-route]')).toHaveAttribute('data-geometry',key)
  expect(container.querySelectorAll('.route-map text')).toHaveLength(visible.length)
})

test.each([
  {name:'first forward',full:['방화','길동','하남검단산'],start:0,expectedStart:'45,145',expectedEnd:'122.22809,145'},
  {name:'later forward',full:['방화','길동','하남검단산'],start:35,expectedStart:'414.003839,74.140664',expectedEnd:'488.804494,65'},
  {name:'first reverse',full:['하남검단산','하남시청','길동','방화'],start:0,expectedStart:'555,65',expectedEnd:'477.77191,65'},
  {name:'later reverse',full:['하남검단산','하남시청','길동','방화'],start:35,expectedStart:'184.290482,126.510361',expectedEnd:'111.195506,145'},
])('derives the $name focused window from independent full-route anchors', ({full,start,expectedStart,expectedEnd}) => {
  const visible=Array.from({length:8},(_,index)=>`S${start+index}`)
  const {container}=render(<RouteMap lineId="seoul-5" stations={visible} geometryStations={full} routeStationCount={49} segmentStart={start} color="#996CAC" progress={0.5} />)
  const route=container.querySelector('polyline[data-route]')!
  expect(route).toHaveAttribute('data-global-start',expectedStart)
  expect(route).toHaveAttribute('data-global-end',expectedEnd)
  expect(route.getAttribute('points')).not.toBe(`${expectedStart} ${expectedEnd}`)
  expect(container.querySelectorAll('.route-map text')).toHaveLength(8)
  const points=parsePoints(route.getAttribute('points')!)
  const transform=container.querySelector('.train')!.getAttribute('style')!
  const [,x,y]=transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)!
  const train:Point=[Number(x),Number(y)]
  expect(Math.min(...points.slice(1).map((end,index)=>distanceToSegment(train,points[index]!,end)))).toBeLessThan(0.01)
})

test('Line 6 loop has a directed closure distinct from the open trunk', () => {
  const { container,rerender }=render(<RouteMap lineId="seoul-6" stations={['응암','역촌','불광','독바위','연신내','구산']} color="#A9431E" progress={0} />)
  expect(container.querySelector('polyline[data-context]')).toHaveAttribute('data-directed-closure','true')
  rerender(<RouteMap lineId="seoul-6" stations={['응암','새절','신내']} color="#A9431E" progress={0} />)
  expect(container.querySelector('polyline[data-context]')).not.toBeInTheDocument()
})

const directionCases = [
  { name:'Line 9 reverse mid-line', lineId:'seoul-9', stations:getRoute('seoul-9','선정릉','여의도').stationIds, expectedStart:'213.657031,165' },
  { name:'Line 5 Hanam reverse mid-line', lineId:'seoul-5', stations:getRoute('seoul-5','미사','강동').stationIds, expectedStart:'555,65' },
  { name:'Line 6 one-way loop', lineId:'seoul-6', stations:['응암','역촌','불광','독바위','연신내','구산'], expectedStart:'300,250' },
] as const

test.each(directionCases)('$name resolves geometry direction from official station adjacency', ({lineId,stations,expectedStart}) => {
  const segmentStart=stations.length>8?8:0
  const visible=stations.slice(segmentStart,segmentStart+8)
  const {container}=render(<RouteMap lineId={lineId} stations={visible} geometryStations={[...stations]} routeStationCount={stations.length} segmentStart={segmentStart} color="#333" progress={0.5} />)
  const route=container.querySelector<SVGPolylineElement>('polyline[data-route]')!
  expect(route).toHaveAttribute('data-global-start',expectedStart)
  expect(container.querySelectorAll('.route-map text')).toHaveLength(Math.min(8,stations.length-segmentStart))
  const points=parsePoints(route.getAttribute('points')!)
  const transform=container.querySelector('.train')!.getAttribute('style')!
  const [,x,y]=transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)!
  const train:Point=[Number(x),Number(y)]
  expect(Math.min(...points.slice(1).map((end,index)=>distanceToSegment(train,points[index]!,end)))).toBeLessThan(0.01)
})

const hanamToMacheon=getRoute('seoul-5','하남검단산','마천').stationIds
const macheonToHanam=getRoute('seoul-5','마천','하남검단산').stationIds
const crossBranchCases = [
  {name:'Hanam to Macheon first',stations:hanamToMacheon,start:0,key:'seoul-5-hanam-macheon',globalStart:'555,65',globalEnd:'374.698451,96.600885'},
  {name:'Hanam-side later window',stations:hanamToMacheon,start:3,key:'seoul-5-hanam-macheon',globalStart:'474.131306,65',globalEnd:'397.928991,156.475059'},
  {name:'Macheon-side later window',stations:hanamToMacheon,start:11,key:'seoul-5-hanam-macheon',globalStart:'413.919401,178.17633',globalEnd:'555,250'},
  {name:'Macheon to Hanam first',stations:macheonToHanam,start:0,key:'seoul-5-macheon-hanam',globalStart:'555,250',globalEnd:'397.928991,156.475059'},
  {name:'reverse Hanam-side later window',stations:macheonToHanam,start:10,key:'seoul-5-macheon-hanam',globalStart:'374.698451,96.600885',globalEnd:'555,65'},
] as const

test.each(crossBranchCases)('$name keeps both Line 5 legs in focused geometry', ({stations,start,key,globalStart,globalEnd}) => {
  const visible=stations.slice(start,start+8)
  const {container}=render(<RouteMap lineId="seoul-5" stations={visible} geometryStations={[...stations]} routeStationCount={stations.length} segmentStart={start} color="#996CAC" progress={0.5} />)
  const route=container.querySelector<SVGPolylineElement>('polyline[data-route]')!
  expect(route).toHaveAttribute('data-geometry',key)
  expect(route).toHaveAttribute('data-global-start',globalStart)
  expect(route).toHaveAttribute('data-global-end',globalEnd)
  expect(container.querySelectorAll('.route-map text')).toHaveLength(Math.min(8,stations.length-start))
  const points=parsePoints(route.getAttribute('points')!)
  const transform=container.querySelector('.train')!.getAttribute('style')!
  const [,x,y]=transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)!
  const train:Point=[Number(x),Number(y)]
  expect(Math.min(...points.slice(1).map((end,index)=>distanceToSegment(train,points[index]!,end)))).toBeLessThan(0.01)
})

test.each([
  {stations:['방화','길동','하남검단산'],key:'seoul-5-hanam'},
  {stations:['방화','둔촌동','마천'],key:'seoul-5-macheon'},
  {stations:['방화','강동'],key:'seoul-5-trunk'},
])('keeps the existing $key identity for a non-cross-branch trip', ({stations,key}) => {
  const {container}=render(<RouteMap lineId="seoul-5" stations={stations} color="#996CAC" progress={0} />)
  expect(container.querySelector('polyline[data-route]')).toHaveAttribute('data-geometry',key)
})
