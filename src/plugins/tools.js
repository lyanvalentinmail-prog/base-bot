/**
 *  Categoría: ᴛᴏᴏʟs — utilidades (API SiputZX + locales)
 */
import crypto from 'node:crypto'
import config from '../../config.js'
import { extractUrl, smallCaps } from '../core/utils.js'

const STYLES = {
  negrita: (t) => [...t].map((c) => (/\w/.test(c) ? c + '\u20E3' : c)).join(''),
  cursiva: (t) => `_${t}_`,
  mono: (t) => `\`\`\`${t}\`\`\``,
  tachado: (t) => `~${t}~`,
  versalita: (t) => smallCaps(t),
  invertido: (t) => [...t].reverse().join(''),
  ancho: (t) => [...t].map((c) => 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ'['abcdefghijklmnopqrstuvwxyz'.indexOf(c.toLowerCase())] || c).join(''),
  serif: (t) => [...t].map((c) => '𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓'['abcdefghijklmnopqrstuvwxyz'.indexOf(c.toLowerCase())] || c).join(''),
  burbuja: (t) => [...t].map((c) => 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ'['abcdefghijklmnopqrstuvwxyz'.indexOf(c.toLowerCase())] || c).join('')
}

export default [
  {
    name: 'qr',
    alias: ['qrcode', 'codigoqr'],
    category: 'tools',
    desc: 'Convierte texto o enlaces en un código QR',
    usage: '.qr https://ejemplo.com',
    limit: 1,
    async run(m, ctx) {
      const text = m.fullText.trim()
      if (!text) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ǫʀ <ᴛᴇxᴛᴏ ᴏ ᴇɴʟᴀᴄᴇ>`)
      const r = await ctx.api.buffer('/api/qr', { text, size: 512, dark: '#000000', light: '#ffffff' })
      if (!r.ok) return m.reply(r.message)
      return m.send({ image: r.buffer, caption: `🔳 ᴄóᴅɪɢᴏ ǫʀ ᴅᴇ : ${text.slice(0, 80)}` })
    }
  },
  {
    name: 'calc',
    alias: ['calcular', 'matematica', 'calculadora'],
    category: 'tools',
    desc: 'Resuelve operaciones matemáticas',
    usage: '.calc (2+3)*4^2',
    limit: 1,
    async run(m, ctx) {
      const expression = m.fullText.trim()
      if (!expression) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴄᴀʟᴄ (2+3)*4^2`)
      const r = await ctx.api.json('/api/calculate', { expression })
      if (!r.ok) return m.reply(r.message)
      return m.reply(`🧮 ${r.data.expression} = *${r.data.result}*`)
    }
  },
  {
    name: 'translate',
    alias: ['tr', 'traducir'],
    category: 'tools',
    desc: 'Traduce un texto a otro idioma',
    usage: '.tr en Hola mundo   ·   .tr fr Hola mundo',
    limit: 1,
    async run(m, ctx) {
      const first = (m.arg || '').toLowerCase()
      const isLang = /^[a-z]{2}(-[a-z]{2})?$/i.test(first)
      const to = isLang ? first : 'en'
      const text = isLang ? m.rest : m.fullText.trim()
      if (!text) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴛʀ <ɪᴅɪᴏᴍᴀ?> <ᴛᴇxᴛᴏ>\nᴇᴊ : ${ctx.prefix}ᴛʀ en Hola mundo`)
      const r = await ctx.api.json('/api/translate', { text, to, from: 'auto' })
      if (!r.ok) return m.reply(r.message)
      return m.reply(`🌐 *${r.data.from}* → *${r.data.to}*\n\n${r.data.translation}`)
    }
  },
  {
    name: 'shorturl',
    alias: ['acortar', 'short'],
    category: 'tools',
    desc: 'Acorta un enlace',
    usage: '.shorturl https://ejemplo.com',
    limit: 1,
    async run(m, ctx) {
      const url = extractUrl(m.fullText) || m.arg
      if (!url) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}sʜᴏʀᴛᴜʀʟ <ᴇɴʟᴀᴄᴇ>`)
      const r = await ctx.api.json('/api/shorturl', { url })
      if (!r.ok) return m.reply(r.message)
      return m.reply(`🔗 ᴏʀɪɢɪɴᴀʟ : ${r.data.original}\n✂️ ᴄᴏʀᴛᴏ : ${r.data.short}`)
    }
  },
  {
    name: 'tinyurl',
    alias: ['alias'],
    category: 'tools',
    desc: 'Acorta un enlace con alias personalizado (necesita clave en la API)',
    usage: '.tinyurl https://ejemplo.com alias',
    limit: 1,
    async run(m, ctx) {
      const url = extractUrl(m.fullText)
      if (!url) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴛɪɴʏᴜʀʟ <ᴇɴʟᴀᴄᴇ> [ᴀʟɪᴀs]`)
      const alias = m.args.filter((a) => !a.startsWith('http'))[0]
      const r = await ctx.api.json('/api/tinyurl', { url, alias })
      if (!r.ok) return m.reply(r.message)
      return m.reply(`✂️ ${r.data.short}`)
    }
  },
  {
    name: 'hash',
    alias: ['md5', 'sha256', 'encriptar'],
    category: 'tools',
    desc: 'Calcula el hash de un texto (local, sin API)',
    usage: '.hash <texto>',
    limit: false,
    async run(m) {
      const text = m.fullText.trim()
      if (!text) return m.reply('⚙️ ᴜsᴏ : .ʜᴀsʜ <ᴛᴇxᴛᴏ>')
      const algorithms = ['md5', 'sha1', 'sha256', 'sha512']
      const out = algorithms.map((a) => `┊ ${a.toUpperCase()} : ${crypto.createHash(a).update(text).digest('hex')}`).join('\n')
      return m.reply(`🔐 *ʜᴀsʜ ᴅᴇ* ${text.slice(0, 40)}\n${out}`)
    }
  },
  {
    name: 'base64',
    alias: ['b64'],
    category: 'tools',
    desc: 'Codifica o decodifica Base64',
    usage: '.base64 enc <texto> · .base64 dec <texto>',
    limit: false,
    async run(m, ctx) {
      const mode = (m.arg || 'enc').toLowerCase()
      const text = m.rest || m.args.slice(1).join(' ')
      if (!text) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʙᴀsᴇ64 <ᴇɴᴄ|ᴅᴇᴄ> <ᴛᴇxᴛᴏ>`)
      if (mode.startsWith('d')) {
        try {
          return m.reply(`📥 ᴅᴇᴄᴏᴅɪꜰɪᴄᴀᴅᴏ :\n${Buffer.from(text, 'base64').toString('utf8')}`)
        } catch {
          return m.reply('❌ Ese texto no es Base64 válido.')
        }
      }
      return m.reply(`📤 ᴄᴏᴅɪꜰɪᴄᴀᴅᴏ :\n${Buffer.from(text, 'utf8').toString('base64')}`)
    }
  },
  {
    name: 'password',
    alias: ['passgen', 'clave'],
    category: 'tools',
    desc: 'Genera una contraseña segura',
    usage: '.password 16',
    limit: false,
    async run(m) {
      const len = Math.min(64, Math.max(6, parseInt(m.arg || '16', 10) || 16))
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?'
      let pass = ''
      for (let i = 0; i < len; i++) pass += chars[crypto.randomInt(chars.length)]
      return m.reply(`🔑 ᴄᴏɴᴛʀᴀsᴇɴ̃ᴀ (${len}) :\n\`${pass}\``)
    }
  },
  {
    name: 'uuid',
    alias: ['id-random'],
    category: 'tools',
    desc: 'Genera un UUID aleatorio',
    usage: '.uuid',
    limit: false,
    async run(m) {
      return m.reply(`🆔 \`${crypto.randomUUID()}\``)
    }
  },
  {
    name: 'style',
    alias: ['fuente', 'letras', 'texto'],
    category: 'tools',
    desc: 'Cambia el estilo de un texto',
    usage: '.style serif Hola mundo',
    limit: false,
    async run(m, ctx) {
      const type = (m.arg || '').toLowerCase()
      const text = m.rest
      if (!type || !text || !STYLES[type]) {
        return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}sᴛʏʟᴇ <ᴛɪᴘᴏ> <ᴛᴇxᴛᴏ>\nᴛɪᴘᴏs : ${Object.keys(STYLES).join(' · ')}`)
      }
      return m.reply(`✨ *${type}* :\n${STYLES[type](text)}`)
    }
  },
  {
    name: 'readmore',
    alias: ['leermas', 'spoiler'],
    category: 'tools',
    desc: 'Manda un texto oculto tras «leer más»',
    usage: '.readmore visible|oculto',
    limit: false,
    async run(m, ctx) {
      const [visible, hidden] = m.fullText.split('|').map((s) => (s || '').trim())
      if (!visible || !hidden) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʀᴇᴀᴅᴍᴏʀᴇ ᴛᴇxᴛᴏ ᴠɪsɪʙʟᴇ|ᴛᴇxᴛᴏ ᴏᴄᴜʟᴛᴏ`)
      return m.send(`${visible}\n${'\u200b\n'.repeat(35)}${hidden}`)
    }
  },
  {
    name: 'ip',
    alias: ['miip', 'red'],
    category: 'tools',
    desc: 'Muestra datos del bot: IP local, RAM y plataforma (sin exponer datos privados)',
    usage: '.ip',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const os = await import('node:os')
      const nets = os.networkInterfaces()
      const local = Object.entries(nets)
        .flatMap(([name, list]) => (list || []).filter((n) => !n.internal && n.family === 'IPv4').map((n) => `${name} : ${n.address}`))
        .join('\n┊ ') || 'ninguna'
      return m.reply(
        [
          `🌐 *ɪɴꜰᴏ ᴅᴇ ʀᴇᴅ*`,
          `┊ ${local}`,
          `┊ ᴘʟᴀᴛᴀꜰᴏʀᴍᴀ : ${process.platform}/${process.arch}`,
          `┊ ʀᴀᴍ ʟɪʙʀᴇ : ${(os.freemem() / 1024 / 1024).toFixed(0)} MB`,
          `┊ ᴜᴘᴛɪᴍᴇ : ${ctx.utils.clockString(Date.now() - ctx.startTime)}`
        ].join('\n')
      )
    }
  },
  {
    name: 'idiomas',
    alias: ['langs'],
    category: 'tools',
    desc: 'Idiomas soportados por traductor y TTS',
    usage: '.idiomas',
    limit: false,
    async run(m) {
      const lineas = [
        'ᴛʀᴀᴅᴜᴄɪʀ : ᴄᴜᴀʟǫᴜɪᴇʀ ᴄóᴅɪɢᴏ ɪsᴏ (ᴇs, ᴇɴ, ᴘᴛ, ꜰʀ, ᴅᴇ, ɪᴛ, ᴊᴀ, ʀᴜ, ᴀʀ, ᴢʜ-ᴄɴ…)',
        'ᴛᴛs : ᴇs · ᴇɴ · ᴘᴛ · ꜰʀ · ᴅᴇ · ɪᴛ · ᴊᴀ · ʀᴜ · ᴀʀ · ᴢʜ-ᴄɴ',
        '.ᴛʀ ᴊᴀ ʙᴜᴇɴᴏs ᴅíᴀs',
        '.ᴛᴛs ᴇs ʜᴏʟᴀ ᴀ ᴛᴏᴅᴏs'
      ]
      return m.reply([ctx.menu.menuBlock('ɪᴅɪᴏᴍᴀs', lineas), '', ctx.config.bot.footer].join('\n'))
    }
  }
]
