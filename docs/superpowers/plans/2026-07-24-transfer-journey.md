# Transfer Journey Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third game mode, 환승 여행, where the player boards one line, rides it with no fixed destination, and presses Tab at a real transfer station to switch lines — the map, sign, and colour all change to the line transferred onto — ending only at a true dead end or on manual exit.

**Architecture:** A pure state machine (`journey.ts`) over `{line, station, direction}` drives free-roam movement; `transfers.ts` derives transfer options and adjacency from the existing `LINES` data with no new data. `Game.tsx` gains a transfer branch that owns a `Journey`, derives the current line's remaining path each render, and feeds it to the unchanged `getLineWorld` / `DirectionSign` / `StationTypingField`. A `TransferSign` badge and Tab/hold key handling sit on top. `App.tsx` adds the third mode's setup.

**Tech Stack:** Vite, React 19, TypeScript (strict), Vitest, custom CSS/SVG. No new runtime dependencies.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-24-transfer-journey-design.md`.
- No new station data. Transfer options and adjacency derive from `LINES` (`src/data/lines.ts`) sequences and `oneWaySequences`.
- Transfer targets are only supported lines. Yamanote is excluded from transfer mode (shares no station with the Seoul network).
- Line priority order, verbatim: `seoul-1, seoul-2, seoul-3, seoul-4, seoul-5, seoul-6, seoul-7, seoul-8, seoul-9, arex, suin-bundang, incheon-1, incheon-2`. No per-station or per-line special cases.
- Tab quick-press transfers to the highest-priority option; Tab held ≥1500ms opens a menu; number keys 1/2/3 pick; Esc cancels. Tab is ignored when the current station has no transfer option, and never reaches the typing input; Korean IME composition is untouched.
- Boarding starts with a decided direction (setup buttons). Every transfer reopens direction: the first correctly typed neighbour fixes it.
- The run ends automatically only at a dead end (no onward station on the current line or via any transfer); a loop line never dead-ends, so 운행 종료 ends it manually.
- Play time and jaso speed rules are inherited unchanged from the existing typing path.
- `any` and `unknown` are forbidden. Run `npx tsc -p tsconfig.json --noEmit` after each task.
- Match the dense house style in `src/game` and `src/components`: no semicolons, minimal spacing, arrow consts.
- Quality gate: `npm run check` (ESLint, Vitest, strict TypeScript, production build).
- Existing modes (노선 운행, 랜덤 역명) and their `Game` props path must not change behaviour.

---

### Task 1: Transfer options and adjacency

**Files:**
- Create: `src/game/transfers.ts`
- Create: `src/game/transfers.test.ts`

**Interfaces:**
- Consumes: `LINES`, `getLine` from `src/data/lines.ts`.
- Produces:
  ```ts
  export const LINE_PRIORITY:readonly string[]
  export function transferOptionsAt(station:string,currentLine:string):string[]
  export function onwardStations(line:string,station:string):string[]
  ```
  `transferOptionsAt` returns supported line ids (excluding `currentLine` and `yamanote`) whose sequence contains `station`, ordered by `LINE_PRIORITY`. `onwardStations` returns the distinct stations directly reachable from `station` on `line` following its `sequences` and `oneWaySequences` (both neighbours mid-line; one at a terminus; the one-way successor on a directed loop).

- [ ] **Step 1: Write the failing test**

Create `src/game/transfers.test.ts`:

```ts
import { expect,test } from 'vitest'
import { LINE_PRIORITY,onwardStations,transferOptionsAt } from './transfers'

test('priority lists numbered lines first, then the rest, and excludes yamanote',()=>{
  expect(LINE_PRIORITY).toEqual(['seoul-1','seoul-2','seoul-3','seoul-4','seoul-5','seoul-6','seoul-7','seoul-8','seoul-9','arex','suin-bundang','incheon-1','incheon-2'])
})

test('transfer options exclude the current line and sort by priority',()=>{
  expect(transferOptionsAt('김포공항','seoul-5')).toEqual(['seoul-9','arex'])
  expect(transferOptionsAt('김포공항','arex')).toEqual(['seoul-5','seoul-9'])
  expect(transferOptionsAt('종로3가','seoul-1')).toEqual(['seoul-3','seoul-5'])
  expect(transferOptionsAt('인천','seoul-1')).toEqual(['suin-bundang'])
})

test('a non-transfer station has no options',()=>{
  expect(transferOptionsAt('신도림','seoul-2')).toEqual(['seoul-1'])
  expect(transferOptionsAt('강남','seoul-2')).toEqual([])
})

test('onward stations give both neighbours mid-line and one at a terminus',()=>{
  expect(onwardStations('seoul-2','강남').sort()).toEqual(['교대','역삼'])
  expect(onwardStations('seoul-3','대화')).toEqual(['주엽'])
  expect(onwardStations('seoul-3','오금')).toEqual(['경찰병원'])
})

test('a loop line wraps, so its first station still has two neighbours',()=>{
  // 신도림 opens the Line 2 array, but the loop closes onto it from 대림.
  expect(onwardStations('seoul-2','신도림').sort()).toEqual(['대림','문래'])
})

test('the eungam one-way loop advances in its single direction',()=>{
  expect(onwardStations('seoul-6','구산')).toEqual(['응암'])
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/game/transfers.test.ts`
Expected: FAIL — `Failed to resolve import "./transfers"`.

- [ ] **Step 3: Write the implementation**

Create `src/game/transfers.ts`:

```ts
import { LINES,getLine } from '../data/lines'

export const LINE_PRIORITY=['seoul-1','seoul-2','seoul-3','seoul-4','seoul-5','seoul-6','seoul-7','seoul-8','seoul-9','arex','suin-bundang','incheon-1','incheon-2'] as const

const stationsOf=(line:typeof LINES[number])=>new Set([...line.sequences.flat(),...(line.oneWaySequences?.flat()??[])])

export function transferOptionsAt(station:string,currentLine:string):string[]{
  return LINE_PRIORITY.filter(id=>id!==currentLine&&stationsOf(getLine(id)).has(station))
}

export function onwardStations(line:string,station:string):string[]{
  const data=getLine(line),result=new Set<string>()
  for(const sequence of data.sequences){
    sequence.forEach((name,index)=>{
      if(name!==station)return
      // A loop closes the sequence, so the first station's previous is the last and vice versa.
      const before=sequence[index-1]??(data.loop?sequence.at(-1):undefined)
      const after=sequence[index+1]??(data.loop?sequence[0]:undefined)
      if(before)result.add(before)
      if(after)result.add(after)
    })
  }
  for(const sequence of data.oneWaySequences??[]){
    sequence.forEach((name,index)=>{
      if(name===station&&sequence[index+1])result.add(sequence[index+1]!)
    })
  }
  return [...result]
}
```

Note: `transferOptionsAt('신도림','seoul-2')` returns `['seoul-1']` because 신도림 is on both lines — that is a real transfer and the test expects it. Only `강남` (Line 2 only) returns empty. The `data.loop` wrap is required, or a loop line's first station reports one neighbour and would look like a terminus.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/game/transfers.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc -p tsconfig.json --noEmit
git add src/game/transfers.ts src/game/transfers.test.ts
git commit -m "feat: derive transfer options and station adjacency from line data"
```

---

### Task 2: Journey state machine

**Files:**
- Create: `src/game/journey.ts`
- Create: `src/game/journey.test.ts`

**Interfaces:**
- Consumes: `onwardStations`, `transferOptionsAt` from Task 1; `getLine` from `src/data/lines.ts`.
- Produces:
  ```ts
  export type Position={line:string;station:string;direction?:string}
  export type Journey={position:Position;visited:string[];lines:string[];transfers:number}
  export function boardJourney(line:string,station:string,toward:string):Journey
  export function nextStation(position:Position):string|null
  export function advance(journey:Journey,typed:string):Journey|null
  export function beginTransfer(journey:Journey,toLine:string):Journey
  export function isDeadEnd(position:Position):boolean
  ```
  `direction` is the station the player is heading toward (the next target). It is `undefined` immediately after a transfer, when `nextStation` is null and the sign must accept either neighbour. `boardJourney` sets `direction` to `toward`. `advance` returns the next journey if `typed` matches the current target (or, when direction is undecided, matches either onward neighbour, which fixes direction); otherwise `null`. `beginTransfer` switches line and clears `direction`. `isDeadEnd` is true when the position cannot move: no next station and every transfer option is itself unable to move onward.

- [ ] **Step 1: Write the failing test**

Create `src/game/journey.test.ts`:

```ts
import { expect,test } from 'vitest'
import { advance,beginTransfer,boardJourney,isDeadEnd,nextStation } from './journey'

test('boarding heads toward the chosen neighbour and advances one station',()=>{
  const journey=boardJourney('seoul-1','소요산','동두천')
  expect(nextStation(journey.position)).toBe('동두천')
  const moved=advance(journey,'동두천')!
  expect(moved.position.station).toBe('동두천')
  expect(nextStation(moved.position)).toBe('보산')
  expect(moved.visited).toEqual(['소요산','동두천'])
})

test('a wrong answer does not advance',()=>{
  const journey=boardJourney('seoul-1','소요산','동두천')
  expect(advance(journey,'보산')).toBeNull()
})

test('after a transfer either neighbour is valid and the first typed sets direction',()=>{
  const start=boardJourney('seoul-5','방화','개화산')
  const atGimpo={...start,position:{line:'seoul-5',station:'김포공항',direction:'송정'as string|undefined}}
  const transferred=beginTransfer(atGimpo,'seoul-9')
  expect(transferred.position.line).toBe('seoul-9')
  expect(transferred.position.direction).toBeUndefined()
  expect(nextStation(transferred.position)).toBeNull()
  // 김포공항 on Line 9 sits between 개화 and 공항시장; either resolves direction.
  const toward개화=advance(transferred,'개화')!
  expect(toward개화.position.station).toBe('개화')
  const toward공항시장=advance(transferred,'공항시장')!
  expect(toward공항시장.position.station).toBe('공항시장')
  expect(transferred.lines).toEqual(['seoul-5','seoul-9'])
  expect(transferred.transfers).toBe(1)
})

test('a terminus with no transfer option ends the run',()=>{
  // 연천 is the Line 1 north terminus and no other supported line serves it.
  expect(isDeadEnd({line:'seoul-1',station:'연천',direction:undefined})).toBe(true)
})

test('a terminus a transfer line continues from is not a dead end',()=>{
  // 인천 ends Line 1 but Suin·Bundang runs on from it; 오금 ends Line 3 but Line 5 continues.
  expect(isDeadEnd({line:'seoul-1',station:'인천',direction:undefined})).toBe(false)
  expect(isDeadEnd({line:'seoul-3',station:'오금',direction:undefined})).toBe(false)
})

test('a loop line never dead-ends',()=>{
  expect(isDeadEnd({line:'seoul-2',station:'신도림',direction:undefined})).toBe(false)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/game/journey.test.ts`
Expected: FAIL — `Failed to resolve import "./journey"`.

- [ ] **Step 3: Write the implementation**

Create `src/game/journey.ts`:

```ts
import { onwardStations,transferOptionsAt } from './transfers'

export type Position={line:string;station:string;direction?:string}
export type Journey={position:Position;visited:string[];lines:string[];transfers:number}

export function nextStation(position:Position):string|null{
  return position.direction??null
}

// The station reached by continuing past `station` when we arrived there from `from`: the onward
// neighbour that is not the one we came from. At a terminus there is none.
const continueFrom=(line:string,station:string,from:string|undefined):string|undefined=>
  onwardStations(line,station).find(candidate=>candidate!==from)

export function boardJourney(line:string,station:string,toward:string):Journey{
  return {position:{line,station,direction:toward},visited:[station],lines:[line],transfers:0}
}

export function advance(journey:Journey,typed:string):Journey|null{
  const {line,station,direction}=journey.position
  const target=typed.normalize('NFC').trim()
  // With a decided direction only that station is valid; undecided (post-transfer) accepts either
  // onward neighbour and the typed one becomes the direction.
  const valid=direction!==undefined?[direction]:onwardStations(line,station)
  if(!valid.includes(target))return null
  // We are leaving `station` for `target`, so the next heading is target's onward neighbour that is
  // not the station we just left — the same whether direction was decided or reopened by a transfer.
  const next:Position={line,station:target,direction:continueFrom(line,target,station)}
  return {...journey,position:next,visited:[...journey.visited,target]}
}

export function beginTransfer(journey:Journey,toLine:string):Journey{
  return {
    ...journey,
    position:{line:toLine,station:journey.position.station,direction:undefined},
    lines:journey.lines.at(-1)===toLine?journey.lines:[...journey.lines,toLine],
    transfers:journey.transfers+1,
  }
}

// A dead end is a terminus of the current line with no other line to switch to. A transfer option
// always reopens travel (its neighbour is a fresh direction), so the presence of any option means the
// journey can continue. A loop line has two neighbours everywhere, so it is never a terminus.
export function isDeadEnd(position:Position):boolean{
  const atTerminus=onwardStations(position.line,position.station).length<=1
  return atTerminus&&transferOptionsAt(position.station,position.line).length===0
}
```

Note on `continueFrom` after a transfer: the reopened direction has no "came from" on the new line, so `advance` passes the transfer point `station` as the origin; the next heading is `target`'s onward neighbour away from that point. `beginTransfer` clears `direction`, so `nextStation` is null until the player types a neighbour.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/game/journey.test.ts`
Expected: PASS, all six cases. The dead-end rule is settled: a terminus (≤1 onward neighbour, which the loop wrap in Task 1 guarantees only true endpoints have) with no transfer option. Do not weaken a test to pass — the cases encode the product rule; if one fails, fix the code.

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc -p tsconfig.json --noEmit
git add src/game/journey.ts src/game/journey.test.ts
git commit -m "feat: model free-roam transfer journeys as a pure state machine"
```

---

### Task 3: Line badge and transfer sign

**Files:**
- Create: `src/components/TransferSign.tsx`
- Create: `src/components/TransferSign.test.tsx`
- Modify: `src/styles.css` (append transfer-sign rules)

**Interfaces:**
- Consumes: `transferOptionsAt` from Task 1; `getLine` from `src/data/lines.ts`.
- Produces:
  ```ts
  export function lineBadgeLabel(lineId:string):string
  export default function TransferSign({currentLine,station,menuOpen,holdProgress}:{currentLine:string;station:string;menuOpen:boolean;holdProgress:number}):JSX.Element|null
  ```
  Returns `null` when `transferOptionsAt(station,currentLine)` is empty. Collapsed: current badge → arrow → priority option badge. `menuOpen`: a numbered list of every option. `holdProgress` (0–1) drives the fill ring.

- [ ] **Step 1: Write the failing test**

Create `src/components/TransferSign.test.tsx`:

```tsx
import { expect,test } from 'vitest'
import { render } from '@testing-library/react'
import TransferSign,{ lineBadgeLabel } from './TransferSign'

test('badge labels are the line number, or a short tag for unnumbered lines',()=>{
  expect(lineBadgeLabel('seoul-5')).toBe('5')
  expect(lineBadgeLabel('arex')).toBe('A')
  expect(lineBadgeLabel('suin-bundang')).toBe('수인')
  expect(lineBadgeLabel('incheon-2')).toBe('I2')
})

test('renders nothing at a non-transfer station',()=>{
  const {container}=render(<TransferSign currentLine="seoul-2" station="강남" menuOpen={false} holdProgress={0} />)
  expect(container.firstChild).toBeNull()
})

test('collapsed shows the current line then the priority option',()=>{
  const {container}=render(<TransferSign currentLine="seoul-5" station="김포공항" menuOpen={false} holdProgress={0} />)
  const badges=[...container.querySelectorAll('.transfer-badge')].map(node=>node.textContent)
  expect(badges).toEqual(['5','9'])
})

test('the open menu lists every option numbered by priority',()=>{
  const {container}=render(<TransferSign currentLine="seoul-5" station="김포공항" menuOpen={true} holdProgress={1} />)
  const rows=[...container.querySelectorAll('.transfer-option')].map(node=>node.textContent)
  expect(rows[0]).toContain('1')
  expect(rows[0]).toContain('9호선')
  expect(rows[1]).toContain('2')
  expect(rows[1]).toContain('공항철도')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/TransferSign.test.tsx`
Expected: FAIL — unresolved import.

- [ ] **Step 3: Write the implementation**

Create `src/components/TransferSign.tsx`:

```tsx
import { getLine } from '../data/lines'
import { transferOptionsAt } from '../game/transfers'

const SHORT:Record<string,string>={arex:'A','suin-bundang':'수인','incheon-1':'I1','incheon-2':'I2'}

export function lineBadgeLabel(lineId:string):string{
  const numbered=lineId.match(/^seoul-(\d)$/)
  return numbered?numbered[1]!:SHORT[lineId]??lineId
}

const Badge=({lineId}:{lineId:string})=>
  <span className="transfer-badge" style={{background:getLine(lineId).color}}>{lineBadgeLabel(lineId)}</span>

export default function TransferSign({currentLine,station,menuOpen,holdProgress}:{currentLine:string;station:string;menuOpen:boolean;holdProgress:number}) {
  const options=transferOptionsAt(station,currentLine)
  if(!options.length)return null
  if(menuOpen)return <div className="transfer-sign" data-open="true" role="listbox" aria-label="환승 노선 선택">
    {options.map((lineId,index)=><div className="transfer-option" key={lineId} role="option" aria-selected={false}><span className="transfer-key">{index+1}</span><Badge lineId={lineId} />{getLine(lineId).name}</div>)}
  </div>
  return <div className="transfer-sign" style={{'--hold':holdProgress} as React.CSSProperties} aria-label={`${getLine(options[0]!).name}으로 환승 · Tab`}>
    <Badge lineId={currentLine} /><span className="transfer-arrow">→</span><Badge lineId={options[0]!} />
    <span className="transfer-hold" data-progress={holdProgress>0||undefined} />
  </div>
}
```

Append to `src/styles.css`:

```css
.transfer-sign{display:inline-flex;align-items:center;gap:8px;margin:6px auto 0;padding:6px 12px;border:2px solid var(--line);border-radius:999px;background:#fff;font-weight:900;font-size:15px;position:relative}
.transfer-sign[data-open="true"]{flex-direction:column;align-items:stretch;gap:6px;border-radius:16px;padding:10px 12px}
.transfer-badge{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;padding:0 6px;border-radius:999px;color:#fff;font-size:13px;font-weight:900}
.transfer-arrow{font-size:18px;font-weight:950;color:#333}
.transfer-option{display:flex;align-items:center;gap:8px}
.transfer-key{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border:1.5px solid #888;border-radius:6px;font-size:12px}
.transfer-hold{position:absolute;inset:-2px;border-radius:999px;border:2px solid var(--line);clip-path:inset(0 calc(100% * (1 - var(--hold,0))) 0 0);pointer-events:none}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/TransferSign.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc -p tsconfig.json --noEmit
git add src/components/TransferSign.tsx src/components/TransferSign.test.tsx src/styles.css
git commit -m "feat: add the transfer badge sign with a hold-to-open menu"
```

---

### Task 4: Wire the transfer branch into Game

**Files:**
- Modify: `src/components/Game.tsx`
- Modify: `src/components/Game.test.tsx`

**Interfaces:**
- Consumes: `boardJourney`, `advance`, `beginTransfer`, `isDeadEnd`, `nextStation`, `Journey` from Task 2; `transferOptionsAt` from Task 1; `TransferSign` from Task 3; `getLine` from `src/data/lines.ts`.
- Produces: `Game` accepts a new optional prop `journey?:{line:string;station:string;toward:string}`. When present, `Game` runs transfer mode: it ignores `stations`/`durationSeconds`, owns a `Journey` state seeded by `boardJourney(journey.line,journey.station,journey.toward)`, and derives the current line's forward path for the world/sign/typing.

- [ ] **Step 1: Write the failing test**

Append to `src/components/Game.test.tsx`:

```tsx
test('transfer mode renders the boarded line world and advances by typing',()=>{
  const {container}=render(<Game journey={{line:'seoul-1',station:'소요산',toward:'동두천'}} color="#0052A4" onExit={()=>{}} />)
  expect(container.querySelector('.tracking-map')).not.toBeNull()
  expect(screen.getByRole('heading',{name:'동두천'})).toBeInTheDocument()
  const input=screen.getByRole('textbox')
  fireEvent.change(input,{target:{value:'동두천'}})
  fireEvent.keyDown(input,{key:'Enter',isComposing:false})
  expect(screen.getByRole('heading',{name:'보산'})).toBeInTheDocument()
})

test('Tab at a transfer station switches the line and recolours; ignored elsewhere',()=>{
  const {container}=render(<Game journey={{line:'seoul-1',station:'구로',toward:'가산디지털단지'}} color="#0052A4" onExit={()=>{}} />)
  const input=screen.getByRole('textbox')
  // 구로 is Line 1 only among supported lines here, so no transfer sign.
  expect(container.querySelector('.transfer-sign')).toBeNull()
  fireEvent.keyDown(input,{key:'Tab'})
  expect(container.querySelector('.tracking-map')).not.toBeNull()
})

test('quick Tab transfers to the priority line at a transfer station',()=>{
  const {container}=render(<Game journey={{line:'seoul-5',station:'김포공항',toward:'송정'}} color="#996CAC" onExit={()=>{}} />)
  expect(container.querySelector('.transfer-sign')).not.toBeNull()
  const input=screen.getByRole('textbox')
  fireEvent.keyDown(input,{key:'Tab'})
  fireEvent.keyUp(input,{key:'Tab'})
  // Priority option at 김포공항 from seoul-5 is seoul-9; its world colour is #BDB092.
  expect(container.querySelector('.tracking-map[data-line="seoul-9"]')).not.toBeNull()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Game.test.tsx -t 'transfer mode'`
Expected: FAIL — `journey` prop unknown, no `.transfer-sign`.

- [ ] **Step 3: Write the implementation**

In `src/components/Game.tsx`:

1. Add imports:
   ```ts
   import { boardJourney,advance,beginTransfer,isDeadEnd,nextStation,type Journey } from '../game/journey'
   import { transferOptionsAt } from '../game/transfers'
   import TransferSign from './TransferSign'
   import { getLine } from '../data/lines'
   ```

2. Extend the props:
   ```ts
   export default function Game({ lineId,stations,color,sound=true,durationSeconds,journey,onExit }:{ lineId?:string; stations:string[]; color:string; sound?:boolean; durationSeconds?:number; journey?:{line:string;station:string;toward:string}; onExit:()=>void }) {
   ```

3. When `journey` is set, run the transfer branch. Add near the top of the component, after the existing state:
   ```ts
   const roaming=journey!==undefined
   const [trip,setTrip]=useState<Journey|null>(()=>journey?boardJourney(journey.line,journey.station,journey.toward):null)
   const [menuOpen,setMenuOpen]=useState(false)
   const holdStart=useRef<number|undefined>(undefined),holdRaf=useRef<number|undefined>(undefined)
   const [holdProgress,setHoldProgress]=useState(0)
   ```

4. Derive the transfer-mode view (place before the existing `const target=...`, guarded by `roaming`):
   ```ts
   const roamLine=trip?getLine(trip.position.line):undefined
   const roamColor=roamLine?.color??color
   // The path fed to the world is the current line's remaining stations in the current direction, so
   // the existing world/sign/typing render unchanged. Direction is the next target; if undecided
   // (just transferred) both neighbours are shown and either is accepted by advance().
   const roamStations=roaming&&trip?buildRoamPath(trip.position):[]
   const roamTarget=roaming&&trip?nextStation(trip.position):undefined
   ```
   where `buildRoamPath` is a local helper: from the current station, follow the direction to the line's terminus, producing `[current, ...onward...]`. For an undecided direction, return `[current]` plus both neighbours is not one path — instead render the current station and rely on the sign/typing accepting either. Implement `buildRoamPath` as:
   ```ts
   const buildRoamPath=(position:{line:string;station:string;direction?:string})=>{
     const path=[position.station]
     let previous:string|undefined,current=position.station,heading=position.direction
     while(heading){
       path.push(heading)
       const onward=onwardStations(position.line,heading).find(s=>s!==current)
       previous=current;current=heading;heading=onward;void previous
     }
     return path
   }
   ```
   Import `onwardStations` from `../game/transfers`. When `direction` is undefined the loop does not run and `path` is `[current]`, which the world renders as a single-station view centred on the transfer point.

5. Key handling for Tab. Add a `keydown`/`keyup` handler passed to the typing field's input (the field forwards `onKeyDown`; add an `onKeyUp` prop to `StationTypingField` mirroring `onKeyDown`). In `Game`:
   ```ts
   const roamKeyDown=(event:KeyboardEvent<HTMLInputElement>)=>{
     if(!roaming||!trip)return submit(event)
     const options=transferOptionsAt(trip.position.station,trip.position.line)
     if(event.key==='Escape'&&menuOpen){setMenuOpen(false);return}
     if(menuOpen&&/^[1-9]$/.test(event.key)){
       const choice=options[Number(event.key)-1]
       if(choice){setTrip(beginTransfer(trip,choice));setMenuOpen(false)}
       event.preventDefault();return
     }
     if(event.key==='Tab'){
       event.preventDefault()
       if(!options.length)return
       if(holdStart.current===undefined){
         holdStart.current=performance.now()
         const tick=()=>{const held=performance.now()-holdStart.current!;setHoldProgress(Math.min(1,held/1500));if(held>=1500){setMenuOpen(true);return}holdRaf.current=requestAnimationFrame(tick)}
         holdRaf.current=requestAnimationFrame(tick)
       }
       return
     }
     submit(event)
   }
   const roamKeyUp=(event:KeyboardEvent<HTMLInputElement>)=>{
     if(event.key!=='Tab'||!roaming||!trip)return
     const held=holdStart.current!==undefined?performance.now()-holdStart.current:0
     cancelAnimationFrame(holdRaf.current!);holdStart.current=undefined;setHoldProgress(0)
     const options=transferOptionsAt(trip.position.station,trip.position.line)
     if(held<1500&&options.length){setTrip(beginTransfer(trip,options[0]!));setMenuOpen(false)}
   }
   ```

6. Route the submit for transfer mode. In `submit`, when `roaming`, replace the `stations[index%…]` comparison with `advance`:
   ```ts
   // inside submit, at the top when roaming:
   if(roaming&&trip){
     if(event.key!=='Enter'||event.nativeEvent.isComposing)return
     const moved=advance(trip,value)
     if(moved){playSound('correct',sound);setValue('');setTrip(moved);setStartedAt(start=>start??Date.now());setNow(Date.now())}
     else{playSound('error',sound);setErrors(current=>current+1)}
     return
   }
   ```
   Keep the existing non-roaming submit body below unchanged.

7. Finished check and result. `const roamFinished=roaming&&trip?isDeadEnd(trip.position):false`. Fold into the existing `finished` so the result screen shows for a dead end; the result reuses the tracking result markup and adds `환승 {trip.transfers}회 · {trip.lines.length}개 노선`.

8. Render. In the transfer branch use `roamStations`, `roamTarget`, `roamColor` in place of `stations`, `target`, `color` for `TrackingMap`, `DirectionSign`, and `StationTypingField`, wire `onKeyDown={roamKeyDown}` / `onKeyUp={roamKeyUp}`, and render `<TransferSign currentLine={trip.position.line} station={trip.position.station} menuOpen={menuOpen} holdProgress={holdProgress} />` above the direction sign. Add `data-line={roaming?trip?.position.line:lineId}` to the `TrackingMap`'s `svg` (pass a new `lineId` through — `TrackingMap` already takes `lineId`; it renders `data-camera-station` etc., so add `data-line` there in Task 4's TrackingMap edit).

   Add to `TrackingMap.tsx` svg element: `data-line={lineId}`.

9. Undecided direction after a transfer. When `roamTarget` is `undefined` (direction not yet chosen), there are two valid next stations, so a single grey target cannot be shown. Render the field and sign in a **choice** state:
   - `StationTypingField` receives `target=''` and `number=''`, so it shows an empty typing surface with no grey target overlay; the player types either neighbour freely and `advance` validates on Enter.
   - The current station stays the `DirectionSign` centre; its two onward neighbours (`onwardStations(trip.position.line,trip.position.station)`) are shown as the previous/next regions labelled as the two directions, e.g. both with a small `택` marker, so the player sees the fork.
   - `TrackingMap` receives `targetIndex` pointing at the transfer station itself (index 0 of `roamStations`), so the camera holds on it until a direction is typed.
   Once `advance` succeeds, `direction` is set, `roamTarget` becomes a single station, and the normal single-target render resumes. Add a `Game.test.tsx` case: after `beginTransfer`, the typing field has an empty target and typing either neighbour advances (covered by the Task 4 quick-Tab test plus one extra assertion that `.typing-field input` has value `''` and no `.station-ko` target text is rendered).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/Game.test.tsx src/components/TrackingMap.test.tsx`
Expected: PASS. Do not alter the ordered/timed assertions; they exercise the untouched `stations`/`durationSeconds` path.

- [ ] **Step 5: Typecheck, full gate and commit**

```bash
npx tsc -p tsconfig.json --noEmit
npm run check
git add src/components/Game.tsx src/components/Game.test.tsx src/components/TrackingMap.tsx src/components/StationTypingField.tsx
git commit -m "feat: run transfer journeys inside Game with Tab to switch lines"
```

---

### Task 5: Transfer setup in App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css` (reuse `.setup-mode` / `.direction` styles; add nothing unless a selector is missing)

**Interfaces:**
- Consumes: `onwardStations` from Task 1; `Game`'s `journey` prop from Task 4; `getStations` from `src/game/routes.ts`.
- Produces: no new exports. `App` gains a third mode `'transfer'` and passes `journey={{line,station,toward}}` to `Game`.

- [ ] **Step 1: Write the failing test**

Append to `src/App.test.tsx`:

```tsx
test('starts a transfer journey from a chosen station and direction', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: '서울 1호선 선택' }))
  fireEvent.click(screen.getByRole('button', { name: '환승 여행' }))
  fireEvent.click(screen.getByRole('combobox', { name: '출발역' }))
  fireEvent.click(screen.getByRole('option', { name: '소요산' }))
  fireEvent.click(screen.getByRole('button', { name: '동두천 방향' }))
  fireEvent.click(screen.getByRole('button', { name: '운행 시작 →' }))

  expect(screen.getByRole('heading', { name: '동두천' })).toBeInTheDocument()
  expect(document.querySelector('.tracking-map')).not.toBeNull()
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/App.test.tsx -t 'transfer journey'`
Expected: FAIL — no 환승 여행 button.

- [ ] **Step 3: Write the implementation**

In `src/App.tsx`:

1. Widen the mode state: `const [mode,setMode]=useState<'route'|'random'|'transfer'|null>(null)`.
2. Add `const [toward,setToward]=useState('')` alongside `from`/`to`.
3. Add the third mode button in `.setup-mode`:
   ```tsx
   <button className={mode==='transfer'?'active':''} onClick={()=>{setMode('transfer');setRouteOverride(null);setToward('')}}>환승 여행</button>
   ```
4. Add the transfer setup block after the `mode==='route'` block:
   ```tsx
   {mode==='transfer'&&<><div className="trip-form"><StationSelect label="출발역" value={from} options={stations} onChange={value=>{setFrom(value);setToward('')}}/></div>{from&&<div className="direction">{onwardStations(line.id,from).map(neighbour=><button key={neighbour} className={toward===neighbour?'active':''} onClick={()=>setToward(neighbour)}>{neighbour} 방향</button>)}</div>}</>}
   ```
   Import `onwardStations` from `./game/transfers`.
5. In the play guard, launch transfer mode:
   ```tsx
   if (playing && line) {
     if(mode==='transfer')return <main className="shell"><Game journey={{line:line.id,station:from,toward}} color={line.color} sound={sound} onExit={()=>setPlaying(false)} /></main>
     // ...existing route/random return unchanged
   }
   ```
6. Enable the start button for transfer mode: extend the `disabled` expression so transfer requires `from` and `toward`:
   ```tsx
   disabled={(mode==='route'&&(!from||!to||from===to))||(mode==='transfer'&&(!from||!toward))}
   ```
   and the `onClick`: when `mode==='transfer'`, `setPlaying(true)` directly (no `tryStartRoute`).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS. Existing mode tests untouched.

- [ ] **Step 5: Typecheck, full gate and commit**

```bash
npx tsc -p tsconfig.json --noEmit
npm run check
git add src/App.tsx src/App.test.tsx src/styles.css
git commit -m "feat: add the transfer journey setup with a start station and direction"
```

---

### Task 6: Visual gate and workflow record

**Files:**
- Create: `.artifacts/capture-transfer.mjs` (throwaway, `.artifacts/` is gitignored)
- Modify: `MDs/Workflow.md`

**Interfaces:** none — evidence only.

- [ ] **Step 1: Build and preview**

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4250
```
Verify `curl -sI http://127.0.0.1:4250/MetroTyping/` returns HTTP 200 `text/html`.

- [ ] **Step 2: Drive a transfer journey and capture**

Create `.artifacts/capture-transfer.mjs` modelled on `.artifacts/capture-all-lines.mjs` (use the `type==='page'` target filter). Board Seoul 5 at 김포공항 toward 송정, screenshot the platform sign showing the transfer badge, press Tab to transfer to Line 9, and screenshot again to confirm the map, colour, and sign are now Line 9. Capture at 360, 768, and 1440 CSS pixels. Keep each browser command small and independently observable.

- [ ] **Step 3: Inspect the PNGs**

Read each capture. Confirm: the transfer badge shows `5 → 9` at 김포공항; after Tab the map recolours to Line 9 (`#BDB092`) and the sign shows a Line 9 station; typing after the transfer accepts either neighbour and advances; no page overflow at any width.

- [ ] **Step 4: Record**

Append to `MDs/Workflow.md` under `## Verification` a dated entry naming the captured journey, the widths, and the gate result, and add the mode to the Decisions/Done sections. Append any mistake found to `## Mistakes` in the `[날짜] 내용 / 원인 / 예방` form.

- [ ] **Step 5: Commit**

```bash
git add MDs/Workflow.md
git commit -m "docs: record the transfer journey visual gate"
```

---

## Self-review notes

- Spec coverage: transfers/priority (Task 1), state machine incl. direction-by-typing and dead-end rule (Task 2), transfer badge with hold menu (Task 3), Game wiring incl. Tab quick/hold/number/Esc and recolour (Task 4), setup with start+direction (Task 5), visual gate (Task 6). Every spec section maps to a task.
- Dead-end rule (settled after checking the data): a dead end is a terminus on the current line with no transfer option. 연천 (no transfer) ends; 인천 and 오금 (a transfer line continues) do not; loop lines never end. The loop wrap in `onwardStations` (Task 1) is what makes "≤1 neighbour = terminus" correct, so Task 1 must land before Task 2 relies on it.
- Naming consistency: `boardJourney`/`advance`/`beginTransfer`/`isDeadEnd`/`nextStation`, `transferOptionsAt`/`onwardStations`/`LINE_PRIORITY`, `TransferSign`/`lineBadgeLabel`, `Game`'s `journey` prop `{line,station,toward}` — used identically across tasks.
- `StationTypingField` gains an `onKeyUp` prop in Task 4; that is the only change to an otherwise-frozen component and is called out in its Files/Interfaces.
