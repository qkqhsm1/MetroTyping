import type { ChangeEventHandler,KeyboardEventHandler,RefObject } from 'react'

export default function StationTypingField({target,number,value,errorAttempt,inputRef,onChange,onKeyDown}:{target:string;number:string;value:string;errorAttempt:number;inputRef:RefObject<HTMLInputElement|null>;onChange:ChangeEventHandler<HTMLInputElement>;onKeyDown:KeyboardEventHandler<HTMLInputElement>}) {
  const targetCharacters=Array.from(target),typed=Array.from(value.normalize('NFC'))
  return <div className="typing-field">
    <div className="typing-visual" data-error-attempt={errorAttempt} key={errorAttempt}>
      <div className="typing-shell" aria-hidden="true" />
      <div className="typing-content">
        <span className="typing-number" data-long={number.length>3||undefined} aria-hidden="true">{number}</span>
        <div className="typing-name">
          <div className="typing-feedback" data-motion="input-only" aria-hidden="true">
            {targetCharacters.slice(0,typed.length).map((character,index)=><span className={typed[index]===character?'correct':'wrong'} key={index}>{typed[index]}</span>)}
            {typed.slice(targetCharacters.length).map((character,index)=><span className="wrong" key={`extra-${index}`}>{character}</span>)}
            <span className="typing-caret" />
            {targetCharacters.slice(typed.length).map((character,index)=><span className="remaining" key={`remaining-${index}`}>{character}</span>)}
          </div>
        </div>
      </div>
    </div>
    <input ref={inputRef} value={value} onChange={onChange} onKeyDown={onKeyDown} aria-label="역명 입력" autoComplete="off" spellCheck={false} />
  </div>
}
