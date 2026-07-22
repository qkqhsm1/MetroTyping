import type { ServicePattern } from '../data/lines'

export default function ServiceSelect({ value, services, onChange }: {
  value: string
  services: readonly ServicePattern[]
  onChange: (value: ServicePattern['id']) => void
}) {
  return <div className="service-select" aria-label="운행 종류">
    {services.map(service => <button key={service.id} type="button" aria-pressed={value === service.id} className={value === service.id ? 'active' : ''} onClick={() => onChange(service.id)}>{service.label}</button>)}
  </div>
}
