/**
 *  Categoría: ᴀɪ — inteligencia artificial (API SiputZX + respaldo opcional directo)
 */
import config from '../../config.js'
import db from '../core/store.js'
import { truncate } from '../core/utils.js'

const systemPrompt = (ctx) =>
  `Eres ${ctx.botName}, un bot de WhatsApp amable, breve y con humor. Respondes en español, ` +
  `con frases cortas (máximo 6 líneas) y algún emoji. Si no sabes algo, dilo con honestidad.`

function history(chat) {
  const c = db.chat(chat)
  return c.ai || []
}

function pushHistory(chat, role, content) {
  const c = db.chat(chat)
  c.ai = [...(c.ai || []), { role, content }].slice(-8)
  db.markDirty()
}

/** Respaldo directo a OpenAI (solo si lo activas en config.js → aiFallback) */
async function directOpenAI(prompt, { image = false } = {}) {
  const fb = config.aiFallback
  if (!fb?.enabled || !fb.apiKey) return null
  try {
    const url = `${fb.baseUrl.replace(/\/+$/, '')}/${image ? 'images/generations' : 'chat/completions'}`
    const body = image
      ? { model: fb.imageModel, prompt, size: '1024x1024', response_format: 'b64_json' }
      : { model: fb.textModel, messages: [{ role: 'system', content: fb.system || 'Asistente útil' }, { role: 'user', content: prompt }], max_tokens: 500 }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fb.apiKey}` },
      body: JSON.stringify(body)
    })
    const json = await res.json()
    if (!res.ok) return { ok: false, message: `⚠️ OpenAI: ${json.error?.message || res.status}` }
    if (image) return { ok: true, buffer: Buffer.from(json.data[0].b64_json, 'base64'), text: prompt }
    return { ok: true, text: json.choices?.[0]?.message?.content || '(sin respuesta)' }
  } catch (e) {
    return { ok: false, message: `⚠️ OpenAI: ${e.message}` }
  }
}

export default [
  {
    name: 'ai',
    alias: ['gpt', 'chat', 'ia', 'chatgpt', 'gemini'],
    category: 'ai',
    desc: 'Habla con la inteligencia artificial',
    usage: '.ai ¿qué es un agujero negro?',
    limit: 2,
    async run(m, ctx) {
      const prompt = m.fullText.trim()
      if (!prompt) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴀɪ <ᴘʀᴇɢᴜɴᴛᴀ>\n┊ ʙᴏʀʀᴀ ᴇʟ ᴄᴏɴᴛᴇxᴛᴏ ᴄᴏɴ ${ctx.prefix}ᴀɪᴄʟᴇᴀʀ`)
      await m.presence('composing')

      const prev = history(m.chat)
      const context =
        prev.length > 1
          ? `Historial reciente:\n${prev.map((h) => `${h.role === 'user' ? 'Usuario' : 'Bot'}: ${truncate(h.content, 300)}`).join('\n')}\n\nNueva pregunta: ${prompt}`
          : prompt

      const r = await ctx.api.json('/api/chatgpt', {}, { method: 'POST', body: { prompt: context, system: systemPrompt(ctx), model: 'gpt-4o-mini' } })

      if (!r.ok) {
        const fb = await directOpenAI(prompt)
        if (fb?.ok) {
          pushHistory(m.chat, 'user', prompt)
          pushHistory(m.chat, 'assistant', fb.text)
          return m.reply(`🤖 *${ctx.botName}*\n\n${fb.text}`)
        }
        return m.reply([r.message, '', '💡 ᴛɪᴘ : ᴘᴜᴇᴅᴇs ᴀᴄᴛɪᴠᴀʀ ᴇʟ ʀᴇsᴘᴀʟᴅᴏ ᴅɪʀᴇᴄᴛᴏ ᴇɴ config.js → aiFallback'].join('\n'))
      }

      const answer = r.data.answer || r.data.result || JSON.stringify(r.data).slice(0, 1500)
      pushHistory(m.chat, 'user', prompt)
      pushHistory(m.chat, 'assistant', answer)
      await m.react('🤖')
      return m.reply(`🤖 *${ctx.botName}*\n\n${truncate(answer, 3500)}`)
    }
  },
  {
    name: 'blackbox',
    alias: ['code', 'programar', 'dev'],
    category: 'ai',
    desc: 'Ayuda con programación',
    usage: '.blackbox ordena un array en javascript',
    limit: 2,
    async run(m, ctx) {
      const prompt = m.fullText.trim()
      if (!prompt) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʙʟᴀᴄᴋʙᴏx <ᴄᴏɴsᴜʟᴛᴀ ᴅᴇ ᴘʀᴏɢʀᴀᴍᴀᴄɪᴏ́ɴ>`)
      const r = await ctx.api.json('/api/blackbox', {}, { method: 'POST', body: { prompt, language: 'javascript' } })
      if (!r.ok) return m.reply(r.message)
      const answer = r.data.answer || JSON.stringify(r.data).slice(0, 2000)
      return m.reply(`💻 *ᴄóᴅɪɢᴏ*\n\n${truncate(answer, 3500)}`)
    }
  },
  {
    name: 'imagine',
    alias: ['imgia', 'generar', 'dalle'],
    category: 'ai',
    desc: 'Genera una imagen desde un texto',
    usage: '.imagine un gato astronauta',
    limit: 3,
    async run(m, ctx) {
      const prompt = m.fullText.trim()
      if (!prompt) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ɪᴍᴀɢɪɴᴇ <ᴅᴇsᴄʀɪᴘᴄɪᴏ́ɴ ᴅᴇ ʟᴀ ɪᴍᴀɢᴇɴ>`)
      await m.reply('🎨 ɢᴇɴᴇʀᴀɴᴅᴏ ʟᴀ ɪᴍᴀɢᴇɴ… (ᴘᴜᴇᴅᴇ ᴛᴀʀᴅᴀʀ ᴜɴᴏs sᴇɢᴜɴᴅᴏs)')
      const r = await ctx.api.json('/api/imagine', {}, { method: 'POST', body: { prompt, size: '1024x1024' } })
      if (r.ok && r.data.image_url) {
        return m.send({ image: { url: r.data.image_url }, caption: `🎨 *${prompt}*` })
      }
      const fb = await directOpenAI(prompt, { image: true })
      if (fb?.ok) return m.send({ image: fb.buffer, caption: `🎨 *${prompt}*\n┊ (respaldo directo OpenAI)` })
      return m.reply(r.message || fb?.message || '⚠️ No pude generar la imagen.')
    }
  },
  {
    name: 'removebg',
    alias: ['quitarfondo', 'nobg'],
    category: 'ai',
    desc: 'Quita el fondo de una imagen (requiere clave en tu API)',
    usage: '.removebg (respondiendo a una imagen)',
    limit: 2,
    async run(m, ctx) {
      const buffer = (await m.downloadQuoted()) || (await m.download())
      if (!buffer) return m.reply(`⚙️ ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ ᴄᴏɴ ${ctx.prefix}ʀᴇᴍᴏᴠᴇʙɢ`)
      const r = await ctx.api.upload('/api/removebg', buffer, { filename: 'imagen.jpg', mimetype: 'image/jpeg' })
      if (!r.ok) return m.reply(r.message)
      return m.send({ image: r.buffer, caption: '✂️ ꜰᴏɴᴅᴏ ᴇʟɪᴍɪɴᴀᴅᴏ' })
    }
  },
  {
    name: 'enhance',
    alias: ['mejorar', 'hd'],
    category: 'ai',
    desc: 'Mejora la calidad de una imagen',
    usage: '.enhance (respondiendo a una imagen)',
    limit: 2,
    async run(m, ctx) {
      const buffer = (await m.downloadQuoted()) || (await m.download())
      if (!buffer) return m.reply(`⚙️ ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ ᴄᴏɴ ${ctx.prefix}ᴇɴʜᴀɴᴄᴇ`)
      const scale = Math.min(4, Math.max(2, parseInt(m.arg || '2', 10) || 2))
      const r = await ctx.api.upload('/api/enhance', buffer, { filename: 'imagen.jpg', mimetype: 'image/jpeg', query: { scale } })
      if (!r.ok) return m.reply(r.message)
      return m.send({ image: r.buffer, caption: `✨ ɪᴍᴀɢᴇɴ ᴍᴇᴊᴏʀᴀᴅᴀ (x${scale})` })
    }
  },
  {
    name: 'aiclear',
    alias: ['resetai', 'borrarmemoria'],
    category: 'ai',
    desc: 'Borra la memoria del chat con la IA',
    usage: '.aiclear',
    limit: false,
    async run(m) {
      const c = db.chat(m.chat)
      c.ai = []
      db.markDirty()
      return m.reply('🧠 ᴍᴇᴍᴏʀɪᴀ ᴅᴇ ʟᴀ ɪᴀ ʙᴏʀʀᴀᴅᴀ')
    }
  },
  {
    /* chatbot: responde a los mensajes que no son comandos cuando está activado */
    name: 'chatbot-auto',
    category: 'ai',
    hidden: true,
    limit: false,
    async onMessage(m, ctx) {
      if (!db.settings.chatbot) return
      if (m.isCommand || m.fromMe) return
      const botJid = `${String(m.sock?.user?.id || '').split(':')[0].split('@')[0]}@s.whatsapp.net`
      if (m.isGroup && !m.mentions.includes(botJid)) {
        // en grupos solo responde si lo mencionan
        if (!m.text.toLowerCase().includes(ctx.botName.toLowerCase())) return
      }
      const prompt = m.text.trim()
      if (!prompt || prompt.length < 2) return
      const r = await ctx.api.json('/api/chatgpt', {}, { method: 'POST', body: { prompt, system: systemPrompt(ctx) } })
      if (!r.ok) return
      const answer = r.data.answer || r.data.result
      if (!answer) return
      await new Promise((res) => setTimeout(res, 1200))
      return m.reply(truncate(answer, 2000))
    }
  }
]
