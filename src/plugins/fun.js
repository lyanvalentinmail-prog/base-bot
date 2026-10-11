/**
 *  Categoría: ғᴜɴ — diversión (con tarjetas canvas propias 🎨)
 */
import db from '../core/store.js'
import { pick, randomInt, reverseText, seededPercent } from '../core/utils.js'

const BALL = [
  '🎱 Sí, definitivamente.', '🎱 Es cierto, sin duda.', '🎱 Sin ninguna duda.',
  '🎱 Claro que sí.', '🎱 Puedes confiar en ello.', '🎱 Según mi criterio, sí.',
  '🎱 Mis fuentes dicen que no.', '🎱 Ni de broma 😅', '🎱 No cuentes con eso.',
  '🎱 La respuesta es confusa, intenta otra vez.', '🎱 Pregunta más tarde.',
  '🎱 Mejor no decirte ahora 🤐', '🎱 Vibra positiva ✨ prueba suerte.', '🎱 Todo apunta a que sí 🚀'
]

const PIROPOS = [
  '¿Tienes wifi? Porque siento una conexión contigo 📶',
  'Si fueras un comando, serías mi favorito: .tuya 💚',
  'Dios repartió belleza y a ti te tocó la de sobra ✨',
  '¿Eres un sticker? Porque te quiero pegar en mi corazón 💞',
  'Tu sonrisa tiene más poder que un .shutdown 😵',
  'Si el amor fuera un bot, estarías en modo owner 👑',
  'No eres del montón, eres el .top de mi ranking 🥇'
]

const VERDADES = [
  '¿Cuál fue la última mentira que dijiste? 🤥',
  '¿A quién de este grupo le contarías un secreto? 🤫',
  '¿Qué es lo más vergonzoso que hiciste por WhatsApp? 😳',
  '¿Cuál fue tu último mensaje borrado? 🗑️',
  '¿Cuántas horas de pantalla tuviste esta semana? 📱',
  '¿A quién ignoraste hoy y por qué? 🙈'
]

const RETOS = [
  'Manda un sticker y no hables por 5 minutos 🤐',
  'Escribe un poema de 4 líneas sobre el admin del grupo ✍️',
  'Escribe tu último mensaje al revés 🙃',
  'Manda un audio cantando el estribillo de tu canción favorita 🎤',
  'Etiqueta a 3 personas y diles algo bonito 💚',
  'Cuenta un chiste malo y aguanta las burlas 😂'
]

export default [
  {
    name: 'gay',
    alias: ['gayrate', 'que-tan-gay'],
    category: 'fun',
    desc: 'Calcula el «porcentaje» de alguien con una tarjeta arcoíris',
    usage: '.gay @usuario',
    limit: 1,
    async run(m, ctx) {
      const target = m.mentionedOrQuoted() || m.sender
      const user = db.user(target)
      const name = user.name || m.pushName
      const percent = seededPercent(`gay-${target}`, 100)
      const card = await ctx.canvas.card('gay', {
        avatar: await pfpOf(m, target),
        name,
        percent,
        accent: '#f472b6',
        footer: ctx.botName
      })
      const caption = `🌈 *${name}* es *${percent}%* gay ${percent > 75 ? '🏳️‍🌈' : percent > 50 ? '😳' : percent > 25 ? '🤔' : '😎'}`
      if (card) return m.send({ image: card.buffer, caption, mentions: [target] })
      return m.reply(caption, { mentions: [target] })
    }
  },
  {
    name: 'iq',
    alias: ['iqtest', 'inteligencia'],
    category: 'fun',
    desc: 'Tarjeta de IQ (100% científica, confía)',
    usage: '.iq @usuario [biografía]',
    limit: 1,
    async run(m, ctx) {
      const target = m.mentionedOrQuoted() || m.sender
      const user = db.user(target)
      const name = user.name || m.pushName
      const bio = m.args.filter((a) => !a.startsWith('@')).join(' ').slice(0, 60)
      const iq = 40 + seededPercent(`iq-${target}`, 160)
      const card = await ctx.canvas.card('iqc', {
        avatar: await pfpOf(m, target),
        name,
        bio: bio || 'ᴇsᴛᴜᴅɪᴀɴᴛᴇ ᴅᴇ ʟᴀ ᴠɪᴅᴀ',
        percent: Math.min(100, Math.round((iq / 200) * 100)),
        subtitle: `ɪǫ : ${iq}`,
        accent: '#38bdf8',
        footer: ctx.botName
      })
      const caption = `🧠 *${name}* tiene un IQ de *${iq}* ${iq > 150 ? '🤯' : iq > 100 ? '😎' : iq > 70 ? '🙂' : '😅'}`
      if (card) return m.send({ image: card.buffer, caption, mentions: [target] })
      return m.reply(caption, { mentions: [target] })
    }
  },
  {
    name: 'ship',
    alias: ['amor', 'compatibilidad'],
    category: 'fun',
    desc: 'Mide la compatibilidad entre dos personas',
    usage: '.ship @persona1 @persona2',
    limit: 1,
    async run(m, ctx) {
      const mentions = m.mentions.map((j) => j.split('@')[0] + '@s.whatsapp.net')
      const a = mentions[0] || m.sender
      const b = mentions[1] || (m.quoted?.sender ? m.quoted.sender : null)
      if (!b) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}sʜɪᴘ @ᴘᴇʀsᴏɴᴀ1 @ᴘᴇʀsᴏɴᴀ2 (ᴏ ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴀʟɢᴜɪᴇɴ)`)
      const nameA = db.user(a).name || a.split('@')[0]
      const nameB = db.user(b).name || b.split('@')[0]
      const percent = seededPercent([a, b].sort().join('-'), 100)
      const card = await ctx.canvas.card('ship', {
        avatar: await pfpOf(m, a),
        avatar1: await pfpOf(m, a),
        avatar2: await pfpOf(m, b),
        username: `${nameA} 💞 ${nameB}`,
        name1: nameA,
        name2: nameB,
        percent,
        subtitle: `${nameA} ʏ ${nameB}`,
        accent: '#fb7185',
        footer: ctx.botName
      })
      const verdict = percent > 85 ? 'ᴀʟᴍᴀs ɢᴇᴍᴇʟᴀs 💍' : percent > 65 ? 'ᴍᴜʏ ʙᴜᴇɴᴀ ᴄʜɪsᴘᴀ 🔥' : percent > 45 ? 'ᴘᴜᴇᴅᴇ ꜰᴜɴᴄɪᴏɴᴀʀ 🤔' : percent > 20 ? 'ᴍᴇʜ… 😬' : 'ᴍᴇᴊᴏʀ ᴀᴍɪɢᴏs 🥲'
      const caption = `💞 *${nameA}* + *${nameB}* = *${percent}%*\n┊ ${verdict}`
      if (card) return m.send({ image: card.buffer, caption, mentions: [a, b] })
      return m.reply(caption, { mentions: [a, b] })
    }
  },
  {
    name: '8ball',
    alias: ['bola8', 'oraculo'],
    category: 'fun',
    desc: 'Pregúntale a la bola mágica',
    usage: '.8ball ¿me irá bien mañana?',
    limit: false,
    async run(m, ctx) {
      if (!m.fullText.trim()) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}8ʙᴀʟʟ <ᴘʀᴇɢᴜɴᴛᴀ>`)
      return m.reply(`❓ ${m.fullText.trim()}\n\n${pick(BALL)}`)
    }
  },
  {
    name: 'rate',
    alias: ['porcentaje', 'calificar'],
    category: 'fun',
    desc: 'Califica cualquier cosa con un porcentaje',
    usage: '.rate mi nivel de sueño',
    limit: false,
    async run(m, ctx) {
      const cosa = m.fullText.trim() || 'esto'
      const percent = seededPercent(`${cosa}-${m.sender}`, 100)
      const bar = '▰'.repeat(Math.round(percent / 10)).padEnd(10, '▱')
      return m.reply(`📊 *${cosa}*\n┊ ${bar} *${percent}%*`)
    }
  },
  {
    name: 'reverse',
    alias: ['invertir', 'alreves-texto'],
    category: 'fun',
    desc: 'Escribe un texto al revés',
    usage: '.reverse hola mundo',
    limit: false,
    async run(m, ctx) {
      if (!m.fullText.trim()) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʀᴇᴠᴇʀsᴇ <ᴛᴇxᴛᴏ>`)
      return m.reply(`🔁 ${reverseText(m.fullText.trim())}`)
    }
  },
  {
    name: 'verdad',
    alias: ['truth'],
    category: 'fun',
    desc: 'Pregunta de verdad o reto: verdad',
    usage: '.verdad',
    limit: false,
    async run(m) {
      return m.reply(`🫢 *ᴠᴇʀᴅᴀᴅ*\n\n${pick(VERDADES)}`)
    }
  },
  {
    name: 'reto',
    alias: ['dare'],
    category: 'fun',
    desc: 'Pregunta de verdad o reto: reto',
    usage: '.reto',
    limit: false,
    async run(m) {
      return m.reply(`🔥 *ʀᴇᴛᴏ*\n\n${pick(RETOS)}`)
    }
  },
  {
    name: 'piropo',
    alias: ['piropear', 'halago'],
    category: 'fun',
    desc: 'Manda un piropo al azar',
    usage: '.piropo [@usuario]',
    limit: false,
    async run(m) {
      const target = m.mentionedOrQuoted()
      const mention = target ? `@${target.split('@')[0]} ` : ''
      return m.reply(`💌 ${mention}${pick(PIROPOS)}`, target ? { mentions: [target] } : {})
    }
  },
  {
    name: 'dado',
    alias: ['dados'],
    category: 'fun',
    desc: 'Lanza dados virtuales',
    usage: '.dado [cantidad] [caras]',
    limit: false,
    async run(m, ctx) {
      const count = Math.min(10, Math.max(1, parseInt(m.arg || '2', 10) || 2))
      const sides = Math.min(100, Math.max(2, parseInt(m.args[1] || '6', 10) || 6))
      const r = await ctx.api.json('/api/dice', { count, sides })
      if (r.ok) return m.reply(`🎲 ᴅᴀᴅᴏs (${count}ᴅ${sides}) : ${r.data.rolls.join(' · ')}\n┊ ᴛᴏᴛᴀʟ : *${r.data.total}*`)
      const rolls = Array.from({ length: count }, () => randomInt(1, sides))
      return m.reply(`🎲 ᴅᴀᴅᴏs (${count}ᴅ${sides}) : ${rolls.join(' · ')}\n┊ ᴛᴏᴛᴀʟ : *${rolls.reduce((a, b) => a + b, 0)}*`)
    }
  },
  {
    name: 'moneda',
    alias: ['coinflip', 'caraocruz'],
    category: 'fun',
    desc: 'Lanza una moneda al aire',
    usage: '.moneda [cantidad]',
    limit: false,
    async run(m, ctx) {
      const count = Math.min(100, Math.max(1, parseInt(m.arg || '1', 10) || 1))
      const r = await ctx.api.json('/api/coinflip', { count })
      if (r.ok) {
        return m.reply(
          `🪙 ʀᴇsᴜʟᴛᴀᴅᴏ : *${r.data.flips?.join(' · ')}*\n┊ ᴄᴀʀᴀs : ${r.data.caras} · ᴄʀᴜᴄᴇs : ${r.data.cruces}`
        )
      }
      const flips = Array.from({ length: count }, () => pick(['cara', 'cruz']))
      return m.reply(`🪙 ʀᴇsᴜʟᴛᴀᴅᴏ : *${flips.join(' · ')}*`)
    }
  },
  {
    name: 'chiste',
    alias: ['broma'],
    category: 'fun',
    desc: 'Un chiste malo para alegrar el chat',
    usage: '.chiste',
    limit: false,
    async run(m) {
      const chistes = [
        '¿Por qué el bot no toma café? Porque ya tiene mucha Java ☕😹',
        'Hay 10 tipos de personas: las que entienden binario y las que no 🤖',
        'Mi código no tiene bugs, tiene sorpresas ✨🐛',
        '—¿Cuál es tu red social favorita? —WhatsApp, porque aquí estoy trabajando gratis 😅',
        'Un byte entra a un bar y el barman le dice: ¿qué va a tomar? Y el byte responde: 1 🍺'
      ]
      return m.reply(pick(chistes))
    }
  }
]

/** Foto de perfil en Buffer (o URL) para las tarjetas */
async function pfpOf(m, jid) {
  try {
    const url = await m.sock.profilePictureUrl(jid, 'image')
    if (!url) return null
    const res = await fetch(url)
    if (!res.ok) return url
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
