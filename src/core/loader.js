/**
 *  src/core/loader.js — carga los plugins de src/plugins/**
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import log from './logger.js'
import { MENU_CATEGORIES } from './menu.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const PLUGINS_DIR = path.resolve(here, '..', 'plugins')

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.name.endsWith('.js')) out.push(full)
  }
  return out
}

function normalize(plugin, file) {
  const list = Array.isArray(plugin) ? plugin : [plugin]
  return list
    .filter((p) => p && typeof p === 'object' && p.name)
    .map((p) => ({
      ...p,
      category: p.category || 'info',
      alias: p.alias || [],
      desc: p.desc || '',
      usage: p.usage || '',
      limit: p.limit === undefined ? 1 : p.limit,
      file
    }))
}

export async function loadPlugins(ctx, { silent = false } = {}) {
  const plugins = new Map()
  const order = []
  let files = []
  try {
    files = walk(PLUGINS_DIR)
  } catch (e) {
    log.error('No pude leer la carpeta de plugins:', e.message)
    return { plugins, list: [] }
  }

  for (const file of files) {
    try {
      const mod = await import(`${pathToFileURL(file).href}?v=${Date.now()}`)
      const defs = normalize(mod.default || mod.plugin, file)
      if (!defs.length) continue
      for (const def of defs) {
        if (typeof def.run !== 'function' && typeof def.onMessage !== 'function' && typeof def.onParticipants !== 'function') {
          log.warn(`Plugin ${def.name} (${path.basename(file)}) no tiene run()`)
          continue
        }
        if (plugins.has(def.name)) log.warn(`Comando duplicado: ${def.name} (${path.basename(file)})`)
        plugins.set(def.name, def)
        order.push(def)
        for (const alias of def.alias) {
          if (!plugins.has(alias)) plugins.set(alias, { ...def, isAlias: true, name: def.name, alias: def.alias })
        }
      }
    } catch (e) {
      log.error(`Error cargando ${path.relative(process.cwd(), file)}:`, e.message)
    }
  }

  const list = order.sort((a, b) => {
    const ca = MENU_CATEGORIES.indexOf(a.category)
    const cb = MENU_CATEGORIES.indexOf(b.category)
    if (ca !== cb) return ca - cb
    return a.name.localeCompare(b.name)
  })

  ctx.plugins = plugins
  ctx.pluginList = list
  if (!silent) {
    const cats = new Map()
    for (const p of list) cats.set(p.category, (cats.get(p.category) || 0) + 1)
    log.ok(`Plugins cargados: ${list.length} comandos en ${cats.size} categorías`)
  }
  return { plugins, list }
}

export function pluginListByCategory(ctx) {
  const map = new Map()
  for (const p of ctx.pluginList) {
    if (!map.has(p.category)) map.set(p.category, [])
    map.get(p.category).push(p)
  }
  return map
}

export { PLUGINS_DIR }
