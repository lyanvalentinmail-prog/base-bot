/**
 *  src/core/logger.js — logs bonitos y con color para la terminal
 */
import config from '../../config.js'

const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 }
const COLORS = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[97m'
}

let current = LEVELS[config.logLevel] ?? 3

export function setLogLevel(level) {
  if (LEVELS[level] !== undefined) current = LEVELS[level]
}

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function write(color, tag, args) {
  console.log(`${COLORS.gray}${stamp()}${COLORS.reset} ${color}${tag}${COLORS.reset}`, ...args)
}

export const log = {
  raw: (...a) => console.log(...a),
  info: (...a) => current >= 3 && write(COLORS.green, '[INFO]', a),
  warn: (...a) => current >= 2 && write(COLORS.yellow, '[WARN]', a),
  error: (...a) => current >= 1 && write(COLORS.red, '[ERROR]', a),
  debug: (...a) => current >= 4 && write(COLORS.gray, '[DEBUG]', a),
  api: (...a) => current >= 3 && write(COLORS.magenta, '[API]', a),
  wa: (...a) => current >= 3 && write(COLORS.blue, '[WHATSAPP]', a),
  cmd: (...a) => current >= 3 && write(COLORS.cyan, '[CMD]', a),
  ok: (...a) => current >= 3 && write(COLORS.green, '[OK]', a),
  box(title, lines = []) {
    const width = Math.max(title.length + 4, ...lines.map((l) => l.length + 2), 34)
    const top = '╭' + '─'.repeat(width) + '╮'
    const bottom = '╰' + '─'.repeat(width) + '╯'
    console.log(COLORS.green + top + COLORS.reset)
    console.log(COLORS.green + '│ ' + COLORS.white + title.padEnd(width - 1) + COLORS.green + '│' + COLORS.reset)
    if (lines.length) console.log(COLORS.green + '├' + '─'.repeat(width) + '┤' + COLORS.reset)
    for (const line of lines) {
      console.log(COLORS.green + '│ ' + COLORS.reset + line.padEnd(width - 1) + COLORS.green + '│' + COLORS.reset)
    }
    console.log(COLORS.green + bottom + COLORS.reset)
  }
}

export default log
