/**
 *  src/core/connection.js — conexión con WhatsApp (Baileys)
 *  Soporta las DOS formas de vincular:  📱 código de emparejamiento  |  🔳 QR
 */
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
  jidNormalizedUser
} from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import config from '../../config.js'
import log from './logger.js'
import { normalizePhone, sleep } from './utils.js'

let reconnectAttempts = 0
let currentSocket = null
let pairingRequested = false

export const getSocket = () => currentSocket

/* ── terminal ─────────────────────────────────────────────── */
export function ask(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve('')
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, (answer) => {
      rl.close()
      resolve(String(answer || '').trim())
    })
  })
}

async function chooseMode(mode, phone) {
  if (mode !== 'ask') return { mode, phone }
  console.log('')
  log.box('¿CÓMO QUIERES VINCULAR EL BOT?', [
    '1) 📱 Código de emparejamiento (pairing code)',
    '2) 🔳 Código QR',
    ''
  ])
  const answer = (await ask('Elige 1 o 2 (por defecto 1): ')) || '1'
  return { mode: answer.startsWith('2') ? 'qr' : 'pairing', phone }
}

async function resolveMode(cliMode, cliPhone) {
  const modeConfig = config.login.mode || 'ask'
  let mode = cliMode || modeConfig
  let phone = normalizePhone(cliPhone || config.login.phone || '')

  // Un número configurado implica pairing por comodidad
  if (!cliMode && mode === 'ask' && phone) mode = 'pairing'

  const chosen = await chooseMode(mode, phone)
  mode = chosen.mode
  phone = chosen.phone

  if (mode === 'pairing' && !phone) {
    console.log('')
    log.box('NÚMERO DE WHATSAPP', [
      'Escribe el número del bot CON código de país y sin +',
      'Ejemplo: 5215512345678'
    ])
    phone = normalizePhone(await ask('Número: '))
  }

  if (mode === 'pairing') {
    if (config.login.countryCode && phone.length <= 10 && !phone.startsWith(config.login.countryCode)) {
      phone = normalizePhone(config.login.countryCode + phone)
    }
    if (phone.length < 8 || phone.length > 15) {
      log.error('Número inválido. Debe incluir el código de país (8 a 15 dígitos).')
      process.exit(1)
    }
  }

  return { mode, phone }
}

/* ── conexión ─────────────────────────────────────────────── */
export async function startBot(options = {}) {
  const { onSocket, onOpen, onClose, mode: cliMode, phone: cliPhone } = options
  const sessionDir = config.paths.session || config.login.sessionDir
  fs.mkdirSync(sessionDir, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const alreadyRegistered = !!state.creds?.registered

  let mode = cliMode || config.login.mode
  let phone = normalizePhone(cliPhone || config.login.phone || '')
  if (!alreadyRegistered) {
    const resolved = await resolveMode(cliMode, cliPhone)
    mode = resolved.mode
    phone = resolved.phone
  } else if (cliMode) {
    log.info(`🪪 Ya existe una sesión guardada: me conectaré directamente (modo ${cliMode} ignorado).`)
    log.info('   Para vincular otro número usa:  node index.js --logout')
  }

  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }))
  const logger = pino({ level: 'silent' })

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    defaultQueryTimeoutMs: 60000,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    getMessage: async () => undefined
  })

  currentSocket = sock
  pairingRequested = false
  onSocket?.(sock)

  /* ── credenciales ─────────────────────────────────────────── */
  sock.ev.on('creds.update', saveCreds)

  /* ── novedades de la conexión ─────────────────────────────── */
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    const registered = !!sock.authState?.creds?.registered

    /* 1) método elegido: QR */
    if (qr && !registered && (mode === 'qr' || (!cliMode && mode === 'qr'))) {
      console.clear?.()
      log.box('ESCANEA EL CÓDIGO QR', [
        'WhatsApp → Dispositivos vinculados → Vincular dispositivo',
        'Si el QR caduca, se genera otro automáticamente.'
      ])
      qrcode.generate(qr, { small: true })
      try {
        fs.writeFileSync(path.join(path.dirname(sessionDir), 'last-qr.txt'), qr)
      } catch {
        /* opcional */
      }
    }

    /* 2) método elegido: código de emparejamiento */
    if (qr && !registered && mode === 'pairing' && !pairingRequested) {
      pairingRequested = true
      setTimeout(() => requestPairingCode(sock, phone), 1200)
    }

    if (connection === 'connecting') {
      log.wa('Conectando con WhatsApp…')
    }

    if (connection === 'open') {
      reconnectAttempts = 0
      pairingRequested = false
      const me = sock.user?.id ? jidNormalizedUser(sock.user.id) : ''
      log.box('BOT CONECTADO ✅', [
        `Cuenta : ${sock.user?.name || '—'}`,
        `Número : +${String(me).split('@')[0].split(':')[0]}`,
        `Modo   : ${registered ? 'sesión guardada' : mode + ' (recién vinculado)'}`,
        '',
        `Prefijo: ${config.bot.prefix}   ·   Bot: ${config.bot.name}`,
        `Escribe *${config.bot.prefix}menu* en WhatsApp para empezar 👋`
      ])
      if (config.bot.autoOwnerOnPairing) {
        const number = String(me).split('@')[0].split(':')[0]
        if (number && !db0.owners.includes(number)) {
          db0.addOwner(number)
          log.ok(`+${number} añadido como owner (config.bot.autoOwnerOnPairing)`)
        }
      }
      await onOpen?.(sock)
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      const reason = lastDisconnect?.error?.message || 'desconocido'
      const loggedOut = code === DisconnectReason.loggedOut
      const restartRequired = code === DisconnectReason.restartRequired || code === 515

      await onClose?.(sock, { code, loggedOut, restartRequired })

      if (loggedOut) {
        log.error('❌ La sesión se cerró (logout). Borra la carpeta de sesión y vuelve a vincular.')
        return
      }
      if (!config.login.reconnect) {
        log.warn('Conexión cerrada y la reconexión está desactivada.')
        return
      }

      reconnectAttempts++
      const wait = restartRequired ? 1500 : Math.min(1500 * reconnectAttempts, config.login.maxReconnectDelay)
      log.warn(`Conexión cerrada (${code} · ${reason}). Reintento ${reconnectAttempts} en ${Math.round(wait / 1000)}s…`)
      await sleep(wait)
      await startBot({ ...options, mode, phone }).catch((e) => {
        log.error('Error reconectando:', e.message)
        setTimeout(() => startBot({ ...options, mode, phone }), 15000)
      })
    }
  })

  return sock
}

/** Solicita el código de 8 dígitos para vincular con el número */
export async function requestPairingCode(sock, phone, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const code = await sock.requestPairingCode(phone, config.login.customPairingCode || undefined)
      log.box('CÓDIGO DE EMPAREJAMIENTO 📱', [
        `Número : +${phone}`,
        `Código : ${code}`,
        '',
        'WhatsApp → Dispositivos vinculados →',
        'Vincular con número de teléfono → escribe el código',
        'El código caduca en unos minutos (se puede pedir otro).'
      ])
      return code
    } catch (e) {
      log.warn(`No pude pedir el código (intento ${i}/${attempts}): ${e.message}`)
      await sleep(6000)
    }
  }
  log.error('No se pudo generar el código de emparejamiento. Reinicia el bot y elige QR como alternativa.')
  return null
}

/** Borra la sesión guardada (para volver a vincular) */
export function deleteSession() {
  const dir = config.paths.session || config.login.sessionDir
  try {
    fs.rmSync(dir, { recursive: true, force: true })
    log.warn('Sesión borrada:', dir)
    return true
  } catch (e) {
    log.error('No pude borrar la sesión:', e.message)
    return false
  }
}

export function sessionExists() {
  const dir = config.paths.session || config.login.sessionDir
  try {
    return fs.existsSync(path.join(dir, 'creds.json'))
  } catch {
    return false
  }
}

/* import perezoso para evitar dependencia circular en el arranque */
let db0 = { owners: [], addOwner: () => false }
export function bindStore(store) {
  db0 = { get owners() { return store.owners }, addOwner: (n) => store.addOwner(n) }
}

export default { startBot, getSocket, requestPairingCode, deleteSession, sessionExists, ask, bindStore }
