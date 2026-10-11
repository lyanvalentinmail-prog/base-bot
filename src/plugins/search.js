/**
 *  Categoría: sᴇᴀʀᴄʜ — buscadores de la API SiputZX (+ GitHub directo)
 */
import { truncate } from '../core/utils.js'

export default [
  {
    name: 'google',
    alias: ['buscar', 'search'],
    category: 'search',
    desc: 'Busca en Google (requiere claves en tu API)',
    usage: '.google qué es node.js',
    limit: 1,
    async run(m, ctx) {
      const q = m.fullText.trim()
      if (!q) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ɢᴏᴏɢʟᴇ <ʙúsǫᴜᴇᴅᴀ>`)
      const r = await ctx.api.json('/api/search/google', { q, limit: 6 })
      if (!r.ok) return m.reply(r.message)
      const results = r.data.results || []
      if (!results.length) return m.reply('🔍 sɪɴ ʀᴇsᴜʟᴛᴀᴅᴏs')
      return m.reply(
        [
          `🔍 *${r.data.query}*`,
          '',
          ...results.map((it, i) => `*${i + 1}. ${it.title}*\n${truncate(it.snippet, 160)}\n${it.url}`)
        ].join('\n')
      )
    }
  },
  {
    name: 'wiki',
    alias: ['wikipedia'],
    category: 'search',
    desc: 'Busca en Wikipedia',
    usage: '.wiki Node.js [lang]',
    limit: 1,
    async run(m, ctx) {
      const arg = (m.arg || '').toLowerCase()
      const langs = ['es', 'en', 'pt', 'fr', 'de', 'it']
      const lang = langs.includes(arg) ? arg : 'es'
      const q = langs.includes(arg) ? m.rest : m.fullText.trim()
      if (!q) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴡɪᴋɪ <ᴛᴇᴍᴀ> [ᴇs|ᴇɴ|ᴘᴛ|ꜰʀ|ᴅᴇ|ɪᴛ]`)
      const r = await ctx.api.json('/api/search/wikipedia', { q, lang })
      if (!r.ok) return m.reply(r.message)
      const { title, summary, url, thumbnail } = r.data
      const text = `📚 *${title}*\n\n${truncate(summary, 900)}\n\n🔗 ${url}`
      if (thumbnail) return m.send({ image: { url: thumbnail }, caption: text }).catch(() => m.reply(text))
      return m.reply(text)
    }
  },
  {
    name: 'imgsearch',
    alias: ['imagenes', 'gimage', 'fotos'],
    category: 'search',
    desc: 'Busca imágenes en internet',
    usage: '.imgsearch gatos',
    limit: 1,
    async run(m, ctx) {
      const q = m.fullText.trim()
      if (!q) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ɪᴍɢsᴇᴀʀᴄʜ <ᴛᴇᴍᴀ>`)
      const r = await ctx.api.json('/api/search/images', { q, limit: 6 })
      if (!r.ok) return m.reply(r.message)
      const results = (r.data.results || []).slice(0, 5)
      if (!results.length) return m.reply('🔍 sɪɴ ʀᴇsᴜʟᴛᴀᴅᴏs')
      await m.reply(`🖼️ ᴇɴᴄᴏɴᴛʀé ${results.length} ɪᴍᴀɢᴇɴᴇs ᴅᴇ *${r.data.query}*`)
      for (const item of results) {
        await m.send({ image: { url: item.url }, caption: `📷 ${truncate(item.title, 80)}\n┊ ᴀᴜᴛᴏʀ : ${item.creator || '—'}\n┊ ʟɪᴄᴇɴᴄɪᴀ : ${item.license || '—'}\n┊ ꜰᴜᴇɴᴛᴇ : ${item.source || '—'}` }).catch(() => {})
        await m.wait(600)
      }
    }
  },
  {
    name: 'pinterest',
    alias: ['pin'],
    category: 'search',
    desc: 'Busca en Pinterest (el endpoint está deshabilitado en la API)',
    usage: '.pinterest decoración',
    limit: 1,
    async run(m, ctx) {
      const q = m.fullText.trim()
      if (!q) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴘɪɴᴛᴇʀᴇsᴛ <ᴛᴇᴍᴀ>`)
      const r = await ctx.api.json('/api/search/pinterest', { q })
      if (!r.ok) {
        return m.reply(
          [
            r.message,
            '',
            '💡 ᴇʟ ᴇɴᴅᴘᴏɪɴᴛ ᴅᴇ ᴘɪɴᴛᴇʀᴇsᴛ ɴᴏ ᴇsᴛᴀ́ ᴅɪsᴘᴏɴɪʙʟᴇ ᴇɴ ʟᴀ ᴀᴘɪ.',
            `ᴜsᴀ ${ctx.prefix}ɪᴍɢsᴇᴀʀᴄʜ ᴍɪᴇɴᴛʀᴀs ᴛᴀɴᴛᴏ 🖼️`
          ].join('\n')
        )
      }
      return m.reply('🔍 ' + JSON.stringify(r.data).slice(0, 1500))
    }
  },
  {
    name: 'lyrics',
    alias: ['letra', 'letras'],
    category: 'search',
    desc: 'Busca la letra de una canción',
    usage: '.lyrics bohemian rhapsody',
    limit: 1,
    async run(m, ctx) {
      const q = m.fullText.trim()
      if (!q) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʟʏʀɪᴄs <ᴄᴀɴᴄɪᴏɴ>`)
      const r = await ctx.api.json('/api/music/lyrics', { q, limit: 1 })
      if (!r.ok) return m.reply(r.message)
      const song = r.data.results?.[0]
      if (!song) return m.reply('🔍 ɴᴏ ᴇɴᴄᴏɴᴛʀᴇ́ ᴇsᴀ ᴄᴀɴᴄɪᴏ́ɴ 😕')
      const header = `🎵 *${song.track}*\n┊ 👤 ${song.artist}\n┊ 💿 ${song.album || '—'}\n\n`
      const lyrics = truncate(song.lyrics || '(sin letra)', 3000)
      return m.reply(header + lyrics)
    }
  },
  {
    name: 'spotify',
    alias: ['sp'],
    category: 'search',
    desc: 'Busca canciones en Spotify (requiere claves en tu API)',
    usage: '.spotify blinding lights',
    limit: 1,
    async run(m, ctx) {
      const q = m.fullText.trim()
      if (!q) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}sᴘᴏᴛɪꜰʏ <ᴄᴀɴᴄɪᴏɴ>`)
      const r = await ctx.api.json('/api/music/spotify', { q, limit: 5 })
      if (!r.ok) return m.reply(r.message)
      const results = r.data.results || []
      if (!results.length) return m.reply('🔍 sɪɴ ʀᴇsᴜʟᴛᴀᴅᴏs')
      return m.reply(
        ['🎧 *sᴘᴏᴛɪꜰʏ*', '', ...results.map((s, i) => `${i + 1}. *${s.track}* — ${s.artist}\n┊ ⏱️ ${Math.round((s.duration_ms || 0) / 1000)}s · ⭐ ${s.popularity || '—'}\n┊ ${s.url || ''}`)].join('\n')
      )
    }
  },
  {
    name: 'play',
    alias: ['ytsearch', 'music'],
    category: 'search',
    desc: 'Busca música en YouTube (requiere yt-dlp en tu API)',
    usage: '.play never gonna give you up',
    limit: 2,
    async run(m, ctx) {
      const q = m.fullText.trim()
      if (!q) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴘʟᴀʏ <ᴄᴀɴᴄɪᴏ́ɴ ᴏ ᴀʀᴛɪsᴛᴀ>`)
      const r = await ctx.api.json('/api/music/play', { q, limit: 5 })
      if (!r.ok) {
        return m.reply(
          [r.message, '', '💡 ᴛᴜ ᴀᴘɪ ɴᴇᴄᴇsɪᴛᴀ ʏᴛ-ᴅʟᴘ ɪɴsᴛᴀʟᴀᴅᴏ (ʀᴇɴᴅᴇʀ → ʙᴜɪʟᴅ ᴄᴏᴍᴍᴀɴᴅ) ᴘᴀʀᴀ ᴅᴇsᴄᴀʀɢᴀs.'].join('\n')
        )
      }
      const results = r.data.results || []
      if (!results.length) return m.reply('🔍 sɪɴ ʀᴇsᴜʟᴛᴀᴅᴏs')
      return m.reply(
        [
          `🎵 *${r.data.query}*`,
          '',
          ...results.map((v, i) => `${i + 1}. ${v.title}\n┊ 👤 ${v.channel || '—'} · ⏱️ ${v.duration || '?'}s\n┊ ${v.url}`),
          '',
          `ᴅᴇsᴄᴀʀɢᴀ ᴀᴜᴅɪᴏ ᴄᴏɴ : ${ctx.prefix}ʏᴛᴍᴘ3 <ᴇɴʟᴀᴄᴇ>`
        ].join('\n')
      )
    }
  },
  {
    name: 'github',
    alias: ['gh', 'usergithub'],
    category: 'search',
    desc: 'Muestra el perfil de GitHub de un usuario',
    usage: '.github torvalds',
    limit: 1,
    async run(m, ctx) {
      const user = (m.arg || '').replace(/[^a-zA-Z0-9-]/g, '')
      if (!user) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ɢɪᴛʜᴜʙ <ᴜsᴜᴀʀɪᴏ>`)
      try {
        const res = await fetch(`https://api.github.com/users/${user}`, { headers: { 'User-Agent': ctx.botName } })
        if (!res.ok) return m.reply(`❌ GitHub no encontró a *${user}* (${res.status})`)
        const u = await res.json()
        const repos = await fetch(`${u.repos_url}?per_page=3&sort=updated`, { headers: { 'User-Agent': ctx.botName } })
          .then((r) => r.json())
          .catch(() => [])
        const text = [
          `🐙 *${u.login}* ${u.name ? `(${u.name})` : ''}`,
          `┊ 📝 ${u.bio || 'sin biografía'}`,
          `┊ 👥 ${u.followers} seguidores · ${u.following} siguiendo`,
          `┊ 📦 ${u.public_repos} repos · ⭐ ${u.public_gists} gists`,
          `┊ 📍 ${u.location || '—'} · 🏢 ${u.company || '—'}`,
          repos?.length ? `┊ 🆕 ᴜ́ʟᴛɪᴍᴏs :\n${repos.map((r) => `┊   · ${r.name} ⭐${r.stargazers_count}`).join('\n')}` : '',
          `┊ 🔗 ${u.html_url}`
        ]
          .filter(Boolean)
          .join('\n')
        if (u.avatar_url) return m.send({ image: { url: u.avatar_url }, caption: text }).catch(() => m.reply(text))
        return m.reply(text)
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  }
]
