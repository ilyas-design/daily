import { useEffect, useRef } from 'react'
import { randomBetween } from '../utils'

const HEART_COUNT = 28

function makeParticle(randomY = false) {
  return {
    x:       randomBetween(0, window.innerWidth),
    y:       randomY ? randomBetween(0, window.innerHeight) : window.innerHeight + 20,
    size:    randomBetween(8, 22),
    speed:   randomBetween(0.28, 0.9),
    drift:   randomBetween(-0.18, 0.18),
    phase:   randomBetween(0, Math.PI * 2),
    opacity: randomBetween(0.08, 0.32),
    wobble:  randomBetween(0.4, 1.2),
  }
}

function drawHeart(ctx, x, y, size) {
  const s = size / 30
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.beginPath()
  ctx.moveTo(0, -6)
  ctx.bezierCurveTo(-22, -28, -44, -4, 0, 22)
  ctx.bezierCurveTo(44, -4, 22, -28, 0, -6)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export default function Particles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let particles = []
    let raf

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    function init() {
      resize()
      particles = Array.from({ length: HEART_COUNT }, () => makeParticle(true))
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.y     -= p.speed
        p.phase += 0.012
        p.x     += Math.sin(p.phase * p.wobble) * p.drift
        const progress = 1 - (p.y / canvas.height)
        const alpha    = p.opacity * Math.sin(Math.min(progress * Math.PI, Math.PI))
        ctx.globalAlpha = Math.max(0, alpha)
        ctx.fillStyle   = `hsl(${330 + Math.sin(p.phase) * 20}deg, 80%, 72%)`
        drawHeart(ctx, p.x, p.y, p.size)
        if (p.y < -30) Object.assign(p, makeParticle(false))
      })
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(loop)
    }

    init()
    loop()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas id="particles-canvas" ref={canvasRef} aria-hidden="true" />
}
