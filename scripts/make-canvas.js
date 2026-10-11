#!/usr/bin/env node
/**
 *  scripts/make-canvas.js — genera los fondos de las tarjetas (assets/canvas/*.png)
 *
 *  Uso:  node scripts/make-canvas.js            (solo crea los que falten)
 *        node scripts/make-canvas.js --force    (los regenera todos)
 *
 *  Si ya tienes tus propias imágenes (las de tu Drive, por ejemplo), ponlas en
 *  assets/canvas/ con estos nombres y NO hace falta ejecutar este script:
 *     welcome.png  despedida.png  ship.png  gay.png  levelup.png  levelup2.png  rank.png
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(here, '..', 'assets', 'canvas')
const W = 1024
const H = 450
const force = process.argv.includes('--force')

const PALETTES = {
  welcome: ['#031f10', '#0f5132', '#22c55e', '#a7f3d0'],
  despedida: ['#140b2e', '#3730a3', '#6366f1', '#c7d2fe'],
  ship: ['#2b0413', '#9f1239', '#fb7185', '#ffe4e6'],
  gay: ['#1f1233', '#6d28d9', '#ec4899', '#fcd34d'],
  levelup: ['#2a1003', '#b45309', '#f59e0b', '#fde68a'],
  levelup2: ['#041f2e', '#0369a1', '#38bdf8', '#bae6fd'],
  rank: ['#0b1220', '#1e293b', '#475569', '#cbd5e1']
}

async function main() {
  let skia
  try {
    skia = await import('@napi-rs/canvas')
  } catch {
    console.error('❌ Necesitas @napi-rs/canvas para generar los fondos:  npm i @napi-rs/canvas')
    process.exit(1)
  }
  fs.mkdirSync(OUT, { recursive: true })

  for (const [kind, colors] of Object.entries(PALETTES)) {
    const file = path.join(OUT, `${kind}.png`)
    if (fs.existsSync(file) && !force) {
      console.log(`• ${kind}.png ya existe (usa --force para regenerar)`)
      continue
    }
    const canvas = skia.createCanvas(W, H)
    const ctx = canvas.getContext('2d')

    // degradado base diagonal
    const grad = ctx.createLinearGradient(0, 0, W, H)
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // manchas suaves de luz
    for (let i = 0; i < 30; i++) {
      const g2 = ctx.createRadialGradient(
        Math.random() * W, Math.random() * H, 0,
        Math.random() * W, Math.random() * H, 60 + Math.random() * 220
      )
      g2.addColorStop(0, `rgba(255,255,255,${0.04 + Math.random() * 0.07})`)
      g2.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, W, H)
    }

    // ondas decorativas
    ctx.globalAlpha = 0.14
    ctx.strokeStyle = colors[3]
    ctx.lineWidth = 3
    for (let w = 0; w < 5; w++) {
      ctx.beginPath()
      const base = H * (0.35 + w * 0.13)
      for (let x = 0; x <= W; x += 12) {
        const y = base + Math.sin((x / W) * Math.PI * (2 + w)) * 26
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // puntos tipo constelación
    ctx.globalAlpha = 0.35
    for (let i = 0; i < 90; i++) {
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // viñeta para que el texto resalte
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.75)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, W, H)

    fs.writeFileSync(file, canvas.toBuffer('image/png'))
    console.log(`✅ ${path.relative(process.cwd(), file)} (${W}x${H})`)
  }
  console.log('\nListo. Los fondos están en assets/canvas/ — puedes reemplazarlos por tus propias imágenes.')
}

main()
