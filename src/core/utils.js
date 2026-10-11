/**
 *  src/core/utils.js — utilidades compartidas
 */

export const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

/* ── JID / números ─────────────────────────────────────────── */
export const BOT_SUFFIX = '@s.whatsapp.net'
export const GROUP_SUFFIX = '@g.us'

export function normalizePhone(input = '') {
  let digits = String(input).replace(/[^0-9]/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  return digits
}

export function toJid(number, server = 's.whatsapp.net') {
  if (!number) return ''
  if (String(number).includes('@')) return String(number)
  return `${normalizePhone(number)}@${server}`
}

export function jidToNumber(jid = '') {
  return String(jid).split('@')[0].split(':')[0]
}

export function jidToName(jid = '') {
  return jidToNumber(jid)
}

export const isGroupJid = (jid = '') => String(jid).endsWith(GROUP_SUFFIX)
export const isPrivateJid = (jid = '') => String(jid).endsWith('@s.whatsapp.net') || String(jid).endsWith('@lid')

/** Quita el :12 (device) de un jid para comparar */
export function bareJid(jid = '') {
  if (!jid) return ''
  const [num, server] = String(jid).split('@')
  return `${num.split(':')[0]}@${server}`
}

/** Compara dos jids ignorando el device */
export function sameJid(a = '', b = '') {
  return bareJid(a) === bareJid(b)
}

/* ── Texto ─────────────────────────────────────────────────── */
const SMALL = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ',
  l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ',
  w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
}

/** Inverso: ᴍᴇɴᴜ → menu (para que también funcione escribir los comandos en versalitas) */
const SMALL_TO_ASCII = Object.fromEntries(Object.entries(SMALL).map(([k, v]) => [v, k]))

/** Convierte texto a versalitas: hola → ʜᴏʟᴀ */
export function smallCaps(text = '') {
  return String(text)
    .toLowerCase()
    .split('')
    .map((c) => SMALL[c] || c)
    .join('')
}

/** Convierte versalitas de vuelta a texto normal: ʜᴏʟᴀ → hola */
export function smallToAscii(text = '') {
  return String(text)
    .split('')
    .map((c) => SMALL_TO_ASCII[c] || c)
    .join('')
}

export function capitalize(text = '') {
  return String(text).charAt(0).toUpperCase() + String(text).slice(1)
}

export function reverseText(text = '') {
  return [...String(text)].reverse().join('')
}

export function truncate(text = '', len = 80) {
  const s = String(text).replace(/\s+/g, ' ').trim()
  return s.length > len ? s.slice(0, len - 1) + '…' : s
}

export function mentionTag(jid) {
  return `@${jidToNumber(jid)}`
}

export function isUrl(text = '') {
  return /^https?:\/\/[^\s]+$/i.test(String(text).trim())
}

export function extractUrl(text = '') {
  const m = String(text).match(/https?:\/\/[^\s]+/i)
  return m ? m[0] : null
}

/* ── Números / azar ────────────────────────────────────────── */
export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
export const pick = (arr = []) => arr[Math.floor(Math.random() * arr.length)]
export const shuffle = (arr = []) => [...arr].sort(() => Math.random() - 0.5)

/** Porcentaje estable a partir de un texto (mismo texto → mismo %) */
export function seededPercent(seedText = '', max = 100) {
  let h = 2166136261
  for (const ch of String(seedText)) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h % (max + 1))
}

export function formatNumber(n = 0) {
  return Number(n || 0).toLocaleString('es-ES')
}

export function clockString(ms = 0) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':')
}

export function prettyBytes(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`
}

export function today() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function humanDate(date = new Date()) {
  const d = new Date(date)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return 'ʙᴜᴇɴᴀꜱ ᴍᴀᴅʀᴜɢᴀᴅᴀꜱ'
  if (h < 12) return 'ʙᴜᴇɴᴏꜱ ᴅɪ́ᴀꜱ'
  if (h < 19) return 'ʙᴜᴇɴᴀꜱ ᴛᴀʀᴅᴇꜱ'
  return 'ʙᴜᴇɴᴀꜱ ɴᴏᴄʜᴇꜱ'
}

/* ── Mensajes de WhatsApp (ayudas) ─────────────────────────── */
export function getContentType(message = {}) {
  if (!message) return undefined
  return Object.keys(message).find((k) =>
    ['conversation', 'extendedTextMessage', 'imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage',
      'documentMessage', 'documentWithCaptionMessage', 'buttonsResponseMessage', 'listResponseMessage',
      'templateButtonReplyMessage', 'ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2',
      'viewOnceMessageV2Extension', 'reactionMessage', 'protocolMessage', 'editedMessage'].includes(k)
  )
}

/** Extrae el texto de cualquier tipo de mensaje */
export function extractText(message = {}) {
  if (!message) return ''
  const unwrap = (m) => (m?.ephemeralMessage?.message || m?.viewOnceMessage?.message || m?.viewOnceMessageV2?.message || m)
  const m = unwrap(message)
  const type = getContentType(m)
  const content = type ? m[type] : m
  switch (type) {
    case 'conversation':
      return content?.message || content || ''
    case 'extendedTextMessage':
      return content?.text || ''
    case 'imageMessage':
    case 'videoMessage':
    case 'documentMessage':
      return content?.caption || ''
    case 'documentWithCaptionMessage':
      return content?.message?.documentMessage?.caption || ''
    case 'buttonsResponseMessage':
      return content?.selectedButtonId || content?.selectedDisplayText || ''
    case 'listResponseMessage':
      return content?.singleSelectReply?.selectedRowId || ''
    case 'templateButtonReplyMessage':
      return content?.selectedId || ''
    case 'reactionMessage':
      return content?.text || ''
    default:
      return ''
  }
}

/** Devuelve la info del mensaje citado (quoted) */
export function getQuoted(message = {}) {
  const ctx =
    message?.extendedTextMessage?.contextInfo ||
    message?.imageMessage?.contextInfo ||
    message?.videoMessage?.contextInfo ||
    message?.audioMessage?.contextInfo ||
    message?.documentMessage?.contextInfo ||
    message?.stickerMessage?.contextInfo ||
    null
  if (!ctx?.quotedMessage) return null
  return {
    key: {
      remoteJid: ctx.remoteJid,
      fromMe: ctx.participant ? ctx.participant === ctx.remoteJid : false,
      id: ctx.stanzaId,
      participant: ctx.participant
    },
    message: ctx.quotedMessage,
    sender: ctx.participant
  }
}

export function getMentionedJids(message = {}) {
  const ctx =
    message?.extendedTextMessage?.contextInfo ||
    message?.imageMessage?.contextInfo ||
    message?.videoMessage?.contextInfo ||
    message?.audioMessage?.contextInfo ||
    message?.documentMessage?.contextInfo ||
    null
  return ctx?.mentionedJid || []
}

/* ── Media ─────────────────────────────────────────────────── */
const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
  'application/zip': 'zip'
}

export function extFromMime(mime = '') {
  return EXT_BY_MIME[String(mime).split(';')[0]] || 'bin'
}

/** Convierte una respuesta HTTP en Buffer */
export async function fetchBuffer(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

/* ── Validación de media de WhatsApp ───────────────────────── */
export function getMediaType(message = {}) {
  const type = getContentType(message)
  if (!type) return null
  const map = {
    imageMessage: 'image',
    videoMessage: 'video',
    audioMessage: 'audio',
    stickerMessage: 'sticker',
    documentMessage: 'document',
    documentWithCaptionMessage: 'document'
  }
  return map[type] || null
}

export function safeJson(text = '', fallback = null) {
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}
