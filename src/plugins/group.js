/**
 *  Categoría: ɢʀᴏᴜᴘ — administración de grupos
 */
import db from '../core/store.js'
import { mentionTag, jidToNumber, smallCaps, sleep } from '../core/utils.js'
import { getTarget } from './_shared.js'

const setToggle = async (m, key, label, value) => {
  const s = m.group.settings
  s[key] = value ?? !s[key]
  db.markDirty()
  return m.reply(`${s[key] ? '✅' : '❌'} *${label}* ${s[key] ? 'activado' : 'desactivado'} ᴇɴ ᴇsᴛᴇ ɢʀᴜᴘᴏ`)
}

export default [
  {
    name: 'link',
    alias: ['invitacion', 'invitelink'],
    category: 'group',
    desc: 'Obtiene el enlace de invitación del grupo',
    usage: '.link',
    group: true,
    admin: true,
    botAdmin: true,
    limit: false,
    async run(m, ctx) {
      try {
        const code = await ctx.sock.groupInviteCode(m.chat)
        return m.reply(`🔗 https://chat.whatsapp.com/${code}`)
      } catch (e) {
        return m.reply(`❌ No pude obtener el enlace: ${e.message}`)
      }
    }
  },
  {
    name: 'revoke',
    alias: ['resetlink', 'nuevolink'],
    category: 'group',
    desc: 'Genera un nuevo enlace de invitación',
    usage: '.revoke',
    group: true,
    admin: true,
    botAdmin: true,
    limit: false,
    async run(m, ctx) {
      try {
        const code = await ctx.sock.groupRevokeInvite(m.chat)
        return m.reply(`♻️ ɴᴜᴇᴠᴏ ᴇɴʟᴀᴄᴇ : https://chat.whatsapp.com/${code}`)
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  },
  {
    name: 'kick',
    alias: ['sacar', 'expulsar', 'remove'],
    category: 'group',
    desc: 'Expulsa a un miembro (mención o respondiendo)',
    usage: '.kick @usuario',
    group: true,
    admin: true,
    botAdmin: true,
    limit: false,
    async run(m, ctx) {
      const target = getTarget(m)
      if (!target) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴋɪᴄᴋ @ᴜsᴜᴀʀɪᴏ (ᴏ ʀᴇsᴘᴏɴᴅɪᴇɴᴅᴏ ᴀ sᴜ ᴍᴇɴsᴀᴊᴇ)`)
      if (target.jid === m.sender) return m.reply('🤨 No puedes expulsarte a ti mismo.')
      try {
        await ctx.sock.groupParticipantsUpdate(m.chat, [target.jid], 'remove')
        return m.reply(`👋 ${mentionTag(target.jid)} ꜰᴜᴇ ᴇxᴘᴜʟsᴀᴅᴏ`, { mentions: [target.jid] })
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  },
  {
    name: 'promote',
    alias: ['daradmin', 'ascender'],
    category: 'group',
    desc: 'Da admin a un miembro',
    usage: '.promote @usuario',
    group: true,
    admin: true,
    botAdmin: true,
    limit: false,
    async run(m, ctx) {
      const target = getTarget(m)
      if (!target) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴘʀᴏᴍᴏᴛᴇ @ᴜsᴜᴀʀɪᴏ`)
      try {
        await ctx.sock.groupParticipantsUpdate(m.chat, [target.jid], 'promote')
        return m.reply(`🎖️ ${mentionTag(target.jid)} ᴀʜᴏʀᴀ ᴇs ᴀᴅᴍɪɴ`, { mentions: [target.jid] })
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  },
  {
    name: 'demote',
    alias: ['quitaradmin', 'degradar'],
    category: 'group',
    desc: 'Quita admin a un miembro',
    usage: '.demote @usuario',
    group: true,
    admin: true,
    botAdmin: true,
    limit: false,
    async run(m, ctx) {
      const target = getTarget(m)
      if (!target) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴅᴇᴍᴏᴛᴇ @ᴜsᴜᴀʀɪᴏ`)
      try {
        await ctx.sock.groupParticipantsUpdate(m.chat, [target.jid], 'demote')
        return m.reply(`📉 ${mentionTag(target.jid)} ʏᴀ ɴᴏ ᴇs ᴀᴅᴍɪɴ`, { mentions: [target.jid] })
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  },
  {
    name: 'tagall',
    alias: ['todos', 'mencionartodos'],
    category: 'group',
    desc: 'Menciona a todos los miembros',
    usage: '.tagall [mensaje]',
    group: true,
    admin: true,
    limit: false,
    async run(m, ctx) {
      const members = m.meta?.participants?.map((p) => p.id) || []
      if (!members.length) return m.reply('⚠️ No pude leer los miembros del grupo.')
      const texto = m.fullText.trim()
      const mentions = members.map((id) => id.split('@')[0] + '@s.whatsapp.net')
      const body = [
        `📢 *${smallCaps('atención')}*`,
        texto ? `┊ ${texto}` : null,
        `┊ ${members.length} ᴍɪᴇᴍʙʀᴏs`,
        '',
        ...mentions.map((j) => `┊ @${jidToNumber(j)}`)
      ]
        .filter(Boolean)
        .join('\n')
      return ctx.sock.sendMessage(m.chat, { text: body.slice(0, 6000), mentions })
    }
  },
  {
    name: 'hidetag',
    alias: ['tag', 'mencion'],
    category: 'group',
    desc: 'Menciona a todos sin mostrar la lista',
    usage: '.hidetag <mensaje>',
    group: true,
    admin: true,
    limit: false,
    async run(m, ctx) {
      const members = m.meta?.participants?.map((p) => p.id) || []
      const texto = m.fullText.trim() || smallCaps('atención')
      return ctx.sock.sendMessage(m.chat, { text: texto, mentions: members.map((id) => id.split('@')[0] + '@s.whatsapp.net') })
    }
  },
  {
    name: 'setname',
    alias: ['nombregrupo'],
    category: 'group',
    desc: 'Cambia el nombre del grupo',
    usage: '.setname <nombre>',
    group: true,
    admin: true,
    botAdmin: true,
    limit: false,
    async run(m, ctx) {
      const name = m.fullText.trim()
      if (!name) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}sᴇᴛɴᴀᴍᴇ <ɴᴜᴇᴠᴏ ɴᴏᴍʙʀᴇ>`)
      try {
        await ctx.sock.groupUpdateSubject(m.chat, name.slice(0, 100))
        db.updateGroup(m.chat, { name })
        return m.reply('✅ ɴᴏᴍʙʀᴇ ᴅᴇʟ ɢʀᴜᴘᴏ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴏ')
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  },
  {
    name: 'setdesc',
    alias: ['descgrupo', 'descripcion'],
    category: 'group',
    desc: 'Cambia la descripción del grupo',
    usage: '.setdesc <texto>',
    group: true,
    admin: true,
    botAdmin: true,
    limit: false,
    async run(m, ctx) {
      const desc = m.fullText.trim()
      if (!desc) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}sᴇᴛᴅᴇsᴄ <ᴛᴇxᴛᴏ>`)
      try {
        await ctx.sock.groupUpdateDescription(m.chat, desc.slice(0, 500))
        return m.reply('✅ ᴅᴇsᴄʀɪᴘᴄɪᴏ́ɴ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ')
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  },
  {
    name: 'seticon',
    alias: ['fotogrupo', 'setfoto'],
    category: 'group',
    desc: 'Cambia la foto del grupo (responde a una imagen)',
    usage: '.seticon (respondiendo a una foto)',
    group: true,
    admin: true,
    botAdmin: true,
    limit: false,
    async run(m, ctx) {
      const buffer = (await m.downloadQuoted()) || (await m.download())
      if (!buffer) return m.reply('📷 ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ ᴄᴏɴ .sᴇᴛɪᴄᴏɴ')
      try {
        await ctx.sock.updateProfilePicture(m.chat, buffer)
        return m.reply('✅ ꜰᴏᴛᴏ ᴅᴇʟ ɢʀᴜᴘᴏ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ')
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  },
  {
    name: 'mute',
    alias: ['cerrar', 'close'],
    category: 'group',
    desc: 'Cierra el grupo: el bot borra los mensajes que no sean de admins',
    usage: '.mute',
    group: true,
    admin: true,
    limit: false,
    run: (m) => setToggle(m, 'mute', 'ɢʀᴜᴘᴏ ᴄᴇʀʀᴀᴅᴏ', true)
  },
  {
    name: 'unmute',
    alias: ['abrir', 'open'],
    category: 'group',
    desc: 'Abre el grupo otra vez',
    usage: '.unmute',
    group: true,
    admin: true,
    limit: false,
    run: (m) => setToggle(m, 'mute', 'ɢʀᴜᴘᴏ ᴄᴇʀʀᴀᴅᴏ', false)
  },
  {
    name: 'welcome',
    alias: ['bienvenida'],
    category: 'group',
    desc: 'Activa o desactiva las tarjetas de bienvenida',
    usage: '.welcome on/off',
    group: true,
    admin: true,
    limit: false,
    async run(m) {
      const arg = (m.arg || '').toLowerCase()
      const value = ['on', '1', 'si', 'sí', 'activar'].includes(arg) ? true : ['off', '0', 'no', 'desactivar'].includes(arg) ? false : !m.group.settings.welcome
      return setToggle(m, 'welcome', 'ʙɪᴇɴᴠᴇɴɪᴅᴀ', value)
    }
  },
  {
    name: 'despedida',
    alias: ['goodbye', 'despedir'],
    category: 'group',
    desc: 'Activa o desactiva las tarjetas de despedida',
    usage: '.despedida on/off',
    group: true,
    admin: true,
    limit: false,
    async run(m) {
      const arg = (m.arg || '').toLowerCase()
      const value = ['on', '1', 'si', 'sí', 'activar'].includes(arg) ? true : ['off', '0', 'no', 'desactivar'].includes(arg) ? false : !m.group.settings.goodbye
      return setToggle(m, 'goodbye', 'ᴅᴇsᴘᴇᴅɪᴅᴀ', value)
    }
  },
  {
    name: 'antilink',
    alias: ['nolinks'],
    category: 'group',
    desc: 'Borra los enlaces de grupos automáticamente',
    usage: '.antilink on/off',
    group: true,
    admin: true,
    limit: false,
    async run(m) {
      const arg = (m.arg || '').toLowerCase()
      const value = ['on', '1', 'si', 'sí'].includes(arg) ? true : ['off', '0', 'no'].includes(arg) ? false : !m.group.settings.antilink
      return setToggle(m, 'antilink', 'ᴀɴᴛɪʟɪɴᴋ', value)
    }
  },
  {
    name: 'antidelete',
    alias: ['antieliminar'],
    category: 'group',
    desc: 'Muestra los mensajes que borran los demás',
    usage: '.antidelete on/off',
    group: true,
    admin: true,
    limit: false,
    async run(m) {
      const arg = (m.arg || '').toLowerCase()
      const value = ['on', '1', 'si', 'sí'].includes(arg) ? true : ['off', '0', 'no'].includes(arg) ? false : !m.group.settings.antidelete
      return setToggle(m, 'antidelete', 'ᴀɴᴛɪᴅᴇʟᴇᴛᴇ', value)
    }
  },
  {
    name: 'antispam',
    alias: ['nofluod'],
    category: 'group',
    desc: 'Borra mensajes cuando alguien escribe demasiado rápido',
    usage: '.antispam on/off',
    group: true,
    admin: true,
    limit: false,
    async run(m) {
      const arg = (m.arg || '').toLowerCase()
      const value = ['on', '1', 'si', 'sí'].includes(arg) ? true : ['off', '0', 'no'].includes(arg) ? false : !m.group.settings.antispam
      return setToggle(m, 'antispam', 'ᴀɴᴛɪsᴘᴀᴍ', value)
    }
  },
  {
    name: 'warn',
    alias: ['advertir'],
    category: 'group',
    desc: 'Pone una advertencia (3 = expulsión automática)',
    usage: '.warn @usuario [motivo]',
    group: true,
    admin: true,
    limit: false,
    async run(m, ctx) {
      const target = getTarget(m)
      if (!target) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴡᴀʀɴ @ᴜsᴜᴀʀɪᴏ [ᴍᴏᴛɪᴠᴏ]`)
      const reason = m.args.slice(1).join(' ') || 'incumplir las reglas'
      const warns = m.group.warns
      warns[target.jid] = (warns[target.jid] || 0) + 1
      db.markDirty()
      if (warns[target.jid] >= 3 && m.isBotAdmin) {
        warns[target.jid] = 0
        db.markDirty()
        await ctx.sock.groupParticipantsUpdate(m.chat, [target.jid], 'remove').catch(() => {})
        return m.reply(`🚫 3 ᴀᴅᴠᴇʀᴛᴇɴᴄɪᴀs · ${mentionTag(target.jid)} ꜰᴜᴇ ᴇxᴘᴜʟsᴀᴅᴏ (${reason})`, { mentions: [target.jid] })
      }
      return m.reply(`⚠️ ᴀᴅᴠᴇʀᴛᴇɴᴄɪᴀ ${warns[target.jid]}/3 ᴘᴀʀᴀ ${mentionTag(target.jid)}\n┊ ᴍᴏᴛɪᴠᴏ : ${reason}`, { mentions: [target.jid] })
    }
  },
  {
    name: 'unwarn',
    alias: ['quitarwarn'],
    category: 'group',
    desc: 'Quita una advertencia',
    usage: '.unwarn @usuario',
    group: true,
    admin: true,
    limit: false,
    async run(m, ctx) {
      const target = getTarget(m)
      if (!target) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴜɴᴡᴀʀɴ @ᴜsᴜᴀʀɪᴏ`)
      m.group.warns[target.jid] = Math.max(0, (m.group.warns[target.jid] || 0) - 1)
      db.markDirty()
      return m.reply(`✅ ᴀᴅᴠᴇʀᴛᴇɴᴄɪᴀs ᴅᴇ ${mentionTag(target.jid)} : ${m.group.warns[target.jid]}/3`, { mentions: [target.jid] })
    }
  },
  {
    name: 'warns',
    alias: ['advertencias', 'listwarn'],
    category: 'group',
    desc: 'Lista las advertencias del grupo',
    usage: '.warns',
    group: true,
    admin: true,
    limit: false,
    async run(m) {
      const entries = Object.entries(m.group.warns).filter(([, n]) => n > 0)
      if (!entries.length) return m.reply('✨ ɴᴀᴅɪᴇ ᴛɪᴇɴᴇ ᴀᴅᴠᴇʀᴛᴇɴᴄɪᴀs ᴇɴ ᴇsᴛᴇ ɢʀᴜᴘᴏ.')
      return m.reply(`⚠️ *ᴀᴅᴠᴇʀᴛᴇɴᴄɪᴀs*\n${entries.map(([jid, n]) => `┊ ${mentionTag(jid)} — ${n}/3`).join('\n')}`)
    }
  },
  {
    name: 'resetwarns',
    alias: ['limpiarwarns'],
    category: 'group',
    desc: 'Borra todas las advertencias del grupo',
    usage: '.resetwarns',
    group: true,
    admin: true,
    limit: false,
    async run(m) {
      m.group.warns = {}
      db.markDirty()
      return m.reply('🧹 ᴀᴅᴠᴇʀᴛᴇɴᴄɪᴀs ʙᴏʀʀᴀᴅᴀs')
    }
  },
  {
    name: 'admins',
    alias: ['listadmin'],
    category: 'group',
    desc: 'Lista los administradores del grupo',
    usage: '.admins',
    group: true,
    limit: false,
    async run(m) {
      const admins = (m.meta?.participants || []).filter((p) => p.admin)
      if (!admins.length) return m.reply('⚠️ No pude leer la lista de admins.')
      return m.reply(
        `🎖️ *ᴀᴅᴍɪɴs* (${admins.length})\n${admins.map((a) => `┊ ${a.admin === 'superadmin' ? '👑' : '⭐'} @${jidToNumber(a.id)}`).join('\n')}`,
        { mentions: admins.map((a) => a.id) }
      )
    }
  },
  {
    name: 'miembros',
    alias: ['members'],
    category: 'group',
    desc: 'Cuenta los miembros del grupo',
    usage: '.miembros',
    group: true,
    limit: false,
    async run(m) {
      const total = m.meta?.participants?.length || 0
      const admins = (m.meta?.participants || []).filter((p) => p.admin).length
      return m.reply(`👥 ᴍɪᴇᴍʙʀᴏs : ${total}\n🎖️ ᴀᴅᴍɪɴs : ${admins}\n🙋 ɴᴏʀᴍᴀʟᴇs : ${total - admins}`)
    }
  },
  {
    name: 'everyone',
    alias: ['avisar'],
    category: 'group',
    desc: 'Menciona a todos con un aviso elegante',
    usage: '.everyone <mensaje>',
    group: true,
    admin: true,
    limit: false,
    async run(m, ctx) {
      const members = m.meta?.participants?.map((p) => p.id.split('@')[0] + '@s.whatsapp.net') || []
      const texto = m.fullText.trim() || 'ᴛᴇɴɢᴀɴ ᴜɴ ʙᴜᴇɴ ᴅíᴀ ☀️'
      await m.reply('📣 ᴀᴠɪsᴀɴᴅᴏ ᴀ ᴛᴏᴅᴏs…')
      for (const jid of members.slice(0, 5)) {
        await sleep(300)
      }
      return ctx.sock.sendMessage(m.chat, {
        text: `╭───「 ᴀᴠɪsᴏ 」\n│ ${texto}\n╰───「 ${ctx.botName} 」`,
        mentions: members
      })
    }
  }
]
