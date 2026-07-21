import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export default function StationSelect({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(value:string)=>void}) {
  const [open,setOpen]=useState(false)
  const [active,setActive]=useState(0)
  const root=useRef<HTMLDivElement>(null)
  const trigger=useRef<HTMLButtonElement>(null)
  const optionRefs=useRef<Array<HTMLButtonElement|null>>([])
  const listId=useId()

  useEffect(()=>{
    if(!open)return
    const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)}
    document.addEventListener('pointerdown',close)
    return()=>document.removeEventListener('pointerdown',close)
  },[open])

  const show=()=>{
    const selected=Math.max(0,options.indexOf(value))
    setActive(selected)
    setOpen(true)
    requestAnimationFrame(()=>root.current?.scrollIntoView?.({block:'start',behavior:'smooth'}))
  }
  const choose=(station:string)=>{onChange(station);setOpen(false);trigger.current?.focus()}
  const move=(next:number)=>{const index=(next+options.length)%options.length;setActive(index);optionRefs.current[index]?.focus()}
  const triggerKey=(event:KeyboardEvent<HTMLButtonElement>)=>{
    if(event.key==='Escape'){setOpen(false);return}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault()
      if(!open){show();requestAnimationFrame(()=>optionRefs.current[active]?.focus())}
      else move(active+(event.key==='ArrowDown'?1:-1))
    }
  }
  const optionKey=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
    if(event.key==='Escape'){setOpen(false);trigger.current?.focus()}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();move(index+(event.key==='ArrowDown'?1:-1))}
  }

  return <div className="station-select" ref={root}>
    <span className="station-label" id={`${listId}-label`}>{label}</span>
    <button ref={trigger} type="button" className="station-trigger" role="combobox" aria-labelledby={`${listId}-label`} aria-controls={listId} aria-expanded={open} aria-haspopup="listbox" onClick={()=>open?setOpen(false):show()} onKeyDown={triggerKey}>
      <span>{value||'선택'}</span><span aria-hidden="true">⌄</span>
    </button>
    {open&&<div id={listId} className="station-menu" role="listbox" aria-label={label}>
      {options.map((station,index)=><button key={station} ref={element=>{optionRefs.current[index]=element}} type="button" role="option" aria-selected={station===value} tabIndex={index===active?0:-1} onClick={()=>choose(station)} onKeyDown={event=>optionKey(event,index)}>{station}</button>)}
    </div>}
  </div>
}
