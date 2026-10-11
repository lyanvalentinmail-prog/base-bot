/**
 *  src/core/store.js — base de datos en JSON (usuarios, grupos, ajustes, partidas)
 *  · Escritura atómica (tmp + rename) para no corromper el archivo
 *  · Guardado diferido (debounce) + autoguardado periódico + backup diario
 */
import fs from 'node:fs'
import path from 'node:path'
import config from '../../config.js'
import log from './logger.js'
import { today } from './utils.js'

const EMPTY = () => ({
  version: 1,
  settings: {
    prefix: config.bot.prefix,
    botName: config.bot.name,
    extraOwners: [],
    selfMode: config.behavior.selfMode,
    autotype: false,
    autoread: false,
    chatbot: false
  },
  users: {},
  groups: {},
  chats: {},
  bans: [],
  stats: {
    messages: 0,
    commands: 0,
    startups: 0,
    firstStart: Date.now(),
    lastStart: Date.now(),
    usage: {}
  }
})

export function defaultUser(jid) {
  return {
    jid,
    number: String(jid || '').split('@')[0].split(':')[0],
    name: '',
    role: null,
    xp: 0,
    level: 1,
    limitUsed: 0,
    limitDate: today(),
    coins: 0,
    bank: 0,
    warns: 0,
    banned: false,
    premiumUntil: null,
    vipUntil: null,
    afk: null,
    cooldowns: {},
    streak: 0,
    inventory: { pocion: 2, superpocion: 0, pokeball: 0 },
    pokemon: { party: [], box: [], potions: 5 },
    rpg: {
      level: 1,
      xp: 0,
      hp: 100,
      maxHp: 100,
      mp: 30,
      maxMp: 30,
      atk: 12,
      def: 8,
      weapon: null,
      armor: null,
      potions: 3,
      bossKills: 0,
      dungeon: 0
    },
    stats: { commands: 0, messages: 0, wins: 0, losses: 0 },
    createdAt: Date.now(),
    lastSeen: Date.now()
  }
}

export function defaultGroup(jid) {
  return {
    jid,
    name: '',
    settings: {
      welcome: config.group.welcome,
      goodbye: config.group.goodbye,
      antilink: false,
      antidelete: false,
      antispam: false,
      mute: false,
      nsfw: false
    },
    warns: {},
    members: {},
    createdAt: Date.now()
  }
}

class JsonStore {
  constructor(file) {
    this.file = file
    this.data = EMPTY()
    this.dirty = false
    this.timer = null
    this.messages = new Map() // caché para antidelete
  }

  /* ── carga / guardado ─────────────────────────────────────── */
  load() {
    try {
      if (fs.existsSync(this.file)) {
        const raw = JSON.parse(fs.readFileSync(this.file, 'utf8'))
        this.data = { ...EMPTY(), ...raw }
        this.data.settings = { ...EMPTY().settings, ...(raw.settings || {}) }
        this.data.stats = { ...EMPTY().stats, ...(raw.stats || {}) }
        log.ok(`Base de datos cargada (${Object.keys(this.data.users).length} usuarios, ${Object.keys(this.data.groups).length} grupos)`)
      } else {
        this.data.stats.startups = 0
        log.info('Base de datos nueva: se creará en', this.file)
      }
    } catch (e) {
      log.error('No se pudo leer la base de datos, se usa una vacía:', e.message)
      this.data = EMPTY()
    }
    this.data.stats.startups = (this.data.stats.startups || 0) + 1
    this.data.stats.lastStart = Date.now()
    this.markDirty()
    return this.data
  }

  markDirty() {
    this.dirty = true
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.save()
    }, 4000)
    if (this.timer.unref) this.timer.unref()
  }

  save(force = false) {
    if (!this.dirty && !force) return
    try {
      const dir = path.dirname(this.file)
      fs.mkdirSync(dir, { recursive: true })
      const tmp = `${this.file}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2))
      fs.renameSync(tmp, this.file)
      this.dirty = false
      log.debug('Base de datos guardada')
    } catch (e) {
      log.error('Error guardando la base de datos:', e.message)
    }
  }

  saveNow() {
    this.save(true)
  }

  /* ── backups ──────────────────────────────────────────────── */
  backup() {
    try {
      const dir = path.join(path.dirname(this.file), 'backup')
      fs.mkdirSync(dir, { recursive: true })
      const file = path.join(dir, `db-${today()}.json`)
      if (fs.existsSync(file)) return
      fs.copyFileSync(this.file, file)
      log.ok('Backup diario creado en', file)
    } catch (e) {
      log.debug('Backup fallido:', e.message)
    }
  }

  /* ── accesos ──────────────────────────────────────────────── */
  get settings() {
    return this.data.settings
  }

  get stats() {
    return this.data.stats
  }

  user(jid, create = true) {
    if (!jid) return null
    if (!this.data.users[jid] && create) {
      this.data.users[jid] = defaultUser(jid)
      this.markDirty()
    }
    const u = this.data.users[jid]
    if (u) {
      // migración suave de campos nuevos
      const base = defaultUser(jid)
      for (const k of Object.keys(base)) if (u[k] === undefined) u[k] = base[k]
      u.rpg = { ...base.rpg, ...(u.rpg || {}) }
      u.pokemon = { ...base.pokemon, ...(u.pokemon || {}) }
      u.inventory = { ...base.inventory, ...(u.inventory || {}) }
      u.cooldowns = { ...base.cooldowns, ...(u.cooldowns || {}) }
      u.stats = { ...base.stats, ...(u.stats || {}) }
      u.lastSeen = Date.now()
    }
    return u
  }

  updateUser(jid, patch = {}) {
    const u = this.user(jid) || defaultUser(jid)
    Object.assign(u, patch)
    this.data.users[jid] = u
    this.markDirty()
    return u
  }

  /** Suma y guarda en un paso */
  addUser(jid, patchFn) {
    const u = this.user(jid)
    patchFn(u)
    this.markDirty()
    return u
  }

  group(jid, create = true) {
    if (!jid) return null
    if (!this.data.groups[jid] && create) {
      this.data.groups[jid] = defaultGroup(jid)
      this.markDirty()
    }
    const g = this.data.groups[jid]
    if (g) {
      const base = defaultGroup(jid)
      g.settings = { ...base.settings, ...(g.settings || {}) }
      g.warns = g.warns || {}
      g.members = g.members || {}
    }
    return g
  }

  updateGroup(jid, patch = {}) {
    const g = this.group(jid)
    Object.assign(g, patch)
    this.markDirty()
    return g
  }

  chat(jid, create = true) {
    if (!jid) return null
    if (!this.data.chats[jid] && create) {
      this.data.chats[jid] = { jid, game: null, lastCommand: 0 }
      this.markDirty()
    }
    return this.data.chats[jid]
  }

  updateChat(jid, patch = {}) {
    const c = this.chat(jid)
    Object.assign(c, patch)
    this.markDirty()
    return c
  }

  /* ── rankings y consultas ─────────────────────────────────── */
  top(metric = 'coins', limit = 10) {
    const list = Object.values(this.data.users)
    const get = (u) => {
      switch (metric) {
        case 'xp': return u.xp || 0
        case 'level': return u.level || 1
        case 'commands': return u.stats?.commands || 0
        case 'wins': return u.stats?.wins || 0
        case 'rpg': return u.rpg?.level || 1
        case 'pokemon': return u.pokemon?.party?.length || 0
        case 'bank': return u.bank || 0
        case 'total': return (u.coins || 0) + (u.bank || 0)
        default: return u.coins || 0
      }
    }
    return list.sort((a, b) => get(b) - get(a)).slice(0, limit)
  }

  get owners() {
    const list = (config.bot.owners || []).map((n) => String(n).replace(/[^0-9]/g, ''))
    for (const n of this.data.settings.extraOwners || []) list.push(String(n).replace(/[^0-9]/g, ''))
    return [...new Set(list.filter(Boolean))]
  }

  addOwner(number) {
    const n = String(number).replace(/[^0-9]/g, '')
    if (!n || this.owners.includes(n)) return false
    this.data.settings.extraOwners.push(n)
    this.markDirty()
    return true
  }

  removeOwner(number) {
    const n = String(number).replace(/[^0-9]/g, '')
    const before = this.data.settings.extraOwners.length
    this.data.settings.extraOwners = this.data.settings.extraOwners.filter((x) => x !== n)
    this.markDirty()
    return before !== this.data.settings.extraOwners.length
  }

  countCommands(name) {
    this.data.stats.commands = (this.data.stats.commands || 0) + 1
    this.data.stats.usage[name] = (this.data.stats.usage[name] || 0) + 1
    this.markDirty()
  }

  /* ── antidelete ───────────────────────────────────────────── */
  cacheMessage(chat, key, payload) {
    if (!this.messages.has(chat)) this.messages.set(chat, [])
    const list = this.messages.get(chat)
    list.push({ key, payload, at: Date.now() })
    if (list.length > 60) list.shift()
  }

  getCachedMessage(chat, id) {
    const list = this.messages.get(chat)
    if (!list) return null
    const found = [...list].reverse().find((x) => x.key?.id === id)
    return found || null
  }
}

export const db = new JsonStore(config.paths.database)
export default db
