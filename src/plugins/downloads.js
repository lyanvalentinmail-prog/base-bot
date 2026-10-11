/**
 *  Categoría: ᴅᴏᴡɴʟᴏᴀᴅs — descargas con la API SiputZX
 *  (los endpoints de descarga necesitan yt-dlp instalado en tu API)
 */
import { extractUrl, prettyBytes, truncate } from '../core/utils.js'

const needService = (ctx, name, r) => {
  const lines = [
    r.message,
    '',
    `💡 ᴇʟ ᴇɴᴅᴘᴏɪɴᴛ /api/${name} ɴᴇᴄᴇsɪᴛᴀ ʏᴛ-ᴅʟᴘ ᴇɴ ᴛᴜ sᴇʀᴠɪᴅᴏʀ.`,
    '   ᴇɴ ʀᴇɴᴅᴇʀ → ᴛᴜ sᴇʀᴠɪᴄɪᴏ → sᴇᴛᴛɪɴɢs → ʙᴜɪʟᴅ ᴄᴏᴍᴍᴀɴᴅ :',
    '   apt-get update && apt-get install -y yt-dlp python3',
    '',
    `ᴍɪᴇɴᴛʀᴀs ᴛᴀɴᴛᴏ ʟᴀ ᴀᴘɪ sɪɢᴜᴇ sɪʀᴠɪᴇɴᴅᴏ ᴛᴀʀᴊᴇᴛᴀs, sᴛɪᴄᴋᴇʀs ʏ ᴍᴀ́s ✨`
  ]
  return m.reply(lines.join('\n'))
}

async function sendMedia(m, url, { title, extra = '', type = 'video' } = {}) {
  const caption = [`🎬 *${truncate(title || 'ᴅᴇsᴄᴀʀɢᴀ', 90)}*`, extra].filter(Boolean).join('\n')
  try {
    if (type === 'video') return await m.send({ video: { url }, caption, mimetype: 'video/mp4' })
    return await m.send({ audio: { url }, mimetype: 'audio/mpeg', caption })
  } catch {
    // si WhatsApp no acepta el enlace directo, lo descargamos
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length > 60 * 1024 * 1024) {
      return m.reply(`⚠️ ᴇʟ ᴀʀᴄʜɪᴠᴏ ᴘᴇsᴀ ${prettyBytes(buffer.length)} ʏ ᴇs ᴅᴇᴍᴀsɪᴀᴅᴏ ɢʀᴀɴᴅᴇ ᴘᴀʀᴀ ᴡʜᴀᴛsᴀᴘᴘ.`)
    }
    return type === 'video' ? m.send({ video: buffer, caption }) : m.send({ audio: buffer, mimetype: 'audio/mpeg' })
  }
}

const GENERIC = (platform) => async (m, ctx) => {
  const url = extractUrl(m.fullText) || m.arg
  if (!url) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}${platform.tool} <ᴇɴʟᴀᴄᴇ>`)
  await m.reply(`⬇️ ᴅᴇsᴄᴀʀɢᴀɴᴅᴏ ᴅᴇ *${platform.name}*…`)
  const r = await ctx.api.json(`/api/${platform.api}`, { url })
  if (!r.ok) return needService(ctx, platform.api, r)
  const d = r.data || {}
  const media = d.video || d.url || d.media || d.download
  const extra = [d.channel ? `┊ 👤 ${d.channel}` : null, d.duration ? `┊ ⏱️ ${d.duration}s` : null].filter(Boolean).join('\n')
  if (!media) return m.reply(`⚠️ ʟᴀ ᴀᴘɪ ɴᴏ ᴅᴇᴠᴏʟᴠɪᴏ́ ᴇʟ ᴀʀᴄʜɪᴠᴏ.\n${JSON.stringify(d).slice(0, 300)}`)
  await sendMedia(m, media, { title: d.title || `ᴠɪᴅᴇᴏ ᴅᴇ ${platform.name}`, extra, type: 'video' })
}

export default [
  {
    name: 'tiktok',
    alias: ['tt', 'ttdl'],
    category: 'downloads',
    desc: 'Descarga un video de TikTok (sin marca de agua)',
    usage: '.tiktok https://vt.tiktok.com/...',
    limit: 2,
    run: GENERIC({ name: 'ᴛɪᴋᴛᴏᴋ', api: 'tiktok', tool: 'ᴛɪᴋᴛᴏᴋ' })
  },
  {
    name: 'instagram',
    alias: ['ig', 'igdl', 'reel'],
    category: 'downloads',
    desc: 'Descarga un reel o video de Instagram',
    usage: '.instagram https://instagram.com/reel/...',
    limit: 2,
    run: GENERIC({ name: 'ɪɴsᴛᴀɢʀᴀᴍ', api: 'instagram', tool: 'ɪɴsᴛᴀɢʀᴀᴍ' })
  },
  {
    name: 'facebook',
    alias: ['fb', 'fbdl'],
    category: 'downloads',
    desc: 'Descarga un video de Facebook',
    usage: '.facebook https://facebook.com/watch?v=...',
    limit: 2,
    run: GENERIC({ name: 'ꜰᴀᴄᴇʙᴏᴏᴋ', api: 'facebook', tool: 'ꜰᴀᴄᴇʙᴏᴏᴋ' })
  },
  {
    name: 'twitter',
    alias: ['x', 'tw', 'xdl'],
    category: 'downloads',
    desc: 'Descarga un video de X (Twitter)',
    usage: '.twitter https://x.com/usuario/status/...',
    limit: 2,
    run: GENERIC({ name: 'x (ᴛᴡɪᴛᴛᴇʀ)', api: 'twitter', tool: 'ᴛᴡɪᴛᴛᴇʀ' })
  },
  {
    name: 'youtube',
    alias: ['yt', 'ytdl'],
    category: 'downloads',
    desc: 'Descarga video de YouTube (360p / 720p)',
    usage: '.youtube https://youtu.be/... [360|720]',
    limit: 2,
    async run(m, ctx) {
      const url = extractUrl(m.fullText) || m.arg
      if (!url) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʏᴏᴜᴛᴜʙᴇ <ᴇɴʟᴀᴄᴇ> [360|720]`)
      const quality = ['360', '720'].includes((m.args[1] || '').replace('p', '')) ? m.args[1].replace('p', '') : '360'
      await m.reply(`⬇️ ᴅᴇsᴄᴀʀɢᴀɴᴅᴏ ᴅᴇ *ʏᴏᴜᴛᴜʙᴇ* ᴇɴ ${quality}ᴘ…`)
      const r = await ctx.api.json('/api/youtube', { url, quality })
      if (!r.ok) return needService(ctx, 'youtube', r)
      const d = r.data || {}
      if (!d.video) return m.reply(`⚠️ sɪɴ ᴀʀᴄʜɪᴠᴏ ᴇɴ ʟᴀ ʀᴇsᴘᴜᴇsᴛᴀ.\n${JSON.stringify(d).slice(0, 300)}`)
      const extra = [d.channel ? `┊ 👤 ${d.channel}` : null, d.duration ? `┊ ⏱️ ${d.duration}s` : null, `┊ 🎚️ ${d.quality || quality + 'p'}`].filter(Boolean).join('\n')
      await sendMedia(m, d.video, { title: d.title, extra, type: 'video' })
    }
  },
  {
    name: 'ytmp3',
    alias: ['yta', 'ytaudio', 'mp3'],
    category: 'downloads',
    desc: 'Descarga el audio de un video de YouTube',
    usage: '.ytmp3 https://youtu.be/...',
    limit: 2,
    async run(m, ctx) {
      const url = extractUrl(m.fullText) || m.arg
      if (!url) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʏᴛᴍᴘ3 <ᴇɴʟᴀᴄᴇ ᴅᴇ ʏᴏᴜᴛᴜʙᴇ>`)
      await m.reply('⬇️ ᴇxᴛʀᴀʏᴇɴᴅᴏ ᴇʟ ᴀᴜᴅɪᴏ…')
      const r = await ctx.api.json('/api/youtube', { url, quality: 'audio' })
      if (!r.ok) return needService(ctx, 'youtube', r)
      const d = r.data || {}
      const media = d.audio || d.video
      if (!media) return m.reply(`⚠️ sɪɴ ᴀᴜᴅɪᴏ ᴇɴ ʟᴀ ʀᴇsᴘᴜᴇsᴛᴀ.\n${JSON.stringify(d).slice(0, 300)}`)
      await m.reply(`🎵 *${truncate(d.title || 'ᴀᴜᴅɪᴏ', 80)}*\n┊ 👤 ${d.channel || '—'}`)
      await sendMedia(m, media, { title: d.title, type: 'audio' })
    }
  },
  {
    name: 'ytmp4',
    alias: ['ytv', 'mp4'],
    category: 'downloads',
    desc: 'Descarga un video de YouTube en 720p',
    usage: '.ytmp4 https://youtu.be/...',
    limit: 2,
    async run(m, ctx) {
      const url = extractUrl(m.fullText) || m.arg
      if (!url) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʏᴛᴍᴘ4 <ᴇɴʟᴀᴄᴇ>`)
      await m.reply('⬇️ ᴅᴇsᴄᴀʀɢᴀɴᴅᴏ ᴇɴ 720ᴘ…')
      const r = await ctx.api.json('/api/youtube', { url, quality: '720' })
      if (!r.ok) return needService(ctx, 'youtube', r)
      const d = r.data || {}
      if (!d.video) return m.reply(`⚠️ sɪɴ ᴠɪᴅᴇᴏ ᴇɴ ʟᴀ ʀᴇsᴘᴜᴇsᴛᴀ.\n${JSON.stringify(d).slice(0, 300)}`)
      await sendMedia(m, d.video, { title: d.title, extra: `┊ 👤 ${d.channel || '—'}`, type: 'video' })
    }
  },
  {
    name: 'dlhelp',
    alias: ['descargas'],
    category: 'downloads',
    desc: 'Explica cómo activar las descargas en tu API',
    usage: '.dlhelp',
    limit: false,
    async run(m, ctx) {
      const r = await ctx.api.json('/api/meta/endpoints', {}, { retries: 0 })
      const down = (r.ok ? r.data.endpoints : []).filter((e) => e.category === 'downloader')
      return m.reply(
        [
          `╭───「 ᴅᴇsᴄᴀʀɢᴀs 」`,
          `│`,
          `│ ᴇsᴛᴀᴅᴏ ᴅᴇ ʟᴏs ᴇɴᴅᴘᴏɪɴᴛs :`,
          ...(down.length
            ? down.map((e) => `│ ┊ ${e.path} → ${e.runtime?.status === 'available' ? '✅ ᴏᴋ' : `⚠️ ${e.runtime?.missing?.join(', ') || e.runtime?.status}`}`)
            : ['│ ┊ (no pude leer el catálogo de la API)']),
          `│`,
          `│ ᴘᴀʀᴀ ᴀᴄᴛɪᴠᴀʀʟᴏs ᴇɴ ʀᴇɴᴅᴇʀ :`,
          `│ ┊ 1. ᴀɢʀᴇɢᴀ ᴜɴ ʙᴜɪʟᴅ ᴄᴏᴍᴍᴀɴᴅ :`,
          `│ ┊    apt-get update && apt-get install -y python3 python3-pip && pip install yt-dlp`,
          `│ ┊ 2. ᴠᴜᴇʟᴠᴇ ᴀ ᴅᴇsᴘʟᴇɢᴀʀ ʟᴀ ᴀᴘɪ`,
          `│ ┊ 3. ᴘʀᴜᴇʙᴀ ᴏᴛʀᴀ ᴠᴇᴢ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ`,
          `│`,
          `╰───「 ${ctx.botName} 」`
        ].join('\n')
      )
    }
  }
]
