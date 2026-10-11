/**
 *  Categoría: ʀᴘɢ — aventura, caza, mazmorras y jefes
 */
import config from '../../config.js'
import db from '../core/store.js'
import { formatNumber, pick, randomInt } from '../core/utils.js'
import { SHOP, findItem } from './_shop.js'

const CUR = config.economy.currency

const MOBS = [
  { name: 'Rata gigante', emoji: '🐀', hp: 45, atk: 8, def: 3, xp: 12, coins: 60, level: 1 },
  { name: 'Slime', emoji: '🟢', hp: 60, atk: 7, def: 6, xp: 15, coins: 80, level: 1 },
  { name: 'Lobo salvaje', emoji: '🐺', hp: 80, atk: 14, def: 6, xp: 25, coins: 150, level: 2 },
  { name: 'Bandido', emoji: '🥷', hp: 95, atk: 16, def: 9, xp: 32, coins: 220, level: 3 },
  { name: 'Esqueleto', emoji: '💀', hp: 110, atk: 18, def: 12, xp: 40, coins: 260, level: 4 },
  { name: 'Orco', emoji: '👹', hp: 150, atk: 24, def: 14, xp: 55, coins: 380, level: 6 },
  { name: 'Troll', emoji: '🧌', hp: 190, atk: 28, def: 18, xp: 70, coins: 480, level: 8 },
  { name: 'Gólem de piedra', emoji: '🗿', hp: 230, atk: 30, def: 26, xp: 85, coins: 560, level: 10 },
  { name: 'Dragón joven', emoji: '🐉', hp: 300, atk: 42, def: 24, xp: 130, coins: 900, level: 14 },
  { name: 'Demonio', emoji: '😈', hp: 380, atk: 52, def: 30, xp: 180, coins: 1300, level: 18 }
]

const ANIMALS = [
  { name: 'Conejo', emoji: '🐇', hp: 30, atk: 6, def: 2, xp: 8, coins: 40 },
  { name: 'Jabalí', emoji: '🐗', hp: 70, atk: 13, def: 5, xp: 18, coins: 110 },
  { name: 'Águila', emoji: '🦅', hp: 60, atk: 17, def: 4, xp: 20, coins: 130 },
  { name: 'Oso', emoji: '🐻', hp: 120, atk: 22, def: 10, xp: 38, coins: 240 },
  { name: 'Cocodrilo', emoji: '🐊', hp: 145, atk: 26, def: 15, xp: 45, coins: 290 },
  { name: 'Tigre', emoji: '🐅', hp: 130, atk: 30, def: 9, xp: 48, coins: 320 }
]

const rpgXpNeed = (level) => Math.round(80 * Math.pow(level, 1.25))

const equipment = (u) => {
  const weapon = u.rpg.weapon ? SHOP[u.rpg.weapon]?.equip : null
  const armor = u.rpg.armor ? SHOP[u.rpg.armor]?.equip : null
  return {
    atk: (u.rpg.atk || 10) + (weapon?.atk || 0),
    def: (u.rpg.def || 5) + (armor?.def || 0) + (weapon?.def || 0)
  }
}

const hpBar = (hp, max) => {
  const filled = Math.max(0, Math.round((hp / max) * 10))
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

function levelUpRpg(u, ctx, m) {
  let ups = 0
  while (u.rpg.xp >= rpgXpNeed(u.rpg.level) && u.rpg.level < 100) {
    u.rpg.xp -= rpgXpNeed(u.rpg.level)
    u.rpg.level++
    u.rpg.maxHp += 22
    u.rpg.maxMp = (u.rpg.maxMp || 30) + 5
    u.rpg.atk += 3
    u.rpg.def += 2
    u.rpg.hp = u.rpg.maxHp
    ups++
  }
  if (ups) db.markDirty()
  return ups
}

function simulate(player, mob) {
  let pHp = player.hp
  let mHp = mob.hp
  const log = []
  let rounds = 0
  while (pHp > 0 && mHp > 0 && rounds < 40) {
    rounds++
    const pDmg = Math.max(1, Math.round(player.atk * (1 + player.level / 25) - mob.def * 0.6) + randomInt(0, 5) - randomInt(0, 3))
    mHp -= pDmg
    if (mHp <= 0) {
      log.push(`⚔️ ɢᴏʟᴘᴇ ᴅᴇ ${pDmg} → ${mob.emoji} ${mob.name} ᴄᴀᴇ 💀`)
      break
    }
    const mDmg = Math.max(1, Math.round(mob.atk * (1 + mob.level / 30) - player.def * 0.7) + randomInt(0, 4) - randomInt(0, 2))
    pHp -= mDmg
    if (log.length < 4) log.push(`⚔️ ᴛú ${pDmg} ᴅᴀñᴏ · ${mob.emoji} ${mDmg} ᴅᴀñᴏ (ᴛᴜ ᴠɪᴅᴀ ${Math.max(0, pHp)}/${player.maxHp})`)
  }
  return { win: mHp <= 0 && pHp > 0, pHp: Math.max(0, pHp), mHp: Math.max(0, mHp), log, rounds }
}

function fight(m, ctx, mob, { dungeonLevel = 0, isBoss = false } = {}) {
  const u = m.user
  if ((u.rpg.hp || 0) <= 0) {
    u.rpg.hp = Math.round(u.rpg.maxHp * 0.3)
    db.markDirty()
    return m.reply('💀 ᴇsᴛás ᴋ.ᴏ. — ᴛᴇ ʀᴇᴀɴɪᴍᴀʀᴏɴ ᴄᴏɴ ᴘᴏᴄᴀ ᴠɪᴅᴀ.\nᴜsᴀ ' + ctx.prefix + 'ᴄᴜʀᴀʀ ᴘᴀʀᴀ ʀᴇᴄᴜᴘᴇʀᴀʀᴛᴇ.')
  }
  const stats = equipment(u)
  const scaled = {
    ...mob,
    hp: Math.round(mob.hp * (1 + dungeonLevel * 0.25) * (isBoss ? 2.4 : 1)),
    atk: Math.round(mob.atk * (1 + dungeonLevel * 0.18) * (isBoss ? 1.7 : 1)),
    def: Math.round(mob.def * (1 + dungeonLevel * 0.15)),
    level: (mob.level || 1) + dungeonLevel
  }
  const result = simulate(
    { hp: u.rpg.hp, maxHp: u.rpg.maxHp, atk: stats.atk, def: stats.def, level: u.rpg.level },
    scaled
  )
  u.rpg.hp = result.pHp
  const name = isBoss ? `👑 ${mob.name} (JEFE)` : `${mob.emoji} ${mob.name}`

  if (result.win) {
    const xpGain = Math.round(scaled.xp * (isBoss ? 3 : 1))
    const coinGain = Math.round(scaled.coins * (isBoss ? 3 : 1) * (1 + Math.random() * 0.3))
    u.rpg.xp += xpGain
    u.coins += coinGain
    if (isBoss) u.rpg.bossKills = (u.rpg.bossKills || 0) + 1
    const ups = levelUpRpg(u, ctx, m)
    db.markDirty()
    return m.reply(
      [
        `🏆 *ᴠɪᴄᴛᴏʀɪᴀ* ᴄᴏɴᴛʀᴀ ${name}`,
        '',
        ...result.log,
        '',
        `┊ ✨ +${xpGain} xᴘ · 🪙 +${coinGain} ${CUR}`,
        ups ? `┊ 🎉 ¡sᴜʙɪsᴛᴇ ᴀʟ ɴɪᴠᴇʟ ${u.rpg.level} ᴅᴇ ʀᴘɢ!` : null,
        `┊ ❤️ ᴠɪᴅᴀ : ${u.rpg.hp}/${u.rpg.maxHp} ${hpBar(u.rpg.hp, u.rpg.maxHp)}`
      ]
        .filter(Boolean)
        .join('\n')
    )
  }

  const lost = Math.floor((u.coins || 0) * 0.08)
  u.coins = Math.max(0, (u.coins || 0) - lost)
  u.rpg.hp = Math.round(u.rpg.maxHp * 0.2)
  db.markDirty()
  return m.reply(
    [
      `💀 *ᴅᴇʀʀᴏᴛᴀ* ᴄᴏɴᴛʀᴀ ${name}`,
      '',
      ...result.log,
      '',
      `┊ ᴘᴇʀᴅɪsᴛᴇ ${formatNumber(lost)} ${CUR}`,
      `┊ ❤️ ᴠɪᴅᴀ ʀᴇsᴛᴀɴᴛᴇ : ${u.rpg.hp}/${u.rpg.maxHp}`,
      `┊ ᴜsᴀ ${ctx.prefix}ᴄᴜʀᴀʀ ᴘᴀʀᴀ ᴠᴏʟᴠᴇʀ ᴀ ʟᴀ ᴀᴄᴄɪóɴ`
    ].join('\n')
  )
}

export default [
  {
    name: 'rpg',
    alias: ['perfilrpg', 'rpginfo', 'yo-rpg'],
    category: 'rpg',
    desc: 'Tu perfil de rol: nivel, vida, ataque y equipo',
    usage: '.rpg',
    limit: false,
    async run(m, ctx) {
      const u = m.user
      const stats = equipment(u)
      const need = rpgXpNeed(u.rpg.level)
      const weapon = u.rpg.weapon ? SHOP[u.rpg.weapon]?.label : '—'
      const armor = u.rpg.armor ? SHOP[u.rpg.armor]?.label : '—'
      return m.reply(
        [
          `╭───「 ᴘᴇʀғɪʟ ʀᴘɢ 」`,
          `│ 👤 ${m.pushName}`,
          `│ 🏅 ɴɪᴠᴇʟ : ${u.rpg.level}`,
          `│ ✨ xᴘ : ${u.rpg.xp}/${need}`,
          `│ ❤️ ᴠɪᴅᴀ : ${u.rpg.hp}/${u.rpg.maxHp} ${hpBar(u.rpg.hp, u.rpg.maxHp)}`,
          `│ 💙 ᴍᴘ : ${u.rpg.mp}/${u.rpg.maxMp}`,
          `│ ⚔️ ᴀᴛǫ : ${stats.atk}${u.rpg.weapon ? ` (${weapon})` : ''}`,
          `│ 🛡️ ᴅᴇꜰ : ${stats.def}${u.rpg.armor ? ` (${armor})` : ''}`,
          `│ 🏰 ᴍᴀᴢᴍᴏʀʀᴀ : ᴘɪsᴏ ${(u.rpg.dungeon || 0) + 1}`,
          `│ 👑 ᴊᴇꜰᴇs ᴍᴀᴛᴀᴅᴏs : ${u.rpg.bossKills || 0}`,
          `│ 🧪 ᴘᴏᴄɪᴏɴᴇs : ${u.inventory?.pocion || 0} · ⚗️ ${u.inventory?.superpocion || 0}`,
          `│ 🪙 ᴍᴏɴᴇᴅᴀs : ${formatNumber(u.coins)}`,
          `│`,
          `│ 🗺️ ${ctx.prefix}ᴀᴠᴇɴᴛᴜʀᴀ · ${ctx.prefix}ᴄᴀᴢᴀʀ · ${ctx.prefix}ᴍᴀᴢᴍᴏʀʀᴀ`,
          `│ 🐉 ${ctx.prefix}ᴊᴇꜰᴇ · ⚔️ ${ctx.prefix}ᴇɴᴛʀᴇɴᴀʀ · ❤️ ${ctx.prefix}ᴄᴜʀᴀʀ`,
          `╰───「 ${ctx.botName} 」`
        ].join('\n')
      )
    }
  },
  {
    name: 'aventura',
    alias: ['adventure', 'explorar'],
    category: 'rpg',
    desc: 'Explora y pelea contra un enemigo aleatorio',
    usage: '.aventura',
    limit: 2,
    async run(m, ctx) {
      const pool = MOBS.filter((x) => (x.level || 1) <= (m.user.rpg.level || 1) + 2)
      const mob = pick(pool.length ? pool : [MOBS[0]])
      await m.reply(`🗺️ ᴇxᴘʟᴏʀᴀɴᴅᴏ… ᴛᴇ ᴇɴᴄᴜᴇɴᴛʀᴀs ᴜɴ *${mob.emoji} ${mob.name}*`)
      await m.wait(800)
      return fight(m, ctx, mob)
    }
  },
  {
    name: 'cazar',
    alias: ['hunt', 'caceria'],
    category: 'rpg',
    desc: 'Caza animales salvajes (menos riesgo)',
    usage: '.cazar',
    limit: 2,
    async run(m, ctx) {
      const mob = pick(ANIMALS)
      await m.reply(`🏹 ᴛᴇ ᴇsᴄᴏɴᴅᴇs ᴇɴ ᴇʟ ʙᴏsǫᴜᴇ… ᴜɴ *${mob.emoji} ${mob.name}* ᴛᴇ ᴠɪᴏ`)
      await m.wait(700)
      return fight(m, ctx, { ...mob, level: 1 })
    }
  },
  {
    name: 'mazmorra',
    alias: ['dungeon', 'calabozo'],
    category: 'rpg',
    desc: 'Baja a la mazmorra: cada piso es más difícil',
    usage: '.mazmorra',
    limit: 3,
    async run(m, ctx) {
      const u = m.user
      const floor = (u.rpg.dungeon || 0) + 1
      const base = pick(MOBS.filter((x) => x.level >= Math.min(8, Math.floor(floor / 2) + 1)).slice(0, 3)) || MOBS[MOBS.length - 1]
      const mob = { ...base, name: `${base.name} del piso ${floor}`, emoji: pick(['👾', '👻', '🧟', '🦂', '🕷️', base.emoji]) }
      await m.reply(`🏰 ᴘɪsᴏ ${floor} ᴅᴇ ʟᴀ ᴍᴀᴢᴍᴏʀʀᴀ… ᴀᴘᴀʀᴇᴄᴇ ${mob.emoji} *${mob.name}*`)
      await m.wait(800)
      const before = (u.rpg.dungeon || 0)
      const reply = await fight(m, ctx, mob, { dungeonLevel: floor })
      if (m.user.rpg.hp > 0 && m.user.rpg.dungeon === before) {
        m.user.rpg.dungeon = floor
        db.markDirty()
        await m.reply(`🏰 ¡ᴘɪsᴏ ${floor} ᴅᴇsᴘᴇᴊᴀᴅᴏ! sɪɢᴜɪᴇɴᴛᴇ : ${ctx.prefix}ᴍᴀᴢᴍᴏʀʀᴀ`)
      }
      return reply
    }
  },
  {
    name: 'jefe',
    alias: ['boss', 'jefeboss'],
    category: 'rpg',
    desc: 'Reto a un jefe poderoso (necesitas nivel 4+)',
    usage: '.jefe',
    limit: 3,
    async run(m, ctx) {
      const u = m.user
      if ((u.rpg.level || 1) < 4) return m.reply(`🔒 ɴᴇᴄᴇsɪᴛᴀs ɴɪᴠᴇʟ 4 ᴅᴇ ʀᴘɢ (ᴛɪᴇɴᴇs ${u.rpg.level}).\nᴜsᴀ ${ctx.prefix}ᴀᴠᴇɴᴛᴜʀᴀ ᴘᴀʀᴀ sᴜʙɪʀ.`)
      const boss = pick(MOBS.slice(5))
      await m.reply(`👑 ᴇʟ *${boss.emoji} ${boss.name} ᴀɴᴄɪᴀɴᴏ* ᴀᴘᴀʀᴇᴄᴇ ᴅᴇ ʟᴀ ɴᴀᴅᴀ 😱`)
      await m.wait(900)
      return fight(m, ctx, boss, { dungeonLevel: Math.floor(u.rpg.level / 2), isBoss: true })
    }
  },
  {
    name: 'curar',
    alias: ['heal', 'descansar'],
    category: 'rpg',
    desc: 'Recupera vida con pociones o monedas',
    usage: '.curar',
    limit: false,
    async run(m, ctx) {
      const u = m.user
      u.inventory = u.inventory || {}
      if (u.rpg.hp >= u.rpg.maxHp) return m.reply('❤️ ʏᴀ ᴇsᴛás ᴀ ᴛᴏᴘᴇ ᴅᴇ ᴠɪᴅᴀ.')
      if ((u.inventory.superpocion || 0) > 0) {
        u.inventory.superpocion--
        u.rpg.hp = u.rpg.maxHp
        db.markDirty()
        return m.reply(`⚗️ ᴜsᴀsᴛᴇ ᴜɴᴀ súᴘᴇʀ ᴘᴏᴄɪóɴ : ᴠɪᴅᴀ ᴀʟ ᴛᴏᴘᴇ (${u.rpg.maxHp})`)
      }
      if ((u.inventory.pocion || 0) > 0) {
        u.inventory.pocion--
        const heal = Math.min(50, u.rpg.maxHp - u.rpg.hp)
        u.rpg.hp += heal
        db.markDirty()
        return m.reply(`🧪 ᴜsᴀsᴛᴇ ᴜɴᴀ ᴘᴏᴄɪóɴ : +${heal} ᴠɪᴅᴀ (${u.rpg.hp}/${u.rpg.maxHp})\n┊ ᴛᴇ ǫᴜᴇᴅᴀɴ ${u.inventory.pocion}`)
      }
      const price = 300
      if ((u.coins || 0) < price) return m.reply(`💸 ɴᴏ ᴛɪᴇɴᴇs ᴘᴏᴄɪᴏɴᴇs ɴɪ ${price} ${CUR} ᴘᴀʀᴀ ᴜɴᴀ ᴄᴜʀᴀ.\nᴜsᴀ ${ctx.prefix}sʜᴏᴘ · ${ctx.prefix}ʙᴜʏ ᴘᴏᴄɪᴏɴ`)
      u.coins -= price
      u.rpg.hp = u.rpg.maxHp
      db.markDirty()
      return m.reply(`🏥 ᴘᴀɢᴀsᴛᴇ ${price} ${CUR} ᴀʟ ᴄᴜʀᴀɴᴅᴇʀᴏ : ᴠɪᴅᴀ ᴀʟ ᴛᴏᴘᴇ ❤️ ${u.rpg.maxHp}`)
    }
  },
  {
    name: 'entrenar',
    alias: ['train', 'practicar'],
    category: 'rpg',
    desc: 'Entrena para subir ataque y defensa',
    usage: '.entrenar',
    limit: false,
    async run(m, ctx) {
      const u = m.user
      const price = 150
      if ((u.coins || 0) < price) return m.reply(`💸 ɴᴇᴄᴇsɪᴛᴀs ${price} ${CUR} ᴘᴀʀᴀ ᴘᴀɢᴀʀ ᴀʟ ᴇɴᴛʀᴇɴᴀᴅᴏʀ.`)
      u.coins -= price
      const upAtk = Math.random() < 0.5
      if (upAtk) u.rpg.atk += 2
      else u.rpg.def += 2
      u.rpg.xp += 15
      const ups = levelUpRpg(u, ctx, m)
      db.markDirty()
      return m.reply(
        `🏋️ ᴇɴᴛʀᴇɴᴀsᴛᴇ ᴅᴜʀᴏ (+${upAtk ? '2 ⚔️ ᴀᴛǫ' : '2 🛡️ ᴅᴇꜰ'})\n┊ ✨ +15 xᴘ${ups ? `\n┊ 🎉 ¡ɴɪᴠᴇʟ ${u.rpg.level}!` : ''}\n┊ 🪙 sᴀʟᴅᴏ : ${formatNumber(u.coins)}`
      )
    }
  },
  {
    name: 'equipar',
    alias: ['equip', 'arme'],
    category: 'rpg',
    desc: 'Equipa un arma o armadura de tu mochila',
    usage: '.equipar espada',
    limit: false,
    async run(m, ctx) {
      const item = findItem(m.arg || '')
      const u = m.user
      if (!item || !item.equip) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴇǫᴜɪᴘᴀʀ <ᴇsᴘᴀᴅᴀ|ᴇsᴄᴜᴅᴏ|ᴀʀᴄᴏ|ᴍᴀʀᴛɪʟʟᴏ>\nʟᴏs ᴄᴏᴍᴘʀᴀs ᴇɴ ${ctx.prefix}sʜᴏᴘ`)
      if (!(u.inventory?.[item.key] > 0)) return m.reply(`🎒 ɴᴏ ᴛɪᴇɴᴇs *${item.label}* ᴇɴ ʟᴀ ᴍᴏᴄʜɪʟᴀ.`)
      u.rpg[item.equip.slot] = item.key
      db.markDirty()
      return m.reply(`✅ ᴇǫᴜɪᴘᴀsᴛᴇ *${item.label}* (${item.desc})`)
    }
  },
  {
    name: 'usar',
    alias: ['use', 'tomar'],
    category: 'rpg',
    desc: 'Usa una poción u objeto',
    usage: '.usar pocion',
    limit: false,
    async run(m, ctx) {
      const item = findItem(m.arg || '')
      const u = m.user
      if (!item) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴜsᴀʀ <ᴘᴏᴄɪᴏɴ|sᴜᴘᴇʀᴘᴏᴄɪᴏɴ>`)
      if (!(u.inventory?.[item.key] > 0)) return m.reply(`🎒 ɴᴏ ᴛɪᴇɴᴇs ${item.label}.`)
      if (item.equip) return m.reply(`ℹ️ ᴇsᴏ sᴇ ᴇǫᴜɪᴘᴀ ᴄᴏɴ ${ctx.prefix}ᴇǫᴜɪᴘᴀʀ ${item.key}`)
      if (item.key === 'pokeball') return m.reply(`ℹ️ ᴜsᴀ ʟᴀ ᴘᴏᴋéʙᴀʟʟ ᴄᴏɴ ${ctx.prefix}ᴀᴛʀᴀᴘᴀʀ`)
      u.inventory[item.key]--
      const heal = item.heal === 'full' ? u.rpg.maxHp - u.rpg.hp : Math.min(50, u.rpg.maxHp - u.rpg.hp)
      u.rpg.hp += heal
      db.markDirty()
      return m.reply(`${item.label} ᴜsᴀᴅᴏ : +${heal} ᴠɪᴅᴀ ❤️ (${u.rpg.hp}/${u.rpg.maxHp})`)
    }
  },
  {
    name: 'rpgshop',
    alias: ['tiendarpg'],
    category: 'rpg',
    desc: 'Atajos de la tienda útiles para el RPG',
    usage: '.rpgshop',
    limit: false,
    async run(m, ctx) {
      return m.reply(
        [
          `╭───「 ᴛɪᴇɴᴅᴀ ʀᴘɢ 」`,
          `│ 🧪 ᴘᴏᴄɪᴏɴ : 250 ${CUR} — ᴄᴜʀᴀ 50 ᴠɪᴅᴀ`,
          `│ ⚗️ sᴜᴘᴇʀ ᴘᴏᴄɪᴏɴ : 700 ${CUR} — ᴄᴜʀᴀ ᴛᴏᴅᴏ`,
          `│ 🗡️ ᴇsᴘᴀᴅᴀ : 1200 ${CUR} — +15 ᴀᴛǫ`,
          `│ 🛡️ ᴇsᴄᴜᴅᴏ : 1000 ${CUR} — +12 ᴅᴇꜰ`,
          `│ 🏹 ᴀʀᴄᴏ : 2200 ${CUR} — +28 ᴀᴛǫ`,
          `│`,
          `│ ᴄᴏᴍᴘʀᴀ : ${ctx.prefix}ʙᴜʏ <ɪᴛᴇᴍ>`,
          `│ ᴇǫᴜɪᴘᴀ : ${ctx.prefix}ᴇǫᴜɪᴘᴀʀ <ɪᴛᴇᴍ>`,
          `╰───「 ${ctx.botName} 」`
        ].join('\n')
      )
    }
  }
]
