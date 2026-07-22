import { expect, test, vi } from 'vitest'
import { playSound, type SoundKind } from './sounds'

test('plays distinct key, correct, error, and complete tones and honors mute', () => {
  const tones:{frequency:number;type:string}[]=[]
  const setGain=vi.fn(), rampGain=vi.fn(), stop=vi.fn()
  class AudioContextMock {
    currentTime=0
    destination={}
    createOscillator(){
      const frequency={value:0}
      const oscillator={frequency,type:'sine',connect:()=>({connect:()=>this.destination}),start:()=>tones.push({frequency:frequency.value,type:oscillator.type}),stop,addEventListener:vi.fn()}
      return oscillator
    }
    createGain(){return {gain:{setValueAtTime:setGain,exponentialRampToValueAtTime:rampGain}}}
    close=vi.fn()
  }
  vi.stubGlobal('AudioContext',AudioContextMock)

  ;(['key','correct','error','complete'] as SoundKind[]).forEach(kind=>playSound(kind))
  playSound('key',false)

  expect(tones).toEqual([
    {frequency:520,type:'triangle'},
    {frequency:660,type:'sine'},
    {frequency:125,type:'sawtooth'},
    {frequency:880,type:'sine'},
  ])
  expect(setGain).toHaveBeenCalledTimes(4)
  expect(setGain).toHaveBeenCalledWith(0.09,0)
  expect(rampGain).toHaveBeenCalledWith(0.0001,0.08)
  expect(stop).toHaveBeenCalledWith(0.08)
  vi.unstubAllGlobals()
})
