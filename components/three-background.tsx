"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  size: number
  opacity: number
}

interface Node {
  x: number
  y: number
  vx: number
  vy: number
}

export default function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let width = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener("resize", resize)

    // --- Particles ---
    const PARTICLE_COUNT = 180
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random(),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
    }))

    // --- Network nodes ---
    const NODE_COUNT = 55
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }))

    // --- Grid lines ---
    const GRID_COLS = 14
    const GRID_ROWS = 9

    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Background gradient
      const bg = ctx.createRadialGradient(
        width * 0.5, height * 0.45, 0,
        width * 0.5, height * 0.45, Math.max(width, height) * 0.75
      )
      bg.addColorStop(0, "#0a1628")
      bg.addColorStop(0.5, "#060d1f")
      bg.addColorStop(1, "#030810")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      // -- Perspective grid --
      const horizon = height * 0.55
      const vanishX = width * 0.5
      ctx.save()
      ctx.globalAlpha = 0.08
      ctx.strokeStyle = "#00d4ff"
      ctx.lineWidth = 0.7

      for (let c = 0; c <= GRID_COLS; c++) {
        const xBase = (c / GRID_COLS) * width
        ctx.beginPath()
        ctx.moveTo(xBase, height)
        ctx.lineTo(vanishX + (xBase - vanishX) * 0.02, horizon)
        ctx.stroke()
      }
      for (let r = 0; r <= GRID_ROWS; r++) {
        const progress = r / GRID_ROWS
        const ease = Math.pow(progress, 1.6)
        const y = horizon + (height - horizon) * ease
        const spreadFactor = 1 - ease * 0.98
        const xLeft = vanishX - (vanishX * (1 - spreadFactor))
        const xRight = vanishX + (vanishX * (1 - spreadFactor)) + (width - vanishX)
        ctx.beginPath()
        ctx.moveTo(xLeft, y)
        ctx.lineTo(xRight, y)
        ctx.stroke()
      }
      ctx.restore()

      // -- Horizon glow --
      const hGlow = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 80)
      hGlow.addColorStop(0, "rgba(0,212,255,0)")
      hGlow.addColorStop(0.5, "rgba(0,212,255,0.07)")
      hGlow.addColorStop(1, "rgba(0,212,255,0)")
      ctx.fillStyle = hGlow
      ctx.fillRect(0, horizon - 60, width, 140)

      // -- Network connections --
      const MAX_DIST = Math.min(width, height) * 0.22
      ctx.save()
      ctx.lineWidth = 0.6
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.2
            ctx.strokeStyle = `rgba(0,212,255,${alpha})`
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }
      ctx.restore()

      // -- Network nodes --
      for (const node of nodes) {
        ctx.save()
        ctx.globalAlpha = 0.5
        ctx.fillStyle = "#00d4ff"
        ctx.beginPath()
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2)
        ctx.fill()
        // Glow ring
        const radGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 8)
        radGrad.addColorStop(0, "rgba(0,212,255,0.18)")
        radGrad.addColorStop(1, "rgba(0,212,255,0)")
        ctx.globalAlpha = 1
        ctx.fillStyle = radGrad
        ctx.beginPath()
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Move node
        node.x += node.vx
        node.y += node.vy
        if (node.x < 0 || node.x > width) node.vx *= -1
        if (node.y < 0 || node.y > height) node.vy *= -1
      }

      // -- Floating particles --
      for (const p of particles) {
        const screenX = p.x
        const screenY = p.y
        ctx.save()
        ctx.globalAlpha = p.opacity * (0.7 + p.z * 0.3)
        ctx.fillStyle = "#00d4ff"
        ctx.beginPath()
        ctx.arc(screenX, screenY, p.size * (0.4 + p.z * 0.6), 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0
      }

      // -- Pulsing center orb --
      const pulse = 0.7 + Math.sin(t * 0.03) * 0.3
      const orbX = width * 0.5
      const orbY = height * 0.5
      const orbR = Math.min(width, height) * 0.28 * pulse
      const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR)
      orbGrad.addColorStop(0, "rgba(0,212,255,0.06)")
      orbGrad.addColorStop(0.5, "rgba(0,100,200,0.04)")
      orbGrad.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = orbGrad
      ctx.fillRect(0, 0, width, height)

      t++
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 w-full h-full"
      aria-hidden="true"
    />
  )
}
