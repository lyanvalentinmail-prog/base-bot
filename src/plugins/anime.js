/**
 *  Categoría: ᴀɴɪᴍᴇ — información e imágenes de anime (Jikan / waifu.pics vía API)
 */
import { truncate } from '../core/utils.js'

export default [
  {
    name: 'anime',
    alias: ['animesearch'],
    category: 'anime',
    desc: 'Busca información de un anime',
    usage: '.anime one piece',
    limit: 1,
    async run(m, ctx) {
      const q = m.fullText.trim()
      if (!q) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴀɴɪᴍᴇ <ɴᴏᴍʙʀᴇ>`)
      const r = await ctx.api.json('/api/anime', { q, limit: 5 })
      if (!r.ok) return m.reply(r.message)
      const list = r.data.results || []
      if (!list.length) return m.reply('🔍 ɴᴏ ᴇɴᴄᴏɴᴛʀᴇ́ ᴇsᴇ ᴀɴɪᴍᴇ 😕')
      const text = list
        .slice(0, 3)
        .map((a, i) =>
          [
            `*${i + 1}. ${a.title}* (${a.year || '—'})`,
            `┊ ᴛɪᴘᴏ : ${a.type || '—'} · ᴇᴘɪsᴏᴅɪᴏs : ${a.episodes || '?'}`,
            `┊ ᴇsᴛᴀᴅᴏ : ${a.status || '—'} · ⭐ ${a.score || '—'}`,
            `┊ ${truncate(a.synopsis, 260)}`,
            `┊ ${a.url}`
          ].join('\n')
        )
        .join('\n\n')
      return m.reply(`🎌 *${r.data.query || q}*\n\n${text}`)
    }
  },
  {
    name: 'manga',
    alias: ['mangasearch'],
    category: 'anime',
    desc: 'Busca información de un manga',
    usage: '.manga berserk',
    limit: 1,
    async run(m, ctx) {
      const q = m.fullText.trim()
      if (!q) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴍᴀɴɢᴀ <ɴᴏᴍʙʀᴇ>`)
      const r = await ctx.api.json('/api/manga', { q, limit: 5 })
      if (!r.ok) return m.reply(r.message)
      const list = r.data.results || []
      if (!list.length) return m.reply('🔍 sɪɴ ʀᴇsᴜʟᴛᴀᴅᴏs 😕')
      const text = list
        .slice(0, 3)
        .map((a, i) => `*${i + 1}. ${a.title}* (${a.year || '—'})\n┊ ᴄᴀᴘíᴛᴜʟᴏs : ${a.chapters || '?'} · ⭐ ${a.score || '—'}\n┊ ${truncate(a.synopsis, 220)}\n┊ ${a.url}`)
        .join('\n\n')
      return m.reply(`📖 *${r.data.query || q}*\n\n${text}`)
    }
  },
  {
    name: 'waifu',
    alias: ['animeimg', 'animegirl'],
    category: 'anime',
    desc: 'Envía una imagen de waifu aleatoria',
    usage: '.waifu',
    limit: 1,
    async run(m, ctx) {
      const r = await ctx.api.json('/api/waifu')
      if (!r.ok) return m.reply(r.message)
      return m.send({ image: { url: r.data.image }, caption: `🌸 ᴡᴀɪꜰᴜ ᴀʟᴇᴀᴛᴏʀɪᴀ` })
    }
  },
  {
    name: 'neko',
    alias: ['gatita', 'animecat'],
    category: 'anime',
    desc: 'Envía una imagen neko aleatoria',
    usage: '.neko',
    limit: 1,
    async run(m, ctx) {
      const r = await ctx.api.json('/api/neko')
      if (!r.ok) return m.reply(r.message)
      return m.send({ image: { url: r.data.image }, caption: '🐱 ɴᴇᴋᴏ ᴀʟᴇᴀᴛᴏʀɪᴏ' })
    }
  },
  {
    name: 'fraseanime',
    alias: ['quoteanime', 'frase'],
    category: 'anime',
    desc: 'Frase célebre de un anime',
    usage: '.fraseanime [cantidad]',
    limit: 1,
    async run(m, ctx) {
      const limit = Math.min(10, Math.max(1, parseInt(m.arg || '1', 10) || 1))
      const r = await ctx.api.json('/api/quoteanime', { limit })
      if (!r.ok) return m.reply(r.message)
      const quotes = r.data.quotes || []
      if (!quotes.length) return m.reply('😕 No hay frases disponibles ahora.')
      return m.reply(quotes.map((q) => `💬 _"${q.quote}"_\n┊ — ${q.character} (${q.anime})`).join('\n\n'))
    }
  }
]
