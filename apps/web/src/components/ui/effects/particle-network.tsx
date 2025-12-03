import { useEffect, useRef } from 'react'

class Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number

  constructor(width: number, height: number) {
    this.x = Math.random() * width
    this.y = Math.random() * height
    this.vx = (Math.random() - 0.5) * 0.5
    this.vy = (Math.random() - 0.5) * 0.5
    this.size = Math.random() * 2 + 1
  }

  update(width: number, height: number, mouse: { x: number; y: number }, mouseDistance: number) {
    this.x += this.vx
    this.y += this.vy

    if (this.x < 0 || this.x > width) this.vx *= -1
    if (this.y < 0 || this.y > height) this.vy *= -1

    const dx = mouse.x - this.x
    const dy = mouse.y - this.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < mouseDistance) {
      const forceDirectionX = dx / dist
      const forceDirectionY = dy / dist
      const force = (mouseDistance - dist) / mouseDistance
      const directionX = forceDirectionX * force * 0.5
      const directionY = forceDirectionY * force * 0.5
      this.vx += directionX
      this.vy += directionY
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = canvas.offsetWidth)
    let height = (canvas.height = canvas.offsetHeight)

    const particles: Particle[] = []
    const particleCount = 60
    const connectionDistance = 150
    const mouseDistance = 200

    const mouse = { x: -1000, y: -1000 }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(width, height))
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      particles.forEach((p) => {
        p.update(width, height, mouse, mouseDistance)
        p.draw(ctx)
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          if (!p1 || !p2) continue

          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDistance) {
            ctx.beginPath()
            const opacity = 1 - dist / connectionDistance
            ctx.strokeStyle = `rgba(20, 184, 166, ${opacity * 0.4})`
            ctx.lineWidth = 1
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full bg-[#051124]" />
}
