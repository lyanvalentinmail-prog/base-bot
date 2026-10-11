#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────
 *  BOT BASE — WhatsApp Bot (Baileys · Termux · API SiputZX)
 *  Arranque:   node index.js            → pregunta cómo vincular
 *              node index.js --pair     → código de emparejamiento
 *              node index.js --pair 5215512345678
 *              node index.js --qr       → código QR
 *              node index.js --logout   → borra la sesión y sale
 *              node --test tests/       → pruebas sin WhatsApp
 * ─────────────────────────────────────────────────────────────
 */
import fs from 'node:fs'
import config from './config.js'
import log, { setLogLevel } from './src/core/logger.js'
import db from './src/core/store.js'
import api from './src/core/api.js'
import canvas from './src/core/canvas.js'
import { loadPlugins } from './src/core/loader.js'
import { createHandler } from './src/core/handler.js'
import { bindGroupEvents, sendLevelUp } from './src/core/events.js'
import { startBot, bindStore, deleteSession, sessionExists } from './src/core/connection.js'
import { remainingLimit, formatLimit, roleLabel, ROLE_ORDER, roleList } from './src/core/roles.js'
import * as menu from './src/core/menu.js'
import * as utils from './src/core/utils.js'

const argv = process.argv.slice(2)
const has = (...flags) => flags.some((f) => argv.includes(f))
const valueAfter = (flag) => {
  const i = argv.indexOf(flag)
  return i >= 0 ? argv[i + 1] : undefined
}

if (has('-h', '--help')) {
  console.log(`
  🟢 ${config.bot.name} — bot de WhatsApp

  node index.js                  inicia el bot (pregunta cómo vincular)
  node index.js --pair           vincular con código de emparejamiento
  node index.js --pair 54911...  vincular con ese número
  node index.js --qr             vincular con código QR
  node index.js --logout         borrar la sesión guardada y salir
  node index.js --test           pruebas internas (sin conectar WhatsApp)
  npm start / npm run pair / npm run qr / npm test
`)
  process.exit(0)
}

if (has('--logout')) {
  deleteSession()
  log.ok('Listo: la próxima vez que arranques podrás vincular otro número.')
  process.exit(0)
}

setLogLevel(has('--debug') ? 'debug' : config.logLevel)

/* ── banner ─────────────────────────────────────────────────── */
function banner() {
  const lines = [
    `ʙᴏᴛ      : ${db.settings.botName || config.bot.name}`,
    `ᴘʀᴇғɪᴊᴏ   : ${db.settings.prefix || config.bot.prefix}`,
    `ᴏᴡɴᴇʀs    : ${db.owners.length ? db.owners.map((o) => '+' + o).join(', ') : '(configúralos en config.js)'}`,
    `ᴀᴘɪ      : ${config.api.baseUrl}`,
    `ɴᴏᴅᴇ     : ${process.version} · ${process.platform}/${process.arch}`,
    `sᴇsɪᴏ́ɴ    : ${sessionExists() ? 'guardada ✅' : 'nueva (hay que vincular)'}`
  ]
  log.box(`${config.bot.name} · ʙᴏᴛ ᴅᴇ ᴡʜᴀᴛsᴀᴘᴘ`, lines)
}

/* ── contexto compartido con los plugins ────────────────────── */
const ctx = {
  config,
  utils,
  log,
  api,
  db,
  canvas,
  sock: null,
  startTime: Date.now(),
  plugins: new Map(),
  pluginList: [],
  groupCache: new Map(),
  commandChars: Array.from(new Set([config.bot.prefix, ...(config.behavior.extraPrefixes || [])])),
  get prefix() {
    return db.settings.prefix || config.bot.prefix
  },
  set prefix(v) {
    db.settings.prefix = v
    ctx.commandChars = Array.from(new Set([v, ...(config.behavior.extraPrefixes || [])]))
    db.markDirty()
  },
  get botName() {
    return db.settings.botName || config.bot.name
  },
  get owners() {
    return db.owners
  },
  remainingLimit,
  formatLimit,
  roleLabel,
  roleList,
  menu,
  visibleCategories() {
    const cats = new Set(ctx.pluginList.filter((p) => !p.hidden).map((p) => p.category))
    return menu.MENU_CATEGORIES.filter((c) => cats.has(c))
  },
  buildMenu(m) {
    return menu.mainMenu({ ctx, user: m.user, role: m.role, ping: m.ctx.lastPing })
  },
  buildCategoryMenu(m, category) {
    return menu.categoryMenu({ ctx, category })
  },
  buildAllMenu(m) {
    return menu.allMenu({ ctx })
  },
  buildRolesMenu(m) {
    return menu.rolesMenu({ ctx, role: m.role })
  },
  async reloadPlugins() {
    await loadPlugins(ctx, { silent: true })
  },
  save() {
    db.saveNow()
  },
  restart() {
    db.saveNow()
    log.warn('Reiniciando el bot…')
    setTimeout(() => process.exit(51), 800)
  },
  logout() {
    deleteSession()
    db.saveNow()
    log.warn('Sesión borrada. Reiniciando para vincular de nuevo…')
    setTimeout(() => process.exit(51), 800)
  },
  onLevelUp: (m, level) => sendLevelUp(m, level, ctx)
}

/* ── arranque ───────────────────────────────────────────────── */
async function main() {
  banner()
  db.load()
  bindStore(db)
  db.backup()

  await loadPlugins(ctx)
  await canvas.loadCanvasEngine()

  if (has('--test')) {
    const { runSelfTest } = await import('./tests/selftest.js')
    await runSelfTest(ctx)
    return
  }

  if (config.api.warmup && !has('--no-warmup')) {
    log.api('Despertando la API SiputZX…')
    api.warmup().catch(() => {})
  }

  /* guardado y backups automáticos */
  const saver = setInterval(() => {
    db.save()
    if (new Date().getHours() === 3 && new Date().getMinutes() < 2) db.backup()
  }, 30000)
  saver.unref?.()

  const handler = createHandler(ctx)

  await startBot({
    mode: has('--qr') ? 'qr' : has('--pair') ? 'pairing' : undefined,
    phone: valueAfter('--pair'),
    onSocket(sock) {
      ctx.sock = sock
      ctx.groupCache.clear()
      sock.ev.on('messages.upsert', handler)
      bindGroupEvents(sock, ctx)
      log.wa('Eventos conectados (mensajes, grupos, antidelete, llamadas)')
    },
    async onOpen(sock) {
      try {
        await sock.sendPresenceUpdate('available')
      } catch {
        /* opcional */
      }
    },
    async onClose() {
      ctx.groupCache.clear()
    }
  })
}

/* ── apagado ordenado ───────────────────────────────────────── */
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    log.warn(`Señal ${signal}: guardando y saliendo…`)
    db.saveNow()
    process.exit(0)
  })
}

process.on('unhandledRejection', (reason) => {
  log.error('Promesa rechazada sin manejar:', reason?.message || reason)
  log.debug(reason?.stack)
})

process.on('uncaughtException', (err) => {
  log.error('Excepción no capturada:', err?.message || err)
  log.debug(err?.stack)
  if (/ENOSPC|EACCES/.test(err?.code || '')) process.exit(1)
})

main().catch((e) => {
  log.error('Fallo al iniciar:', e.message)
  log.debug(e.stack)
  process.exit(1)
})

export { ctx }
