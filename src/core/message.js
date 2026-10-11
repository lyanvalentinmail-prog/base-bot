/**
 *  src/core/message.js — convierte un mensaje crudo de Baileys en un objeto cómodo
 *  para los plugins: m.reply(), m.download(), m.sendImage(), m.react(), etc.
 */
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import db from './store.js'
import log from './logger.js'
import config from '../../config.js'
import { resolveRole, ensureDailyLimit, remainingLimit, roleLabel } from './roles.js'
import {
  bareJid, extractText, getContentType, getQuoted, getMentionedJids, getMediaType,
  isGroupJid, jidToNumber, sameJid, sleep, extFromMime, smallToAscii
} from './utils.js'

export async function groupMetadata(sock, jid, ctx) {
  if (!isGroupJid(jid)) return null
  const cache = ctx.groupCache
  const hit = cache.get(jid)
  if (hit && Date.now() - hit.at < 60 * 1000) return hit.data
  try {
    const data = await sock.groupMetadata(jid)
    cache.set(jid, { data, at: Date.now() })
    return data
  } catch (e) {
    log.debug('No pude leer metadata del grupo', jid, e.message)
    return hit?.data || null
  }
}

export async function buildMessage(sock, msg, ctx) {
  const key = msg.key || {}
  const chat = key.remoteJid
  if (!chat) return null

  const message = msg.message || {}
  const type = getContentType(message)
  const text = extractText(message)
  const senderJid = key.fromMe ? sock.user?.id : key.participant || chat
  const sender = bareJid(senderJid)
  const isGroup = isGroupJid(chat)
  const mentions = getMentionedJids(message)
  const quotedRaw = getQuoted(message)

  /* ── usuario y rol ─────────────────────────────────────── */
  const user = db.user(sender)
  if (msg.pushName && user && (user.name !== msg.pushName)) user.name = msg.pushName
  user.stats.messages = (user.stats?.messages || 0) + 1
  ensureDailyLimit(user)

  const ownerNumbers = db.owners
  const isOwner = !!key.fromMe || ownerNumbers.includes(jidToNumber(sender)) || ownerNumbers.includes(jidToNumber(key.participant || ''))
  user.banned = user.banned || db.data.bans.includes(jidToNumber(sender))

  /* ── grupo ────────────────────────────────────────────── */
  const group = isGroup ? db.group(chat) : null
  let meta = null
  let isAdmin = false
  let isBotAdmin = false
  if (isGroup) {
    meta = await groupMetadata(sock, chat, ctx)
    if (meta) {
      if (group && meta.subject && group.name !== meta.subject) group.name = meta.subject
      const admins = (meta.participants || []).filter((p) => p.admin)
      const me = bareJid(sock.user?.id || '')
      isAdmin = admins.some((p) => sameJid(p.id, sender)) || isOwner
      isBotAdmin = admins.some((p) => sameJid(p.id, me))
    }
  }

  const role = resolveRole({ user, isOwner, isGroupAdmin: isAdmin })

  /* ── comandos ─────────────────────────────────────────── */
  const prefix = ctx.prefix
  const prefixes = Array.isArray(prefix) ? prefix : [prefix]
  let usedPrefix = null
  let command = null
  let args = []
  if (ctx.commandChars.some((p) => text.startsWith(p))) {
    usedPrefix = ctx.commandChars.find((p) => text.startsWith(p))
    const parts = text.slice(usedPrefix.length).trim().split(/\s+/)
    // smallToAscii: así también funcionan los comandos en versalitas (.ᴍᴇɴᴜ ≡ .menu)
    command = smallToAscii(parts.shift() || '').toLowerCase()
    args = parts
  }

  const quoted = quotedRaw
    ? {
        ...quotedRaw,
        text: extractText(quotedRaw.message),
        type: getMediaType(quotedRaw.message) || 'text',
        async download() {
          return downloadMedia(quotedRaw.message, sock)
        }
      }
    : null

  const m = {
    ctx,
    sock,
    raw: msg,
    key,
    chat,
    message,
    type,
    text,
    body: text,
    sender,
    senderNumber: jidToNumber(sender),
    senderJid,
    pushName: msg.pushName || user?.name || jidToNumber(sender),
    isGroup,
    isStatus: chat === 'status@broadcast',
    isPrivate: !isGroup,
    fromMe: !!key.fromMe,
    isOwner,
    isAdmin,
    isBotAdmin,
    role,
    roleLabel: roleLabel(role),
    user,
    group,
    meta,
    mentions,
    mentionedJid: mentions,
    quoted,
    prefix: usedPrefix,
    command,
    args,
    arg: args[0],
    rest: args.slice(1).join(' '),
    fullText: args.join(' '),
    mediaType: getMediaType(message),
    isMedia: !!getMediaType(message),
    isCommand: !!command,
    timestamp: Number(msg.messageTimestamp) || Math.floor(Date.now() / 1000),
    remaining: remainingLimit(user, role)
  }

  /* ── helpers de envío ─────────────────────────────────── */
  m.reply = async (content, options = {}) => {
    const payload = typeof content === 'string' ? { text: content } : content
    return sock.sendMessage(chat, { ...payload, ...options }, { quoted: msg, ...(options.sendOptions || {}) })
  }

  m.send = async (content, options = {}) => sock.sendMessage(chat, typeof content === 'string' ? { text: content } : content, options)

  m.replyImage = (buffer, caption = '', options = {}) =>
    m.isPrivate || !options.quoted
      ? sock.sendMessage(chat, { image: buffer, caption, ...options })
      : sock.sendMessage(chat, { image: buffer, caption, ...options }, { quoted: msg })

  m.sendImage = (buffer, caption = '', options = {}) => sock.sendMessage(chat, { image: buffer, caption, ...options })

  m.sendVideo = (buffer, caption = '', options = {}) => sock.sendMessage(chat, { video: buffer, caption, ...options })

  m.sendAudio = (buffer, options = {}) => sock.sendMessage(chat, { audio: buffer, mimetype: 'audio/mpeg', ptt: false, ...options })

  m.sendVoice = (buffer, options = {}) => sock.sendMessage(chat, { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true, ...options })

  m.sendSticker = (buffer, options = {}) => sock.sendMessage(chat, { sticker: buffer, ...options })

  m.sendDocument = (buffer, filename = 'archivo', mimetype = 'application/octet-stream', options = {}) =>
    sock.sendMessage(chat, { document: buffer, fileName: filename, mimetype, ...options })

  m.react = async (emoji = '✅') => {
    try {
      await sock.sendMessage(chat, { react: { text: emoji, key: msg.key } })
    } catch (e) {
      log.debug('react falló:', e.message)
    }
  }

  m.delete = async () => {
    try {
      await sock.sendMessage(chat, { delete: msg.key })
    } catch (e) {
      log.debug('delete falló:', e.message)
    }
  }

  m.presence = (type = 'composing') => sock.sendPresenceUpdate(type, chat).catch(() => {})

  /** Descarga el media del propio mensaje */
  m.download = () => downloadMedia(message, sock)

  /** Descarga el media del mensaje citado */
  m.downloadQuoted = () => (quoted ? quoted.download() : null)

  /** Cita el mensaje tal cual (reenvío) */
  m.forward = (jid = chat) => sock.sendMessage(jid, { forward: msg, forceForward: true })

  m.mentionedOrQuoted = () => {
    if (mentions.length) return bareJid(mentions[0])
    if (quoted?.sender) return bareJid(quoted.sender)
    return null
  }

  m.wait = (ms = 900) => sleep(ms)

  return m
}

/** Descarga media (imagen, video, audio, sticker, documento) a Buffer */
export async function downloadMedia(message, sock) {
  try {
    const buffer = await downloadMediaMessage(
      { key: {}, message },
      'buffer',
      {},
      { logger: log, reuploadRequest: sock?.updateMediaMessage?.bind(sock) }
    )
    return buffer
  } catch (e) {
    // reintento con la clave real del mensaje
    try {
      return await downloadMediaMessage({ message }, 'buffer', {}, { logger: log })
    } catch (e2) {
      log.debug('downloadMedia falló:', e.message, '→', e2.message)
      return null
    }
  }
}

/** Nombre + extensión para documentos generados */
export function fileName(name = 'archivo', mimetype = 'application/octet-stream') {
  return `${name}.${extFromMime(mimetype)}`
}

export function isOwnerJid(jid) {
  return db.owners.includes(jidToNumber(jid))
}

export const behaviorOnly = () => config.behavior.only
