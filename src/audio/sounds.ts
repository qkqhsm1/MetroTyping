export type SoundKind = 'key' | 'correct' | 'error' | 'complete' | 'select'

let context:AudioContext|undefined
let output:DynamicsCompressorNode|undefined

function audioOutput() {
  context ??= new AudioContext()
  if (context.state==='suspended') void context.resume().catch(()=>undefined)
  if (!output) {
    output=context.createDynamicsCompressor()
    output.connect(context.destination)
  }
  return {context,output}
}

function tone(frequency:number, type:OscillatorType, duration:number, delay=0) {
  const audio=audioOutput()
  const oscillator=audio.context.createOscillator()
  const gain=audio.context.createGain()
  const start=audio.context.currentTime+delay
  oscillator.frequency.value=frequency
  oscillator.type=type
  gain.gain.setValueAtTime(0.135,start)
  gain.gain.exponentialRampToValueAtTime(0.0001,start+duration)
  oscillator.connect(gain).connect(audio.output)
  oscillator.start(start)
  oscillator.stop(start+duration)
}

export function playSound(kind:SoundKind, enabled=true) {
  if (!enabled || !window.AudioContext) return
  if (kind==='select') {
    tone(523,'sine',0.12)
    tone(784,'sine',0.16,0.07)
    return
  }
  const frequencies:Record<Exclude<SoundKind,'select'>,number>={key:520,correct:660,error:125,complete:880}
  tone(frequencies[kind],kind==='error'?'sawtooth':kind==='key'?'triangle':'sine',0.08)
}
