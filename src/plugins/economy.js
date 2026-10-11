/**
 *  Categoría: ᴇᴄᴏɴᴏᴍʏ — monedas, trabajo, robos y tienda
 */
import config from '../../config.js'
import db from '../core/store.js'
import { formatNumber, mentionTag, pick, randomInt } from '../core/utils.js'
import { addXp, formatLimit, remainingLimit } from '../core/roles.js'
import { SHOP, findItem, shopList } from './_shop.js'
import { getTarget } from './_shared.js'

const CUR = config.economy.currency

const cooldown = (user, key, ms) => {
  user.cooldowns = user.cooldowns || {}
  const last = user.cooldowns[key] || 0
  const left = ms - (Date.now() - last)
  if (left > 0) return left
  user.cooldowns[key] = Date.now()
  return 0
}

const wait = (ms) => {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return m ? `${m} ᴍɪɴ ${s}s` : `${s}s`
}

const addCoins = (user, amount) => {
  user.coins = Math.max(0, (user.coins || 0) + amount)
  db.markDirty()
}

export default [
  {
    name: 'bal',
    alias: ['balance', 'cartera', 'coins', 'dinero'],
    category: 'economy',
    desc: 'Muestra tu dinero y tus cooldowns',
    usage: '.bal',
    limit: false,
    async run(m, ctx) {
      const u = db.user(m.sender)
      const top = db.top('total', 100).findIndex((x) => x.jid === m.sender) + 1
      const cds = Object.entries(u.cooldowns || {})
        .map(([k, at]) => {
          const cfg = config.economy[`${k}Cooldown`] || 0
          const left = cfg - (Date.now() - at)
          return left > 0 ? `┊ ⏳ ${k} : ${wait(left)}` : null
        })
        .filter(Boolean)
        .join('\n')
      return m.reply(
        [
          `╭───「 ᴛᴜ ᴄᴀʀᴛᴇʀᴀ 」`,
          `│ 👤 ${m.pushName}`,
          `│ 💵 ᴇꜰᴇᴄᴛɪᴠᴏ : ${formatNumber(u.coins)} ${CUR}`,
          `│ 🏦 ʙᴀɴᴄᴏ : ${formatNumber(u.bank)} ${CUR}`,
          `│ 💰 ᴛᴏᴛᴀʟ : ${formatNumber((u.coins || 0) + (u.bank || 0))} ${CUR}`,
          `│ 🥇 ᴘᴜᴇsᴛᴏ : ${top || '—'} ᴅᴇ ${Object.keys(db.data.users).length}`,
          `│ Ⓛ ʟíᴍɪᴛᴇ : ${formatLimit(remainingLimit(u, m.role))}`,
          cds ? `│\n${cds}` : '',
          `│`,
          `│ ᴛʀᴀʙᴀᴊᴀ ᴄᴏɴ : ${ctx.prefix}ᴡᴏʀᴋ · ${ctx.prefix}ᴍɪɴᴇ · ${ctx.prefix}ꜰɪsʜ`,
          `│ ᴛɪᴇɴᴅᴀ : ${ctx.prefix}sʜᴏᴘ`,
          `╰───「 ${ctx.botName} 」`
        ]
          .filter(Boolean)
          .join('\n')
      )
    }
  },
  {
    name: 'daily',
    alias: ['diario', 'recompensa'],
    category: 'economy',
    desc: 'Reclama tu recompensa diaria',
    usage: '.daily',
    limit: false,
    async run(m, ctx) {
      const u = db.user(m.sender)
      const left = cooldown(u, 'daily', 24 * 60 * 60 * 1000)
      if (left) return m.reply(`⏳ ʏᴀ ʀᴇᴄʟᴀᴍᴀsᴛᴇ ᴛᴜ ᴅɪᴀʀɪᴏ. ᴠᴜᴇʟᴠᴇ ᴇɴ ${wait(left)}.`)
      const streak = u.streak || 0
      const bonus = Math.min(1000, streak * 50)
      const amount = config.economy.dailyReward + bonus + randomInt(0, 100)
      addCoins(u, amount)
      u.streak = streak + 1
      const { levelUp, level } = addXp(u, 25, m.role)
      db.markDirty()
      if (levelUp) ctx.onLevelUp?.(m, level)
      return m.reply(
        [
          `🎁 *ʀᴇᴄᴏᴍᴘᴇɴsᴀ ᴅɪᴀʀɪᴀ*`,
          `┊ ʀᴀᴄʜᴀ : ${u.streak} ᴅíᴀs 🔥`,
          `┊ ɢᴀɴᴀɴᴄɪᴀ : ${amount} ${CUR}`,
          bonus ? `┊ ʙᴏɴᴜs ᴘᴏʀ ʀᴀᴄʜᴀ : +${bonus}` : '',
          `┊ ᴛᴏᴛᴀʟ : ${formatNumber(u.coins)} ${CUR}`
        ]
          .filter(Boolean)
          .join('\n')
      )
    }
  },
  {
    name: 'work',
    alias: ['trabajar', 'chamba'],
    category: 'economy',
    desc: 'Trabaja para ganar monedas',
    usage: '.work',
    limit: false,
    async run(m, ctx) {
      const u = db.user(m.sender)
      const left = cooldown(u, 'work', 10 * 60 * 1000)
      if (left) return m.reply(`💤 ᴇsᴛás ᴄᴀɴsᴀᴅᴏ, ᴅᴇsᴄᴀɴsᴀ ${wait(left)} ʏ ᴠᴜᴇʟᴠᴇ.`)
      const [min, max] = config.economy.workRange
      const amount = randomInt(min, max)
      addCoins(u, amount)
      const job = pick(['programador de bots 🤖', 'repartidor de stickers 🛵', 'barista de termux ☕', 'youtuber de 3 vistas 🎥', 'profesor de WhatsApp 🧑‍🏫', 'minero de cripto fake ⛏️'])
      return m.reply(`👷 ᴛʀᴀʙᴀᴊᴀsᴛᴇ ᴄᴏᴍᴏ *${job}*\n┊ ɢᴀɴᴀɴᴄɪᴀ : +${amount} ${CUR}\n┊ ᴛᴏᴛᴀʟ : ${formatNumber(u.coins)} ${CUR}`)
    }
  },
  {
    name: 'crime',
    alias: ['delito', 'robarunbanco'],
    category: 'economy',
    desc: 'Intenta un delito: mucho riesgo, mucha recompensa',
    usage: '.crime',
    limit: false,
    async run(m, ctx) {
      const u = db.user(m.sender)
      const left = cooldown(u, 'crime', 30 * 60 * 1000)
      if (left) return m.reply(`🚔 ʟᴀ ᴘᴏʟɪᴄíᴀ ᴛᴇ ᴠɪɢɪʟᴀ, ᴇsᴘᴇʀᴀ ${wait(left)}.`)
      const success = Math.random() < 0.55
      if (success) {
        const amount = randomInt(400, 1500)
        addCoins(u, amount)
        return m.reply(`🕵️ ᴛᴇ sᴀʟɪᴏ ʙɪᴇɴ ᴇʟ ɢᴏʟᴘᴇ 😎\n┊ ʙᴏᴛíɴ : +${amount} ${CUR}\n┊ ᴛᴏᴛᴀʟ : ${formatNumber(u.coins)} ${CUR}`)
      }
      const fine = Math.min(u.coins || 0, randomInt(200, 800))
      addCoins(u, -fine)
      return m.reply(`👮 ᴛᴇ ᴘᴇsᴄᴀʀᴏɴ 😬\n┊ ᴍᴜʟᴛᴀ : -${fine} ${CUR}\n┊ ᴛᴏᴛᴀʟ : ${formatNumber(u.coins)} ${CUR}`)
    }
  },
  {
    name: 'mine',
    alias: ['minar', 'mina'],
    category: 'economy',
    desc: 'Mina minerales para venderlos',
    usage: '.mine',
    limit: false,
    async run(m, ctx) {
      const u = db.user(m.sender)
      const left = cooldown(u, 'mine', 15 * 60 * 1000)
      if (left) return m.reply(`⛏️ ᴛᴜ ᴘɪᴄᴏ ɴᴇᴄᴇsɪᴛᴀ ʀᴇᴘᴀʀᴀᴄɪóɴ, ᴇsᴘᴇʀᴀ ${wait(left)}.`)
      const [min, max] = config.economy.mineRange
      const amount = randomInt(min, max)
      const mineral = pick(['🪨 ᴄᴀʀʙóɴ', '🔶 ᴏʀᴏ', '💎 ᴅɪᴀᴍᴀɴᴛᴇ', '⛓️ ʜɪᴇʀʀᴏ', '🟢 ᴇsᴍᴇʀᴀʟᴅᴀ'])
      addCoins(u, amount)
      return m.reply(`⛏️ ᴇɴᴄᴏɴᴛʀᴀsᴛᴇ ${mineral}\n┊ ᴠᴇɴᴛᴀ : +${amount} ${CUR}\n┊ ᴛᴏᴛᴀʟ : ${formatNumber(u.coins)} ${CUR}`)
    }
  },
  {
    name: 'fish',
    alias: ['pescar', 'pesca'],
    category: 'economy',
    desc: 'Pesca algo para vender',
    usage: '.fish',
    limit: false,
    async run(m, ctx) {
      const u = db.user(m.sender)
      const left = cooldown(u, 'fish', 12 * 60 * 1000)
      if (left) return m.reply(`🎣 ʟᴏs ᴘᴇᴄᴇs ᴇsᴄᴀᴘᴀɴ, ᴠᴜᴇʟᴠᴇ ᴇɴ ${wait(left)}.`)
      const [min, max] = config.economy.fishRange
      const amount = randomInt(min, max)
      const fish = pick(['🐟 ᴛɪʟᴀᴘɪᴀ', '🐠 ᴘᴇᴢ ᴘᴀʏᴀsᴏ', '🦐 ᴄᴀᴍᴀʀóɴ', '🦈 ᴛɪʙᴜʀóɴ ʙᴀʙʏ', '🐙 ᴘᴜʟᴘᴏ', '👟 ᴜɴ ᴢᴀᴘᴀᴛᴏ ᴠɪᴇᴊᴏ'])
      addCoins(u, amount)
      return m.reply(`🎣 ᴘᴇsᴄᴀsᴛᴇ ${fish}\n┊ ᴠᴇɴᴛᴀ : +${amount} ${CUR}\n┊ ᴛᴏᴛᴀʟ : ${formatNumber(u.coins)} ${CUR}`)
    }
  },
  {
    name: 'rob',
    alias: ['robar', 'atracar'],
    category: 'economy',
    desc: 'Intenta robarle monedas a alguien',
    usage: '.rob @usuario',
    limit: false,
    async run(m, ctx) {
      const target = getTarget(m)
      if (!target) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʀᴏʙ @ᴜsᴜᴀʀɪᴏ`)
      if (target.jid === m.sender) return m.reply('🤨 No te robes a ti mismo.')
      const u = db.user(m.sender)
      const left = cooldown(u, 'rob', 60 * 60 * 1000)
      if (left) return m.reply(`🚨 ᴛᴇ ᴇsᴛás ᴇsᴄᴏɴᴅɪᴇɴᴅᴏ ᴅᴇ ʟᴀ ᴘᴏʟɪᴄíᴀ, ᴇsᴘᴇʀᴀ ${wait(left)}.`)
      const victim = target.user
      if ((victim.coins || 0) < 100) return m.reply(`💸 ${mentionTag(target.jid)} ɴᴏ ᴛɪᴇɴᴇ sᴜꜰɪᴄɪᴇɴᴛᴇ ᴇꜰᴇᴄᴛɪᴠᴏ (ɴᴇᴄᴇsɪᴛᴀ 100+).`, { mentions: [target.jid] })
      if (Math.random() < config.economy.robSuccess) {
        const stolen = Math.floor(victim.coins * (0.15 + Math.random() * 0.2))
        victim.coins -= stolen
        u.coins += stolen
        db.markDirty()
        return m.reply(`🥷 ¡ʀᴏʙᴏ ᴇxɪᴛᴏsᴏ!\n┊ ʟᴇ ʀᴏʙᴀsᴛᴇ ${formatNumber(stolen)} ${CUR} ᴀ ${mentionTag(target.jid)}\n┊ ᴛᴜ ᴛᴏᴛᴀʟ : ${formatNumber(u.coins)} ${CUR}`, { mentions: [target.jid] })
      }
      const fine = Math.min(u.coins || 0, config.economy.robFine)
      addCoins(u, -fine)
      const give = Math.floor(fine / 2)
      victim.coins = (victim.coins || 0) + give
      db.markDirty()
      return m.reply(`👮 ¡ᴛᴇ ᴀᴛʀᴀᴘᴀʀᴏɴ! ᴘᴀɢᴀs ${fine} ${CUR} ᴅᴇ ᴍᴜʟᴛᴀ ʏ ${give} ᴠᴀɴ ᴘᴀʀᴀ ${mentionTag(target.jid)}`, { mentions: [target.jid] })
    }
  },
  {
    name: 'pay',
    alias: ['pagar', 'transferir', 'dar'],
    category: 'economy',
    desc: 'Transfiere monedas a otro usuario',
    usage: '.pay @usuario 500',
    limit: false,
    async run(m, ctx) {
      const target = getTarget(m)
      const amount = parseInt(m.args.find((a) => /^\d+$/.test(a)) || '0', 10)
      if (!target || !amount) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴘᴀʏ @ᴜsᴜᴀʀɪᴏ <ᴄᴀɴᴛɪᴅᴀᴅ>`)
      if (target.jid === m.sender) return m.reply('🤨 No puedes pagarte a ti mismo.')
      const u = db.user(m.sender)
      if ((u.coins || 0) < amount) return m.reply(`💸 sᴏʟᴏ ᴛɪᴇɴᴇs ${formatNumber(u.coins)} ${CUR}.`)
      u.coins -= amount
      target.user.coins = (target.user.coins || 0) + amount
      db.markDirty()
      return m.reply(`💸 ᴛʀᴀɴsꜰᴇʀɪsᴛᴇ ${formatNumber(amount)} ${CUR} ᴀ ${mentionTag(target.jid)}\n┊ ᴛᴜ ᴛᴏᴛᴀʟ : ${formatNumber(u.coins)} ${CUR}`, { mentions: [target.jid] })
    }
  },
  {
    name: 'dep',
    alias: ['depositar'],
    category: 'economy',
    desc: 'Guarda monedas en el banco (a salvo de robos)',
    usage: '.dep 500 · .dep all',
    limit: false,
    async run(m, ctx) {
      const u = db.user(m.sender)
      const arg = (m.arg || '').toLowerCase()
      const amount = arg === 'all' || arg === 'todo' ? u.coins : parseInt(arg || '0', 10)
      if (!amount || amount > u.coins) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴅᴇᴘ <ᴄᴀɴᴛɪᴅᴀᴅ|ᴀʟʟ>\n┊ ᴇꜰᴇᴄᴛɪᴠᴏ : ${formatNumber(u.coins)} ${CUR}`)
      u.coins -= amount
      u.bank = (u.bank || 0) + amount
      db.markDirty()
      return m.reply(`🏦 ᴅᴇᴘᴏsɪᴛᴀsᴛᴇ ${formatNumber(amount)} ${CUR}\n┊ ʙᴀɴᴄᴏ : ${formatNumber(u.bank)} ${CUR}`)
    }
  },
  {
    name: 'ret',
    alias: ['retirar', 'withdraw'],
    category: 'economy',
    desc: 'Saca monedas del banco',
    usage: '.ret 500 · .ret all',
    limit: false,
    async run(m, ctx) {
      const u = db.user(m.sender)
      const arg = (m.arg || '').toLowerCase()
      const amount = arg === 'all' || arg === 'todo' ? u.bank : parseInt(arg || '0', 10)
      if (!amount || amount > (u.bank || 0)) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʀᴇᴛ <ᴄᴀɴᴛɪᴅᴀᴅ|ᴀʟʟ>\n┊ ʙᴀɴᴄᴏ : ${formatNumber(u.bank)} ${CUR}`)
      u.bank -= amount
      u.coins += amount
      db.markDirty()
      return m.reply(`💵 ʀᴇᴛɪʀᴀsᴛᴇ ${formatNumber(amount)} ${CUR}\n┊ ᴇꜰᴇᴄᴛɪᴠᴏ : ${formatNumber(u.coins)} ${CUR}`)
    }
  },
  {
    name: 'shop',
    alias: ['tienda', 'comprar-tienda'],
    category: 'economy',
    desc: 'Tienda del bot (pociones, armas, rol premium…)',
    usage: '.shop',
    limit: false,
    async run(m, ctx) {
      return m.reply(
        [
          `╭───「 ᴛɪᴇɴᴅᴀ ᴅᴇ ${ctx.botName} 」`,
          `│ 💰 ᴛᴜ ᴅɪɴᴇʀᴏ : ${formatNumber(db.user(m.sender).coins)} ${CUR}`,
          `│`,
          shopList(),
          `│`,
          `│ ᴄᴏᴍᴘʀᴀ ᴄᴏɴ : ${ctx.prefix}ʙᴜʏ <ɪᴛᴇᴍ> [ᴄᴀɴᴛ]`,
          `╰───「 ${config.bot.footer} 」`
        ].join('\n')
      )
    }
  },
  {
    name: 'buy',
    alias: ['comprar'],
    category: 'economy',
    desc: 'Compra un artículo de la tienda',
    usage: '.buy pocion 2',
    limit: false,
    async run(m, ctx) {
      const item = findItem(m.arg || '')
      if (!item) {
        return m.reply(`⚙️ ɪᴛᴇᴍ ɴᴏ ᴠáʟɪᴅᴏ. ᴜsᴀ ${ctx.prefix}sʜᴏᴘ ᴘᴀʀᴀ ᴠᴇʀ ʟᴀ ʟɪsᴛᴀ.\nᴛɪᴇɴᴇs ${formatNumber(db.user(m.sender).coins)} ${CUR}.`)
      }
      const count = Math.max(1, Math.min(99, parseInt(m.args.find((a) => /^\d+$/.test(a)) || '1', 10)))
      const u = db.user(m.sender)
      const total = item.price * count
      if ((u.coins || 0) < total) return m.reply(`💸 ᴛᴇ ꜰᴀʟᴛᴀɴ ${formatNumber(total - u.coins)} ${CUR}\n┊ ᴘʀᴇᴄɪᴏ : ${formatNumber(total)} ${CUR}\n┊ ᴛɪᴇɴᴇs : ${formatNumber(u.coins)} ${CUR}`)
      addCoins(u, -total)

      if (item.role) {
        const until = Date.now() + item.days * 86400000
        db.updateUser(m.sender, {
          role: item.role,
          [item.role === 'vip' ? 'vipUntil' : 'premiumUntil']: until
        })
        return m.reply(`👑 ¡ᴄᴏᴍᴘʀᴀᴅᴏ! ᴛᴇɴɢᴏs ᴇʟ ʀᴏʟ *${item.role}* ᴘᴏʀ ${item.days} ᴅíᴀs.\n┊ sᴀʟᴅᴏ : ${formatNumber(u.coins)} ${CUR}`)
      }
      if (item.key === 'limite5') {
        u.limitUsed = Math.max(0, (u.limitUsed || 0) - 5 * count)
        db.markDirty()
        return m.reply(`⏳ +${5 * count} ᴅᴇ ʟíᴍɪᴛᴇ ᴘᴀʀᴀ ʜᴏʏ\n┊ ʀᴇsᴛᴀɴᴛᴇ : ${formatLimit(remainingLimit(u, m.role))}`)
      }
      u.inventory = u.inventory || {}
      u.inventory[item.key] = (u.inventory[item.key] || 0) + count
      db.markDirty()
      return m.reply(`✅ ᴄᴏᴍᴘʀᴀsᴛᴇ ${count}x ${item.label}\n┊ ᴄᴏsᴛᴏ : ${formatNumber(total)} ${CUR}\n┊ sᴀʟᴅᴏ : ${formatNumber(u.coins)} ${CUR}\n┊ ᴜsᴀʟᴏ ᴄᴏɴ ${ctx.prefix}ᴜsᴀʀ ᴏ ${ctx.prefix}ᴇǫᴜɪᴘᴀʀ`)
    }
  },
  {
    name: 'inv',
    alias: ['inventario', 'mochila', 'items'],
    category: 'economy',
    desc: 'Muestra tu inventario',
    usage: '.inv',
    limit: false,
    async run(m) {
      const u = db.user(m.sender)
      const items = Object.entries(u.inventory || {}).filter(([, n]) => n > 0)
      const equipped = [u.rpg.weapon ? `🗡️ ${u.rpg.weapon}` : null, u.rpg.armor ? `🛡️ ${u.rpg.armor}` : null].filter(Boolean)
      return m.reply(
        [
          `╭───「 ᴍᴏᴄʜɪʟᴀ ᴅᴇ ${m.pushName} 」`,
          `│`,
          items.length ? items.map(([k, n]) => `│ ${SHOP[k]?.label || k} x${n}`).join('\n') : '│ (vacío)',
          `│`,
          equipped.length ? `│ ᴇǫᴜɪᴘᴀᴅᴏ : ${equipped.join(' · ')}` : '│ sɪɴ ᴇǫᴜɪᴘᴏ',
          `│ 💵 ${formatNumber(u.coins)} · 🏦 ${formatNumber(u.bank)}`,
          `╰───「 ${m.ctx.botName} 」`
        ].join('\n')
      )
    }
  },
  {
    name: 'economy',
    alias: ['ecohelp', 'eco'],
    category: 'economy',
    desc: 'Explica cómo funciona la economía',
    usage: '.economy',
    limit: false,
    async run(m, ctx) {
      const p = ctx.prefix
      const lineas = [
        `💰 ${p}ʙᴀʟ — ᴛᴜ ᴅɪɴᴇʀᴏ ʏ ᴄᴏᴏʟᴅᴏᴡɴs`,
        `🎁 ${p}ᴅᴀɪʟʏ — ʀᴇᴄᴏᴍᴘᴇɴsᴀ ᴅɪᴀʀɪᴀ (ʀᴀᴄʜᴀ = ᴍás ᴍᴏɴᴇᴅᴀs)`,
        `👷 ${p}ᴡᴏʀᴋ — ᴛʀᴀʙᴀᴊᴀʀ`,
        `⛏️ ${p}ᴍɪɴᴇ — ᴍɪɴᴀʀ`,
        `🎣 ${p}ꜰɪsʜ — ᴘᴇsᴄᴀʀ`,
        `🕵️ ${p}ᴄʀɪᴍᴇ — ʀɪᴇsɢᴏ ᴀʟᴛᴏ, ᴘʀᴇᴍɪᴏ ᴀʟᴛᴏ`,
        `🥷 ${p}ʀᴏʙ @ᴜsᴜᴀʀɪᴏ — ʀᴏʙᴀ ᴍᴏɴᴇᴅᴀs (1ʜ ᴅᴇ ᴇsᴘᴇʀᴀ)`,
        `💸 ${p}ᴘᴀʏ @ᴜsᴜᴀʀɪᴏ <ɴ> — ᴛʀᴀɴsꜰᴇʀɪʀ`,
        `🏦 ${p}ᴅᴇᴘ <ɴ> · ${p}ʀᴇᴛ <ɴ> — ʙᴀɴᴄᴏ`,
        `🛒 ${p}sʜᴏᴘ · ${p}ʙᴜʏ <ɪᴛᴇᴍ> — ᴛɪᴇɴᴅᴀ`,
        `🎒 ${p}ɪɴᴠ — ɪɴᴠᴇɴᴛᴀʀɪᴏ`,
        `🏆 ${p}ᴛᴏᴘ ᴄᴏɪɴs — ʀᴀɴᴋɪɴɢ`
      ]
      return m.reply([ctx.menu.menuBlock('ᴇᴄᴏɴᴏᴍʏ', lineas), '', ctx.config.bot.footer].join('\n'))
    }
  }
]
