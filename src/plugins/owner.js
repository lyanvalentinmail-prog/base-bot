/**
 *  Categoría: ᴏᴡɴᴇʀ — control total del bot
 */
import fs from 'node:fs'
import config from '../../config.js'
import db from '../core/store.js'
import log from '../core/logger.js'
import { deleteSession } from '../core/connection.js'
import { bareJid, jidToNumber, normalizePhone, sleep } from '../core/utils.js'

const toggle = (m, key, label) => {
  const arg = (m.arg || '').toLowerCase()
  const current = !!db.settings[key]
  const value = ['on', '1', 'true', 'si', 'sí', 'activar'].includes(arg) ? true : ['off', '0', 'false', 'no', 'desactivar'].includes(arg) ? false : !current
  db.settings[key] = value
  db.markDirty()
  return m.reply(`${value ? '✅' : '❌'} *${label}* ${value ? 'activado' : 'desactivado'}`)
}

export default [
  {
    name: 'self',
    alias: ['selfmode', 'privado'],
    category: 'owner',
    desc: 'Modo self: solo los owners pueden usar el bot',
    usage: '.self on/off',
    owner: true,
    limit: false,
    run: (m) => toggle(m, 'selfMode', 'ᴍᴏᴅᴏ sᴇʟғ')
  },
  {
    name: 'autotype',
    alias: ['escribiendo'],
    category: 'owner',
    desc: 'Muestra «escribiendo…» mientras el bot responde',
    usage: '.autotype on/off',
    owner: true,
    limit: false,
    run: (m) => toggle(m, 'autotype', 'ᴀᴜᴛᴏᴛʏᴘᴇ')
  },
  {
    name: 'autoread',
    alias: ['leer'],
    category: 'owner',
    desc: 'Marca los mensajes como leídos',
    usage: '.autoread on/off',
    owner: true,
    limit: false,
    run: (m) => toggle(m, 'autoread', 'ᴀᴜᴛᴏʀᴇᴀᴅ')
  },
  {
    name: 'chatbot',
    alias: ['autoai'],
    category: 'owner',
    desc: 'Responde con IA a los mensajes que no son comandos',
    usage: '.chatbot on/off',
    owner: true,
    limit: false,
    run: (m) => toggle(m, 'chatbot', 'ᴄʜᴀᴛʙᴏᴛ ɪᴀ')
  },
  {
    name: 'setprefix',
    alias: ['prefijo', 'prefix'],
    category: 'owner',
    desc: 'Cambia el prefijo de los comandos',
    usage: '.setprefix !',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const p = m.arg
      if (!p || p.length > 3) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}sᴇᴛᴘʀᴇғɪx <sɪᴍʙᴏʟᴏ>\nᴘʀᴇғɪᴊᴏ ᴀᴄᴛᴜᴀʟ : ${ctx.prefix}`)
      ctx.prefix = p
      return m.reply(`✅ ᴘʀᴇғɪᴊᴏ ᴄᴀᴍʙɪᴀᴅᴏ ᴀ : ${p}\nᴘʀᴜᴇʙᴀ ᴄᴏɴ ${p}ᴍᴇɴᴜ`)
    }
  },
  {
    name: 'setbotname',
    alias: ['nombrebot', 'nombre-bot'],
    category: 'owner',
    desc: 'Cambia el nombre del bot (aparece en el menú)',
    usage: '.setname <nombre>',
    owner: true,
    limit: false,
    async run(m) {
      const name = m.fullText.trim()
      if (!name) return m.reply('⚙️ ᴜsᴏ : .sᴇᴛʙᴏᴛɴᴀᴍᴇ <ɴᴏᴍʙʀᴇ ᴅᴇʟ ʙᴏᴛ>')
      db.settings.botName = name.slice(0, 40)
      db.markDirty()
      return m.reply(`✅ ᴀʜᴏʀᴀ ᴍᴇ ʟʟᴀᴍᴏ *${db.settings.botName}*`)
    }
  },
  {
    name: 'addowner',
    alias: ['adddueño'],
    category: 'owner',
    desc: 'Añade un owner más',
    usage: '.addowner 5491112345678',
    owner: true,
    limit: false,
    async run(m) {
      const number = normalizePhone(m.arg || m.mentionedOrQuoted() || '')
      if (number.length < 8) return m.reply('⚙️ ᴜsᴏ : .ᴀᴅᴅᴏᴡɴᴇʀ <ɴúᴍᴇʀᴏ ᴄᴏɴ ᴄóᴅɪɢᴏ ᴅᴇ ᴘᴀíꜱ>')
      const added = db.addOwner(number)
      return m.reply(added ? `✅ +${number} ᴀʜᴏʀᴀ ᴇs ᴏᴡɴᴇʀ` : `ℹ️ +${number} ʏᴀ ᴇʀᴀ ᴏᴡɴᴇʀ`)
    }
  },
  {
    name: 'delowner',
    alias: ['quitarowner', 'removeowner'],
    category: 'owner',
    desc: 'Quita un owner',
    usage: '.delowner 5491112345678',
    owner: true,
    limit: false,
    async run(m) {
      const number = normalizePhone(m.arg || '')
      if (!number) return m.reply('⚙️ ᴜsᴏ : .ᴅᴇʟᴏᴡɴᴇʀ <ɴúᴍᴇʀᴏ>')
      const removed = db.removeOwner(number)
      return m.reply(removed ? `🗑️ +${number} ʏᴀ ɴᴏ ᴇs ᴏᴡɴᴇʀ` : 'ℹ️ Ese número no estaba en la lista')
    }
  },
  {
    name: 'owners',
    alias: ['listowners'],
    category: 'owner',
    desc: 'Lista los owners del bot',
    usage: '.owners',
    owner: true,
    limit: false,
    async run(m) {
      return m.reply(`👑 ᴏᴡɴᴇʀs :\n${db.owners.map((o) => `┊ +${o}`).join('\n') || '┊ (ninguno)'}`)
    }
  },
  {
    name: 'reload',
    alias: ['recargar'],
    category: 'owner',
    desc: 'Recarga los plugins sin apagar el bot',
    usage: '.reload',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const before = ctx.pluginList.length
      await ctx.reloadPlugins()
      return m.reply(`♻️ ᴘʟᴜɢɪɴs ʀᴇᴄᴀʀɢᴀᴅᴏs : ${before} → ${ctx.pluginList.length} ᴄᴏᴍᴀɴᴅᴏs`)
    }
  },
  {
    name: 'save',
    alias: ['guardar'],
    category: 'owner',
    desc: 'Fuerza el guardado de la base de datos',
    usage: '.save',
    owner: true,
    limit: false,
    async run(m) {
      db.saveNow()
      return m.reply('💾 ʙᴀsᴇ ᴅᴇ ᴅᴀᴛᴏs ɢᴜᴀʀᴅᴀᴅᴀ')
    }
  },
  {
    name: 'restart',
    alias: ['reiniciar'],
    category: 'owner',
    desc: 'Reinicia el bot',
    usage: '.restart',
    owner: true,
    limit: false,
    async run(m, ctx) {
      await m.reply('🔄 ʀᴇɪɴɪᴄɪᴀɴᴅᴏ ʜᴀsᴛᴀ ʟᴜᴇɢᴏ 👋')
      ctx.restart()
    }
  },
  {
    name: 'shutdown',
    alias: ['off', 'apagar'],
    category: 'owner',
    desc: 'Apaga el bot por completo',
    usage: '.shutdown',
    owner: true,
    limit: false,
    async run(m) {
      await m.reply('🛑 ᴀᴘᴀɢᴀɴᴅᴏ ᴇʟ ʙᴏᴛ…')
      db.saveNow()
      setTimeout(() => process.exit(0), 1000)
    }
  },
  {
    name: 'logout',
    alias: ['unlink', 'desvincular'],
    category: 'owner',
    desc: 'Borra la sesión de WhatsApp (para vincular otro número)',
    usage: '.logout',
    owner: true,
    limit: false,
    async run(m) {
      await m.reply('🚪 ᴇsᴛᴀs ᴅᴇɴᴛʀᴏ ᴅᴇ ɴᴏᴜᴇᴠᴏ ʜᴀʏ ǫᴜᴇ ᴠɪɴᴄᴜʟᴀʀ ᴜɴ ɴúᴍᴇʀᴏ. ʀᴇɪɴɪᴄɪᴀɴᴅᴏ…')
      deleteSession()
      db.saveNow()
      setTimeout(() => process.exit(51), 1200)
    }
  },
  {
    name: 'exec',
    alias: ['eval', '>'],
    category: 'owner',
    desc: 'Ejecuta código JavaScript (solo owners expertos)',
    usage: '.exec return Object.keys(db.data.users).length',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const code = m.fullText.trim()
      if (!code) return m.reply('⚙️ ᴜsᴏ : .ᴇxᴇᴄ <ᴄóᴅɪɢᴏ ᴊs>')
      try {
        const fn = new Function('ctx', 'db', 'config', 'm', `return (async () => { ${code} })()`)
        const result = await fn(ctx, db, config, m)
        const out = typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        return m.reply(`✅ ʀᴇsᴜʟᴛᴀᴅᴏ:\n${String(out).slice(0, 3500)}`)
      } catch (e) {
        return m.reply(`❌ ᴇʀʀᴏʀ:\n${e.message}`)
      }
    }
  },
  {
    name: 'bc',
    alias: ['broadcast', 'difundir'],
    category: 'owner',
    desc: 'Envía un mensaje a todos los grupos donde está el bot',
    usage: '.bc <mensaje>',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const text = m.fullText.trim()
      if (!text) return m.reply('⚙️ ᴜsᴏ : .ʙᴄ <ᴍᴇɴsᴀᴊᴇ>')
      const groups = Object.keys(db.data.groups)
      await m.reply(`📢 ᴇɴᴠɪᴀɴᴅᴏ ᴀ ${groups.length} ɢʀᴜᴘᴏs…`)
      let sent = 0
      let failed = 0
      for (const jid of groups) {
        try {
          await ctx.sock.sendMessage(jid, { text: `📢 *ᴀᴠɪsᴏ ᴅᴇ ${ctx.botName}*\n\n${text}` })
          sent++
          await sleep(1200)
        } catch {
          failed++
        }
      }
      return m.reply(`✅ ᴇɴᴠɪᴀᴅᴏ : ${sent}\n⚠️ ꜰᴀʟʟɪᴅᴏs : ${failed}`)
    }
  },
  {
    name: 'join',
    alias: ['entrar'],
    category: 'owner',
    desc: 'El bot entra a un grupo con el enlace de invitación',
    usage: '.join https://chat.whatsapp.com/XXXX',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const link = m.arg || ''
      const code = link.replace(/.*chat\.whatsapp\.com\//i, '').replace(/[^a-zA-Z0-9]/g, '')
      if (!code) return m.reply('⚙️ ᴜsᴏ : .ᴊᴏɪɴ <ᴇɴʟᴀᴄᴇ ᴅᴇ ɢʀᴜᴘᴏ>')
      try {
        const jid = await ctx.sock.groupAcceptInvite(code)
        return m.reply(`✅ ᴇɴᴛʀᴇ ᴀʟ ɢʀᴜᴘᴏ : ${jid}`)
      } catch (e) {
        return m.reply(`❌ No pude entrar: ${e.message}`)
      }
    }
  },
  {
    name: 'leave',
    alias: ['salir'],
    category: 'owner',
    desc: 'El bot sale del grupo actual o de uno indicado',
    usage: '.leave [id del grupo]',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const jid = m.arg && m.arg.includes('@g.us') ? m.arg : m.chat
      if (!jid.endsWith('@g.us')) return m.reply('⚙️ ᴜsᴏ : .ʟᴇᴀᴠᴇ (ᴇɴ ᴜɴ ɢʀᴜᴘᴏ) ᴏ .ʟᴇᴀᴠᴇ <ɪᴅ ᴅᴇʟ ɢʀᴜᴘᴏ>')
      await m.reply('👋 sᴀʟɪᴇɴᴅᴏ ᴅᴇʟ ɢʀᴜᴘᴏ…')
      await ctx.sock.groupLeave(jid).catch(() => {})
    }
  },
  {
    name: 'grupos',
    alias: ['listagrupos', 'grouplist'],
    category: 'owner',
    desc: 'Lista los grupos donde está el bot',
    usage: '.grupos [página]',
    owner: true,
    limit: false,
    async run(m) {
      const list = Object.entries(db.data.groups)
      if (!list.length) return m.reply('📭 ᴛᴏᴅᴀᴠíᴀ ɴᴏ ᴇsᴛᴏʏ ᴇɴ ɴɪɴɢúɴ ɢʀᴜᴘᴏ.')
      const page = Math.max(1, parseInt(m.arg || '1', 10) || 1)
      const perPage = 10
      const slice = list.slice((page - 1) * perPage, page * perPage)
      const totalPages = Math.ceil(list.length / perPage)
      const text = [
        `╭───「 ᴍɪs ɢʀᴜᴘᴏs 」`,
        `│ ᴛᴏᴛᴀʟ : ${list.length} · ᴘᴀ́ɢɪɴᴀ ${page}/${totalPages}`,
        `│`,
        ...slice.map(([jid, g], i) => `│ ${(page - 1) * perPage + i + 1}. ${g.name || '(sin nombre)'}\n│    ${jid}`),
        `│`,
        `│ ᴜsᴀ .ɢʀᴜᴘᴏs ${page + 1} ᴘᴀʀᴀ ᴠᴇʀ ᴍᴀ́s`,
        `╰───「 ${config.bot.footer} 」`
      ].join('\n')
      return m.reply(text.slice(0, 6000))
    }
  },
  {
    name: 'setpp',
    alias: ['setfoto', 'setpfp'],
    category: 'owner',
    desc: 'Cambia la foto de perfil del bot (responde a una imagen)',
    usage: '.setpp (respondiendo a una foto)',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const buffer = (await m.downloadQuoted()) || (await m.download())
      if (!buffer) return m.reply('📷 ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ ᴄᴏɴ .sᴇᴛᴘᴘ')
      await ctx.sock.updateProfilePicture(ctx.sock.user.id, buffer)
      return m.reply('✅ ꜰᴏᴛᴏ ᴅᴇ ᴘᴇʀғɪʟ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ')
    }
  },
  {
    name: 'setbio',
    alias: ['setstatus', 'bio'],
    category: 'owner',
    desc: 'Cambia el estado/frase del bot',
    usage: '.setbio <texto>',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const text = m.fullText.trim()
      if (!text) return m.reply('⚙️ ᴜsᴏ : .sᴇᴛʙɪᴏ <ᴛᴇxᴛᴏ>')
      try {
        await ctx.sock.updateProfileStatus(text)
        return m.reply('✅ ᴇsᴛᴀᴅᴏ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴏ')
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  },
  {
    name: 'ban',
    alias: ['bloquear'],
    category: 'owner',
    desc: 'Bloquea a un usuario para que el bot lo ignore',
    usage: '.ban @usuario',
    owner: true,
    limit: false,
    async run(m) {
      const target = m.mentionedOrQuoted()
      const number = jidToNumber(target || m.arg || '')
      if (!number) return m.reply('⚙️ ᴜsᴏ : .ʙᴀɴ @ᴜsᴜᴀʀɪᴏ')
      if (!db.data.bans.includes(number)) db.data.bans.push(number)
      db.updateUser(bareJid(target || `${number}@s.whatsapp.net`), { banned: true })
      db.markDirty()
      return m.reply(`🚫 +${number} ʙʟᴏǫᴜᴇᴀᴅᴏ`)
    }
  },
  {
    name: 'unban',
    alias: ['desbloquear'],
    category: 'owner',
    desc: 'Quita el bloqueo de un usuario',
    usage: '.unban @usuario',
    owner: true,
    limit: false,
    async run(m) {
      const target = m.mentionedOrQuoted()
      const number = jidToNumber(target || m.arg || '')
      db.data.bans = db.data.bans.filter((n) => n !== number)
      if (target) db.updateUser(bareJid(target), { banned: false })
      db.markDirty()
      return m.reply(`✅ +${number} ᴅᴇsʙʟᴏǫᴜᴇᴀᴅᴏ`)
    }
  },
  {
    name: 'files',
    alias: ['ls', 'archivos'],
    category: 'owner',
    desc: 'Lista archivos del proyecto (para depurar)',
    usage: '.files [ruta]',
    owner: true,
    limit: false,
    async run(m) {
      const target = m.arg || '.'
      try {
        const list = fs.readdirSync(target, { withFileTypes: true })
        return m.reply(
          `📁 *${target}*\n` + list.slice(0, 60).map((f) => `┊ ${f.isDirectory() ? '📂' : '📄'} ${f.name}`).join('\n')
        )
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  },
  {
    name: 'clearcache',
    alias: ['limpiarcache'],
    category: 'owner',
    desc: 'Limpia la caché de grupos y guarda la base de datos',
    usage: '.clearcache',
    owner: true,
    limit: false,
    async run(m, ctx) {
      ctx.groupCache.clear()
      db.saveNow()
      log.info('Caché limpiada por owner')
      return m.reply('🧹 ᴄᴀᴄʜᴇ ʟɪᴍᴘɪᴀᴅᴀ')
    }
  }
]
