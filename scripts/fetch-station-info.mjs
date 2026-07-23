import { writeFileSync } from 'node:fs'
import { LINES } from '../src/data/lines.ts'

// Source pages, retrieved for English station names and official station numbers only.
// Station ORDER is never taken from here: it stays on the frozen official data in src/data/lines.ts.
const PAGES={
  'seoul-1':['수도권 전철 1호선'],'seoul-2':['서울 지하철 2호선'],'seoul-3':['수도권 전철 3호선'],
  'seoul-4':['수도권 전철 4호선'],'seoul-5':['서울 지하철 5호선','하남선'],'seoul-6':['서울 지하철 6호선'],
  'seoul-7':['서울 지하철 7호선'],'seoul-8':['서울 지하철 8호선','별내선'],'seoul-9':['서울 지하철 9호선'],
  'suin-bundang':['수도권 전철 수인·분당선'],'incheon-1':['인천 도시철도 1호선'],'incheon-2':['인천 도시철도 2호선'],
  arex:['인천국제공항철도'],
}
// Yamanote is a static table: 30 stations, JY numbers, already-known Korean transliterations.
const YAMANOTE=[
  ['도쿄','Tokyo','JY01'],['간다','Kanda','JY02'],['아키하바라','Akihabara','JY03'],['오카치마치','Okachimachi','JY04'],
  ['우에노','Ueno','JY05'],['우구이스다니','Uguisudani','JY06'],['닛포리','Nippori','JY07'],['니시닛포리','Nishi-Nippori','JY08'],
  ['다바타','Tabata','JY09'],['고마고메','Komagome','JY10'],['스가모','Sugamo','JY11'],['오쓰카','Otsuka','JY12'],
  ['이케부쿠로','Ikebukuro','JY13'],['메지로','Mejiro','JY14'],['다카다노바바','Takadanobaba','JY15'],['신오쿠보','Shin-Okubo','JY16'],
  ['신주쿠','Shinjuku','JY17'],['요요기','Yoyogi','JY18'],['하라주쿠','Harajuku','JY19'],['시부야','Shibuya','JY20'],
  ['에비스','Ebisu','JY21'],['메구로','Meguro','JY22'],['고탄다','Gotanda','JY23'],['오사키','Osaki','JY24'],
  ['시나가와','Shinagawa','JY25'],['다카나와게이트웨이','Takanawa Gateway','JY26'],['다마치','Tamachi','JY27'],
  ['하마마쓰초','Hamamatsucho','JY28'],['신바시','Shimbashi','JY29'],['유라쿠초','Yurakucho','JY30'],
]
// English names read off the bundled official map where the Wikipedia tables disagree with it.
// The number is optional and defaults to the parsed one; it is spelled out only for the three
// stations the current Wikipedia tables file under a different Korean name entirely.
const OVERRIDES={
  'seoul-1/동묘앞':['Dongmyo'],
  'seoul-3/백석':['Baekseok'],
  'seoul-4/별내별가람':['Byeollae Byeolgaram'],
  'seoul-4/총신대입구(이수)':['Chongshin Univ.'],
  'seoul-4/능길':['Neunggil','455'],                          // renamed from 신길온천, still filed under the old title
  'seoul-5/을지로4가':['Euljiro 4(sa)-ga'],
  'seoul-5/광나루':['Gwangnaru'],
  'seoul-7/태릉입구':['Taereung'],
  'seoul-7/건대입구':['Konkuk Univ.'],
  'seoul-7/총신대입구(이수)':['Chongshin Univ.','736'],          // Wikipedia files the Line 7 half under 이수
  'seoul-7/숭실대입구(살피재)':['Soongsil Univ.'],
  'seoul-9/흑석':['Heukseok'],
  'seoul-9/삼성중앙':['Samseong Jungang'],
  'suin-bundang/신길온천':['Singiloncheon'],
  'incheon-1/신검단중앙':['Singeomdan Jungang'],
  'incheon-2/주안국가산단':['Juan National Industrial Complex'],
  'incheon-2/남동구청':['Namdong-gu Office'],
  'incheon-2/서구청':['Seo-gu Office','I210'],                 // renamed to 서해구청 after the map was frozen
  'arex/홍대입구':['Hongik Univ.'],
}

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))
// The anonymous API quota answers a burst with HTTP 429, so back off and retry rather than give up.
const wikitext=async page=>{
  const url=`https://ko.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2`
  for(let attempt=0;;attempt++){
    const response=await fetch(url,{headers:{'user-agent':'MetroTyping/1.0 (station name and number import)'}})
    if(response.ok)return (await response.json()).parse.wikitext
    if(response.status!==429||attempt===5)throw new Error(`${page}: HTTP ${response.status}`)
    await wait(15000*(attempt+1))
  }
}

// Rows look like:  |- \n ! 133 \n | [[서울역|서울역]] \n | Seoul Station \n | 漢字 \n | transfers ...
// but the hanja column sometimes precedes the romanized one, and a rowspan line-name cell sometimes
// precedes the Korean one, so cells are picked by shape and by position relative to the Latin cell.
const NUMBER=/^[A-Z]{0,2}\d{2,4}(?:-\d)?$/
const HANGUL=/[가-힣]/
const HANJA=/[一-鿿]/
const LATIN=/^[A-Za-z][A-Za-z0-9 .,'()\-&/·]*$/
const clean=text=>text
  .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g,'')
  .replace(/^[^|[{]*=[^|]*\|/,'')
  .replace(/<small>[\s\S]*?<\/small>/g,'')
  .replace(/<br\s*\/?>[\s\S]*$/,'')
  .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g,'$2')
  .replace(/\{\{[^{}]*\}\}/g,'')
  .replace(/<[^>]*>/g,'')
  .replace(/'''/g,'')
  .trim()
// Secondary names live in parentheses on one side only (총신대입구(이수) vs 총신대입구), so match on the stem.
const stem=korean=>korean.replace(/[(（].*$/,'').trim()
const parseRows=text=>{
  const rows=[]
  for(const block of text.split('\n|-')){
    const cells=block.split('\n').filter(line=>/^[|!]/.test(line)).map(line=>({header:line[0]==='!',text:clean(line.slice(1))}))
    const at=cells.findIndex(cell=>!cell.header&&LATIN.test(cell.text)&&cell.text.length>2)
    const number=cells.find(cell=>cell.header&&NUMBER.test(cell.text))?.text
    const korean=cells.slice(0,Math.max(at,0)).filter(cell=>!cell.header&&HANGUL.test(cell.text)&&!HANJA.test(cell.text)).at(-1)?.text
    const english=cells[at]?.text.replace(/\s*\([^()]*\)$/,'').trim()
    if(number&&korean&&english)rows.push({korean:stem(korean),english,number})
  }
  return rows
}

const declared=line=>[...new Set([...line.sequences.flat(),...(line.oneWaySequences?.flat()??[]),...(line.services?.flatMap(service=>service.sequence)??[])])]
const result={},missing=[]
for(const line of LINES){
  const rows=YAMANOTE.filter(()=>!PAGES[line.id]).map(([korean,english,number])=>({korean,english,number}))
  for(const page of PAGES[line.id]??[])rows.push(...parseRows(await wikitext(page)))
  const byStem=new Map(rows.map(row=>[row.korean,row]))
  const stations={}
  for(const korean of declared(line)){
    const override=OVERRIDES[`${line.id}/${korean}`],row=byStem.get(stem(korean))
    const english=override?.[0]??row?.english,number=override?.[1]??row?.number
    if(english&&number)stations[korean]={korean,english,number}
    else missing.push(`${line.id}/${korean}`)
  }
  result[line.id]=stations
  console.log(`${line.id}: ${Object.keys(stations).length}/${declared(line).length}`)
}
if(missing.length)console.log(`\nmissing:\n${missing.join('\n')}`)

const body=Object.entries(result).map(([lineId,stations])=>
  `  ${JSON.stringify(lineId)}:{\n${Object.values(stations).map(s=>`    ${JSON.stringify(s.korean)}:{korean:${JSON.stringify(s.korean)},english:${JSON.stringify(s.english)},number:${JSON.stringify(s.number)}},`).join('\n')}\n  },`).join('\n')

writeFileSync('src/data/stationInfo.ts',`// Generated by scripts/fetch-station-info.mjs on ${new Date().toISOString().slice(0,10)}.
// English names and station numbers only. Station ORDER comes from src/data/lines.ts, which stays
// frozen against the bundled official 2025-09-29 Seoul map and the operator sources cited there.
// Sources: the ko.wikipedia.org line articles listed in the script, spot-checked against the bundled
// official map public/assets/seoul-metro-map-20250929.pdf, plus a static JR Yamanote table.
export type StationInfo={korean:string;english:string;number:string}

export const STATION_INFO:Record<string,Record<string,StationInfo>>={
${body}
}

export function stationInfo(lineId:string,korean:string):StationInfo{
  return STATION_INFO[lineId]?.[korean]??{korean,english:'',number:''}
}
`)
