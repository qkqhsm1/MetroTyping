import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { Point } from '../game/geometry'
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

test('Line 6 loop has a directed closure distinct from the open trunk', () => {
  const { container,rerender }=render(<RouteMap lineId="seoul-6" stations={['응암','역촌','불광','독바위','연신내','구산']} color="#A9431E" progress={0} />)
  expect(container.querySelector('polyline[data-context]')).toHaveAttribute('data-directed-closure','true')
  rerender(<RouteMap lineId="seoul-6" stations={['응암','새절','신내']} color="#A9431E" progress={0} />)
  expect(container.querySelector('polyline[data-context]')).not.toBeInTheDocument()
})
