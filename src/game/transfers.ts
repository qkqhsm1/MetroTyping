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
