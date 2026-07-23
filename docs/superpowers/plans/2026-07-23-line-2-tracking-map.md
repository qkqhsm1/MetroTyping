# Line 2 Tracking Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Seoul Line 2-only official-vector gameplay map whose camera centres the station currently being typed, shows one previous and two upcoming stations, and records elapsed game time.

**Architecture:** Add one frozen Line 2 station/geometry data module and one dedicated SVG component. `Game` selects that component only for ordered `seoul-2` runs; all other map and result paths stay unchanged. Use native SVG `viewBox` transitions and existing React state—no map, animation, or timing dependency.

**Tech Stack:** React 19, TypeScript 6, SVG, CSS, Vitest, Testing Library, Vite

## Global Constraints

- Apply every new behavior only to ordered Seoul Line 2 play.
- Use the bundled official Seoul Metro PDF/vector as geometry provenance.
- The target being typed is always the camera centre.
- Show one previous, the target, and two upcoming stations when available.
- Correct input must update logical target, train, and camera immediately without blocking input.
- Start elapsed time on the first typed input; freeze it at completion.
- Preserve Korean IME handling, CPM, errors, sound, reduced motion, and all non-Line-2 behavior.
- Add no dependency.

---

### Task 1: Freeze official Line 2 metadata and geometry

**Files:**
- Create: `src/data/line2Tracking.ts`
- Create: `src/data/line2Tracking.test.ts`
- Read: `public/assets/seoul-supported-lines.svg`
- Read: `public/assets/seoul-metro-map-20250929.pdf`

**Interfaces:**
- Produces: `Line2Station { name:string; english:string; number:string; point:Point }`
- Produces: `LINE_2_STATIONS: readonly Line2Station[]`
- Produces: `LINE_2_PATH_D:string`, `LINE_2_PATH_TRANSFORM:string`
- Produces: `line2Station(name:string):Line2Station|undefined`
- Produces: `hasLine2TrackingData(stations:readonly string[]):boolean`
- Consumes: existing `Point` from `src/game/geometry.ts`

- [ ] **Step 1: Write the metadata RED test**

Create `src/data/line2Tracking.test.ts`:

```ts
import { expect, test } from 'vitest'
import { getLine } from './lines'
import { LINE_2_STATIONS, line2Station } from './line2Tracking'

test('freezes all official Line 2 main-loop names, English names, and numbers',()=>{
  expect(LINE_2_STATIONS.map(({name})=>name)).toEqual(getLine('seoul-2').sequences[0])
  expect(LINE_2_STATIONS).toHaveLength(43)
  expect(LINE_2_STATIONS.map(({number})=>number)).toEqual(
    Array.from({length:43},(_,index)=>String(234+index>243?191+index:234+index)),
  )
  expect(line2Station('신도림')).toMatchObject({english:'Sindorim',number:'234'})
  expect(line2Station('문래')).toMatchObject({english:'Mullae',number:'235'})
  expect(line2Station('동대문역사문화공원')).toMatchObject({
    english:'Dongdaemun History & Culture Park',
    number:'205',
  })
})
```

The expected number order follows the existing sequence `신도림(234)…충정로(243)→시청(201)…대림(233)`.

- [ ] **Step 2: Run the metadata test and verify RED**

Run:

```powershell
npx vitest run src/data/line2Tracking.test.ts
```

Expected: FAIL because `line2Tracking.ts` does not exist.

- [ ] **Step 3: Add the complete official metadata table**

Create `src/data/line2Tracking.ts` with this type and verified metadata order:

```ts
import type { Point } from '../game/geometry'

export type Line2Station={
  name:string
  english:string
  number:string
  point:Point
}

const metadata=[
  ['신도림','Sindorim','234'],['문래','Mullae','235'],
  ['영등포구청','Yeongdeungpo-gu Office','236'],['당산','Dangsan','237'],
  ['합정','Hapjeong','238'],['홍대입구','Hongik Univ.','239'],
  ['신촌','Sinchon','240'],['이대','Ewha Womans Univ.','241'],
  ['아현','Ahyeon','242'],['충정로','Chungjeongno','243'],
  ['시청','City Hall','201'],['을지로입구','Euljiro 1(il)-ga','202'],
  ['을지로3가','Euljiro 3(sam)-ga','203'],['을지로4가','Euljiro 4(sa)-ga','204'],
  ['동대문역사문화공원','Dongdaemun History & Culture Park','205'],
  ['신당','Sindang','206'],['상왕십리','Sangwangsimni','207'],
  ['왕십리','Wangsimni','208'],['한양대','Hanyang Univ.','209'],
  ['뚝섬','Ttukseom','210'],['성수','Seongsu','211'],
  ['건대입구','Konkuk Univ.','212'],['구의','Guui','213'],
  ['강변','Gangbyeon','214'],['잠실나루','Jamsillaru','215'],
  ['잠실','Jamsil','216'],['잠실새내','Jamsilsaenae','217'],
  ['종합운동장','Sports Complex','218'],['삼성','Samseong','219'],
  ['선릉','Seolleung','220'],['역삼','Yeoksam','221'],['강남','Gangnam','222'],
  ['교대',"Seoul Nat'l Univ. of Education",'223'],['서초','Seocho','224'],
  ['방배','Bangbae','225'],['사당','Sadang','226'],['낙성대','Nakseongdae','227'],
  ['서울대입구',"Seoul Nat'l Univ.",'228'],['봉천','Bongcheon','229'],
  ['신림','Sillim','230'],['신대방','Sindaebang','231'],
  ['구로디지털단지','Guro Digital Complex','232'],['대림','Daerim','233'],
] as const
```

Copy the official Line 2 main-loop `d` and `transform` from `<g id="seoul-2">` in `public/assets/seoul-supported-lines.svg`. Digitize all 43 official station centres from the bundled PDF into the same `2551.18 × 2551.18` coordinate system, preserving the metadata order above. Construct `LINE_2_STATIONS` by pairing each tuple with its corresponding point. Export:

```ts
export const line2Station=(name:string)=>LINE_2_STATIONS.find(station=>station.name===name)
export const hasLine2TrackingData=(stations:readonly string[])=>
  stations.every(station=>line2Station(station)!==undefined)
```

The current primary metadata source is Seoul Open Data dataset `OA-15442`, service `SearchSTNBySubwayLineInfo`, updated 2026-07-22; `FR_CODE` is the displayed station number.

- [ ] **Step 4: Add completeness and fallback-data assertions**

Extend `src/data/line2Tracking.test.ts` to assert every point is a finite tuple, every name is unique, and `hasLine2TrackingData(['신도림','문래'])` is true while an unknown station returns false.

- [ ] **Step 5: Run metadata and geometry tests**

Run:

```powershell
npx vitest run src/data/line2Tracking.test.ts
```

Expected: 43 names/numbers/English labels and all path-distance assertions PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/data/line2Tracking.ts src/data/line2Tracking.test.ts
git commit -m "feat: add official Line 2 tracking data"
```

---

### Task 2: Build the target-centred SVG camera

**Files:**
- Create: `src/components/Line2TrackingMap.tsx`
- Create: `src/components/Line2TrackingMap.test.tsx`
- Create: `src/game/line2Camera.ts`
- Create: `src/game/line2Camera.test.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `LINE_2_STATIONS`, `LINE_2_PATH_D`, `LINE_2_PATH_TRANSFORM`
- Produces: `line2Window(stations:string[],targetIndex:number):Line2Station[]`
- Produces: `line2ViewBox(stations:string[],targetIndex:number,aspectRatio:number):string`
- Produces: `distanceToLine2Path(point:Point):number`
- Produces component:

```ts
type Line2TrackingMapProps={
  stations:string[]
  targetIndex:number
  color:string
  trainVisible:boolean
}
```

- [ ] **Step 1: Write camera RED tests**

Create `src/game/line2Camera.test.ts`:

```ts
import { expect, test } from 'vitest'
import { line2ViewBox, line2Window } from './line2Camera'

const clockwise=['신도림','문래','영등포구청','당산','합정']
const counterclockwise=['신도림','대림','구로디지털단지','신대방','신림']

test('shows target plus one previous and two upcoming stations',()=>{
  expect(line2Window(clockwise,0).map(({name})=>name))
    .toEqual(['신도림','문래','영등포구청'])
  expect(line2Window(clockwise,1).map(({name})=>name))
    .toEqual(['신도림','문래','영등포구청','당산'])
  expect(line2Window(counterclockwise,1).map(({name})=>name))
    .toEqual(['신도림','대림','구로디지털단지','신대방'])
})

test('centres the target station in the camera viewBox',()=>{
  const [x,y,width,height]=line2ViewBox(clockwise,0,16/9).split(' ').map(Number)
  const target=line2Window(clockwise,0)[0]!
  expect(x+width/2).toBeCloseTo(target.point[0])
  expect(y+height/2).toBeCloseTo(target.point[1])
})

test('keeps every station centre on the official Line 2 path',()=>{
  for(const station of LINE_2_STATIONS)
    expect(distanceToLine2Path(station.point)).toBeLessThan(0.5)
})
```

- [ ] **Step 2: Run camera tests and verify RED**

Run:

```powershell
npx vitest run src/game/line2Camera.test.ts
```

Expected: FAIL because camera helpers do not exist.

- [ ] **Step 3: Implement the smallest camera helpers**

Create `src/game/line2Camera.ts`. Slice `targetIndex-1…targetIndex+2`, map names through `line2Station`, and throw only for missing frozen metadata. Compute the maximum x/y distance from the target to the context points, add 18% padding, enforce the supplied aspect ratio, and return a viewBox centred exactly on the target.

- [ ] **Step 4: Write component RED tests**

Create `src/components/Line2TrackingMap.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import Line2TrackingMap from './Line2TrackingMap'

const stations=['신도림','문래','영등포구청','당산','합정']

test('moves camera and train from Sindorim to Mullae immediately',()=>{
  const {container,rerender}=render(
    <Line2TrackingMap stations={stations} targetIndex={0} color="#00A84D" trainVisible />,
  )
  const before=container.querySelector('svg')!.getAttribute('viewBox')
  expect(container.querySelector('[data-camera-centre="신도림"]')).toBeInTheDocument()
  rerender(<Line2TrackingMap stations={stations} targetIndex={1} color="#00A84D" trainVisible />)
  expect(container.querySelector('svg')).not.toHaveAttribute('viewBox',before)
  expect(container.querySelector('[data-camera-centre="문래"]')).toBeInTheDocument()
  expect(container.querySelector('.train')).toHaveAttribute('data-station','문래')
})

test('renders Korean, English, and station number for four contextual stations',()=>{
  const {container}=render(
    <Line2TrackingMap stations={stations} targetIndex={1} color="#00A84D" trainVisible />,
  )
  expect(container.querySelectorAll('[data-station]')).toHaveLength(4)
  expect(container.textContent).toContain('Sindorim')
  expect(container.textContent).toContain('234')
  expect(container.textContent).toContain('Mullae')
  expect(container.textContent).toContain('235')
})
```

- [ ] **Step 5: Implement the SVG component and native transition**

Render one `<svg className="route-map line2-tracking-map">` with:

- full official loop path;
- only the four contextual station nodes/labels;
- target-centred `viewBox`;
- train anchored directly to the target station point;
- label `<tspan>` rows for Korean, English, and number.

Add only presentation styles to `src/styles.css`:

```css
.line2-tracking-map{display:block;width:100%;overflow:hidden}
.line2-station-meta{font-size:7px;font-weight:700;fill:#777}
```

Because CSS interpolation of the SVG `viewBox` attribute is not portable, keep the SVG mounted and animate between the previous and next numeric viewBox values with a single 100 ms `requestAnimationFrame` loop. Cancel the prior frame on a rapid new target and immediately animate toward the newest target. Under reduced motion, set the final viewBox directly.

- [ ] **Step 6: Run component and camera tests**

Run:

```powershell
npx vitest run src/game/line2Camera.test.ts src/components/Line2TrackingMap.test.tsx
```

Expected: all camera window, centring, metadata, train, and rapid-update tests PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/game/line2Camera.ts src/game/line2Camera.test.ts src/components/Line2TrackingMap.tsx src/components/Line2TrackingMap.test.tsx src/styles.css
git commit -m "feat: add Line 2 tracking camera"
```

---

### Task 3: Integrate Line 2 gameplay and elapsed time

**Files:**
- Modify: `src/components/Game.tsx`
- Modify: `src/components/Game.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `Line2TrackingMap`
- Keeps the existing `Game` public props unchanged.
- Produces: route-mode Line 2 elapsed status text `MM:SS.t`.

- [ ] **Step 1: Write gameplay RED tests**

Add to `src/components/Game.test.tsx`:

```tsx
test('uses target-centred tracking only for ordered Line 2 play',()=>{
  const line2=render(<Game lineId="seoul-2" stations={['신도림','문래']} color="#00A84D" onExit={()=>{}} />)
  expect(line2.container.querySelector('.line2-tracking-map')).toBeInTheDocument()
  line2.unmount()
  const line3=render(<Game lineId="seoul-3" stations={['대화','주엽']} color="#EF7C1C" onExit={()=>{}} />)
  expect(line3.container.querySelector('.line2-tracking-map')).not.toBeInTheDocument()
  expect(line3.container.querySelector('.route-map')).toBeInTheDocument()
})

test('centres Mullae immediately after the correct Sindorim answer',()=>{
  const {container}=render(<Game lineId="seoul-2" stations={['신도림','문래','영등포구청']} color="#00A84D" onExit={()=>{}} />)
  answer('신도림')
  expect(container.querySelector('[data-camera-centre="문래"]')).toBeInTheDocument()
  expect(screen.getByRole('heading',{name:'문래'})).toBeInTheDocument()
})

test('times only Line 2 route play from first input through completion',()=>{
  vi.useFakeTimers()
  render(<Game lineId="seoul-2" stations={['신도림']} color="#00A84D" onExit={()=>{}} />)
  expect(screen.getByLabelText('총 게임 시간')).toHaveTextContent('00:00.0')
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'신'}})
  vi.advanceTimersByTime(1230)
  answer('신도림')
  expect(screen.getByText(/총 게임 시간/)).toHaveTextContent('00:01.2')
  vi.useRealTimers()
})
```

- [ ] **Step 2: Run Game tests and verify RED**

Run:

```powershell
npx vitest run src/components/Game.test.tsx
```

Expected: FAIL because Game still renders the focused RouteMap and has no Line 2 elapsed status.

- [ ] **Step 3: Integrate the map without changing other lines**

In the ordered map branch, use:

```tsx
lineId==='seoul-2'&&hasLine2TrackingData(stations)
  ? <Line2TrackingMap
      stations={stations}
      targetIndex={index}
      color={color}
      trainVisible
    />
  : <RouteMap {...existingProps}/>
```

The Line 2 train is visible at the first target because this design explicitly places the train and camera at the station currently being typed. Keep the existing departure-first scoring rule.

- [ ] **Step 4: Add the Line 2-only elapsed clock**

Reuse `startedAt`, add `finishedAt`, and format milliseconds with:

```ts
const formatElapsed=(milliseconds:number)=>{
  const tenths=Math.floor(milliseconds/100)
  const minutes=Math.floor(tenths/600)
  const seconds=Math.floor(tenths/10)%60
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${tenths%10}`
}
```

Update the existing running interval to 100 ms only when `lineId==='seoul-2'`, ordered play is active, and typing has started. On the final correct submission, set `finishedAt` from the same `Date.now()` used to complete the run. Render `(finishedAt ?? now) - startedAt` so the result cannot continue changing. Do not render this metric for other lines or random mode.

- [ ] **Step 5: Run Game and regression tests**

Run:

```powershell
npx vitest run src/components/Game.test.tsx src/components/RouteMap.test.tsx src/App.test.tsx
```

Expected: Line 2 tracking/time tests and all existing non-Line-2 behavior PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/components/Game.tsx src/components/Game.test.tsx src/styles.css
git commit -m "feat: connect Line 2 tracking gameplay"
```

---

### Task 4: Visual QA, full verification, and deployment

**Files:**
- Modify: `MDs/Workflow.md`

**Interfaces:**
- Verifies the complete feature; produces no new runtime interface.

- [ ] **Step 1: Render the real Line 2 component**

Use the existing temporary Vitest SSR + headless Chrome flow to render:

- clockwise Sindorim target;
- clockwise Mullae target;
- counterclockwise Daerim target;
- wraparound near Chungjeongno/City Hall;
- a long English label.

Capture at exact 360, 768, and 1440 CSS-pixel viewports.

- [ ] **Step 2: Inspect required visual behavior**

Confirm from pixels and DOM measurements:

- target is exactly centred;
- one previous and two upcoming stations are visible when available;
- Korean/English/number rows are readable and do not cross the path;
- no label or train clipping;
- full official vector remains sharp at 1440;
- 100 ms movement does not flash an old eight-station segment;
- reduced motion jumps directly to the target.

- [ ] **Step 3: Run the full quality gate**

Run:

```powershell
npm run check
```

Expected: ESLint, all client tests, 2 server tests, strict TypeScript, and Vite build PASS.

- [ ] **Step 4: Update project memory**

Replace `MDs/Workflow.md` `In progress` and `Next` status, record exact test counts, screenshot coverage, primary source/API access date, and any mistakes encountered.

- [ ] **Step 5: Commit and push**

```powershell
git add MDs/Workflow.md
git commit -m "docs: record Line 2 tracking verification"
git push origin main
```

- [ ] **Step 6: Verify GitHub Pages**

Wait for the Pages run for the pushed commit. Verify:

- `/MetroTyping/` returns HTML;
- emitted JS/CSS return JavaScript/CSS MIME types rather than HTML fallback;
- the JavaScript bundle contains `Sindorim`, `Mullae`, and `234`;
- headless Chrome renders the deployed page and Line 2 setup/game flow.
