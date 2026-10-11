/**
 *  src/core/handler.js — el corazón del bot:
 *  antispam / antilink / antidelete / mute → permisos → límites → XP → ejecuta el plugin
 */
import db from './store.js'
import log from './logger.js'
import config from '../../config.js'
import { buildMessage } from './message.js'
import { resendDeleted } from './events.js'
import { addXp, consumeLimit, ensureDailyLimit, formatLimit, remainingLimit, roleLabel } from './roles.js'
import { bareJid, extractUrl, isUrl, jidToNumber, mentionTag, sleep, today } from './utils.js'

/* rate-limit en memoria para antispam */
const spamTracker = new Map()
const GROUP_LINK = /(chat\.whatsapp\.com\/|wa\.me\/|whatsapp\.com\/channel)/i
const spamWarning = new Map()

export function createHandler(ctx) {
  /**
   * ⚠️ OJO: el socket se lee SIEMPRE desde ctx.sock, nunca se guarda en una variable.
   *  · index.js crea el handler ANTES de conectar (ctx.sock todavía es null)
   *  · al reconectar, Baileys crea un socket NUEVO y el anterior queda muerto
   * Leyéndolo en cada mensaje, el bot siempre usa el socket vivo.
   */
  const sock = () => ctx.sock

  return async function onMessagesUpsert({ messages, type }) {
    if (type !== 'notify' && type !== 'append') return

    for (const raw of messages) {
      try {
        await handleOne(raw)
      } catch (e) {
        log.error('Error procesando mensaje:', e.message)
        log.debug(e.stack)
      }
    }
  }

  async function handleOne(raw) {
    if (!raw.message) return
    if (raw.key?.remoteJid === 'status@broadcast') return

    const sockRef = sock()
    if (!sockRef) {
      log.warn('Llegó un mensaje pero todavía no hay conexión con WhatsApp; lo ignoro.')
      return
    }

    const isGroup = String(raw.key.remoteJid).endsWith('@g.us')
    const chat = raw.key.remoteJid
    const sender = bareJid(raw.key.fromMe ? sockRef.user?.id : raw.key.participant || chat)

    /* ── antidelete: revocaciones (el típico «eliminar para todos») ── */
    const protocol = raw.message?.protocolMessage
    if (protocol?.type === 0 && protocol.key?.id) {
      await resendDeleted(sockRef, chat, protocol.key.id, raw.key.participant || raw.key.remoteJid)
      return
    }

    /* ── antidelete: guardamos los mensajes en caché ─────── */
    db.stats.messages = (db.stats.messages || 0) + 1
    db.cacheMessage(chat, raw.key, {
      participant: raw.key.participant,
      pushName: raw.pushName,
      message: raw.message,
      timestamp: raw.messageTimestamp
    })

    const m = await buildMessage(sockRef, raw, ctx)
    if (!m) return

    /* ── bloqueos básicos ────────────────────────────────── */
    if (m.user.banned) {
      log.debug('Mensaje de usuario baneado', m.senderNumber)
      return
    }
    if (config.behavior.blacklist?.includes(m.senderNumber)) return
    if (config.behavior.only === 'group' && m.isPrivate) return
    if (config.behavior.only === 'private' && m.isGroup) return

    const group = m.group

    /* ── antilink ────────────────────────────────────────── */
    if (m.isGroup && group?.settings.antilink && m.text && GROUP_LINK.test(m.text) && !m.isAdmin) {
      await m.delete()
      await punishWarn(ctx, m, 'Enviar enlaces de grupos')
      return
    }

    /* ── mute (solo admins escriben) ─────────────────────── */
    if (m.isGroup && group?.settings.mute && !m.isAdmin && !m.fromMe && m.isCommand) {
      await m.delete().catch(() => {})
      return
    }

    /* ── antispam ────────────────────────────────────────── */
    if (m.isGroup && group?.settings.antispam && !m.isAdmin) {
      const now = Date.now()
      const rec = spamTracker.get(m.sender) || { count: 0, at: now }
      if (now - rec.at > 10000) {
        rec.count = 0
        rec.at = now
      }
      rec.count++
      spamTracker.set(m.sender, rec)
      if (rec.count > config.behavior.spamLimit) {
        const last = spamWarning.get(m.sender) || 0
        if (now - last > 60000) {
          spamWarning.set(m.sender, now)
          await m.delete().catch(() => {})
          await m.reply(`🚫 *ANTISPAM* — ${mentionTag(m.sender)} baja el ritmo (${config.behavior.spamLimit} mensajes / 10s)`, { mentions: [m.sender] })
        }
        return
      }
    }

    /* ── AFK ─────────────────────────────────────────────── */
    if (m.user.afk) {
      const since = Math.floor((Date.now() - (m.user.afk.at || Date.now())) / 1000)
      m.user.afk = null
      db.markDirty()
      if (m.text && !isUrl(m.text)) await m.reply(`👋 Has vuelto, ${m.pushName} (estuviste AFK ${since}s)`)
    }
    if (m.mentions.length || m.quoted?.sender) {
      const targets = [...new Set([...m.mentions, m.quoted?.sender].filter(Boolean).map(bareJid))]
      for (const t of targets) {
        const u = db.data.users[t]
        if (u?.afk) {
          const a = userAfk(u)
          await m.reply(`💤 ${mentionTag(t)} está AFK${a.motivo ? `: ${a.motivo}` : ''}`, { mentions: [t] })
        }
      }
    }

    /* ── hooks de plugins (onMessage) ────────────────────── */
    for (const p of ctx.pluginList) {
      if (typeof p.onMessage !== 'function') continue
      try {
        await p.onMessage(m, ctx)
      } catch (e) {
        log.debug(`onMessage de ${p.name} falló:`, e.message)
      }
    }

    if (!m.isCommand) return

    /* ── resolver comando ────────────────────────────────── */
    const plugin = ctx.plugins.get(m.command)
    if (!plugin) return

    const user = m.user
    const role = m.role
    const remaining = remainingLimit(user, role)

    /* ── self / modo privado ─────────────────────────────── */
    if ((config.behavior.selfMode || db.settings.selfMode) && !m.isOwner) {
      return
    }
    if (plugin.only && plugin.only !== (m.isGroup ? 'group' : 'private')) return

    /* ── permisos ────────────────────────────────────────── */
    if (plugin.owner && !m.isOwner) {
      return m.reply(`Ⓞ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ ᴇs sᴏʟᴏ ᴘᴀʀᴀ ᴏᴡɴᴇʀs.\n┊ ᴛᴜ ʀᴏʟ : ${roleLabel(role)}`)
    }
    if (plugin.group && !m.isGroup) return m.reply('Ⓖ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ sᴏʟᴏ ғᴜɴᴄɪᴏɴᴀ ᴇɴ ɢʀᴜᴘᴏs.')
    if (plugin.private && m.isGroup) return m.reply('📩 ᴜsᴀ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ ᴇɴ ᴘʀɪᴠᴀᴅᴏ.')
    if (plugin.admin && !m.isAdmin) return m.reply('Ⓐ ɴᴇᴄᴇsɪᴛᴀs sᴇʀ ᴀᴅᴍɪɴ ᴅᴇʟ ɢʀᴜᴘᴏ.')
    if (plugin.botAdmin && !m.isBotAdmin) return m.reply('🤖 ɴᴇᴄᴇsɪᴛᴏ sᴇʀ ᴀᴅᴍɪɴ ᴅᴇʟ ɢʀᴜᴘᴏ ᴘᴀʀᴀ ᴇsᴛᴏ.')
    if (plugin.premium && !['premium', 'vip', 'owner'].includes(role)) {
      return m.reply(`Ⓟ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ ᴇs ᴘʀᴇᴍɪᴜᴍ.\n┊ ᴛᴜ ʀᴏʟ : ${roleLabel(role)}\n┊ ᴜsᴀ ${ctx.prefix}ʀᴏʟᴇs ᴘᴀʀᴀ ᴠᴇʀ ʟᴏs ʀᴏʟᴇs`)
    }

    /* ── límites ─────────────────────────────────────────── */
    const costsLimit = plugin.limit !== false && plugin.limit > 0
    if (costsLimit && remaining !== Infinity && remaining <= 0) {
      const max = config.roles[role]?.limit
      return m.reply(
        [
          `Ⓛ ʟʟᴇɢᴀsᴛᴇ ᴀʟ ʟɪᴍɪᴛᴇ ᴅᴇ ᴛᴜ ʀᴏʟ`,
          `┊ ʀᴏʟ : ${roleLabel(role)}`,
          `┊ ᴜsᴀᴅᴏ : ${user.limitUsed}/${max}`,
          `┊ ʀᴇɴᴜᴇᴠᴀ : ᴍᴀɴ̃ᴀɴᴀ ᴀ ʟᴀs 00:00`,
          `┊ ᴄᴏᴍᴘʀᴀ ᴍᴀ́s ʟɪᴍɪᴛᴇ ᴄᴏɴ ${ctx.prefix}sʜᴏᴘ ᴏ ᴘɪᴅᴇ ᴘʀᴇᴍɪᴜᴍ ᴀʟ ᴏᴡɴᴇʀ`
        ].join('\n')
      )
    }

    /* ── ejecutar ────────────────────────────────────────── */
    const started = Date.now()
    try {
      if (db.settings.autoread) await sockRef.readMessages([m.key]).catch(() => {})
      if (db.settings.autotype) await m.presence('composing')
      if (config.behavior.reactCommands) await m.react('✅')

      await plugin.run(m, ctx)

      if (costsLimit) consumeLimit(user, plugin.limit === true ? 1 : plugin.limit)
      const { gained, levelUp, level } = addXp(user, 4 + Math.floor(Math.random() * 11), role)
      db.countCommands(plugin.name)
      db.markDirty()

      log.cmd(
        `${m.command} ▸ ${m.pushName} (${roleLabel(role)}) ${m.isGroup ? `en ${m.group?.name || m.chat}` : 'privado'} · ${Date.now() - started}ms · xp +${gained}`
      )

      if (levelUp) {
        ctx.onLevelUp?.(m, level).catch?.(() => {})
      }
    } catch (e) {
      log.error(`Error en .${m.command}:`, e.message)
      log.debug(e.stack)
      const msg =
        /no pude conectar|ECONN|fetch failed|timeout|abort/i.test(e.message || '')
          ? '⚠️ ᴇʀʀᴏʀ ᴅᴇ ᴄᴏɴᴇxɪᴏ́ɴ ᴄᴏɴ ʟᴀ ᴀᴘɪ. ɪɴᴛᴇɴᴛᴀ ᴅᴇ ɴᴜᴇᴠᴏ ᴇɴ ᴜɴᴏs sᴇɢᴜɴᴅᴏs.'
          : `❌ ᴇʀʀᴏʀ ᴇᴊᴇᴄᴜᴛᴀɴᴅᴏ *${m.command}*:\n${String(e.message || e).slice(0, 300)}`
      await m.reply(msg).catch(() => {})
    }
  }

  /* ── advertencias + expulsión automática ───────────────── */
  async function punishWarn(ctxLocal, m, reason) {
    const g = m.group
    if (!g) return
    const target = m.sender
    g.warns[target] = (g.warns[target] || 0) + 1
    db.markDirty()
    const count = g.warns[target]
    if (count >= 3) {
      g.warns[target] = 0
      db.markDirty()
      if (m.isBotAdmin) {
        await sock().groupParticipantsUpdate(m.chat, [target], 'remove').catch(() => {})
        return m.reply(`🚫 ${mentionTag(target)} ᴇxᴘᴜʟsᴀᴅᴏ ᴘᴏʀ 3 ᴀᴅᴠᴇʀᴛᴇɴᴄɪᴀs (${reason})`, { mentions: [target] })
      }
    }
    return m.reply(`⚠️ ${mentionTag(target)} ᴀᴅᴠᴇʀᴛᴇɴᴄɪᴀ ${count}/3 — ${reason}`, { mentions: [target] })
  }
}

function userAfk(u) {
  return { motivo: u.afk?.motivo || '', at: u.afk?.at }
}

export default createHandler
