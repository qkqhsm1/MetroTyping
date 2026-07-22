export type SoundKind = 'key' | 'correct' | 'error' | 'complete'

export function playSound(kind:SoundKind, enabled=true) {
  if (!enabled || !window.AudioContext) return
  const context=new AudioContext()
  const oscillator=context.createOscillator()
  const gain=context.createGain()
  const frequencies:Record<SoundKind,number>={key:520,correct:660,error:125,complete:880}
  oscillator.frequency.value=frequencies[kind]
  oscillator.type=kind==='error'?'sawtooth':kind==='key'?'triangle':'sine'
  gain.gain.setValueAtTime(0.09,context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001,context.currentTime+0.08)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime+0.08)
  oscillator.addEventListener('ended',()=>void context.close())
}
