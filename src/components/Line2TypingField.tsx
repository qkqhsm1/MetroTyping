import type { ChangeEventHandler,KeyboardEventHandler,RefObject } from 'react'

export default function Line2TypingField({target,number,value,inputRef,onChange,onKeyDown}:{target:string;number:string;value:string;inputRef:RefObject<HTMLInputElement|null>;onChange:ChangeEventHandler<HTMLInputElement>;onKeyDown:KeyboardEventHandler<HTMLInputElement>}) {
  const targetCharacters=Array.from(target),typed=Array.from(value.normalize('NFC'))
  return <div className="line2-typing-field">
    <div className="line2-typing-shell" aria-hidden="true" />
    <div className="line2-typing-content">
      <span className="line2-typing-number" aria-hidden="true">{number}</span>
      <div className="line2-typing-name">
        <div className="line2-typing-feedback" data-motion="input-only" aria-hidden="true">
          {targetCharacters.slice(0,typed.length).map((character,index)=><span className={typed[index]===character?'correct':'wrong'} key={index}>{typed[index]}</span>)}
          {typed.slice(targetCharacters.length).map((character,index)=><span className="wrong" key={`extra-${index}`}>{character}</span>)}
          <span className="line2-typing-caret" />
          {targetCharacters.slice(typed.length).map((character,index)=><span className="remaining" key={`remaining-${index}`}>{character}</span>)}
        </div>
      </div>
    </div>
    <input ref={inputRef} value={value} onChange={onChange} onKeyDown={onKeyDown} aria-label="역명 입력" autoComplete="off" spellCheck={false} />
  </div>
}
