/**
 *  Categoría: ᴀᴜᴅɪᴏ — texto a voz y efectos de audio (API SiputZX)
 */
const LANGS = ['es', 'en', 'pt', 'fr', 'de', 'it', 'ja', 'ru', 'ar', 'zh-CN']

/** Saca un audio (o video) del mensaje o del citado */
async function pickAudio(m) {
  if (['audio', 'video'].includes(m.mediaType)) return await m.download()
  const quoted = await m.downloadQuoted()
  if (quoted) return quoted
  return null
}

async function effect(m, ctx, name, query = {}) {
  const buffer = await pickAudio(m)
  if (!buffer) {
    return m.reply(
      [
        `⚙️ ɴᴇᴄᴇsɪᴛᴏ ᴜɴ ᴀᴜᴅɪᴏ ᴏ ᴠɪᴅᴇᴏ ᴄᴏʀᴛᴏ.`,
        `┊ ᴍáɴᴅᴀʟᴏ ᴄᴏɴ ${ctx.prefix}${m.command} ᴇɴ ᴇʟ ᴍɪsᴍᴏ ᴍᴇɴsᴀᴊᴇ`,
        `┊ ᴏ ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴ ᴀᴜᴅɪᴏ ᴄᴏɴ ${ctx.prefix}${m.command}`
      ].join('\n')
    )
  }
  await m.reply(`🎧 ᴀᴘʟɪᴄᴀɴᴅᴏ ᴇꜰᴇᴄᴛᴏ *${name}*…`)
  const r = await ctx.api.upload(`/api/audio/${name}`, buffer, {
    filename: 'audio.ogg',
    mimetype: 'audio/ogg',
    query
  })
  if (!r.ok) return m.reply(r.message)
  return m.send({ audio: r.buffer, mimetype: 'audio/mpeg', ptt: true })
}

export default [
  {
    name: 'tts',
    alias: ['decir', 'voz', 'speak'],
    category: 'audio',
    desc: 'Convierte texto en voz',
    usage: '.tts Hola a todos   ·   .tts en Hello world',
    limit: 2,
    async run(m, ctx) {
      const first = (m.arg || '').toLowerCase()
      const isLang = LANGS.map((l) => l.toLowerCase()).includes(first)
      const lang = isLang ? LANGS.find((l) => l.toLowerCase() === first) : 'es'
      const text = (isLang ? m.rest : m.fullText).trim()
      if (!text) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴛᴛs <ᴛᴇxᴛᴏ> [ᴇs|ᴇɴ|ᴘᴛ|ꜰʀ|ᴅᴇ|ɪᴛ|ᴊᴀ|ʀᴜ|ᴀʀ|ᴢʜ-ᴄɴ]\nᴍáx 200 ᴄᴀʀᴀᴄᴛᴇʀᴇs.`)
      if (text.length > 200) return m.reply('⚠️ El texto es muy largo (máximo 200 caracteres).')
      const r = await ctx.api.buffer('/api/tts', { text, lang })
      if (!r.ok) return m.reply(r.message)
      return m.send({ audio: r.buffer, mimetype: r.mimetype || 'audio/mpeg', ptt: false })
    }
  },
  {
    name: 'reversa',
    alias: ['alreves', 'audioreverse'],
    category: 'audio',
    desc: 'Reproduce un audio al revés',
    usage: '.reversa (respondiendo a un audio)',
    limit: 2,
    run: (m, ctx) => effect(m, ctx, 'reverse')
  },
  {
    name: 'robot',
    alias: ['robótico'],
    category: 'audio',
    desc: 'Efecto de voz robótica',
    usage: '.robot (respondiendo a un audio)',
    limit: 2,
    run: (m, ctx) => effect(m, ctx, 'robot')
  },
  {
    name: 'zueira',
    alias: ['chistoso', 'gracioso'],
    category: 'audio',
    desc: 'Efecto divertido (velocidad + tono)',
    usage: '.zueira (respondiendo a un audio)',
    limit: 2,
    run: (m, ctx) => effect(m, ctx, 'zueira')
  },
  {
    name: 'bass',
    alias: ['bajos', 'bassboost'],
    category: 'audio',
    desc: 'Sube los bajos de un audio',
    usage: '.bass [1-30] (respondiendo a un audio)',
    limit: 2,
    async run(m, ctx) {
      const gain = Math.min(30, Math.max(1, parseInt(m.arg || '15', 10) || 15))
      return effect(m, ctx, 'bass', { gain })
    }
  },
  {
    name: 'efectos',
    alias: ['audiohelp'],
    category: 'audio',
    desc: 'Lista los efectos de audio disponibles',
    usage: '.efectos',
    limit: false,
    async run(m, ctx) {
      const p = ctx.prefix
      const lineas = [
        `🔊 ${p}ᴛᴛs`,
        `⏪ ${p}ʀᴇᴠᴇʀsᴀ`,
        `🤖 ${p}ʀᴏʙᴏᴛ`,
        `🤪 ${p}ᴢᴜᴇɪʀᴀ`,
        `🎚️ ${p}ʙᴀss`,
        `💡 ᴛᴏᴅᴏs sᴇ ᴜsᴀɴ ʀᴇsᴘᴏɴᴅɪᴇɴᴅᴏ ᴀ ᴜɴ ᴀᴜᴅɪᴏ ᴏ ᴠɪᴅᴇᴏ`
      ]
      return m.reply([ctx.menu.menuBlock('ᴇꜰᴇᴄᴛᴏs ᴅᴇ ᴀᴜᴅɪᴏ', lineas), '', ctx.config.bot.footer].join('\n'))
    }
  }
]
