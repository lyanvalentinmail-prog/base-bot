/**
 *  src/core/menu.js — menús del bot
 *
 *  Formato (el del dueño):
 *
 *    ୨୧ ❏ *ᴄᴀᴛᴇɢᴏʀɪᴀ*
 *    ┊ ✿ .ᴄᴏᴍᴀɴᴅᴏ
 *    ┊ ✿ .ᴄᴏᴍᴀɴᴅᴏ
 *    ୨୧
 *
 *  Los comandos van SIEMPRE en limpio, sin parámetros ni ejemplos.
 */
import config from '../../config.js'
import { smallCaps, smallToAscii, formatNumber, clockString } from './utils.js'
import { formatLimit, roleLabel } from './roles.js'


/** Nombres alternativos para pedir una categoría: .menu juegos ≡ .menu games */
export const CATEGORY_ALIASES = {
  menu: ['menu', 'menú', 'menus', 'menús', 'ayuda', 'help'],
  info: ['info', 'informacion', 'información', 'datos'],
  owner: ['owner', 'dueño', 'dueno', 'dueños', 'propietario'],
  panel: ['panel', 'admin', 'administracion', 'administración'],
  group: ['group', 'grupo', 'grupos'],
  tools: ['tools', 'tool', 'herramientas', 'utilidades', 'utilidad'],
  search: ['search', 'busqueda', 'búsqueda', 'buscador', 'buscar'],
  ai: ['ai', 'ia', 'inteligencia', 'gpt'],
  downloads: ['downloads', 'descargas', 'descarga', 'downloader'],
  stickers: ['stickers', 'sticker', 'figuritas', 'calcomanias', 'calcomanías'],
  image: ['image', 'imagen', 'imagenes', 'imágenes', 'fotos', 'foto'],
  audio: ['audio', 'audios', 'voz', 'sonido'],
  anime: ['anime', 'animes', 'manga', 'otaku'],
  fun: ['fun', 'diversion', 'diversión', 'humor'],
  games: ['games', 'juegos', 'juego', 'game'],
  economy: ['economy', 'economia', 'economía', 'dinero', 'monedas', 'eco'],
  rpg: ['rpg', 'aventura', 'aventuras', 'roleplay'],
  pokemon: ['pokemon', 'pokémon', 'poke', 'pokémones']
}

const normalizeCat = (t = '') =>
  smallToAscii(String(t))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

/** Devuelve el id de categoría a partir de lo que escribió el usuario, o null */
export function resolveCategory(query) {
  const q = normalizeCat(query)
  if (!q) return null
  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (key === q || aliases.some((a) => normalizeCat(a) === q)) return key
  }
  return MENU_CATEGORIES.find((k) => k.startsWith(q) || normalizeCat(CATEGORY_LABELS[k]) === q) || null
}

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

/**
 * Bloque de menú con el formato del dueño (compacto, sin líneas en blanco):
 *
 *   ୨୧ ❏ *ᴛɪᴛᴜʟᴏ*
 *   ┊ ✿ línea
 *   ┊ ✿ línea
 *   ୨୧
 */
export function menuBlock(title, lines = [], { max = 0, more = 'ᴍás ᴄᴏᴍᴀɴᴅᴏs' } = {}) {
  const out = [`୨୧ ❏ *${title}*`]
  const shown = max > 0 ? lines.slice(0, max) : lines
  for (const line of shown) out.push(`┊ ✿ ${line}`)
  if (max > 0 && lines.length > max) out.push(`┊ ✿ … ʏ ${lines.length - max} ${more}`)
  out.push('୨୧')
  return out.join('\n')
}

/**
 * Pista de argumentos para el menú, sacada de `plugin.usage`:
 *   usage: '.tts Hola a todos'  →  ' ʜᴏʟᴀ ᴀ ᴛᴏᴅᴏs'
 *   usage: '.menu [categoría]'  →  ' [ᴄᴀᴛᴇɢᴏʀíᴀ]'
 */
export function argHint(plugin) {
  const first = String(plugin.usage || '').split('·')[0].trim()
  if (!first) return ''
  const after = first.replace(/^[.!/]?\S+/, '').trim() // quita el ".comando"
  if (!after) return ''
  const clean = smallCaps(after)
  return ` ${clean.length > 42 ? `${clean.slice(0, 41)}…` : clean}`
}

/**
 * Línea lista para el menú: ".ᴍᴇɴᴜ  Ⓛ"
 *
 * El menú muestra el comando PURO (sin parámetros, rangos ni ejemplos).
 * `argHint()` sigue disponible por si algún día se quiere mostrar el uso
 * en otro sitio: `commandLine(plugin, prefix, { hint: true })`.
 */
export function commandLine(plugin, prefix, { hint = false } = {}) {
  const marks = commandMarks(plugin)
  const args = hint ? argHint(plugin) : ''
  return `${prefix}${smallCaps(plugin.name)}${args}${marks ? `  ${marks}` : ''}`
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
    `┊ ✿ ${prefix}ʀᴏʟᴇs`,
    `┊ ✿ ${prefix}ᴄᴀᴛᴇɢᴏʀíᴀꜱ`,
    `┊ ✿ ${prefix}ᴘɪɴɢ`,
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

/** Menú de una categoría:  .menu tools */
export function categoryMenu({ ctx, category }) {
  const id = resolveCategory(category)
  if (!id) return null
  const plugins = ctx.pluginList.filter((p) => p.category === id && !p.hidden)
  if (!plugins.length) return null
  const lines = plugins.map((p) => commandLine(p, ctx.prefix))
  return [menuBlock(CATEGORY_LABELS[id], lines), '', config.bot.footer].join('\n')
}

/**
 * allmenu — TODO en un solo mensaje.
 * Devuelve un array (normalmente con 1 elemento); solo se parte si superara el
 * límite de WhatsApp (~65 000 caracteres) para no perder el mensaje.
 */
export function allMenu({ ctx }) {
  const total = ctx.pluginList.filter((p) => !p.hidden).length
  const blocks = []
  for (const cat of MENU_CATEGORIES) {
    const plugins = ctx.pluginList.filter((p) => p.category === cat && !p.hidden)
    if (!plugins.length) continue
    blocks.push(menuBlock(CATEGORY_LABELS[cat] || smallCaps(cat), plugins.map((p) => commandLine(p, ctx.prefix))))
  }

  const header = menuBlock('ᴀʟʟᴍᴇɴᴜ', [
    `${total} ᴄᴏᴍᴀɴᴅᴏs · ${blocks.length} ᴄᴀᴛᴇɢᴏʀíᴀs`
  ])

  const MAX = 60000
  const parts = []
  let current = header
  for (const block of blocks) {
    const candidate = `${current}\n${block}`
    if (candidate.length + 30 > MAX && current !== header) {
      parts.push(current)
      current = block
    } else {
      current = candidate
    }
  }
  current = `${current}\n\n${config.bot.footer}`
  parts.push(current)
  return parts
}

/** Lista de roles y límites (formato de menú) */
export function rolesMenu({ ctx, role }) {
  const lines = [
    `ᴛᴜ ʀᴏʟ : ${roleLabel(role)}`,
    ...Object.entries(config.roles).map(
      ([, r]) => `${r.label} — ${r.limit === Infinity ? '∞' : r.limit} ᴘᴏʀ ᴅɪ́ᴀ`
    ),
    'ʟᴏs ʟɪᴍɪᴛᴇs sᴇ ʀᴇɴᴜᴇᴠᴀɴ ᴀ ʟᴀs 00:00'
  ]
  return [menuBlock('ʀᴏʟᴇs', lines), '', config.bot.footer].join('\n')
}
