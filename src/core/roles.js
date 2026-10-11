/**
 *  src/core/roles.js — roles, límites diarios, XP y niveles
 */
import config from '../../config.js'
import { today, randomInt } from './utils.js'

export const ROLE_ORDER = ['newbie', 'master', 'premium', 'vip', 'admin', 'owner']

export function roleLabel(role = 'newbie') {
  return config.roles[role]?.label || config.roles.newbie.label
}

export function roleLimit(role = 'newbie') {
  const limit = config.roles[role]?.limit
  return limit === undefined ? config.roles.newbie.limit : limit
}

export function roleList() {
  return ROLE_ORDER.map((id) => ({
    id,
    label: roleLabel(id),
    limit: roleLimit(id),
    xpMultiplier: config.roles[id]?.xpMultiplier ?? 1
  }))
}

/**
 * Rol efectivo del usuario:
 *  owner del bot > rol guardado (premium/vip/master) > admin de grupo > newbie
 */
export function resolveRole({ user, isOwner = false, isGroupAdmin = false }) {
  if (isOwner) return 'owner'
  const stored = user?.role
  if (stored && config.roles[stored]) {
    // premium/vip caducados vuelven a master/newbie
    if (stored === 'premium' && user.premiumUntil && user.premiumUntil < Date.now()) return 'master'
    if (stored === 'vip' && user.vipUntil && user.vipUntil < Date.now()) return 'master'
    if (stored === 'admin') return isGroupAdmin ? 'admin' : 'master'
    return stored
  }
  if (isGroupAdmin) return 'admin'
  return 'newbie'
}

/** Reinicia el contador de límite si cambió el día */
export function ensureDailyLimit(user) {
  const t = today()
  if (!user) return false
  if (user.limitDate !== t) {
    user.limitDate = t
    user.limitUsed = 0
    return true
  }
  return false
}

export function usedLimit(user) {
  ensureDailyLimit(user)
  return user?.limitUsed || 0
}

export function remainingLimit(user, role) {
  const max = roleLimit(role)
  if (max === Infinity) return Infinity
  const left = max - usedLimit(user)
  return left < 0 ? 0 : left
}

export function formatLimit(n) {
  return n === Infinity ? '∞' : String(n)
}

export function consumeLimit(user, amount = 1) {
  ensureDailyLimit(user)
  user.limitUsed = (user.limitUsed || 0) + amount
}

/* ── XP y niveles ──────────────────────────────────────────── */
/** XP necesaria para pasar del nivel `level` al siguiente */
export function xpToNext(level = 1) {
  return Math.round(100 * Math.pow(level, 1.35))
}

export function xpTotalForLevel(level = 1) {
  let total = 0
  for (let i = 1; i < level; i++) total += xpToNext(i)
  return total
}

export function levelFromXp(xp = 0) {
  let level = 1
  let acc = 0
  while (acc + xpToNext(level) <= xp && level < 999) {
    acc += xpToNext(level)
    level++
  }
  return level
}

export function xpProgress(user) {
  const level = user.level || 1
  const base = xpTotalForLevel(level)
  const need = xpToNext(level)
  const current = Math.max(0, (user.xp || 0) - base)
  return { level, current, need, percent: Math.min(100, Math.round((current / need) * 100)) }
}

/** Añade XP aplicando el multiplicador del rol y devuelve si subió de nivel */
export function addXp(user, amount, role = 'newbie') {
  const mult = config.roles[role]?.xpMultiplier ?? 1
  const gained = Math.max(1, Math.round(amount * mult))
  const before = user.level || 1
  user.xp = (user.xp || 0) + gained
  user.level = levelFromXp(user.xp)
  if (user.level > before) {
    user.coins = (user.coins || 0) + (config.xp.levelUpReward || 0)
  }
  return { gained, levelUp: user.level > before, level: user.level }
}

export function randomCommandXp() {
  const [min, max] = config.xp.perCommand || [4, 14]
  return randomInt(min, max)
}
