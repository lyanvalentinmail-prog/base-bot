#!/usr/bin/env node
/**
 *  tests/selftest.js — prueba el bot SIN conectarse a WhatsApp
 *
 *  Ejecuta:   npm test        (o: node index.js --test)
 *
 *  Qué comprueba:
 *   · que todos los plugins cargan sin errores y sin comandos duplicados
 *   · que los menús se generan bien
 *   · que cada comando se ejecuta con un WhatsApp falso (sock y API simulados)
 */
import config from '../config.js'
import db from '../src/core/store.js'
import canvas from '../src/core/canvas.js'
import { loadPlugins } from '../src/core/loader.js'
import { createHandler } from '../src/core/handler.js'
import * as utils from '../src/core/utils.js'
import * as menu from '../src/core/menu.js'
import { remainingLimit, formatLimit, roleLabel, roleList } from '../src/core/roles.js'

/* ── WhatsApp falso ────────────────────────────────────────── */
const sent = []
const OWNER = '5491112345678'
const USER = '5491199999999'
const GROUP = '120363000000000000@g.us'

function fakeSock() {
  return {
    user: { id: `${OWNER}:12@s.whatsapp.net`, name: 'bot base' },
    store: { contacts: {} },
    ev: { on: () => {} },
    sendMessage: async (jid, content, opts) => {
      sent.push({ jid, content, opts })
      return { key: { id: `msg${sent.length}`, remoteJid: jid } }
    },
    readMessages: async () => {},
    sendPresenceUpdate: async () => {},
    groupMetadata: async () => ({
      subject: 'Grupo de prueba',
      desc: 'probando el bot',
      participants: [
        { id: `${OWNER}@s.whatsapp.net`, admin: 'superadmin' },
        { id: `${USER}@s.whatsapp.net`, admin: null }
      ]
    }),
    groupInviteCode: async () => 'ABC123',
    groupRevokeInvite: async () => 'XYZ789',
    groupParticipantsUpdate: async () => {},
    groupUpdateSubject: async () => {},
    groupUpdateDescription: async () => {},
    updateProfilePicture: async () => {},
    updateProfileStatus: async () => {},
    rejectCall: async () => {},
    profilePictureUrl: async () => null,
    updateMediaMessage: async () => {}
  }
}

/* ── API falsa ─────────────────────────────────────────────── */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64'
)

const FAKE_JSON = {
  '/api/meta/endpoints': {
    version: '1.0.0',
    categories: [{ id: 'tools', name: 'Tools' }],
    endpoints: [
      { id: 'qr', path: '/api/qr', category: 'tools', runtime: { status: 'available' } },
      { id: 'youtube', path: '/api/youtube', category: 'downloader', runtime: { status: 'credentials', missing: ['yt-dlp'] } }
    ]
  },
  '/api/calculate': { expression: '2+2', result: 4 },
  '/api/translate': { from: 'es', to: 'en', text: 'hola', translation: 'hello' },
  '/api/shorturl': { original: 'https://ejemplo.com', short: 'https://is.gd/x' },
  '/api/dice': { rolls: [3, 5], total: 8, dice: 2, sides: 6 },
  '/api/coinflip': { flips: ['cara'], caras: 1, cruces: 0 },
  '/api/trivia': { questions: [{ category: 'Ciencia', difficulty: 'facil', question: '¿Símbolo del oro?', options: ['Au', 'Ag', 'Fe', 'Or'], answer: 'Au' }] },
  '/api/quiz': { questions: [{ category: 'ciencia', question: '¿Planeta rojo?', options: ['Marte', 'Venus'], answer: 'Marte' }] },
  '/api/riddle': { riddles: [{ riddle: 'Cuanto más quitas, más grande', answer: 'un agujero' }] },
  '/api/slot': { reels: ['🍒', '🍒', '🍋'], result: 'pareja', bet: 10, won: 20, credits: 20 },
  '/api/search/wikipedia': { title: 'Node.js', summary: 'Entorno de ejecución…', url: 'https://es.wikipedia.org/wiki/Node.js', thumbnail: null },
  '/api/search/images': { query: 'gatos', results: [] },
  '/api/anime': { query: 'one piece', results: [{ title: 'One Piece', type: 'TV', episodes: 1000, status: 'Airing', score: 8.7, year: 1999, url: 'https://myanimelist.net/anime/21', synopsis: 'Luffy…' }] },
  '/api/manga': { results: [] },
  '/api/waifu': { image: 'https://ejemplo.com/waifu.png' },
  '/api/neko': { image: 'https://ejemplo.com/neko.png' },
  '/api/quoteanime': { quotes: [{ quote: 'Sigue adelante', character: 'Someone', anime: 'Anime' }] },
  '/api/music/lyrics': { results: [{ track: 'Test', artist: 'Artista', album: 'Album', lyrics: 'la la la' }] },
  '/api/music/play': { query: 'test', results: [{ title: 'Cancion', channel: 'Canal', duration: 200, url: 'https://youtu.be/x' }] },
  '/api/youtube': { title: 'Video', channel: 'Canal', duration: 100, video: 'https://ejemplo.com/v.mp4', audio: 'https://ejemplo.com/a.mp3' },
  '/api/tiktok': { title: 'TikTok', video: 'https://ejemplo.com/t.mp4' },
  '/api/tictactoe': { session: 'ttt_1', board: [null, null, null, 'X', 'O', null, null, null, null], turn: 'X', winner: null, finished: false },
  '/api/ptt': { session: 'ptt_1', you: 'piedra', ai: 'tijera', round: 'ganaste', score: { you: 1, ai: 0, draws: 0, rounds: 1 } },
  '/api/guessnumber': { session: 'gn_1', result: 'mayor', attempts: 1, range: { min: 1, max: 100 }, finished: false },
  '/api/hangman': { session: 'hm_1', word: 'A _ A _ A', attemptsLeft: 5, wrongLetters: ['z'], hit: true, finished: false },
  '/api/wordle': { session: 'wd_1', attempt: 1, attemptsLeft: 5, finished: false, feedback: [{ letter: 'g', state: 'absent' }, { letter: 'a', state: 'misplaced' }, { letter: 't', state: 'correct' }, { letter: 'o', state: 'correct' }, { letter: 's', state: 'absent' }] },
  '/api/mathquiz': { session: 'mq_1', current: { expression: '7 * 3' }, score: 1, streak: 1, correct: true },
  '/api/memory': { session: 'mm_1', board: ['🍎', '❓', '❓', '🍋'], matched: 2, moves: 4, finished: false },
  '/api/snake': { session: 'sn_1', grid: 12, snake: [{ x: 5, y: 6 }], food: { x: 9, y: 3 }, score: 1, alive: true },
  '/api/2048': { session: 'g_1', board: [[2, 4, 0, 0], [0, 2, 0, 0], [0, 0, 0, 0], [0, 0, 4, 2]], score: 12, finished: false, won: false },
  '/api/2048x': {}
}

const fakeApi = {
  json: async (path, query = {}, opts = {}) => {
    if (FAKE_JSON[path]) return { ok: true, data: FAKE_JSON[path], code: 200 }
    if (path === '/api/chatgpt') return { ok: true, data: { answer: 'Esta es una respuesta de prueba del bot 🤖' } }
    if (path.startsWith('/api/search')) return { ok: true, data: { query: query.q || '', results: [] } }
    return { ok: true, data: {}, code: 200 }
  },
  buffer: async () => ({ ok: true, buffer: PNG, mimetype: 'image/png', size: PNG.length }),
  upload: async () => ({ ok: true, buffer: PNG, mimetype: 'image/webp', size: PNG.length }),
  postBuffer: async () => ({ ok: true, buffer: PNG, mimetype: 'image/png' }),
  healthy: async () => ({ ok: true }),
  meta: async () => FAKE_JSON['/api/meta/endpoints'],
  warmup: async () => true
}

/* ── contexto ──────────────────────────────────────────────── */
export function makeCtx() {
  config.bot.owners = [OWNER]
  db.load()
  const sock = fakeSock()
  const ctx = {
    config,
    utils,
    log: {
      info: () => {},
      warn: () => {},
      error: (...a) => console.error('  ⚠️', ...a),
      debug: () => {},
      api: () => {},
      wa: () => {},
      cmd: () => {},
      ok: () => {},
      box: () => {},
      raw: () => {}
    },
    api: fakeApi,
    db,
    canvas,
    sock,
    startTime: Date.now(),
    plugins: new Map(),
    pluginList: [],
    groupCache: new Map(),
    commandChars: [config.bot.prefix],
    get prefix() {
      return db.settings.prefix
    },
    get botName() {
      return db.settings.botName
    },
    get owners() {
      return db.owners
    },
    remainingLimit,
    formatLimit,
    roleLabel,
    roleList,
    menu,
    visibleCategories: () => menu.MENU_CATEGORIES.filter((c) => ctx.pluginList.some((p) => p.category === c && !p.hidden)),
    buildMenu: (m) => menu.mainMenu({ ctx, user: m.user, role: m.role, ping: 42 }),
    buildCategoryMenu: (m, c) => menu.categoryMenu({ ctx, category: c }),
    buildAllMenu: () => menu.allMenu({ ctx }),
    buildRolesMenu: (m) => menu.rolesMenu({ ctx, role: m.role }),
    reloadPlugins: async () => loadPlugins(ctx, { silent: true }),
    save: () => db.saveNow(),
    restart: () => {},
    logout: () => {},
    onLevelUp: async () => {}
  }
  return ctx
}

function rawMessage(text, { jid = GROUP, sender = USER } = {}) {
  return {
    key: { remoteJid: jid, participant: jid.endsWith('@g.us') ? `${sender}@s.whatsapp.net` : undefined, id: `T${Math.random()}` },
    pushName: 'Tester',
    message: { conversation: text },
    messageTimestamp: Math.floor(Date.now() / 1000)
  }
}

const COMMANDS = [
  'menu', 'menu info', 'allmenu', 'ping', 'roles', 'categorias', 'bot', 'perfil', 'grupo', 'owner', 'apistatus', 'uptime', 'id', 'afk',
  'panel', 'stats', 'cmdsstats', 'users', 'user @5491199999999', 'top xp',
  'link', 'admins', 'miembros', 'warns', 'welcome on', 'antilink off',
  'qr hola', 'calc 2+2', 'tr en hola mundo', 'shorturl https://ejemplo.com', 'hash hola', 'base64 enc hola', 'password 12', 'uuid', 'style serif hola', 'idiomas',
  'google nodejs', 'wiki nodejs', 'imgsearch gatos', 'pinterest gatos', 'lyrics test', 'play test', 'github torvalds',
  'ai hola', 'blackbox test', 'imagine un gato', 'aiclear',
  'tiktok https://vt.tiktok.com/x', 'instagram https://instagram.com/reel/x', 'youtube https://youtu.be/x 360', 'ytmp3 https://youtu.be/x', 'dlhelp',
  'sticker', 'emojimix 😂+🔥', 'toimg',
  'blur', 'darkness', 'pixel', 'wanted', 'beautiful',
  'tts hola a todos', 'reverse', 'efectos',
  'anime one piece', 'manga berserk', 'waifu', 'neko', 'fraseanime',
  'gay', 'iq', 'ship @5491199999999', '8ball me ira bien', 'rate el bot', 'verdad', 'reto', 'piropo', 'chiste', 'moneda 3', 'dado 2 6',
  'ttt', 'ttt 5', 'ppt piedra', 'adivina', 'adivina 50', 'ahorcado', 'ahorcado a', 'wordle gatos', 'mates', 'mates 21', 'trivia 1', 'quiz ciencia 1', 'acertijo 1', 'memoria 3', 'serpiente derecha', '2048 izquierda', 'tragamonedas 10', 'juegos', 'terminar', 'reversa',
  'bal', 'daily', 'work', 'mine', 'fish', 'rob @5491199999999', 'pay @5491199999999 100', 'dep 100', 'ret 50', 'shop', 'buy pocion', 'inv', 'economy',
  'rpg', 'aventura', 'cazar', 'mazmorra', 'entrenar', 'curar', 'equipar espada', 'usar pocion', 'rpgshop',
  'pokedex pikachu', 'atrapar', 'equipo', 'box', 'pelear', 'pccurar', 'pokehelp', 'pctop', 'pokealeatorio', 'pcinfo 1', 'liberar 1',
  'save', 'reload', 'exec return 1 + 1', 'clearcache', 'setprefix .', 'setbotname bot base', 'owners', 'admins'
]

export async function runSelfTest(ctx) {
  console.log('\n🧪 BOT BASE — pruebas internas (sin conectar WhatsApp)\n')

  await loadPlugins(ctx)
  await canvas.loadCanvasEngine()

  const results = []
  const handler = createHandler(ctx)

  // 1) plugins duplicados
  const names = ctx.pluginList.map((p) => p.name)
  const dup = names.filter((n, i) => names.indexOf(n) !== i)
  results.push(['sin comandos duplicados', dup.length === 0, dup.join(', ')])

  // 2) menús
  const fakeM = { user: db.user(`${USER}@s.whatsapp.net`), role: 'premium', ctx }
  const main = menu.mainMenu({ ctx, user: fakeM.user, role: 'premium', ping: 12 })
  results.push(['menú principal', main.includes('ESTADÍSTICAS') && main.includes('❏ ɪɴғᴏ'), ''])
  const cat = menu.categoryMenu({ ctx, category: 'tools' })
  results.push(['menú de categoría', !!cat && cat.includes('ᴛᴏᴏʟ') && cat.includes('ǫʀ'), ''])
  results.push(['formato ୨୧ ❏ *…* + ┊ ✿', !!cat && cat.startsWith('୨୧ ❏ *') && cat.includes('\n┊ ✿ ') && cat.trimEnd().includes('୨୧'), ''])
  const catLines = (cat || '').split('\n')
  results.push(['sin líneas en blanco dentro del bloque', !catLines.slice(0, -3).some((l, i) => l === '' && i > 0), catLines.filter((l) => l === '').length + ' líneas vacías (solo antes del footer)'])
  results.push(['1ª línea tras la categoría = comando', (catLines[1] || '').startsWith('┊ ✿ '), catLines[1] || ''])
  const catSmall = menu.categoryMenu({ ctx, category: 'ᴛᴏᴏʟꜱ' })
  results.push(['categoría escrita en versalitas', !!catSmall && catSmall.includes('ǫʀ'), ''])
  const catEs = menu.categoryMenu({ ctx, category: 'juegos' })
  results.push(['categoría en español (.menu juegos)', !!catEs && catEs.includes('ᴛᴛᴛ'), ''])
  results.push(['categoría con tilde (.menu economía)', !!menu.categoryMenu({ ctx, category: 'economía' }), ''])
  results.push(['categoría inexistente devuelve null', menu.resolveCategory('zzz') === null, ''])
  const all = menu.allMenu({ ctx })
  const allText = all.join('\n')
  results.push(['allmenu en 1 solo mensaje', all.length === 1, `${all.length} mensaje(s) · ${allText.length} caracteres`])
  results.push(['allmenu trae las 18 categorías', menu.MENU_CATEGORIES.every((c) => allText.includes(menu.CATEGORY_LABELS[c])), ''])
  results.push(['allmenu cabe en WhatsApp (<65k)', allText.length < 65000, `${allText.length} caracteres`])
  const rolesText = menu.rolesMenu({ ctx, role: 'owner' })
  results.push(['menú de roles', rolesText.includes('ᴏᴡɴᴇʀ') && rolesText.startsWith('୨୧ ❏ *'), ''])

  // 3) tarjetas canvas
  const card = await canvas.card('welcome', { username: 'Tester', group: 'Grupo', members: 5 })
  results.push(['tarjeta de bienvenida', !!card?.buffer?.length, card ? `${card.source} · ${card.buffer.length} bytes` : 'sin imagen'])
  const rankCard = await canvas.card('rank', { username: 'Tester', percent: 40, subtitle: 'nivel 3' })
  results.push(['tarjeta de perfil', !!rankCard?.buffer?.length, rankCard?.source || 'sin imagen'])

  // 4) ejecutar todos los comandos con el WhatsApp falso
  console.log(`\n▶ Probando ${COMMANDS.length} comandos…\n`)
  let ok = 0
  for (const line of COMMANDS) {
    const before = sent.length
    try {
      await handler({ messages: [rawMessage(`${config.bot.prefix}${line}`)], type: 'notify' })
      const produced = sent.length > before
      if (produced) ok++
      results.push([line, produced, produced ? '' : 'no respondió nada'])
    } catch (e) {
      results.push([line, false, e.message])
    }
  }

  // 5) permisos: un no-owner no puede usar comandos de owner
  sent.length = 0
  const urls = { jid: GROUP, sender: '5491100000000' }
  await handler({ messages: [rawMessage('.restart', urls)], type: 'notify' })
  const denied = sent.some((s) => /sᴏʟᴏ ᴘᴀʀᴀ ᴏᴡɴᴇʀs/.test(s.content?.text || ''))
  results.push(['los comandos de owner están protegidos', denied, ''])

  // 6) límites diarios
  const beforeLimitUser = db.updateUser(`${USER}@s.whatsapp.net`, { limitUsed: 0, role: 'premium' })
  const limitBefore = beforeLimitUser.limitUsed
  await handler({ messages: [rawMessage('.calc 1+1')], type: 'notify' })
  results.push(['el comando consume límite', db.user(`${USER}@s.whatsapp.net`).limitUsed > limitBefore, `${limitBefore} → ${db.user(`${USER}@s.whatsapp.net`).limitUsed}`])
  results.push(['xp acumulada', db.user(`${USER}@s.whatsapp.net`).xp > 0, `xp = ${db.user(`${USER}@s.whatsapp.net`).xp}`])

  // 6.5) .allmenu en un solo mensaje + comandos escritos en versalitas
  sent.length = 0
  await handler({ messages: [rawMessage(`${config.bot.prefix}allmenu`)], type: 'notify' })
  results.push(['.allmenu envía 1 solo mensaje', sent.length === 1, `${sent.length} mensaje(s) · ${(sent[0]?.content?.text || sent[0]?.text || '').length} caracteres`])

  sent.length = 0
  await handler({ messages: [rawMessage(`${config.bot.prefix}ᴍᴇɴᴜ ᴛᴏᴏʟꜱ`)], type: 'notify' })
  results.push(['.ᴍᴇɴᴜ en versalitas funciona', sent.length > 0 && /ᴛᴏᴏʟ|ǫʀ/.test(sent[0]?.content?.text || sent[0]?.text || ''), `${sent.length} respuesta(s)`])

  sent.length = 0
  await handler({ messages: [rawMessage(`${config.bot.prefix}ᴘɪɴɢ`)], type: 'notify' })
  results.push(['.ᴘɪɴɢ en versalitas funciona', sent.length > 0, `${sent.length} respuesta(s)`])

  // 7) REGRESIÓN: en index.js el handler se crea ANTES de conectarse (ctx.sock = null).
  //    Antes fallaba con: "Cannot read properties of null (reading 'user')"
  {
    const ctx2 = makeCtx()
    const realSock = ctx2.sock
    ctx2.sock = null // todavía no hay conexión
    await loadPlugins(ctx2, { silent: true })
    const h2 = createHandler(ctx2) // igual que index.js
    ctx2.sock = realSock // ahora llega el socket (onSocket)

    let okCreatedEarly = true
    sent.length = 0
    await h2({ messages: [rawMessage('.ping')], type: 'notify' }) // mensaje normal
    okCreatedEarly = sent.length > 0

    sent.length = 0
    // mensaje del propio bot (fromMe) → aquí es donde reventaba el error
    await h2({
      messages: [
        {
          key: { remoteJid: GROUP, fromMe: true, participant: `${OWNER}@s.whatsapp.net`, id: 'FROM1' },
          pushName: 'bot',
          message: { conversation: '.ping' },
          messageTimestamp: Math.floor(Date.now() / 1000)
        }
      ],
      type: 'notify'
    })
    const okFromMe = sent.length > 0

    // y sin socket todavía: debe avisar, no explotar
    ctx2.sock = null
    let okNoSocket = true
    try {
      await h2({ messages: [rawMessage('.ping')], type: 'notify' })
    } catch {
      okNoSocket = false
    }

    results.push(['handler creado antes de conectar (regresión)', okCreatedEarly && okFromMe && okNoSocket, `normal:${okCreatedEarly} fromMe:${okFromMe} sin-socket:${okNoSocket}`])
  }

  // 8) REGRESIÓN: reconexión → el handler debe usar el socket NUEVO, no el viejo
  {
    const ctx3 = makeCtx()
    await loadPlugins(ctx3, { silent: true })
    const h3 = createHandler(ctx3)
    const oldSock = ctx3.sock
    let oldUsed = 0
    let newUsed = 0
    const oldSend = oldSock.sendMessage
    oldSock.sendMessage = async (...args) => {
      oldUsed++
      return oldSend(...args)
    }
    const newSock = fakeSock()
    const newSend = newSock.sendMessage
    newSock.sendMessage = async (...args) => {
      newUsed++
      return newSend(...args)
    }
    ctx3.sock = newSock // Baileys creó otro socket tras reconectar
    await h3({ messages: [rawMessage('.ping')], type: 'notify' })
    results.push(['tras reconectar usa el socket nuevo', newUsed > 0 && oldUsed === 0, `nuevo:${newUsed} viejo:${oldUsed}`])
  }

  /* ── resumen ─────────────────────────────────────────────── */
  const failed = results.filter(([, pass]) => !pass)
  console.log('\n──────────── RESUMEN ────────────')
  for (const [name, pass, extra] of results) {
    console.log(`${pass ? '✅' : '❌'} ${name}${extra ? `  ·  ${extra}` : ''}`)
  }
  console.log('─────────────────────────────────')
  console.log(`Total: ${results.length} pruebas · ${results.length - failed.length} ok · ${failed.length} fallos`)
  console.log(`Comandos ejecutados con respuesta: ${ok}/${COMMANDS.length}\n`)
  db.saveNow()
  if (failed.length) process.exitCode = 1
  return failed.length === 0
}

// ejecución directa: node tests/selftest.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const ctx = makeCtx()
  runSelfTest(ctx).then((pass) => process.exit(pass ? 0 : 1))
}
