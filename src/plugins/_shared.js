/**
 *  src/plugins/_shared.js — ayudas comunes de los plugins (no es un plugin)
 */
import db from '../core/store.js'
import { bareJid, jidToNumber, normalizePhone, toJid } from '../core/utils.js'

/**
 * Resuelve a quién apunta un comando con mención, cita o número.
 * Devuelve { jid, number, user } o null
 */
export function getTarget(m, argIndex = 0) {
  const mentioned = m.mentions?.[0]
  if (mentioned) return target(bareJid(mentioned))
  if (m.quoted?.sender) return target(bareJid(m.quoted.sender))
  const arg = m.args[argIndex]
  if (arg && /[0-9]/.test(arg)) {
    const digits = normalizePhone(arg.replace('@', ''))
    if (digits.length >= 7) return target(toJid(digits))
  }
  return null
}

function target(jid) {
  return { jid, number: jidToNumber(jid), user: db.user(jid) }
}

/** Todos los owners y admins pueden gestionar usuarios del panel */
export function parseRole(text = '') {
  const t = String(text).toLowerCase()
  const map = {
    newbie: 'newbie', nuevo: 'newbie', free: 'newbie',
    master: 'master', maestro: 'master',
    premium: 'premium', prem: 'premium',
    vip: 'vip',
    admin: 'admin',
    owner: 'owner', dueño: 'owner',
    none: null, quitar: null, borrar: null
  }
  return t in map ? map[t] : undefined
}

export function roleTable() {
  return [
    'ɴᴇᴡʙɪᴇ · ᴍᴀsᴛᴇʀ · ᴘʀᴇᴍɪᴜᴍ · ᴠɪᴘ · ᴀᴅᴍɪɴ · ᴏᴡɴᴇʀ'
  ].join('\n')
}

export const fmt = (n) => Number(n || 0).toLocaleString('es-ES')

export default null
