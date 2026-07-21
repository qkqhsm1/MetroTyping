import type { CSSProperties } from 'react'
import type { QuickRoute, QuickRoutePair } from '../game/routes'

export default function QuickRoutes({ pairs, color, onStart }: {
  pairs: QuickRoutePair[]
  color: string
  onStart: (route: QuickRoute) => void
}) {
  if (!pairs.length) return null

  return <section className="quick-routes" style={{ '--line': color } as CSSProperties}>
    <div><p className="eyebrow">ONE CLICK TRIP</p><h2>빠른 운행</h2></div>
    <div className="quick-route-grid">{pairs.map(pair => <article key={pair.id}>
      <h3>{pair.title}</h3>
      <div>{pair.routes.map(route => <button key={route.id} type="button" onClick={() => onStart(route)} aria-label={`${route.from}에서 ${route.to}까지 바로 시작`}>{route.label}</button>)}</div>
    </article>)}</div>
  </section>
}
