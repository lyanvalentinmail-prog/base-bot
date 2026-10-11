/**
 *  Categoría: ɪᴍᴀɢᴇ — efectos de imagen de la API SiputZX
 */
import { pickImage } from './stickers.js'

async function applyEffect(m, ctx, path, query = {}) {
  const buffer = await pickImage(m, ctx)
  if (!buffer) {
    return m.reply(
      [
        `⚙️ ɴᴇᴄᴇsɪᴛᴏ ᴜɴᴀ ɪᴍᴀɢᴇɴ.`,
        `┊ ᴍáɴᴅᴀʟᴀ ᴄᴏɴ ᴇʟ ᴄᴏᴍᴀɴᴅᴏ ᴅᴇ ᴘɪᴇ`,
        `┊ ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ ᴄᴏɴ ${ctx.prefix}${m.command}`,
        `┊ ᴏ ᴘᴀsᴀ ᴜɴ ᴇɴʟᴀᴄᴇ : ${ctx.prefix}${m.command} https://…/foto.jpg`
      ].join('\n')
    )
  }
  await m.react('🎨')
  const r = await ctx.api.upload(path, buffer, { filename: 'imagen.jpg', mimetype: 'image/jpeg', query })
  if (!r.ok) return m.reply(r.message)
  return m.send({ image: r.buffer, caption: `🎨 ᴇꜰᴇᴄᴛᴏ *${m.command}* ʟɪsᴛᴏ` })
}

export default [
  {
    name: 'blur',
    alias: ['desenfoque', 'borroso'],
    category: 'image',
    desc: 'Aplica desenfoque a una imagen',
    usage: '.blur [1-20] (respondiendo a una imagen)',
    limit: 2,
    async run(m, ctx) {
      const amount = Math.min(50, Math.max(0.3, parseFloat(m.arg || '5') || 5))
      return applyEffect(m, ctx, '/api/blur', { amount })
    }
  },
  {
    name: 'darkness',
    alias: ['oscuro', 'dark'],
    category: 'image',
    desc: 'Oscurece una imagen',
    usage: '.darkness [1-100]',
    limit: 2,
    async run(m, ctx) {
      const level = Math.min(100, Math.max(1, parseInt(m.arg || '60', 10) || 60))
      return applyEffect(m, ctx, '/api/darkness', { level })
    }
  },
  {
    name: 'pixel',
    alias: ['pixelar'],
    category: 'image',
    desc: 'Efecto pixelado',
    usage: '.pixel [2-64]',
    limit: 2,
    async run(m, ctx) {
      const scale = Math.min(64, Math.max(2, parseInt(m.arg || '8', 10) || 8))
      return applyEffect(m, ctx, '/api/pixel', { scale })
    }
  },
  {
    name: 'wanted',
    alias: ['sebusca', 'buscado'],
    category: 'image',
    desc: 'Crea un póster de «Se busca»',
    usage: '.wanted [recompensa]',
    limit: 2,
    async run(m, ctx) {
      const reward = (m.arg && !/^https?:/.test(m.arg) ? m.arg : '1.000.000').slice(0, 30)
      return applyEffect(m, ctx, '/api/wanted', { reward })
    }
  },
  {
    name: 'trigger',
    alias: ['triggered'],
    category: 'image',
    desc: 'Efecto TRIGGERED',
    usage: '.trigger (respondiendo a una imagen)',
    limit: 2,
    async run(m, ctx) {
      return applyEffect(m, ctx, '/api/trigger', {})
    }
  },
  {
    name: 'beautiful',
    alias: ['hermosa', 'mejorar-imagen'],
    category: 'image',
    desc: 'Mejora luz, color y nitidez de una imagen',
    usage: '.beautiful (respondiendo a una imagen)',
    limit: 2,
    async run(m, ctx) {
      return applyEffect(m, ctx, '/api/beautiful', {})
    }
  },
  {
    name: 'stickerwm',
    alias: ['marca'],
    category: 'image',
    desc: 'Recuerda dónde se agregan las marcas de agua de los stickers',
    usage: '.stickerwm',
    limit: false,
    async run(m, ctx) {
      return m.reply('ℹ️ ᴇsᴛᴇ ʙᴏᴛ ɴᴏ ʟᴇ ᴘᴏɴᴇ ᴍᴀʀᴄᴀ ᴅᴇ ᴀɢᴜᴀ ᴀ ᴛᴜs sᴛɪᴄᴋᴇʀs 😌')
    }
  }
]
