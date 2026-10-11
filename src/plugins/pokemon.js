/**
 *  Categoría: ᴘᴏᴋᴇᴍᴏɴ — atrapa, entrena y pelea (Pokédex de Kanto incluida)
 */
import config from '../../config.js'
import db from '../core/store.js'
import { formatNumber, pick, randomInt, smallCaps } from '../core/utils.js'
import { POKEDEX, byId, byName, randomWild, typeEmojis, typesLabel, MOVES } from '../data/pokemon.js'

const CUR = config.economy.currency
const MAX_PARTY = 6
const CATCH_COOLDOWN = 15 * 60 * 1000

/* tabla de efectividad (atacante → defensor) */
const EFFECT = {
  fuego: { planta: 2, bicho: 2, hielo: 2, agua: 0.5, roca: 0.5, dragon: 0.5, fuego: 0.5 },
  agua: { fuego: 2, roca: 2, tierra: 2, agua: 0.5, planta: 0.5, dragon: 0.5 },
  planta: { agua: 2, roca: 2, tierra: 2, fuego: 0.5, planta: 0.5, veneno: 0.5, volador: 0.5, bicho: 0.5, dragon: 0.5 },
  electrico: { agua: 2, volador: 2, tierra: 0, planta: 0.5, electrico: 0.5, dragon: 0.5 },
  hielo: { planta: 2, tierra: 2, volador: 2, dragon: 2, fuego: 0.5, agua: 0.5, hielo: 0.5, acero: 0.5 },
  lucha: { normal: 2, roca: 2, hielo: 2, acero: 2, siniestro: 2, volador: 0.5, psiquico: 0.5, hada: 0.5, veneno: 0.5, bicho: 0.5 },
  veneno: { planta: 2, hada: 2, roca: 0.5, tierra: 0.5, veneno: 0.5, fantasma: 0.5, acero: 0 },
  tierra: { fuego: 2, electrico: 2, roca: 2, acero: 2, veneno: 2, planta: 0.5, bicho: 0.5, volador: 0 },
  volador: { planta: 2, lucha: 2, bicho: 2, electrico: 0.5, roca: 0.5, acero: 0.5 },
  psiquico: { lucha: 2, veneno: 2, psiquico: 0.5, acero: 0.5, siniestro: 0 },
  bicho: { planta: 2, psiquico: 2, siniestro: 2, fuego: 0.5, lucha: 0.5, volador: 0.5, fantasma: 0.5, acero: 0.5, hada: 0.5 },
  roca: { fuego: 2, volador: 2, bicho: 2, hielo: 2, lucha: 0.5, tierra: 0.5, acero: 0.5 },
  fantasma: { psiquico: 2, fantasma: 2, normal: 0, siniestro: 0.5 },
  dragon: { dragon: 2, acero: 0.5, hada: 0 },
  acero: { roca: 2, hielo: 2, hada: 2, fuego: 0.5, agua: 0.5, electrico: 0.5, acero: 0.5 },
  hada: { lucha: 2, dragon: 2, siniestro: 2, fuego: 0.5, veneno: 0.5, acero: 0.5 },
  normal: { roca: 0.5, acero: 0.5, fantasma: 0 },
  siniestro: { psiquico: 2, fantasma: 2, lucha: 0.5, siniestro: 0.5, hada: 0.5 }
}

const effectiveness = (type, defenderTypes = []) =>
  defenderTypes.reduce((mult, def) => mult * (EFFECT[type]?.[def] ?? 1), 1)

/** Estadísticas reales de un pokémon según su nivel */
const statsOf = (mon) => {
  const base = byId(mon.id)
  const lv = mon.level || 1
  const scale = 1 + lv / 22
  return {
    maxHp: Math.round(base.hp * scale * 0.55) + 12,
    atk: Math.round(base.atk * scale * 0.5) + 6,
    def: Math.round(base.def * scale * 0.5) + 4,
    spe: Math.round(base.spe * scale * 0.5) + 5
  }
}

const hpBar = (hp, max) => {
  const filled = Math.max(0, Math.round((hp / max) * 8))
  return '🟩'.repeat(filled) + '⬜'.repeat(8 - filled)
}

const wildOf = (avgLevel = 5, maxBst = 420) => {
  const base = randomWild(maxBst, 0)
  const level = Math.max(2, avgLevel + randomInt(-2, 2))
  return { id: base.id, name: base.name, types: base.types, level, ...statsOf({ id: base.id, level }) }
}

const partyOf = (u) => (u.pokemon?.party || []).map((mon) => ({ ...mon, ...statsOf(mon) }))

function gainXp(mon, amount) {
  mon.xp = (mon.xp || 0) + amount
  const need = () => (mon.level || 1) * 60
  let ups = 0
  while (mon.xp >= need() && mon.level < 100) {
    mon.xp -= need()
    mon.level++
    ups++
  }
  if (ups) mon.hp = statsOf(mon).maxHp
  return ups
}

export default [
  {
    name: 'pokedex',
    alias: ['pokemon', 'poke'],
    category: 'pokemon',
    desc: 'Busca un Pokémon en la Pokédex (151 de Kanto)',
    usage: '.pokedex pikachu  ·  .pokedex 25',
    limit: 1,
    async run(m, ctx) {
      const q = m.fullText.trim()
      if (!q) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴘᴏᴋᴇᴅᴇx <ɴᴏᴍʙʀᴇ ᴏ ɴúᴍᴇʀᴏ>`)
      const mon = /^\d+$/.test(q) ? byId(q) : byName(q)
      if (!mon) return m.reply('🔍 ɴᴏ ᴇɴᴄᴏɴᴛʀᴇ́ ᴇsᴇ ᴘᴏᴋéᴍᴏɴ (ᴛᴇɴɢᴏ ʟᴏs 151 ᴅᴇ ᴋᴀɴᴛᴏ).')
      return m.reply(
        [
          `#${String(mon.id).padStart(3, '0')} ${mon.name} ${typeEmojis(mon.types)}`,
          `┊ ᴛɪᴘᴏs : ${typesLabel(mon.types)}`,
          `┊ ❤️ ʜᴘ ${mon.hp} · ⚔️ ᴀᴛᴋ ${mon.atk} · 🛡️ ᴅᴇꜰ ${mon.def} · 💨 sᴘᴇ ${mon.spe}`,
          `┊ 📊 ᴛᴏᴛᴀʟ : ${mon.bst}${mon.legendary ? ' 👑 legendario' : ''}`,
          mon.evoTo ? `┊ 🔄 ᴇᴠᴏʟᴜᴄɪᴏɴᴀ ᴀ ʟᴠ ${mon.evoLevel} → ${byId(mon.evoTo)?.name}` : '┊ 🔄 sɪɴ ᴇᴠᴏʟᴜᴄɪᴏɴᴇs ᴇɴ ᴇsᴛᴀ ʟɪsᴛᴀ',
          `┊ 🎯 ᴍᴏᴠɪᴍɪᴇɴᴛᴏ : ${MOVES[mon.types[0]] || 'Placaje 💥'}`
        ].join('\n')
      )
    }
  },
  {
    name: 'atrapar',
    alias: ['catch', 'capturar'],
    category: 'pokemon',
    desc: 'Atrapa un Pokémon salvaje',
    usage: '.atrapar',
    limit: 2,
    async run(m, ctx) {
      const u = m.user
      u.pokemon = u.pokemon || { party: [], box: [], potions: 0 }
      u.inventory = u.inventory || {}
      const usesBall = (u.inventory.pokeball || 0) > 0
      u.cooldowns = u.cooldowns || {}
      const left = CATCH_COOLDOWN - (Date.now() - (u.cooldowns.catch || 0))
      if (left > 0 && !usesBall) {
        const mins = Math.ceil(left / 60000)
        return m.reply(
          `😴 ʟᴏs ᴘᴏᴋéᴍᴏɴ ᴇsᴛᴀ́ɴ ᴅᴜʀᴍɪᴇɴᴅᴏ… ᴠᴜᴇʟᴠᴇ ᴇɴ ${mins} ᴍɪɴ.\n┊ 💡 ᴜsᴀ ᴜɴᴀ 🔴 ᴘᴏᴋéʙᴀʟʟ (${ctx.prefix}sʜᴏᴘ) ᴘᴀʀᴀ ᴀᴛʀᴀᴘᴀʀ ʏᴀ ᴍɪsᴍᴏ`
        )
      }
      const avgLevel = u.pokemon.party.length ? Math.round(u.pokemon.party.reduce((a, p) => a + p.level, 0) / u.pokemon.party.length) : 5
      const wild = wildOf(avgLevel, Math.min(520, 300 + avgLevel * 10))
      const base = byId(wild.id)
      const chance = Math.min(0.92, Math.max(0.18, 0.95 - base.bst / 700 + (usesBall ? 0.15 : 0)))
      const roll = Math.random()
      if (usesBall) u.inventory.pokeball--
      else u.cooldowns.catch = Date.now()

      if (roll > chance) {
        db.markDirty()
        return m.reply(
          [
            `🎯 ᴀᴘᴀʀᴇᴄɪó ᴜɴ *${wild.name}* ${typeEmojis(wild.types)} ɴɪᴠᴇʟ ${wild.level}…`,
            `💨 ¡ᴘᴇʀᴏ ᴇsᴄᴀᴘó! (ᴄᴀɴᴄᴇ ʀᴇᴀʟ ${(chance * 100).toFixed(0)}% ᴄᴏɴ ᴛᴜ ᴘᴏᴋéʙᴀʟʟ)`,
            `ᴠᴜᴇʟᴠᴇ ᴀ ɪɴᴛᴇɴᴛᴀʀʟᴏ ᴇɴ ᴜɴᴏs ᴍɪɴᴜᴛᴏs.`
          ].join('\n')
        )
      }

      const caught = { id: base.id, name: base.name, types: base.types, level: wild.level, xp: 0, hp: 0, caughtAt: Date.now(), from: m.pushName }
      caught.hp = statsOf(caught).maxHp
      let where = 'box'
      if (u.pokemon.party.length < MAX_PARTY) {
        u.pokemon.party.push(caught)
        where = 'party'
      } else {
        u.pokemon.box.push(caught)
      }
      u.coins += 80
      db.markDirty()
      return m.reply(
        [
          `🎉 ¡ᴀᴛʀᴀᴘᴀsᴛᴇ ᴜɴ *${caught.name}*! ${typeEmojis(caught.types)}`,
          `┊ ɴɪᴠᴇʟ : ${caught.level}`,
          `┊ ᴛɪᴘᴏs : ${typesLabel(caught.types)}`,
          `┊ ɢᴜᴀʀᴅᴀᴅᴏ ᴇɴ : ${where === 'party' ? 'ᴛᴜ ᴇǫᴜɪᴘᴏ (equipo)' : 'ʟᴀ ᴄᴀᴊᴀ (box)'}`,
          `┊ 🪙 +80 ${CUR} ᴘᴏʀ ʟᴀ ᴄᴀᴘᴛᴜʀᴀ`,
          `┊ ᴜsᴀ ${ctx.prefix}ᴇǫᴜɪᴘᴏ ᴘᴀʀᴀ ᴠᴇʀʟᴏ`
        ].join('\n')
      )
    }
  },
  {
    name: 'equipo',
    alias: ['party', 'misequipo'],
    category: 'pokemon',
    desc: 'Muestra tu equipo Pokémon',
    usage: '.equipo',
    limit: false,
    async run(m) {
      const party = partyOf(m.user)
      if (!party.length) return m.reply(`🐾 ᴛᴏᴅᴀᴠíᴀ ɴᴏ ᴛɪᴇɴᴇs ᴘᴏᴋéᴍᴏɴ.\nᴜsᴀ ${m.ctx.prefix}ᴀᴛʀᴀᴘᴀʀ ᴘᴀʀᴀ ᴄᴏɴsᴇɢᴜɪʀ ᴛᴜ ᴘʀɪᴍᴇʀᴏ 😉`)
      return m.reply(
        [
          `╭───「 ᴛᴜ ᴇǫᴜɪᴘᴏ (${party.length}/${MAX_PARTY}) 」`,
          ...party.map(
            (p, i) =>
              `│ ${i + 1}. ${typeEmojis(p.types)} *${p.name}* · ɴᴠ ${p.level}\n│    ${hpBar(p.hp, p.maxHp)} ${p.hp}/${p.maxHp} ʜᴘ`
          ),
          `│`,
          `│ ⚔️ ${m.ctx.prefix}ᴘᴇʟᴇᴀʀ · ❤️ ${m.ctx.prefix}ᴘᴄᴄᴜʀᴀʀ · 📦 ${m.ctx.prefix}ʙᴏx`,
          `╰───「 ${m.ctx.botName} 」`
        ].join('\n')
      )
    }
  },
  {
    name: 'box',
    alias: ['caja', 'pcbox'],
    category: 'pokemon',
    desc: 'Muestra los Pokémon guardados en la caja',
    usage: '.box',
    limit: false,
    async run(m) {
      const box = m.user.pokemon.box || []
      if (!box.length) return m.reply('📦 ᴛᴜ ᴄᴀᴊᴀ ᴇsᴛá ᴠᴀᴄíᴀ.')
      return m.reply(
        [`📦 *ᴄᴀᴊᴀ* (${box.length})`, ...box.map((p, i) => `┊ ${i + 1}. ${typeEmojis(p.types)} ${p.name} · ɴᴠ ${p.level}`)].join('\n')
      )
    }
  },
  {
    name: 'pcinfo',
    alias: ['pokemoninfo', 'pinfo'],
    category: 'pokemon',
    desc: 'Detalles de un Pokémon tuyo (equipo o caja)',
    usage: '.pcinfo 1',
    limit: false,
    async run(m, ctx) {
      const all = [...partyOf(m.user), ...(m.user.pokemon.box || [])]
      if (!all.length) return m.reply('🐾 ɴᴏ ᴛɪᴇɴᴇs ᴘᴏᴋéᴍᴏɴ ᴛᴏᴅᴀᴠíᴀ.')
      const index = parseInt(m.arg || '1', 10) - 1
      const mon = all[index]
      if (!mon) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴘᴄɪɴꜰᴏ <1-${all.length}>`)
      const base = byId(mon.id)
      const s = statsOf(mon)
      return m.reply(
        [
          `#${String(base.id).padStart(3, '0')} ${typeEmojis(mon.types)} *${mon.name}* ɴᴠ ${mon.level}`,
          `┊ ᴛɪᴘᴏs : ${typesLabel(mon.types)}`,
          `┊ ❤️ ${mon.hp ?? s.maxHp}/${s.maxHp} ${hpBar(mon.hp ?? s.maxHp, s.maxHp)}`,
          `┊ ⚔️ ${s.atk} · 🛡️ ${s.def} · 💨 ${s.spe}`,
          `┊ ✨ xᴘ : ${mon.xp || 0}/${mon.level * 60}`,
          `┊ 🎯 ${MOVES[mon.types[0]] || 'Placaje 💥'}`,
          base.evoTo ? `┊ 🔄 ᴇᴠᴏʟᴜᴄɪᴏɴᴀ ᴀ ʟᴠ ${base.evoLevel} → ${byId(base.evoTo)?.name}` : '',
          `┊ 📅 ᴀᴛʀᴀᴘᴀᴅᴏ : ${mon.caughtAt ? new Date(mon.caughtAt).toLocaleDateString('es-ES') : '—'}`
        ]
          .filter(Boolean)
          .join('\n')
      )
    }
  },
  {
    name: 'pelear',
    alias: ['batalla', 'battle'],
    category: 'pokemon',
    desc: 'Pelea contra un Pokémon salvaje',
    usage: '.pelear',
    limit: 2,
    async run(m, ctx) {
      const u = m.user
      const party = partyOf(u)
      if (!party.length) return m.reply(`🐾 ɴᴇᴄᴇsɪᴛᴀs ᴀʟ ᴍᴇɴᴏs ᴜɴ ᴘᴏᴋéᴍᴏɴ. ᴜsᴀ ${ctx.prefix}ᴀᴛʀᴀᴘᴀʀ`)
      const mine = party.find((p) => (p.hp ?? p.maxHp) > 0)
      if (!mine) return m.reply(`😵 ᴛᴏᴅᴏ ᴛᴜ ᴇǫᴜɪᴘᴏ ᴇsᴛá ᴋ.ᴏ. ᴜsᴀ ${ctx.prefix}ᴘᴄᴄᴜʀᴀʀ`)
      const avgLevel = Math.round(party.reduce((a, p) => a + p.level, 0) / party.length)
      const wild = wildOf(avgLevel, Math.min(540, 320 + avgLevel * 10))
      await m.reply(`⚔️ ¡ᴜɴ *${wild.name}* ${typeEmojis(wild.types)} ɴɪᴠᴇʟ ${wild.level} ǫᴜɪᴇʀᴇ ᴘᴇʟᴇᴀʀ!`)
      await m.wait(700)

      let php = mine.hp ?? mine.maxHp
      let whp = wild.maxHp
      const log = []
      let rounds = 0
      while (php > 0 && whp > 0 && rounds < 30) {
        rounds++
        const pType = mine.types[0]
        const pEff = effectiveness(pType, wild.types)
        const pDmg = Math.max(1, Math.round((mine.atk * (1 + mine.level / 20) - wild.def * 0.5) * pEff) + randomInt(0, 4))
        whp -= pDmg
        if (log.length < 5) log.push(`🗡️ ${mine.name} ᴜsᴀ ${MOVES[pType] || 'Placaje'} → ${pDmg} ᴅᴀñᴏ${pEff > 1 ? ' (¡sᴜᴘᴇʀ ᴇꜰᴇᴄᴛɪᴠᴏ!)' : pEff < 1 ? ' (ᴘᴏᴄᴏ ᴇꜰᴇᴄᴛɪᴠᴏ)' : ''}`)
        if (whp <= 0) break
        const wEff = effectiveness(wild.types[0], mine.types)
        const wDmg = Math.max(1, Math.round((wild.atk * (1 + wild.level / 20) - mine.def * 0.5) * wEff) + randomInt(0, 4))
        php -= wDmg
        if (log.length < 5) log.push(`💥 ${wild.name} ᴀᴛᴀᴄᴀ → ${wDmg} ᴅᴀñᴏ`)
      }

      const partyIndex = u.pokemon.party.findIndex((p) => p.id === mine.id && p.level === mine.level)
      const stored = u.pokemon.party[partyIndex >= 0 ? partyIndex : 0]
      stored.hp = Math.max(0, php)

      if (whp <= 0) {
        const xpGain = Math.round(wild.bst / 4 + wild.level * 4)
        const coinGain = Math.round(30 + wild.bst / 1.6 + randomInt(0, 40))
        const ups = gainXp(stored, xpGain)
        u.coins += coinGain
        db.markDirty()
        return m.reply(
          [
            `🏆 *¡ᴠɪᴄᴛᴏʀɪᴀ!* ${mine.name} ᴠᴇɴᴄɪᴏ́ ᴀ ${wild.name}`,
            '',
            ...log,
            '',
            `┊ ✨ +${xpGain} xᴘ${ups ? ` · 🎉 ¡sᴜʙɪᴏ́ ᴀʟ ɴɪᴠᴇʟ ${stored.level}!` : ''}`,
            `┊ 🪙 +${coinGain} ${CUR}`,
            `┊ ❤️ ${mine.name} : ${Math.max(0, php)}/${mine.maxHp} ${hpBar(Math.max(0, php), mine.maxHp)}`
          ].join('\n')
        )
      }

      db.markDirty()
      return m.reply(
        [
          `💀 *${mine.name}* ᴘᴇʀᴅɪᴏ ᴄᴏɴᴛʀᴀ *${wild.name}*`,
          '',
          ...log,
          '',
          `┊ ᴜsᴀ ${ctx.prefix}ᴘᴄᴄᴜʀᴀʀ ᴘᴀʀᴀ ᴄᴜʀᴀʀ ᴀ ᴛᴜ ᴇǫᴜɪᴘᴏ`
        ].join('\n')
      )
    }
  },
  {
    name: 'pccurar',
    alias: ['pcheal', 'curar-pokemon'],
    category: 'pokemon',
    desc: 'Cura a todo tu equipo con una poción',
    usage: '.pccurar',
    limit: false,
    async run(m, ctx) {
      const u = m.user
      u.inventory = u.inventory || {}
      const party = u.pokemon.party || []
      if (!party.length) return m.reply('🐾 ɴᴏ ᴛɪᴇɴᴇs ᴘᴏᴋéᴍᴏɴ.')
      if ((u.inventory.pocion || 0) <= 0 && (u.inventory.superpocion || 0) <= 0) {
        return m.reply(`🧪 ɴᴇᴄᴇsɪᴛᴀs ᴜɴᴀ ᴘᴏᴄɪóɴ.\nᴜsᴀ ${ctx.prefix}ʙᴜʏ ᴘᴏᴄɪᴏɴ (250 ${CUR})`)
      }
      const superPotion = (u.inventory.superpocion || 0) > 0
      if (superPotion) u.inventory.superpocion--
      else u.inventory.pocion--
      for (const mon of party) {
        const s = statsOf(mon)
        mon.hp = superPotion ? s.maxHp : Math.min(s.maxHp, (mon.hp || 0) + 50)
      }
      db.markDirty()
      return m.reply(`❤️ ᴛᴜ ᴇǫᴜɪᴘᴏ ꜰᴜᴇ ᴄᴜʀᴀᴅᴏ ᴄᴏɴ ${superPotion ? '⚗️ súᴘᴇʀ ᴘᴏᴄɪóɴ' : '🧪 ᴘᴏᴄɪóɴ'}`)
    }
  },
  {
    name: 'liberar',
    alias: ['release', 'soltar'],
    category: 'pokemon',
    desc: 'Libera un Pokémon de tu equipo',
    usage: '.liberar 2',
    limit: false,
    async run(m, ctx) {
      const party = m.user.pokemon.party || []
      const index = parseInt(m.arg || '', 10) - 1
      if (Number.isNaN(index) || !party[index]) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ʟɪʙᴇʀᴀʀ <1-${party.length || 1}> (ᴠᴇʀ ${ctx.prefix}ᴇǫᴜɪᴘᴏ)`)
      const [gone] = party.splice(index, 1)
      m.user.pokemon.box.push(gone)
      db.markDirty()
      return m.reply(`👋 *${gone.name}* ꜰᴜᴇ ᴍᴏᴠɪᴅᴏ ᴀ ʟᴀ ᴄᴀᴊᴀ (📦 ${ctx.prefix}ʙᴏx)`)
    }
  },
  {
    name: 'pokehelp',
    alias: ['pokemonhelp', 'ayudapokemon'],
    category: 'pokemon',
    desc: 'Cómo funciona el sistema Pokémon',
    usage: '.pokehelp',
    limit: false,
    async run(m, ctx) {
      const p = ctx.prefix
      const lineas = [
        `🔎 ${p}ᴘᴏᴋᴇᴅᴇx`,
        `🎯 ${p}ᴀᴛʀᴀᴘᴀʀ — ʙᴜsᴄᴀ ᴜɴᴏ sᴀʟᴠᴀᴊᴇ (ᴄᴅ 15 ᴍɪɴ, ɢʀᴀᴛɪs ᴄᴏɴ 🔴 ᴘᴏᴋéʙᴀʟʟ)`,
        `🐾 ${p}ᴇǫᴜɪᴘᴏ — ᴛᴜ ᴇǫᴜɪᴘᴏ (ᴍáx ${MAX_PARTY})`,
        `📦 ${p}ʙᴏx — ᴘᴏᴋéᴍᴏɴ ɢᴜᴀʀᴅᴀᴅᴏs`,
        `📋 ${p}ᴘᴄɪɴꜰᴏ`,
        `⚔️ ${p}ᴘᴇʟᴇᴀʀ — ᴘᴇʟᴇᴀ ᴄᴏɴᴛʀᴀ ᴜɴ sᴀʟᴠᴀᴊᴇ`,
        `❤️ ${p}ᴘᴄᴄᴜʀᴀʀ — ᴄᴜʀᴀ ᴛᴜ ᴇǫᴜɪᴘᴏ (ɴᴇᴄᴇsɪᴛᴀ ᴘᴏᴄɪóɴ)`,
        `👋 ${p}ʟɪʙᴇʀᴀʀ`,
        `🏆 ${p}ᴘᴄᴛᴏᴘ — ʀᴀɴᴋɪɴɢ ᴅᴇ ᴇɴᴛʀᴇɴᴀᴅᴏʀᴇs`,
        `💡 ɪɴᴄʟᴜʏᴇ ᴛᴀʙʟᴀs ᴅᴇ ᴛɪᴘᴏs, ɴɪᴠᴇʟᴇs ʏ ᴇᴠᴏʟᴜᴄɪᴏɴᴇs`
      ]
      return m.reply([ctx.menu.menuBlock('ᴘᴏᴋᴇᴍᴏɴ', lineas), '', ctx.config.bot.footer].join('\n'))
    }
  },
  {
    name: 'pctop',
    alias: ['toppokemon', 'pokemontop'],
    category: 'pokemon',
    desc: 'Ranking: quién tiene más Pokémon',
    usage: '.pctop',
    limit: false,
    async run(m) {
      const list = db.top('pokemon', 10)
      return m.reply(
        [
          `🏆 *ᴛᴏᴘ ᴘᴏᴋéᴍᴏɴ*`,
          ...list.map((u, i) => `┊ ${['🥇', '🥈', '🥉'][i] || `#${i + 1}`} ${u.name || u.number} — ${u.pokemon.party.length} ᴇɴ ᴇǫᴜɪᴘᴏ · ${u.pokemon.box.length} ᴇɴ ᴄᴀᴊᴀ`)
        ].join('\n')
      )
    }
  },
  {
    name: 'pokealeatorio',
    alias: ['pokemonrandom', 'randompoke'],
    category: 'pokemon',
    desc: 'Muestra un Pokémon aleatorio de la Pokédex',
    usage: '.pokealeatorio',
    limit: false,
    async run(m) {
      const mon = pick(POKEDEX)
      return m.reply(
        `🎲 #${String(mon.id).padStart(3, '0')} ${typeEmojis(mon.types)} *${mon.name}*\n┊ ${typesLabel(mon.types)}\n┊ ❤️ ${mon.hp} · ⚔️ ${mon.atk} · 🛡️ ${mon.def} · 💨 ${mon.spe}\n┊ ᴛᴏᴛᴀʟ : ${mon.bst}${mon.legendary ? ' 👑' : ''}`
      )
    }
  }
]
