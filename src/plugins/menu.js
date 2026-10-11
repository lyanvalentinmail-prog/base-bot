/**
 *  Categoría: ᴍᴇɴᴜ
 */
import config from '../../config.js'
import { smallCaps } from '../core/utils.js'
import { CATEGORY_LABELS, menuBlock, commandLine, resolveCategory } from '../core/menu.js'

export default [
  {
    name: 'menu',
    alias: ['menú', 'help', 'ayuda', 'comandos'],
    category: 'menu',
    desc: 'Muestra el menú principal o el de una categoría',
    usage: '.menu [categoría]',
    limit: false,
    async run(m, ctx) {
      ctx.lastPing = Math.max(1, Math.min(9999, Math.abs(Math.round(Date.now() - m.timestamp * 1000))))
      const query = m.fullText.trim()
      if (query) {
        const text = ctx.buildCategoryMenu(m, query)
        if (text) return m.reply(text)
        const cats = ctx.visibleCategories().map((c) => CATEGORY_LABELS[c])
        return m.reply(
          [`⚠️ ɴᴏ ᴇɴᴄᴏɴᴛʀᴇ́ ʟᴀ ᴄᴀᴛᴇɢᴏʀíᴀ *${smallCaps(query)}*`, '', menuBlock('ᴄᴀᴛᴇɢᴏʀɪᴀs', cats), '', config.bot.footer].join('\n')
        )
      }
      return m.reply(ctx.buildMenu(m))
    }
  },
  {
    name: 'allmenu',
    alias: ['todosmenu', 'menutotal'],
    category: 'menu',
    desc: 'Envía TODOS los comandos en un solo mensaje',
    usage: '.allmenu',
    limit: false,
    async run(m, ctx) {
      const parts = ctx.buildAllMenu(m) // normalmente 1 sola parte
      for (const part of parts) {
        await m.send(part)
        if (parts.length > 1) await m.wait(700)
      }
      ctx.log.cmd(`allmenu enviado en ${parts.length} mensaje(s) · ${parts.join('').length} caracteres`)
    }
  },
  {
    name: 'ping',
    alias: ['p', 'latencia'],
    category: 'menu',
    desc: 'Mide la velocidad de respuesta del bot',
    usage: '.ping',
    limit: false,
    async run(m, ctx) {
      const t0 = Date.now()
      const sent = await m.reply('🏓 ᴍɪᴅɪᴇɴᴅᴏ…')
      const ms = Date.now() - t0
      const apiCheck = await ctx.api.healthy().catch(() => ({ ok: false }))
      const uptime = ctx.utils.clockString(Date.now() - ctx.startTime)
      const text = [
        `🏓 *ᴘᴏɴɢ!*`,
        `┊ ʙᴏᴛ : ${ms} ms`,
        `┊ ᴀᴘɪ : ${apiCheck.ok ? 'online ✅' : 'sin respuesta ⚠️'}`,
        `┊ ᴜᴘᴛɪᴍᴇ : ${uptime}`,
        `┊ ʀᴀᴍ : ${ctx.utils.prettyBytes(process.memoryUsage().rss)}`
      ].join('\n')
      try {
        await m.sock.sendMessage(m.chat, { text, edit: sent.key })
      } catch {
        await m.reply(text)
      }
    }
  },
  {
    name: 'roles',
    alias: ['rol', 'planes', 'limites'],
    category: 'menu',
    desc: 'Lista los roles y cuántos comandos por día permite cada uno',
    usage: '.roles',
    limit: false,
    async run(m, ctx) {
      return m.reply(ctx.buildRolesMenu(m))
    }
  },
  {
    name: 'categorias',
    alias: ['categorías', 'cats'],
    category: 'menu',
    desc: 'Lista las categorías del menú',
    usage: '.categorias',
    limit: false,
    async run(m, ctx) {
      const lines = []
      for (const cat of ctx.visibleCategories()) {
        const plugins = ctx.pluginList.filter((p) => p.category === cat && !p.hidden)
        lines.push(`${CATEGORY_LABELS[cat]} — ${plugins.length} ᴄᴏᴍᴀɴᴅᴏs`)
      }
      lines.push(`ᴇsᴄʀɪʙᴇ ${ctx.prefix}ᴍᴇɴᴜ ᴄᴏɴ ᴇʟ ɴᴏᴍʙʀᴇ ᴅᴇ ᴜɴᴀ ᴄᴀᴛᴇɢᴏʀíᴀ ᴘᴀʀᴀ ᴠᴇʀʟᴀ ᴄᴏᴍᴘʟᴇᴛᴀ`)
      return m.reply([menuBlock('ᴄᴀᴛᴇɢᴏʀɪᴀs', lines), '', config.bot.footer].join('\n'))
    }
  }
]

export { commandLine, smallCaps }
