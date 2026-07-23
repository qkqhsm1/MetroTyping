import type { ChangeEventHandler,KeyboardEventHandler,RefObject } from 'react'

export default function Line2TypingField({target,value,inputRef,onChange,onKeyDown}:{target:string;value:string;inputRef:RefObject<HTMLInputElement|null>;onChange:ChangeEventHandler<HTMLInputElement>;onKeyDown:KeyboardEventHandler<HTMLInputElement>}) {
  const targetCharacters=Array.from(target),typed=Array.from(value.normalize('NFC'))
  return <div className="line2-typing-field">
    <div className="line2-typing-feedback" aria-hidden="true">
      {targetCharacters.map((character,index)=>{
        const entered=typed[index]
        return <span className={entered===undefined?'remaining':entered===character?'correct':'wrong'} key={index}>{entered??character}</span>
      })}
      {typed.slice(targetCharacters.length).map((character,index)=><span className="wrong" key={`extra-${index}`}>{character}</span>)}
    </div>
    <input ref={inputRef} value={value} onChange={onChange} onKeyDown={onKeyDown} aria-label="역명 입력" autoComplete="off" spellCheck={false} />
  </div>
}
