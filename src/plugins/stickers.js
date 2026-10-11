/**
 *  Categoría: sᴛɪᴄᴋᴇʀs — stickers con la API SiputZX (+ conversión local con canvas)
 */

/** Convierte cualquier imagen/gif en webp de sticker (API → canvas local) */
export async function toSticker(ctx, buffer, mimetype = 'image/png') {
  // 1) la API hace la conversión (rápida y siempre disponible)
  const r = await ctx.api.upload('/api/sticker', buffer, {
    filename: mimetype.includes('gif') ? 'sticker.gif' : 'sticker.png',
    mimetype,
    field: 'file'
  })
  if (r.ok && r.buffer?.length) return { buffer: r.buffer, source: 'api' }

  // 2) conversión local con @napi-rs/canvas
  const skia = await ctx.canvas.loadCanvasEngine()
  if (skia) {
    try {
      const img = await skia.loadImage(buffer)
      const size = 512
      const canvas = skia.createCanvas(size, size)
      const c = canvas.getContext('2d')
      const ratio = Math.min(size / img.width, size / img.height)
      const w = img.width * ratio
      const h = img.height * ratio
      c.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
      return { buffer: canvas.toBuffer('image/webp'), source: 'local' }
    } catch (e) {
      ctx.log.debug('toSticker local falló:', e.message)
    }
  }
  return { buffer: null, error: r.message }
}

/** Saca una imagen del mensaje: directa, respondiendo o por enlace */
export async function pickImage(m, ctx) {
  if (m.mediaType === 'image' || m.mediaType === 'sticker') return await m.download()
  const quoted = await m.downloadQuoted()
  if (quoted) return quoted
  const url = m.args.find((a) => /^https?:\/\//.test(a))
  if (url) {
    const res = await fetch(url)
    if (res.ok) return Buffer.from(await res.arrayBuffer())
  }
  return null
}

export default [
  {
    name: 'sticker',
    alias: ['s', 'stiker', 'figu', 'figurita'],
    category: 'stickers',
    desc: 'Convierte una imagen o video en sticker',
    usage: '.sticker (respondiendo a una imagen / con enlace)',
    limit: 1,
    async run(m, ctx) {
      const buffer = (await pickImage(m, ctx)) || (await m.download())
      if (!buffer) {
        return m.reply(
          [
            `⚙️ ᴍáɴᴅᴀᴍᴇ ᴜɴᴀ ɪᴍᴀɢᴇɴ ᴄᴏɴ ${ctx.prefix}sᴛɪᴄᴋᴇʀ ᴅᴇ ᴘɪᴇ ᴏ ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ.`,
            `ᴛᴀᴍʙɪᴇ́ɴ ᴠᴀʟᴇ : ${ctx.prefix}sᴛɪᴄᴋᴇʀ https://…/imagen.jpg`
          ].join('\n')
        )
      }
      await m.react('🖼️')
      const { buffer: webp, error } = await toSticker(ctx, buffer, m.mediaType === 'video' ? 'video/mp4' : 'image/jpeg')
      if (!webp) return m.reply(error || '⚠️ No pude crear el sticker.')
      return m.sendSticker(webp)
    }
  },
  {
    name: 'brat',
    alias: ['bratsticker'],
    category: 'stickers',
    desc: 'Sticker estilo Brat',
    usage: '.brat hola mundo [bg: lime|black|white]',
    limit: 1,
    async run(m, ctx) {
      const bg = ['lime', 'black', 'white'].includes((m.args.at(-1) || '').toLowerCase()) ? m.args.at(-1).toLowerCase() : 'lime'
      const text = (bg === (m.args.at(-1) || '').toLowerCase() ? m.args.slice(0, -1) : m.args).join(' ').trim()
      if (!text) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʙʀᴀᴛ ʜᴏʟᴀ ᴍᴜɴᴅᴏ [ʟɪᴍᴇ|ʙʟᴀᴄᴋ|ᴡʜɪᴛᴇ]`)
      const r = await ctx.api.buffer('/api/brat', { text, bg, size: 512 })
      if (!r.ok) return m.reply(r.message)
      const { buffer: webp } = await toSticker(ctx, r.buffer, 'image/png')
      if (!webp) return m.send({ image: r.buffer, caption: `🎨 ʙʀᴀᴛ : ${text}` })
      return m.sendSticker(webp)
    }
  },
  {
    name: 'brathd',
    alias: ['brathq'],
    category: 'stickers',
    desc: 'Sticker estilo Brat en alta calidad',
    usage: '.brathd hola mundo',
    limit: 1,
    async run(m, ctx) {
      const text = m.fullText.trim()
      if (!text) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʙʀᴀᴛʜᴅ <ᴛᴇxᴛᴏ>`)
      const r = await ctx.api.buffer('/api/brathd', { text, size: 1024 })
      if (!r.ok) return m.reply(r.message)
      const { buffer: webp } = await toSticker(ctx, r.buffer, 'image/png')
      if (!webp) return m.send({ image: r.buffer, caption: `🎨 ${text}` })
      return m.sendSticker(webp)
    }
  },
  {
    name: 'bratv',
    alias: ['bratvertical'],
    category: 'stickers',
    desc: 'Sticker estilo Brat vertical',
    usage: '.bratv hola',
    limit: 1,
    async run(m, ctx) {
      const text = m.fullText.trim()
      if (!text) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʙʀᴀᴛᴠ <ᴛᴇxᴛᴏ>`)
      const r = await ctx.api.buffer('/api/bratv', { text, bg: 'lime' })
      if (!r.ok) return m.reply(r.message)
      const { buffer: webp } = await toSticker(ctx, r.buffer, 'image/png')
      return webp ? m.sendSticker(webp) : m.send({ image: r.buffer, caption: text })
    }
  },
  {
    name: 'ttp',
    alias: ['textosticker'],
    category: 'stickers',
    desc: 'Sticker con texto y color personalizado',
    usage: '.ttp hola #ff0055',
    limit: 1,
    async run(m, ctx) {
      const color = /^#?[0-9a-f]{6}$/i.test(m.args.at(-1) || '') ? m.args.at(-1).replace('#', '#') : '#22c55e'
      const text = (/^#?[0-9a-f]{6}$/i.test(m.args.at(-1) || '') ? m.args.slice(0, -1) : m.args).join(' ').trim()
      if (!text) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴛᴛᴘ ʜᴏʟᴀ #22ᴄ55ᴇ`)
      const r = await ctx.api.buffer('/api/ttp', { text, color, size: 512 })
      if (!r.ok) return m.reply(r.message)
      const { buffer: webp } = await toSticker(ctx, r.buffer, 'image/png')
      return webp ? m.sendSticker(webp) : m.send({ image: r.buffer, caption: text })
    }
  },
  {
    name: 'attp',
    alias: ['stickeranimado'],
    category: 'stickers',
    desc: 'Sticker animado con texto arcoíris',
    usage: '.attp hola',
    limit: 2,
    async run(m, ctx) {
      const text = m.fullText.trim()
      if (!text) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴀᴛᴛᴘ <ᴛᴇxᴛᴏ>`)
      const r = await ctx.api.buffer('/api/attp', { text, size: 512 })
      if (!r.ok) return m.reply(r.message)
      const mimetype = r.mimetype || 'image/gif'
      if (mimetype.includes('gif') || mimetype.includes('webp')) {
        const { buffer: webp } = await toSticker(ctx, r.buffer, mimetype)
        if (webp) return m.sendSticker(webp)
        return m.send({ image: r.buffer, caption: `🌈 ${text}` })
      }
      return m.send({ image: r.buffer, caption: `🌈 ${text}` })
    }
  },
  {
    name: 'toimg',
    alias: ['toimage', 's2i'],
    category: 'stickers',
    desc: 'Convierte un sticker en imagen PNG',
    usage: '.toimg (respondiendo a un sticker)',
    limit: 1,
    async run(m, ctx) {
      if (m.mediaType !== 'sticker' && m.quoted?.type !== 'sticker') {
        return m.reply(`⚙️ ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴ sᴛɪᴄᴋᴇʀ ᴄᴏɴ ${ctx.prefix}ᴛᴏɪᴍɢ`)
      }
      const buffer = (await m.download()) || (await m.downloadQuoted())
      if (!buffer) return m.reply('⚠️ No pude descargar el sticker.')
      const skia = await ctx.canvas.loadCanvasEngine()
      if (!skia) return m.reply('⚠️ ᴘᴀʀᴀ ᴄᴏɴᴠᴇʀᴛɪʀ sᴛɪᴄᴋᴇʀs ɴᴇᴄᴇsɪᴛᴏ ᴇʟ ᴍóᴅᴜʟᴏ ᴄᴀɴᴠᴀs.\n┊ ɪɴsᴛᴀʟᴀ : npm i @napi-rs/canvas')
      try {
        const img = await skia.loadImage(buffer)
        const canvas = skia.createCanvas(img.width, img.height)
        const c = canvas.getContext('2d')
        c.fillStyle = '#ffffff'
        c.fillRect(0, 0, img.width, img.height)
        c.drawImage(img, 0, 0)
        return m.send({ image: canvas.toBuffer('image/png'), caption: '🖼️ sᴛɪᴄᴋᴇʀ ᴄᴏɴᴠᴇʀᴛɪᴅᴏ ᴀ ɪᴍᴀɢᴇɴ' })
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  },
  {
    name: 'emojimix',
    alias: ['mix'],
    category: 'stickers',
    desc: 'Mezcla dos emojis en un sticker (experimental)',
    usage: '.emojimix 😂+🔥',
    limit: 1,
    async run(m, ctx) {
      const [a, b] = m.fullText.split(/[+\s]+/).filter(Boolean)
      if (!a || !b) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴇᴍᴏᴊɪᴍɪx 😂+🔥`)
      const skia = await ctx.canvas.loadCanvasEngine()
      if (!skia) return m.reply('⚠️ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ ɴᴇᴄᴇsɪᴛᴀ ᴄᴀɴᴠᴀs ʟᴏᴄᴀʟ : npm i @napi-rs/canvas')
      try {
        const canvas = skia.createCanvas(512, 512)
        const c = canvas.getContext('2d')
        c.font = '260px "BotFont"'
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.fillText(a, 256 - 60, 256)
        c.fillText(b, 256 + 60, 256)
        return m.sendSticker(canvas.toBuffer('image/webp'))
      } catch (e) {
        return m.reply(`❌ ${e.message}`)
      }
    }
  }
]
