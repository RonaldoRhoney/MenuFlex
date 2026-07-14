// Alerta sonoro da fila de pedidos — gerado via Web Audio API (sem depender de
// arquivo de áudio). Continua tocando em loop até o admin confirmar, porque o
// requisito é notar o pedido mesmo com a aba em segundo plano / tela desligada.
let audioCtx: AudioContext | null = null
let loopTimer: ReturnType<typeof setInterval> | null = null

function beep() {
  audioCtx ??= new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + 0.4)
  if (navigator.vibrate) navigator.vibrate([200, 100, 200])
}

export function startAlertLoop() {
  stopAlertLoop()
  beep()
  loopTimer = setInterval(beep, 2500)
}

export function stopAlertLoop() {
  if (loopTimer) {
    clearInterval(loopTimer)
    loopTimer = null
  }
}
