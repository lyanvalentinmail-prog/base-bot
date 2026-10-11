/**
 *  src/core/canvas.js — tarjetas de imagen (bienvenida, despedida, ship, level up…)
 *
 *  1) Motor LOCAL con @napi-rs/canvas (instalación opcional, funciona en Termux arm64).
 *     Los fondos se leen de assets/canvas/*.png y, si no existen, se generan al vuelo.
 *  2) Si el motor local no está disponible, se usan los endpoints CANVAS de la API
 *     (/api/welcome, /api/goodbye, /api/ship, /api/gay, /api/iqc).
 */
import fs from 'node:fs'
import path from 'node:path'
import config from '../../config.js'
import api from './api.js'
import log from './logger.js'
import { pick, seededPercent } from './utils.js'

const CANVAS_DIR = config.paths.canvas
const FONT_DIR = path.join(config.paths.assets, 'fonts')

let skia = null // módulo @napi-rs/canvas
let fontFamily = null
let loaded = false

/* ── utilidades de texto para canvas ───────────────────────── */
const SMALL_TO_ASCII = {
  ᴀ: 'a', ʙ: 'b', ᴄ: 'c', ᴅ: 'd', ᴇ: 'e', ꜰ: 'f', ɢ: 'g', ʜ: 'h', ɪ: 'i', ᴊ: 'j', ᴋ: 'k', ʟ: 'l',
  ᴍ: 'm', ɴ: 'n', ᴏ: 'o', ᴘ: 'p', ǫ: 'q', ʀ: 'r', ꜱ: 's', ᴛ: 't', ᴜ: 'u', ᴠ: 'v', ᴡ: 'w', ʏ: 'y', ᴢ: 'z'
}

/** Deja solo caracteres que las fuentes normales pueden dibujar */
export function toRenderable(text = '') {
  return String(text)
    .split('')
    .map((c) => SMALL_TO_ASCII[c] || c)
    .join('')
    .normalize('NFC')
    .replace(/[\u0300-\u036f]/g, (m) => m) // conserva tildes
    .replace(/[\u2500-\uFFFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeName(text = '', fallback = 'Usuario') {
  const clean = toRenderable(text).slice(0, 26)
  return clean || fallback
}

/* ── carga del motor ───────────────────────────────────────── */
export async function loadCanvasEngine() {
  if (loaded) return skia
  loaded = true
  try {
    skia = await import('@napi-rs/canvas')
    const { GlobalFonts } = skia
    const candidates = []
    if (fs.existsSync(FONT_DIR)) {
      for (const f of fs.readdirSync(FONT_DIR)) if (/\.(ttf|otf|ttc)$/i.test(f)) candidates.push(path.join(FONT_DIR, f))
    }
    candidates.push(
      // Android / Termux
      '/system/fonts/Roboto-Regular.ttf',
      '/system/fonts/Roboto-Bold.ttf',
      '/system/fonts/NotoSans-Regular.ttf',
      '/system/fonts/NotoSans-Bold.ttf',
      // Linux
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
      // macOS
      '/System/Library/Fonts/Supplemental/Arial.ttf',
      '/System/Library/Fonts/Supplemental/Verdana.ttf',
      // Windows
      'C:/Windows/Fonts/segoeui.ttf',
      'C:/Windows/Fonts/arial.ttf'
    )
    for (const file of candidates) {
      try {
        if (!fs.existsSync(file)) continue
        const family = /bold/i.test(file) ? 'BotBold' : /Roboto|Noto|PlusJakarta/i.test(path.basename(file)) ? 'BotSans' : 'BotFont'
        GlobalFonts.registerFromPath(file, family)
        fontFamily = fontFamily || family
      } catch {
        /* siguiente */
      }
    }
    if (!fontFamily) {
      const families = GlobalFonts.families || []
      if (families.length) fontFamily = families[0].family
    }
    log.ok(`Canvas local activo (fuente: ${fontFamily || 'por defecto'})`)
    return skia
  } catch (e) {
    log.warn('Canvas local no disponible (@napi-rs/canvas):', e.message.split('\n')[0])
    log.warn('→ Las tarjetas se generarán con la API. Instala con: npm i @napi-rs/canvas')
    skia = null
    return null
  }
}

export const localCanvasAvailable = () => !!skia && !!fontFamily

function font(size, weight = 'bold') {
  return `${weight} ${size}px "${fontFamily}"`.replace('bold bold', 'bold')
}

/* ── dibujo ────────────────────────────────────────────────── */
function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function circleImage(ctx, img, cx, cy, r) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  const size = r * 2
  const ratio = Math.max(size / img.width, size / img.height)
  const w = img.width * ratio
  const h = img.height * ratio
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h)
  ctx.restore()
}

async function loadBg(kind) {
  const W = config.canvas.width
  const H = config.canvas.height
  // acepta assets/canvas/<tipo>.png o <tipo>.jpg (lo que tengas)
  const candidatesFiles = [path.join(CANVAS_DIR, `${kind}.png`), path.join(CANVAS_DIR, `${kind}.jpg`), path.join(CANVAS_DIR, `${kind}.jpeg`)]
  const file = candidatesFiles.find((f) => fs.existsSync(f))
  if (file) {
    try {
      const img = await skia.loadImage(fs.readFileSync(file))
      const canvas = skia.createCanvas(W, H)
      const ctx = canvas.getContext('2d')
      const ratio = Math.max(W / img.width, H / img.height)
      const w = img.width * ratio
      const h = img.height * ratio
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h)
      return { canvas, ctx }
    } catch (e) {
      log.debug('Fondo', kind, 'inválido:', e.message)
    }
  }
  // Fondo generado al vuelo (degradado + brillos suaves)
  const canvas = skia.createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  const palettes = {
    welcome: ['#052e16', '#15803d', '#4ade80'],
    despedida: ['#1e1b4b', '#4338ca', '#a5b4fc'],
    ship: ['#4c0519', '#be123c', '#fda4af'],
    gay: ['#1f2937', '#7c3aed', '#f472b6'],
    levelup: ['#431407', '#c2410c', '#fdba74'],
    levelup2: ['#082f49', '#0284c7', '#7dd3fc'],
    rank: ['#111827', '#334155', '#94a3b8']
  }
  const [c1, c2, c3] = palettes[kind] || palettes.welcome
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, c1)
  grad.addColorStop(0.55, c2)
  grad.addColorStop(1, c3)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
  for (let i = 0; i < 26; i++) {
    ctx.beginPath()
    ctx.globalAlpha = 0.05 + Math.random() * 0.08
    ctx.fillStyle = '#ffffff'
    ctx.arc(Math.random() * W, Math.random() * H, 12 + Math.random() * 90, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  return { canvas, ctx }
}

async function toImage(input) {
  if (!input) return null
  try {
    if (Buffer.isBuffer(input)) {
      if (!input.length) return null
      return await skia.loadImage(input)
    }
    if (typeof input === 'string') {
      if (fs.existsSync(input)) return await skia.loadImage(fs.readFileSync(input))
      const res = await fetch(input)
      if (!res.ok) return null
      return await skia.loadImage(Buffer.from(await res.arrayBuffer()))
    }
  } catch (e) {
    log.debug('Avatar inválido:', e.message)
  }
  return null
}

/** Avatar por defecto dibujado (inicial del nombre) */
function placeholderAvatar(ctx, cx, cy, r, name = '?') {
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  grad.addColorStop(0, '#22c55e')
  grad.addColorStop(1, '#0ea5e9')
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = font(r * 0.95)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(toRenderable(name).charAt(0).toUpperCase() || '?', cx, cy + r * 0.04)
  ctx.restore()
}

async function drawCard(kind, opts = {}) {
  const { canvas, ctx } = await loadBg(kind)
  const W = config.canvas.width
  const H = config.canvas.height
  const accent = opts.accent || config.canvas.accent

  // capa oscura para que el texto siempre se lea
  const overlay = ctx.createLinearGradient(0, 0, 0, H)
  overlay.addColorStop(0, 'rgba(0,0,0,0.30)')
  overlay.addColorStop(0.5, 'rgba(0,0,0,0.45)')
  overlay.addColorStop(1, 'rgba(0,0,0,0.75)')
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, W, H)

  // marco
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 3
  roundRect(ctx, 14, 14, W - 28, H - 28, 26)
  ctx.stroke()

  // avatar
  const avatarImg = await toImage(opts.avatar)
  const ax = 210
  const ay = H / 2
  const ar = 130
  ctx.save()
  ctx.beginPath()
  ctx.arc(ax, ay, ar + 8, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fill()
  ctx.strokeStyle = accent
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(ax, ay, ar + 6, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
  if (avatarImg) circleImage(ctx, avatarImg, ax, ay, ar)
  else placeholderAvatar(ctx, ax, ay, ar, opts.username || opts.name || 'B')

  const tx = 380
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const title = opts.title || 'bienvenido'
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.shadowBlur = 12
  ctx.fillStyle = accent
  ctx.font = font(58, 'bold')
  ctx.fillText(toRenderable(title).toUpperCase().slice(0, 22), tx, 175)

  ctx.fillStyle = '#ffffff'
  ctx.font = font(46, 'bold')
  ctx.fillText(safeName(opts.username || opts.name), tx, 235)

  ctx.shadowBlur = 6
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = font(30, 'normal')
  const line2 = opts.subtitle || ''
  if (line2) ctx.fillText(toRenderable(line2).slice(0, 48), tx, 285)
  const line3 = opts.extra || ''
  if (line3) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = font(26, 'normal')
    ctx.fillText(toRenderable(line3).slice(0, 52), tx, 328)
  }

  // barra de progreso / porcentaje
  if (typeof opts.percent === 'number') {
    const bx = tx
    const by = 350
    const bw = W - bx - 120
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    roundRect(ctx, bx, by, bw, 34, 17)
    ctx.fill()
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0)
    grad.addColorStop(0, accent)
    grad.addColorStop(1, '#f472b6')
    ctx.fillStyle = grad
    roundRect(ctx, bx, by, Math.max(34, (bw * Math.min(100, opts.percent)) / 100), 34, 17)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = font(24, 'bold')
    ctx.textAlign = 'right'
    ctx.fillText(`${opts.percent}%`, bx + bw, by + 26)
    ctx.textAlign = 'left'
  }

  // firma
  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = font(24, 'normal')
  ctx.textAlign = 'right'
  ctx.fillText(toRenderable(opts.footer || config.bot.name), W - 40, H - 40)

  return canvas.toBuffer('image/png')
}

/* ── API pública ───────────────────────────────────────────── */
export const KINDS = {
  welcome: { bg: 'welcome', title: 'bienvenido' },
  goodbye: { bg: 'despedida', title: 'hasta pronto' },
  ship: { bg: 'ship', title: 'ship' },
  gay: { bg: 'gay', title: 'resultado' },
  levelup: { bg: 'levelup', title: 'nivel arriba' },
  rank: { bg: 'rank', title: 'perfil' },
  iqc: { bg: 'levelup2', title: 'iq test' },
  event: { bg: 'levelup2', title: 'evento' }
}

/** Tarjeta local (devuelve Buffer o null) */
export async function renderLocal(kind, opts = {}) {
  if (!skia) await loadCanvasEngine()
  if (!skia || !fontFamily) return null
  try {
    return await drawCard(KINDS[kind]?.bg || 'welcome', { title: KINDS[kind]?.title, ...opts })
  } catch (e) {
    log.warn('Error dibujando tarjeta', kind, ':', e.message)
    return null
  }
}

const apiAvatar = (avatar) => (typeof avatar === 'string' && /^https?:/.test(avatar) ? avatar : undefined)

/** Tarjeta vía API (usa las imágenes del servidor SiputZX) */
export async function renderApi(kind, opts = {}) {
  try {
    const seed = opts.seed ?? seededPercent(`${opts.username || ''}${opts.name || ''}${opts.name1 || ''}${opts.name2 || ''}`, 100)
    switch (kind) {
      case 'welcome':
      case 'goodbye': {
        const path = kind === 'welcome' ? '/api/welcome' : '/api/goodbye'
        const query = { username: safeName(opts.username), group: opts.group || 'Grupo', members: opts.members || 1, avatar: apiAvatar(opts.avatar) }
        if (Buffer.isBuffer(opts.avatar)) {
          return api.upload(path, opts.avatar, { query, filename: 'avatar.jpg', mimetype: 'image/jpeg' })
        }
        return api.buffer(path, query, { method: 'POST' })
      }
      case 'ship':
        return api.upload('/api/ship', Buffer.isBuffer(opts.avatar1) ? opts.avatar1 : Buffer.alloc(0), {
          query: { name1: safeName(opts.name1), name2: safeName(opts.name2), seed },
          fields: {}
        })
      case 'gay':
        if (Buffer.isBuffer(opts.avatar)) return api.upload('/api/gay', opts.avatar, { query: { name: safeName(opts.name), seed } })
        return api.buffer('/api/gay', { name: safeName(opts.name), seed, avatar: apiAvatar(opts.avatar) }, { method: 'POST' })
      case 'iqc':
        if (Buffer.isBuffer(opts.avatar)) return api.upload('/api/iqc', opts.avatar, { query: { name: safeName(opts.name), bio: opts.bio || '', seed } })
        return api.buffer('/api/iqc', { name: safeName(opts.name), bio: opts.bio || '', seed, avatar: apiAvatar(opts.avatar) }, { method: 'POST' })
      default:
        return null
    }
  } catch (e) {
    log.debug('Canvas API falló:', e.message)
    return null
  }
}

/**
 * Genera una tarjeta: intenta local → API → null
 * Devuelve { buffer, source } o null
 */
export async function card(kind, opts = {}) {
  const prefer = config.canvas.preferred
  const order = prefer === 'local' ? ['local'] : prefer === 'api' ? ['api'] : ['local', 'api']
  for (const mode of order) {
    if (mode === 'local') {
      const buffer = await renderLocal(kind, opts)
      if (buffer) return { buffer, source: 'local' }
    } else {
      const r = await renderApi(kind, opts)
      if (r?.ok && r.buffer) return { buffer: r.buffer, source: 'api' }
      if (r && r.ok === false) log.debug('Canvas API:', r.error || r.message)
    }
  }
  return null
}

/** Atajos usados por los plugins y eventos */
export const welcomeCard = (o) => card('welcome', o)
export const goodbyeCard = (o) => card('goodbye', o)
export const shipCard = (o) => card('ship', o)
export const gayCard = (o) => card('gay', o)
export const levelUpCard = (o) => card('levelup', o)
export const rankCard = (o) => card('rank', o)
export const iqCard = (o) => card('iqc', o)

export function listBackgrounds() {
  try {
    if (!fs.existsSync(CANVAS_DIR)) return []
    return fs.readdirSync(CANVAS_DIR).filter((f) => f.endsWith('.png'))
  } catch {
    return []
  }
}

export function randomAccent() {
  return pick(['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444', '#06b6d4'])
}

export default { card, renderLocal, renderApi, loadCanvasEngine, localCanvasAvailable, listBackgrounds, KINDS }
