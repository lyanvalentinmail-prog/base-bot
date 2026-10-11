/**
 *  src/core/menu.js — menús del bot (plantilla del dueño + por categoría + allmenu)
 */
import config from '../../config.js'
import { smallCaps, formatNumber, clockString } from './utils.js'
import { formatLimit, roleLabel } from './roles.js'

/** Orden exacto de las categorías del menú */
export const MENU_CATEGORIES = [
  'menu', 'info', 'owner', 'panel', 'group', 'tools', 'search', 'ai',
  'downloads', 'stickers', 'image', 'audio', 'anime', 'fun', 'games',
  'economy', 'rpg', 'pokemon'
]

export const CATEGORY_LABELS = {
  menu: 'ᴍᴇɴᴜ',
  info: 'ɪɴғᴏ',
  owner: 'ᴏᴡɴᴇʀ',
  panel: 'ᴘᴀɴᴇʟ',
  group: 'ɢʀᴏᴜᴘ',
  tools: 'ᴛᴏᴏʟs',
  search: 'sᴇᴀʀᴄʜ',
  ai: 'ᴀɪ',
  downloads: 'ᴅᴏᴡɴʟᴏᴀᴅs',
  stickers: 'sᴛɪᴄᴋᴇʀs',
  image: 'ɪᴍᴀɢᴇ',
  audio: 'ᴀᴜᴅɪᴏ',
  anime: 'ᴀɴɪᴍᴇ',
  fun: 'ғᴜɴ',
  games: 'ɢᴀᴍᴇs',
  economy: 'ᴇᴄᴏɴᴏᴍʏ',
  rpg: 'ʀᴘɢ',
  pokemon: 'ᴘᴏᴋᴇᴍᴏɴ'
}

export function categoryLabel(id = '') {
  if (CATEGORY_LABELS[id]) return CATEGORY_LABELS[id]
  const found = Object.keys(CATEGORY_LABELS).find((k) => k.startsWith(String(id).toLowerCase()))
  return found ? CATEGORY_LABELS[found] : smallCaps(id)
}

/** Marcas de un comando: Ⓟ Ⓛ Ⓞ Ⓐ Ⓖ */
export function commandMarks(plugin) {
  const marks = []
  if (plugin.owner) marks.push('Ⓞ')
  if (plugin.premium) marks.push('Ⓟ')
  if (plugin.admin) marks.push('Ⓐ')
  if (plugin.group) marks.push('Ⓖ')
  if (plugin.limit !== false && plugin.limit > 0) marks.push('Ⓛ')
  return marks.join(' ')
}

/** Firma de la tarjeta de menú */
function header(ctx, title) {
  return [
    `╭───「 ${title} 」`,
    `│`
  ].join('\n')
}

/** Menú principal — plantilla original del dueño */
export function mainMenu({ ctx, user, role, ping }) {
  const prefix = ctx.prefix
  const limit = formatLimit(ctx.remainingLimit(user, role))
  const uptime = clockString(Date.now() - ctx.startTime)
  const categories = ctx.visibleCategories()

  const lines = [
    `ʜᴏʟᴀ, sᴏʏ ${ctx.botName},`,
    ``,
    `ɢʀᴀᴄɪᴀs ᴘᴏʀ ɪɴᴠɪᴛᴀʀᴍᴇ ᴀʟ ɢʀᴜᴘᴏ — sᴇʟᴇᴄᴄɪᴏɴᴀ ᴇʟ ᴍᴇɴᴜ́ ǫᴜᴇ ɴᴇᴄᴇsɪᴛᴇs ᴀʙᴀᴊᴏ.`,
    ``,
    `୨୧ ESTADÍSTICAS ୨୧`,
    ``,
    `୨୧ ᴜꜱᴇʀ ɪɴꜰᴏ`,
    `┊ ʀᴏʟ : ${roleLabel(role)}`,
    `┊ ʟɪᴍɪᴛ : ${limit}`,
    `┊ XP : ${formatNumber(user?.xp || 0)}`,
    `୨୧`,
    ``,
    `୨୧ ɪɴғᴏʀᴍᴀᴄɪᴏɴ ᴅᴇʟ ʙᴏᴛ`,
    `┊ Ⓟ = ᴘʀᴇᴍɪᴜᴍ`,
    `┊ Ⓛ = ʟɪᴍɪᴛ`,
    `┊ Ⓞ = ᴏᴡɴᴇʀ`,
    `┊ Ⓐ = ᴀᴅᴍɪɴ`,
    `┊ Ⓖ = sᴏʟᴏ ɢʀᴜᴘᴏ`,
    `୨୧`,
    ``,
    `୨୧ ❏ *ᴍᴇɴᴜ*`,
    `┊ ✿ ${prefix}ᴍᴇɴᴜ`,
    `┊ ✿ ${prefix}ᴀʟʟᴍᴇɴᴜ`,
    `┊ ✿ ${prefix}ᴍᴇɴᴜ <ᴄᴀᴛᴇɢᴏʀɪᴀ>`,
    `┊ ✿ ${prefix}ᴘɪɴɢ`,
    `┊ ✿ ${prefix}ʀᴏʟᴇs`,
    `୨୧`,
    ``
  ]

  for (const cat of MENU_CATEGORIES) {
    if (!categories.includes(cat)) continue
    lines.push(`❏ ${CATEGORY_LABELS[cat] || smallCaps(cat)}`)
  }

  lines.push(``)
  lines.push(`⌬ ᴘɪɴɢ : ${ping ?? '—'} ms`)
  lines.push(`⌬ ᴜᴘᴛɪᴍᴇ : ${uptime}`)
  lines.push(`⌬ ᴄᴏᴍᴀɴᴅᴏs : ${ctx.pluginList.filter((p) => !p.hidden).length}`)
  lines.push(``)
  lines.push(config.bot.footer)
  return lines.join('\n')
}

/** Menú de una categoría concreta */
export function categoryMenu({ ctx, category }) {
  const id = Object.keys(CATEGORY_LABELS).find((k) => k === String(category).toLowerCase() || k.startsWith(String(category).toLowerCase()))
  if (!id) return null
  const plugins = ctx.pluginList.filter((p) => p.category === id && !p.hidden)
  if (!plugins.length) return null

  const out = [
    header(ctx, CATEGORY_LABELS[id]),
    `│ ⌬ ${plugins.length} ᴄᴏᴍᴀɴᴅᴏs`,
    `│`
  ]
  for (const p of plugins) {
    const marks = commandMarks(p)
    const names = [p.name, ...(p.alias || [])].slice(0, 3).map((n) => `${ctx.prefix}${n}`).join(' · ')
    out.push(`│ ✿ ${names}${marks ? `  ${marks}` : ''}`)
    if (p.desc) out.push(`│    ${smallCaps(p.desc).slice(0, 60)}`)
  }
  out.push(`│`)
  out.push(`│ ⌬ ᴜsᴀ ${ctx.prefix}ᴍᴇɴᴜ ᴘᴀʀᴀ ᴠᴏʟᴠᴇʀ`)
  out.push(`╰───「 ${ctx.botName} 」`)
  return out.join('\n')
}

/** allmenu — todo de una vez (troceado para WhatsApp) */
export function allMenu({ ctx }) {
  const parts = []
  let current = `╭───「 ᴀʟʟᴍᴇɴᴜ 」\n│ ${ctx.botName} — ${ctx.pluginList.filter((p) => !p.hidden).length} ᴄᴏᴍᴀɴᴅᴏs\n│\n`
  for (const cat of MENU_CATEGORIES) {
    const plugins = ctx.pluginList.filter((p) => p.category === cat && !p.hidden)
    if (!plugins.length) continue
    let block = `├─ ❏ ${CATEGORY_LABELS[cat] || cat}\n`
    for (const p of plugins) {
      const marks = commandMarks(p)
      block += `│  ✿ ${ctx.prefix}${p.name}${marks ? `  ${marks}` : ''} — ${smallCaps(p.desc || '').slice(0, 48)}\n`
    }
    if ((current + block).length > 3400) {
      parts.push(current)
      current = ''
    }
    current += block
  }
  current += `│\n╰───「 ${config.bot.footer} 」`
  parts.push(current)
  return parts
}

/** Lista de roles y límites (comando .roles) */
export function rolesMenu({ ctx, role }) {
  const rows = Object.entries(config.roles)
    .map(([id, r]) => `┊ ${r.label} — ${r.limit === Infinity ? '∞' : r.limit} ᴘᴏʀ ᴅɪ́ᴀ`)
    .join('\n')
  return [
    `╭───「 ʀᴏʟᴇs 」`,
    `│`,
    `│ ᴛᴜ ʀᴏʟ : ${roleLabel(role)}`,
    `│`,
    rows,
    `│`,
    `│ Ⓛ ʟᴏs ʟɪᴍɪᴛᴇs sᴇ ʀᴇɴᴜᴇᴠᴀɴ ᴄᴀᴅᴀ ᴅɪ́ᴀ ᴀ ʟᴀs 00:00`,
    `╰───「 ${ctx.botName} 」`
  ].join('\n')
}
