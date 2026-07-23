import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { Point } from '../game/geometry'
import { hasSelfIntersection } from '../game/randomRoute'
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
  const { container } = render(<RouteMap lineId="seoul-2" stations={stations} color="#00A84D" progress={0.25} trainVisible={false} />)
  expect([...container.querySelectorAll('text')].map(node => node.textContent)).toEqual(stations)
})

test('keeps one seeded shape stable and changes it for another seed',()=>{
  const props={lineId:'incheon-2',stations:['검단오류','왕길','검단사거리','마전','완정','독정','검암','검바위'],color:'#ED8B00',progress:0,shapeSeed:11}
  const {container,rerender}=render(<RouteMap {...props}/>)
  const first=container.querySelector('[data-route]')!.getAttribute('points')
  rerender(<RouteMap {...props}/>)
  expect(container.querySelector('[data-route]')).toHaveAttribute('points',first)
  rerender(<RouteMap {...props} shapeSeed={12}/>)
  expect(container.querySelector('[data-route]')).not.toHaveAttribute('points',first)
})

test('keeps seeded routes and labels inside a tall collision-free safe area',()=>{
  const stations=['인천공항2터미널','B','C','동대문역사문화공원','E','F','G','H']
  const {container}=render(<RouteMap lineId="incheon-2" stations={stations} color="#ED8B00" progress={0} shapeSeed={11}/>)
  expect(container.querySelector('svg')).toHaveAttribute('viewBox','0 0 600 360')
  const circles=[...container.querySelectorAll('circle:not(.target-ring)')]
  const labels=[...container.querySelectorAll('text')]
  labels.forEach((label,index)=>{
    const stationX=Number(circles[index]!.getAttribute('cx')),stationY=Number(circles[index]!.getAttribute('cy'))
    const labelX=Number(label.getAttribute('x')),labelY=Number(label.getAttribute('y'))
    expect(label).toHaveAttribute('data-label-position',expect.stringMatching(/^(above|below|left|right)$/))
    expect(labelX).toBeGreaterThanOrEqual(10)
    expect(labelX).toBeLessThanOrEqual(590)
    expect(labelY).toBeGreaterThanOrEqual(12)
    expect(labelY).toBeLessThanOrEqual(348)
    expect(Math.max(Math.abs(labelX-stationX),Math.abs(labelY-stationY))).toBeGreaterThanOrEqual(16)
  })
})

test('clips a Line 2 window to its first and last visible stations', () => {
  const full=getFullLoopRoute('seoul-2','신도림','clockwise').stationIds
  const visible=full.slice(0,8)
  const {container}=render(<RouteMap lineId="seoul-2" stations={visible} geometryStations={full} routeStationCount={full.length} segmentStart={0} color="#00A84D" progress={0} trainVisible={false} />)
  const route=parsePoints(container.querySelector('polyline[data-route]')!.getAttribute('points')!)
  const stations=[...container.querySelectorAll('circle:not(.target-ring)')]
  expect(route[0]).toEqual([Number(stations[0]!.getAttribute('cx')),Number(stations[0]!.getAttribute('cy'))])
  expect(route.at(-1)).toEqual([Number(stations.at(-1)!.getAttribute('cx')),Number(stations.at(-1)!.getAttribute('cy'))])
  expect([...container.querySelectorAll('text')].map(node=>node.textContent)).toEqual(visible)
})

test('places the first visible Incheon-origin station to the left of the next stations', () => {
  const full=getRoute('seoul-1','인천','연천').stationIds
  const visible=full.slice(0,8)
  const {container}=render(<RouteMap lineId="seoul-1" stations={visible} geometryStations={full} routeStationCount={full.length} segmentStart={0} color="#0052A4" progress={0} />)
  const stations=[...container.querySelectorAll('circle:not(.target-ring)')]
  expect(Number(stations[0]!.getAttribute('cx'))).toBeLessThan(Number(stations.at(-1)!.getAttribute('cx')))
})

const officialDirectionCases = [
  {name:'Line 1 Incheon to Guro',lineId:'seoul-1',from:'인천',to:'구로',axis:0,order:'less'},
  {name:'Line 1 Yeoncheon to Guro',lineId:'seoul-1',from:'연천',to:'구로',axis:0,order:'greater'},
  {name:'Line 1 Sinchang to Guro',lineId:'seoul-1',from:'신창',to:'구로',axis:0,order:'less'},
  {name:'Line 3 Daehwa to Ogeum',lineId:'seoul-3',from:'대화',to:'오금',axis:0,order:'less'},
  {name:'Line 4 Oido to Jinjeop',lineId:'seoul-4',from:'오이도',to:'진접',axis:0,order:'less'},
  {name:'Line 5 Banghwa to Hanam',lineId:'seoul-5',from:'방화',to:'하남검단산',axis:0,order:'less'},
  {name:'Line 5 Banghwa to Macheon',lineId:'seoul-5',from:'방화',to:'마천',axis:0,order:'less'},
  {name:'Line 6 Eungam to Sinnae',lineId:'seoul-6',from:'응암',to:'신내',axis:0,order:'less'},
  {name:'Line 7 Seoknam to Jangam',lineId:'seoul-7',from:'석남',to:'장암',axis:0,order:'less'},
  {name:'Line 8 Byeollae to Moran',lineId:'seoul-8',from:'별내',to:'모란',axis:1,order:'less'},
  {name:'Line 9 Gaehwa to VHS Medical Center',lineId:'seoul-9',from:'개화',to:'중앙보훈병원',axis:0,order:'less',serviceId:'local'},
  {name:'Suin-Bundang Incheon to Cheongnyangni',lineId:'suin-bundang',from:'인천',to:'청량리',axis:0,order:'less'},
  {name:'Incheon 1 north to south',lineId:'incheon-1',from:'검단호수공원',to:'송도달빛축제공원',axis:1,order:'less'},
  {name:'Incheon 2 north to south',lineId:'incheon-2',from:'검단오류',to:'운연',axis:1,order:'less'},
  {name:'AREX airport to Seoul',lineId:'arex',from:'인천공항2터미널',to:'서울역',axis:0,order:'less'},
] as const

test.each(officialDirectionCases)('$name preserves official map orientation with a randomized curve', directionCase => {
  const {lineId,from,to,axis,order}=directionCase
  const serviceId='serviceId' in directionCase?directionCase.serviceId:undefined
  const stations=getRoute(lineId,from,to,'forward',serviceId).stationIds
  const {container}=render(<RouteMap lineId={lineId} stations={stations} geometryStations={stations} routeStationCount={stations.length} color="#333" progress={0} shapeSeed={17} trainVisible={false} />)
  const route=parsePoints(container.querySelector('polyline[data-route]')!.getAttribute('points')!)
  const nodes=[...container.querySelectorAll('circle:not(.target-ring)')]
  const start=Number(nodes[0]!.getAttribute(axis===0?'cx':'cy'))
  const end=Number(nodes.at(-1)!.getAttribute(axis===0?'cx':'cy'))
  expect(order==='less'?start<end:start>end).toBe(true)
  expect(route[0]![axis]).toBeCloseTo(start)
  expect(route.at(-1)![axis]).toBeCloseTo(end)
  expect(hasSelfIntersection(route)).toBe(false)
})

test.each([
  {name:'Suin-Bundang Oido to Handae-ap',lineId:'suin-bundang',from:'오이도',to:'한대앞',axis:0,order:'less'},
  {name:'Suin-Bundang Handae-ap to Incheon',lineId:'suin-bundang',from:'한대앞',to:'인천',axis:0,order:'greater'},
  {name:'Incheon 2 Gajaeul to Geomdan Oryu',lineId:'incheon-2',from:'가재울',to:'검단오류',axis:1,order:'greater'},
] as const)('$name keeps local official direction in the first focused window', ({lineId,from,to,axis,order}) => {
  const full=getRoute(lineId,from,to).stationIds
  const visible=full.slice(0,8)
  const {container}=render(<RouteMap lineId={lineId} stations={visible} geometryStations={full} routeStationCount={full.length} segmentStart={0} color="#333" progress={0} shapeSeed={17} trainVisible={false} />)
  const nodes=[...container.querySelectorAll('circle:not(.target-ring)')]
  const start=Number(nodes[0]!.getAttribute(axis===0?'cx':'cy'))
  const end=Number(nodes.at(-1)!.getAttribute(axis===0?'cx':'cy'))
  expect(order==='less'?start<end:start>end).toBe(true)
})

test('anchors the front of the train at the current station', () => {
  const { container } = render(<RouteMap lineId="seoul-2" stations={['신도림','문래']} color="#00A84D" progress={0} />)
  expect(container.querySelector('.train-body')).toHaveAttribute('transform', 'translate(-22 0)')
})

test('hides the current station map label (shown under the train) but keeps the target', () => {
  const stations=['신도림','문래','영등포구청','당산','합정','홍대입구','신촌','이대']
  const { container,rerender } = render(<RouteMap lineId="seoul-2" stations={stations} color="#00A84D" progress={0} targetIndex={1} />)
  const shown=[...container.querySelectorAll('.route-map text')].map(node=>node.textContent)
  expect(shown).not.toContain('신도림') // current station under the train
  expect(shown).toContain('문래') // target stays labelled
  rerender(<RouteMap lineId="seoul-2" stations={stations} color="#00A84D" progress={0} targetIndex={1} trainVisible={false} />)
  expect([...container.querySelectorAll('.route-map text')].map(node=>node.textContent)).toContain('신도림')
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
  const { container, rerender } = render(<RouteMap lineId={lineId} stations={stations} color="#f58220" progress={0.5} trainVisible={false} />)
  const pointsValue = container.querySelector('polyline')!.getAttribute('points')!
  const points = parsePoints(pointsValue)

  expect([...container.querySelectorAll('text')].map(node => node.textContent)).toEqual(stations)
  for (const station of container.querySelectorAll('g:not(.train) > circle:not(.target-ring)')) {
    const point: Point = [Number(station.getAttribute('cx')), Number(station.getAttribute('cy'))]
    expect(Math.min(...points.slice(1).map((end,index)=>distanceToSegment(point,points[index]!,end)))).toBeLessThan(0.01)
  }

  rerender(<RouteMap lineId="seoul-2" stations={stations} color="#00A84D" progress={0.5} trainVisible={false} />)
  expect(container.querySelector('polyline')).not.toHaveAttribute('points', pointsValue)
})

const topologyCases:Array<{key:string;lineId:string;stations:string[];endpoints:[Point,Point];anchors:Point[];context?:string}> = [
  { key:'seoul-4', lineId:'seoul-4', stations:['진접','오이도'], endpoints:[[530,35],[70,250]], anchors:[[530,35],[70,250]] },
  { key:'seoul-5-hanam', lineId:'seoul-5', stations:['강동','길동','하남검단산'], endpoints:[[45,145],[555,65]], anchors:[[45,145],[300.840553,105],[555,65]] },
  { key:'seoul-5-macheon', lineId:'seoul-5', stations:['강동','둔촌동','마천'], endpoints:[[45,145],[555,250]], anchors:[[45,145],[324.345943,105],[555,250]] },
  { key:'seoul-6-trunk', lineId:'seoul-6', stations:['응암','새절','신내'], endpoints:[[45,235],[555,55]], anchors:[[45,235],[292.660318,125],[555,55]] },
  { key:'seoul-6-loop', lineId:'seoul-6', stations:['응암','역촌','불광','독바위','연신내','구산'], endpoints:[[300,250],[365,210]], anchors:[[300,250],[158.003203,221.503603],[109.932436,102.920412],[224.387228,36.757448],[358.804666,81.802722],[365,210]], context:'365,210 300,250' },
  { key:'seoul-7', lineId:'seoul-7', stations:['장암','석남'], endpoints:[[535,35],[65,250]], anchors:[[535,35],[65,250]] },
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
  const {container}=render(<RouteMap lineId="seoul-5" stations={visible} geometryStations={full} color="#996CAC" progress={0} trainVisible={false} />)
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
  expect(container.querySelectorAll('.route-map text')).toHaveLength(7) // current station label hidden under the train
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
  expect(container.querySelectorAll('.route-map text')).toHaveLength(Math.min(8,stations.length-segmentStart)-1) // current station label hidden
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
  expect(container.querySelectorAll('.route-map text')).toHaveLength(Math.min(8,stations.length-start)-1) // current station label hidden
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
