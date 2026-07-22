import { expect, test, vi } from 'vitest'
import { playSound, type SoundKind } from './sounds'

test('plays distinct cues through a shared limiter at the approved gain and honors mute', () => {
  const tones:{frequency:number;type:string}[]=[]
  const setGain=vi.fn(), rampGain=vi.fn(), stop=vi.fn()
  const compressorConnect=vi.fn()
  const resume=vi.fn().mockResolvedValue(undefined)
  class AudioContextMock {
    currentTime=0
    destination={}
    state='suspended'
    resume=resume
    createOscillator(){
      const frequency={value:0}
      const oscillator={frequency,type:'sine',connect:()=>({connect:()=>this.destination}),start:()=>tones.push({frequency:frequency.value,type:oscillator.type}),stop,addEventListener:vi.fn()}
      return oscillator
    }
    createGain(){return {gain:{setValueAtTime:setGain,exponentialRampToValueAtTime:rampGain}}}
    createDynamicsCompressor(){return {connect:compressorConnect}}
    close=vi.fn()
  }
  vi.stubGlobal('AudioContext',AudioContextMock)

  ;(['key','correct','error','complete'] as SoundKind[]).forEach(kind=>playSound(kind))
  playSound('select')
  playSound('key',false)

  expect(tones).toEqual([
    {frequency:520,type:'triangle'},
    {frequency:660,type:'sine'},
    {frequency:125,type:'sawtooth'},
    {frequency:880,type:'sine'},
    {frequency:523,type:'sine'},
    {frequency:784,type:'sine'},
  ])
  expect(setGain).toHaveBeenCalledTimes(6)
  expect(setGain).toHaveBeenCalledWith(0.135,0)
  expect(compressorConnect).toHaveBeenCalledTimes(1)
  expect(resume).toHaveBeenCalled()
  expect(rampGain).toHaveBeenCalledWith(0.0001,0.08)
  expect(stop).toHaveBeenCalledWith(0.08)
  vi.unstubAllGlobals()
})
