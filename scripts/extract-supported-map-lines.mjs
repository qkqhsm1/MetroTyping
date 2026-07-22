import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const sourcePath = existsSync('.artifacts/seoul-map.svg') ? '.artifacts/seoul-map.svg' : '../../.artifacts/seoul-map.svg'
const source = readFileSync(sourcePath, 'utf8')
const lines = {
  'seoul-1': '13.975525%, 32.061768%, 55.384827%',
  'seoul-2': '13.000488%, 68.972778%, 27.290344%',
  'seoul-3': '94.703674%, 31.959534%, 10.5896%',
  'seoul-4': '22.377014%, 63.475037%, 81.7276%',
  'seoul-6': '39.141846%, 20.777893%, 12.677002%',
  'suin-bundang': '91.685486%, 58.009338%, 9.550476%',
  'incheon-1': '51.05896%, 69.056702%, 88.70697%',
  'incheon-2': '96.755981%, 56.323242%, 34.22699%',
  arex: '10.438538%, 41.053772%, 59.489441%',
}

const groups = Object.entries(lines).map(([id, color]) => {
  const paths = [...source.matchAll(/<path\b[^>]*\/>/g)]
    .map(match => match[0])
    .filter(path => path.includes(`stroke="rgb(${color})"`))
    .map(path => {
      const d = path.match(/\sd="([^"]+)"/)?.[1]
      const transform = path.match(/\stransform="([^"]+)"/)?.[1]
      if (!d) throw new Error(`Missing path data for ${id}`)
      return `<path d="${d}"${transform ? ` transform="${transform}"` : ''}/>`
    })
  if (paths.length < 5) throw new Error(`Too few official paths for ${id}: ${paths.length}`)
  return `<g id="${id}">${paths.join('')}</g>`
})

writeFileSync('public/assets/seoul-supported-lines.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2551.18 2551.18"><defs>${groups.join('')}</defs></svg>`)
