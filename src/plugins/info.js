/**
 *  Categoría: ɪɴғᴏ
 */
import os from 'node:os'
import config from '../../config.js'
import db from '../core/store.js'
import { clockString, formatNumber, mentionTag, smallCaps } from '../core/utils.js'
import { formatLimit, remainingLimit, xpProgress } from '../core/roles.js'

const cooldown = new Map()

export default [
  {
    name: 'bot',
    alias: ['info', 'botinfo'],
    category: 'info',
    desc: 'Información del bot y su estado',
    usage: '.bot',
    limit: false,
    async run(m, ctx) {
      const users = Object.keys(db.data.users).length
      const groups = Object.keys(db.data.groups).length
      const t = [
        `╭───「 ${ctx.botName} 」`,
        `│`,
        `│ 🤖 ɴᴏᴍʙʀᴇ : ${ctx.botName}`,
        `│ ⚙️ ᴘʀᴇғɪᴊᴏ : ${ctx.prefix}`,
        `│ 🧩 ᴄᴏᴍᴀɴᴅᴏs : ${ctx.pluginList.length}`,
        `│ 👥 ᴜsᴜᴀʀɪᴏs : ${users}`,
        `│ 💬 ɢʀᴜᴘᴏs : ${groups}`,
        `│ 📊 ᴍsɢ ᴘʀᴏᴄᴇsᴀᴅᴏs : ${formatNumber(db.stats.messages)}`,
        `│ ⌨️ ᴄᴏᴍᴀɴᴅᴏs ᴜsᴀᴅᴏs : ${formatNumber(db.stats.commands)}`,
        `│ 🌐 ᴀᴘɪ : ${config.api.baseUrl}`,
        `│ 🖥️ sɪsᴛᴇᴍᴀ : ${process.platform}/${process.arch}`,
        `│ 🧠 ɴᴏᴅᴇ : ${process.version}`,
        `│ ⏱️ ᴜᴘᴛɪᴍᴇ : ${clockString(Date.now() - ctx.startTime)}`,
        `│ 💾 ʀᴀᴍ : ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB / libre ${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
        `│ 🖼️ ᴛᴀʀᴊᴇᴛᴀs : ${ctx.canvas.localCanvasAvailable() ? 'canvas local ✅' : 'API canvas'}`,
        `│`,
        `╰───「 ${config.bot.footer} 」`
      ].join('\n')
      return m.reply(t)
    }
  },
  {
    name: 'perfil',
    alias: ['profile', 'userinfo', 'yo'],
    category: 'info',
    desc: 'Tu perfil con tarjeta: rol, nivel, XP y monedas',
    usage: '.perfil',
    limit: false,
    async run(m, ctx) {
      const target = m.mentionedOrQuoted() || m.sender
      const user = db.user(target)
      const isSelf = target === m.sender
      const { level, current, need, percent } = xpProgress(user)
      const remaining = remainingLimit(user, target === m.sender ? m.role : user.role || 'newbie')
      const card = await ctx.canvas.card('rank', {
        avatar: await pfp(m, target),
        username: user.name || m.pushName,
        title: isSelf ? 'mi perfil' : 'perfil',
        subtitle: `ɴɪᴠᴇʟ ${level} · xᴘ ${formatNumber(user.xp || 0)}`,
        extra: `🪙 ${formatNumber((user.coins || 0) + (user.bank || 0))} · ʟɪᴍɪᴛ ${formatLimit(remaining)}`,
        percent,
        footer: ctx.botName
      })
      const text = [
        `╭───「 ᴘᴇʀғɪʟ 」`,
        `│ 👤 ${mentionTag(target)}`,
        `│ 🎭 ʀᴏʟ : ${user.role ? ctx.roleLabel(user.role) : ctx.roleLabel(m.role)}`,
        `│ 📈 ɴɪᴠᴇʟ : ${level}`,
        `│ ✨ xᴘ : ${formatNumber(user.xp || 0)} (${current}/${need} · ${percent}%)`,
        `│ 🪙 ᴇғᴇᴄᴛɪᴠᴏ : ${formatNumber(user.coins)}`,
        `│ 🏦 ʙᴀɴᴄᴏ : ${formatNumber(user.bank)}`,
        `│ Ⓛ ʟɪᴍɪᴛᴇ ʜᴏʏ : ${formatLimit(remaining)}`,
        `│ 💬 ᴍᴇɴsᴀᴊᴇs : ${formatNumber(user.stats.messages)}`,
        `│ ⌨️ ᴄᴏᴍᴀɴᴅᴏs : ${formatNumber(user.stats.commands)}`,
        `│ ⚔️ ɴɪᴠᴇʟ ʀᴘɢ : ${user.rpg.level} · ᴘᴏᴋᴇᴍᴏɴ : ${user.pokemon.party.length}/6`,
        `│ ⚠️ ᴀᴅᴠᴇʀᴛᴇɴᴄɪᴀs : ${user.warns}`,
        `│`,
        `╰───「 ${ctx.botName} 」`
      ].join('\n')
      if (card) return m.send({ image: card.buffer, caption: text, mentions: [target] })
      return m.reply(text, { mentions: [target] })
    }
  },
  {
    name: 'grupo',
    alias: ['groupinfo', 'infogrupo'],
    category: 'info',
    desc: 'Información y ajustes del grupo',
    usage: '.grupo',
    group: true,
    limit: false,
    async run(m, ctx) {
      const meta = m.meta
      if (!meta) return m.reply('No pude leer la información del grupo.')
      const admins = (meta.participants || []).filter((p) => p.admin)
      const s = m.group.settings
      const on = (v) => (v ? '✅' : '❌')
      const text = [
        `╭───「 ɢʀᴜᴘᴏ 」`,
        `│ 👥 ɴᴏᴍʙʀᴇ : ${meta.subject}`,
        `│ 🆔 ɪᴅ : ${m.chat}`,
        `│ 👤 ᴍɪᴇᴍʙʀᴏs : ${meta.participants?.length || 0}`,
        `│ 🎖️ ᴀᴅᴍɪɴs : ${admins.length}`,
        `│ 🤖 sᴏʏ ᴀᴅᴍɪɴ : ${on(m.isBotAdmin)}`,
        `│ 🎭 ᴛᴜ ʀᴏʟ : ${m.roleLabel}`,
        `│`,
        `│ ⚙️ ᴀᴊᴜsᴛᴇs`,
        `│ ┊ ʙɪᴇɴᴠᴇɴɪᴅᴀ : ${on(s.welcome)}`,
        `│ ┊ ᴅᴇsᴘᴇᴅɪᴅᴀ : ${on(s.goodbye)}`,
        `│ ┊ ᴀɴᴛɪʟɪɴᴋ : ${on(s.antilink)}`,
        `│ ┊ ᴀɴᴛɪᴅᴇʟᴇᴛᴇ : ${on(s.antidelete)}`,
        `│ ┊ ᴀɴᴛɪsᴘᴀᴍ : ${on(s.antispam)}`,
        `│ ┊ ᴄᴇʀʀᴀᴅᴏ : ${on(s.mute)}`,
        `│`,
        `│ 📝 ᴅᴇsᴄʀɪᴘᴄɪᴏ́ɴ`,
        `│ ${smallCaps(meta.desc || 'sin descripción').slice(0, 200)}`,
        `│`,
        `╰───「 ${ctx.botName} 」`
      ].join('\n')
      return m.reply(text)
    }
  },
  {
    name: 'owner',
    alias: ['dueño', 'contacto'],
    category: 'info',
    desc: 'Muestra cómo contactar al dueño del bot',
    usage: '.owner',
    limit: false,
    async run(m, ctx) {
      const list = db.owners.length
        ? db.owners.map((o) => `┊ 📞 wa.me/${o}`).join('\n')
        : '┊ (sin owners configurados)'
      return m.reply(
        [
          `╭───「 ᴏᴡɴᴇʀ 」`,
          `│`,
          `│ 👑 ᴏᴡɴᴇʀs ᴅᴇ ${ctx.botName}`,
          list,
          `│`,
          `│ 💡 ᴜsᴀ ${ctx.prefix}ʀᴇᴘᴏʀᴛ <ᴍᴇɴsᴀᴊᴇ> ᴘᴀʀᴀ ᴀᴠɪsᴀʀᴍᴇ ᴅᴇ ᴀʟɢᴏ`,
          `│`,
          `╰───「 ${ctx.botName} 」`
        ].join('\n')
      )
    }
  },
  {
    name: 'report',
    alias: ['sugerencia', 'sugerir', 'reporte'],
    category: 'info',
    desc: 'Envía un reporte o sugerencia a los owners',
    usage: '.report <mensaje>',
    limit: false,
    async run(m, ctx) {
      const text = m.fullText.trim()
      if (!text) return m.reply(`📮 ᴜsᴏ : ${ctx.prefix}ʀᴇᴘᴏʀᴛ <ᴍᴇɴsᴀᴊᴇ>`)
      const last = cooldown.get(m.sender) || 0
      if (Date.now() - last < 60000) return m.reply('⏳ Espera un minuto antes de enviar otro reporte.')
      cooldown.set(m.sender, Date.now())
      const body = [
        `📮 *ɴᴜᴇᴠᴏ ʀᴇᴘᴏʀᴛᴇ*`,
        `┊ ᴅᴇ : ${m.pushName} (+${m.senderNumber})`,
        `┊ ᴄʜᴀᴛ : ${m.isGroup ? m.group?.name || m.chat : 'privado'}`,
        `┊ ᴛᴇxᴛᴏ : ${text}`
      ].join('\n')
      let sent = 0
      for (const owner of db.owners) {
        try {
          await m.sock.sendMessage(`${owner}@s.whatsapp.net`, { text: body })
          sent++
        } catch {
          /* sigue con el siguiente */
        }
      }
      return m.reply(sent ? '✅ ʀᴇᴘᴏʀᴛᴇ ᴇɴᴠɪᴀᴅᴏ ᴀ ʟᴏs ᴏᴡɴᴇʀs, ɢʀᴀᴄɪᴀs 🫶' : '⚠️ No pude enviar el reporte (no hay owners accesibles).')
    }
  },
  {
    name: 'apistatus',
    alias: ['api', 'estadoapi'],
    category: 'info',
    desc: 'Comprueba el estado de la API SiputZX',
    usage: '.apistatus',
    limit: false,
    async run(m, ctx) {
      const t0 = Date.now()
      const r = await ctx.api.json('/api/meta/endpoints', {}, { retries: 0 })
      const ms = Date.now() - t0
      if (!r.ok) {
        return m.reply(
          [
            `⚠️ *ᴀᴘɪ sɪɴ ʀᴇsᴘᴜᴇsᴛᴀ*`,
            `┊ ${ctx.config.api.baseUrl}`,
            `┊ ᴇʀʀᴏʀ : ${r.error || r.message}`,
            ``,
            `💡 En el plan gratis de Render la API se duerme;`,
            `   espera ~30s y prueba otra vez.`
          ].join('\n')
        )
      }
      const cats = r.data.categories?.map((c) => c.name).join(', ') || '—'
      const bad = (r.data.endpoints || []).filter((e) => e.runtime?.status !== 'available')
      return m.reply(
        [
          `✅ *ᴀᴘɪ ᴏɴʟɪɴᴇ*`,
          `┊ ʟᴀᴛᴇɴᴄɪᴀ : ${ms} ms`,
          `┊ ᴠᴇʀsɪᴏ́ɴ : ${r.data.version}`,
          `┊ ᴇɴᴅᴘᴏɪɴᴛs : ${r.data.endpoints?.length || 0}`,
          `┊ ᴄᴀᴛᴇɢᴏʀɪ́ᴀs : ${cats}`,
          ``,
          bad.length ? `⚠️ ᴘᴇɴᴅɪᴇɴᴛᴇs ᴅᴇ ᴄᴏɴғɪɢᴜʀᴀᴄɪᴏ́ɴ (${bad.length}):` : '🎉 Todos los endpoints están disponibles',
          ...bad.slice(0, 12).map((e) => `┊ ✿ ${e.path} — ${e.runtime?.missing?.join(', ') || e.runtime?.status}`)
        ].join('\n')
      )
    }
  },
  {
    name: 'uptime',
    alias: ['runtime', 'activo'],
    category: 'info',
    desc: 'Cuánto tiempo lleva encendido el bot',
    usage: '.uptime',
    limit: false,
    async run(m, ctx) {
      return m.reply(`⏱️ ᴇsᴛᴏʏ ᴇɴᴄᴇɴᴅɪᴅᴏ ᴅᴇsᴅᴇ ʜᴀᴄᴇ *${clockString(Date.now() - ctx.startTime)}*`)
    }
  },
  {
    name: 'id',
    alias: ['jid', 'miid'],
    category: 'info',
    desc: 'Muestra los IDs de WhatsApp (chat y usuario)',
    usage: '.id',
    limit: false,
    async run(m) {
      return m.reply(
        [`🆔 ᴄʜᴀᴛ : ${m.chat}`, `👤 ᴛᴜ ɪᴅ : ${m.sender}`, m.quoted?.sender ? `↩️ ᴄɪᴛᴀᴅᴏ : ${m.quoted.sender}` : null]
          .filter(Boolean)
          .join('\n')
      )
    }
  },
  {
    name: 'afk',
    alias: ['ausente'],
    category: 'info',
    desc: 'Marca que estás ausente (el bot avisa si te mencionan)',
    usage: '.afk [motivo]',
    limit: false,
    async run(m) {
      m.user.afk = { at: Date.now(), motivo: m.fullText.trim() || '' }
      db.markDirty()
      return m.reply(`💤 ᴛᴇ ᴘᴜsᴇ ᴇɴ ᴀꜰᴋ${m.fullText.trim() ? `: ${m.fullText.trim()}` : ''}. ᴇsᴄʀɪʙᴇ ᴄᴜᴀʟǫᴜɪᴇʀ ᴄᴏsᴀ ᴘᴀʀᴀ ᴠᴏʟᴠᴇʀ.`)
    }
  }
]

/** Foto de perfil de WhatsApp (Buffer) o null */
export async function pfp(m, jid) {
  try {
    const url = await m.sock.profilePictureUrl(jid, 'image')
    if (!url) return null
    const res = await fetch(url)
    if (!res.ok) return url
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
