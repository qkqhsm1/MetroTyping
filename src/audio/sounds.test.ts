import { expect, test, vi } from 'vitest'
import { playSound, type SoundKind } from './sounds'

test('plays distinct key, correct, error, and complete tones and honors mute', () => {
  const starts:number[]=[]
  class AudioContextMock {
    currentTime=0
    destination={}
    createOscillator(){
      const frequency={value:0}
      return {frequency,type:'sine',connect:()=>({connect:()=>this.destination}),start:()=>starts.push(frequency.value),stop:vi.fn(),addEventListener:vi.fn()}
    }
    createGain(){return {gain:{setValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn()}}}
    close=vi.fn()
  }
  vi.stubGlobal('AudioContext',AudioContextMock)

  ;(['key','correct','error','complete'] as SoundKind[]).forEach(kind=>playSound(kind))
  playSound('key',false)

  expect(starts).toEqual([260,660,125,880])
  vi.unstubAllGlobals()
})
