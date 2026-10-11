/**
 *  src/core/events.js — eventos de WhatsApp:
 *  entradas/salidas del grupo (tarjetas canvas), antidelete, llamadas, cambios de grupo
 */
import config from '../../config.js'
import db from './store.js'
import log from './logger.js'
import canvas from './canvas.js'
import { bareJid, jidToNumber, mentionTag, smallCaps } from './utils.js'

const getPushName = (sock, jid) => {
  const c = sock?.store?.contacts?.[jid] || sock?.store?.contacts?.[bareJid(jid)]
  return c?.notify || c?.name || c?.verifiedName || jidToNumber(jid)
}

async function pfpBuffer(sock, jid) {
  try {
    const url = await sock.profilePictureUrl(jid, 'image')
    if (!url) return { url: null, buffer: null }
    const res = await fetch(url)
    if (!res.ok) return { url, buffer: null }
    return { url, buffer: Buffer.from(await res.arrayBuffer()) }
  } catch {
    return { url: null, buffer: null }
  }
}

/**
 * Reenvía un mensaje borrado (si el grupo tiene antidelete activado).
 * Lo llaman: messages.update, messages.delete y las revocaciones (protocolMessage).
 */
export async function resendDeleted(sock, chat, messageId, byJid) {
  try {
    const group = db.group(chat)
    if (!group?.settings.antidelete) return
    const cached = db.getCachedMessage(chat, messageId)
    if (!cached) return
    const who = byJid ? mentionTag(bareJid(byJid)) : 'alguien'
    await sock.sendMessage(chat, {
      text: `🗑️ *ᴀɴᴛɪᴅᴇʟᴇᴛᴇ*\n┊ ${who} ʙᴏʀʀᴏ́ ᴜɴ ᴍᴇɴsᴀᴊᴇ\n┊ ᴀᴜᴛᴏʀ : ${cached.pushName || jidToNumber(cached.participant || '')}`
    })
    const forwardKey = {
      remoteJid: chat,
      fromMe: false,
      id: cached.key?.id,
      participant: cached.participant || chat
    }
    await sock.sendMessage(chat, { forward: { key: forwardKey, message: cached.message } }).catch(async () => {
      await sock.sendMessage(chat, { text: '⚠️ No pude recuperar el contenido borrado.' })
    })
  } catch (e) {
    log.debug('antidelete falló:', e.message)
  }
}

/** Bienvenida / despedida con tarjeta canvas */
export function bindGroupEvents(sock, ctx) {
  /** ⚠️ siempre el socket VIVO: al reconectar, Baileys crea uno nuevo */
  const live = () => ctx.sock || sock

  live().ev.on('group-participants.update', async ({ id, participants, action }) => {
    try {
      const group = db.group(id)
      const meta = await live().groupMetadata(id).catch(() => null)
      if (meta?.subject) group.name = meta.subject
      db.markDirty()

      for (const raw of participants) {
        const jid = bareJid(raw.id || raw)
        const name = getPushName(sock, jid)
        const members = meta?.participants?.length || 0
        const { url, buffer } = await pfpBuffer(live(), jid)

        if (action === 'add' && group.settings.welcome) {
          const card = await canvas.card('welcome', {
            avatar: buffer || url,
            username: name,
            group: meta?.subject || group.name || 'el grupo',
            members,
            subtitle: `ɢʀᴀᴄɪᴀs ᴘᴏʀ ᴜɴɪʀᴛᴇ ᴀ ${meta?.subject || 'el grupo'}`,
            extra: `ᴀʜᴏʀᴀ sᴏᴍᴏs ${members} ᴍɪᴇᴍʙʀᴏs`,
            footer: ctx.botName
          })
          const caption =
            `╭───「 ʙɪᴇɴᴠᴇɴɪᴅᴏ/a 」\n│ ${mentionTag(jid)}\n│ ᴀ ${meta?.subject || 'el grupo'} 🎉\n` +
            `│ sᴏᴍᴏs ${members} ᴍɪᴇᴍʙʀᴏs\n│ ᴇsᴄʀɪʙᴇ *${ctx.prefix}ᴍᴇɴᴜ* ᴘᴀʀᴀ ᴠᴇʀ ᴍɪs ᴄᴏᴍᴀɴᴅᴏs\n╰───「 ${ctx.botName} 」` +
            (config.group.welcomeText ? `\n\n${config.group.welcomeText}` : '')
          if (card) await live().sendMessage(id, { image: card.buffer, caption, mentions: [jid] })
          else await live().sendMessage(id, { text: caption, mentions: [jid] })
        }

        if ((action === 'remove' || action === 'leave') && group.settings.goodbye) {
          const card = await canvas.card('goodbye', {
            avatar: buffer || url,
            username: name,
            group: meta?.subject || group.name || 'el grupo',
            members,
            subtitle: 'sᴀʟɪᴏ́ ᴅᴇʟ ɢʀᴜᴘᴏ',
            extra: '¡ᴠᴜᴇʟᴠᴇ ᴘʀᴏɴᴛᴏ! 👋',
            footer: ctx.botName
          })
          const caption = `╭───「 ᴅᴇsᴘᴇᴅɪᴅᴀ 」\n│ ${mentionTag(jid)} sᴀʟɪᴏ́ ᴅᴇʟ ɢʀᴜᴘᴏ\n│ Qᴜᴇᴅᴀᴍᴏs ${members} ᴍɪᴇᴍʙʀᴏs\n╰───「 ${ctx.botName} 」`
          if (card) await live().sendMessage(id, { image: card.buffer, caption, mentions: [jid] })
          else await live().sendMessage(id, { text: caption, mentions: [jid] })
        }

        if (action === 'promote') {
          await live().sendMessage(id, { text: `🎖️ ${mentionTag(jid)} ᴀʜᴏʀᴀ ᴇs ᴀᴅᴍɪɴ ᴅᴇʟ ɢʀᴜᴘᴏ`, mentions: [jid] }).catch(() => {})
        }
        if (action === 'demote') {
          await live().sendMessage(id, { text: `📉 ${mentionTag(jid)} ʏᴀ ɴᴏ ᴇs ᴀᴅᴍɪɴ`, mentions: [jid] }).catch(() => {})
        }
      }
    } catch (e) {
      log.debug('group-participants falló:', e.message)
    }
  })

  /* cambios de nombre/descripción del grupo */
  live().ev.on('groups.update', async (updates) => {
    for (const u of updates) {
      try {
        if (!u.id) continue
        const group = db.group(u.id)
        if (u.subject) {
          group.name = u.subject
          db.markDirty()
        }
      } catch {
        /* ignora */
      }
    }
  })

  /* ── antidelete ─────────────────────────────────────────── */
  live().ev.on('messages.update', async (updates) => {
    for (const u of updates) {
      try {
        const revoked = u.update?.message === null
        if (revoked && u.key) await resendDeleted(live(), u.key.remoteJid, u.key.id, u.key.participant || u.key.remoteJid)
      } catch {
        /* ignora */
      }
    }
  })

  live().ev.on('messages.delete', async (item) => {
    try {
      if (item.keys) {
        for (const k of item.keys) await resendDeleted(live(), k.remoteJid, k.id, k.participant || k.remoteJid)
      } else if (item.key) {
        await resendDeleted(live(), item.key.remoteJid, item.key.id, item.key.participant || item.key.remoteJid)
      }
    } catch {
      /* ignora */
    }
  })

  /* ── llamadas: rechazar y avisar ─────────────────────────── */
  live().ev.on('call', async (calls) => {
    for (const call of calls) {
      try {
        if (call.status !== 'offer') continue
        await live().rejectCall(call.id, call.from)
        await live().sendMessage(call.from, {
          text: `📵 ${smallCaps('No puedo atender llamadas, escríbeme mejor por mensaje')} 😊`
        })
      } catch (e) {
        log.debug('rechazo de llamada falló:', e.message)
      }
    }
  })
}

/** Nivel arriba → tarjeta */
export async function sendLevelUp(m, level, ctx) {
  try {
    const { url, buffer } = await pfpBuffer(m.sock, m.sender)
    const card = await canvas.card('levelup', {
      avatar: buffer || url,
      username: m.pushName,
      title: '¡subiste de nivel!',
      subtitle: `ɴɪᴠᴇʟ ${level}`,
      extra: `+${config.xp.levelUpReward} ${config.economy.currency} ᴅᴇ ʀᴇᴄᴏᴍᴘᴇɴsᴀ`,
      footer: ctx.botName
    })
    const caption = `🎉 ${mentionTag(m.sender)} sᴜʙɪᴏ́ ᴀʟ ɴɪᴠᴇʟ *${level}*`
    if (card) await m.send({ image: card.buffer, caption, mentions: [m.sender] })
    else await m.send({ text: caption, mentions: [m.sender] })
  } catch (e) {
    log.debug('level up falló:', e.message)
  }
}

export default { bindGroupEvents, sendLevelUp }
