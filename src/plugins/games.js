/**
 *  Categoría: ɢᴀᴍᴇs — 15 juegos de la API SiputZX
 *  Las sesiones se guardan por chat en data/database.json
 */
import db from '../core/store.js'
import { formatNumber, randomInt, smallCaps } from '../core/utils.js'
import { addXp } from '../core/roles.js'

const KEYCAP = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']
const keycap = (i) => KEYCAP[i] || String(i + 1)

const game = (m) => db.chat(m.chat).game
const save = (m, data) => db.updateChat(m.chat, { game: data })
const clear = (m) => db.updateChat(m.chat, { game: null })

const norm = (t = '') =>
  String(t)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

/* ── tableros ──────────────────────────────────────────────── */
const renderTTT = (board = []) => {
  const cell = (v, i) => (v === 'X' ? '❌' : v === 'O' ? '⭕' : keycap(i))
  const rows = []
  for (let r = 0; r < 3; r++) rows.push([0, 1, 2].map((c) => cell(board[r * 3 + c], r * 3 + c)).join(' ┃ '))
  return rows.join('\n━━━━━━━━━━\n')
}

const renderSnake = (data = {}) => {
  const size = data.grid || 12
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => '⬛'))
  for (const s of data.snake || []) if (grid[s.y]) grid[s.y][s.x] = '🟩'
  if (data.food && grid[data.food.y]) grid[data.food.y][data.food.x] = '🍎'
  if (data.snake?.[0]) grid[data.snake[0].y][data.snake[0].x] = '🐍'
  return grid.map((row) => row.join('')).join('\n')
}

const render2048 = (board = []) =>
  board
    .map((row) => row.map((n) => (n === 0 ? '·'.padEnd(5) : String(n).padEnd(5))).join(''))
    .join('\n')

const renderMemory = (board = []) => {
  const out = []
  for (let r = 0; r < 4; r++) {
    out.push(
      board
        .slice(r * 4, r * 4 + 4)
        .map((v, i) => (v === '❓' || v === null || v === undefined ? keycap(r * 4 + i) : v))
        .join(' ')
    )
  }
  return out.join('\n')
}

const DIRS = {
  arriba: 'up', abajo: 'down', izquierda: 'left', derecha: 'right',
  up: 'up', down: 'down', left: 'left', right: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right'
}

export default [
  /* ── TRES EN RAYA ─────────────────────────────────────── */
  {
    name: 'ttt',
    alias: ['tictactoe', 'tresenraya'],
    category: 'games',
    desc: 'Juega al tres en raya contra el bot',
    usage: '.ttt  ·  .ttt 5 (casilla 1-9)',
    limit: 1,
    async run(m, ctx) {
      const current = game(m)
      const cell = parseInt(m.arg || '', 10)
      const difficulty = (m.args.find((a) => ['easy', 'hard', 'facil', 'dificil'].includes(a)) || 'hard').toLowerCase()
      const body = { difficulty: difficulty.startsWith('e') || difficulty.startsWith('f') && difficulty === 'facil' ? 'easy' : 'hard' }
      if (current?.name === 'ttt' && !Number.isNaN(cell) && cell >= 1 && cell <= 9) {
        body.session = current.session
        body.cell = cell - 1
      }
      const r = await ctx.api.json('/api/tictactoe', {}, { method: 'POST', body })
      if (!r.ok) return m.reply(r.message)
      const d = r.data
      if (!Number.isNaN(cell) && cell >= 1 && cell <= 9 && d.board?.[cell - 1] === 'O') {
        return m.reply('⚠️ Esa casilla ya está ocupada, elige otra.')
      }
      save(m, { name: 'ttt', session: d.session })
      const status = d.finished
        ? d.winner === 'X'
          ? '🎉 ¡ɢᴀɴᴀsᴛᴇ!'
          : d.winner === 'O'
            ? '🤖 ᴛᴇ ɢᴀɴᴇ́'
            : '🤝 ᴇᴍᴘᴀᴛᴇ'
        : `ᴛᴜ ᴛᴜʀɴᴏ (❌) — ᴇʟɪɢᴇ ᴄᴀsɪʟʟᴀ : ${ctx.prefix}ᴛᴛᴛ <1-9>`
      if (d.finished) {
        clear(m)
        if (d.winner === 'X') {
          const u = m.user
          u.coins += 120
          const { levelUp, level } = addXp(u, 25, m.role)
          db.markDirty()
          if (levelUp) ctx.onLevelUp?.(m, level)
        }
      }
      const text = [`🎮 *ᴛʀᴇs ᴇɴ ʀᴀʏᴀ*`, '', renderTTT(d.board), '', status].join('\n')
      return m.reply(text)
    }
  },

  /* ── PIEDRA PAPEL TIJERA ──────────────────────────────── */
  {
    name: 'ppt',
    alias: ['ptt', 'piedrapapel', 'piedra'],
    category: 'games',
    desc: 'Piedra, papel o tijera contra el bot (con marcador)',
    usage: '.ppt piedra',
    limit: 1,
    async run(m, ctx) {
      const move = norm(m.arg || '')
      const moves = { piedra: 'piedra', papel: 'papel', tijera: 'tijera', tijeras: 'tijera', rock: 'piedra', paper: 'papel', scissors: 'tijera' }
      const chosen = moves[move]
      if (!chosen) return m.reply(`⚙️ ᴜsᴏ : ${ctx.prefix}ᴘᴘᴛ <ᴘɪᴇᴅʀᴀ|ᴘᴀᴘᴇʟ|ᴛɪᴊᴇʀᴀ>`)
      const current = game(m)
      const body = { move: chosen }
      if (current?.name === 'ppt') body.session = current.session
      const r = await ctx.api.json('/api/ptt', {}, { method: 'POST', body })
      if (!r.ok) return m.reply(r.message)
      const d = r.data
      save(m, { name: 'ppt', session: d.session })
      const emoji = { piedra: '🪨', papel: '📄', tijera: '✂️' }
      const result = { ganaste: '🎉 ¡ɢᴀɴᴀsᴛᴇ!', perdiste: '😢 ᴘᴇʀᴅɪsᴛᴇ', empate: '🤝 ᴇᴍᴘᴀᴛᴇ' }[d.round] || d.round
      if (d.round === 'ganaste') {
        m.user.coins += 60
        db.markDirty()
      }
      return m.reply(
        [
          `🎮 *ᴘɪᴇᴅʀᴀ ᴘᴀᴘᴇʟ ᴛɪᴊᴇʀᴀ*`,
          `┊ ᴛú : ${emoji[d.you]} ${d.you}`,
          `┊ ʙᴏᴛ : ${emoji[d.ai]} ${d.ai}`,
          `┊ ${result}`,
          `┊ ᴍᴀʀᴄᴀᴅᴏʀ : ${d.score.you} - ${d.score.ai} (ᴇᴍᴘᴀᴛᴇs ${d.score.draws} · ʀᴏɴᴅᴀs ${d.score.rounds})`
        ].join('\n')
      )
    }
  },

  /* ── ADIVINA EL NÚMERO ────────────────────────────────── */
  {
    name: 'adivina',
    alias: ['guessnumber', 'guess'],
    category: 'games',
    desc: 'Adivina el número secreto',
    usage: '.adivina 42  ·  .adivina start 100',
    limit: 1,
    async run(m, ctx) {
      const current = game(m)
      const guess = parseInt(m.arg || '', 10)
      const body = {}
      if (current?.name === 'adivina') body.session = current.session
      if (!Number.isNaN(guess)) body.guess = guess
      if (norm(m.args[1] || '') === '1000') body.max = 1000
      const r = await ctx.api.json('/api/guessnumber', {}, { method: 'POST', body })
      if (!r.ok) return m.reply(r.message)
      const d = r.data
      save(m, { name: 'adivina', session: d.session })
      if (d.finished) {
        clear(m)
        m.user.coins += 200
        const { levelUp, level } = addXp(m.user, 30, m.role)
        db.markDirty()
        if (levelUp) ctx.onLevelUp?.(m, level)
        return m.reply(`🎉 ¡ᴀᴄᴇʀᴛᴀsᴛᴇ ᴇɴ ${d.attempts} ɪɴᴛᴇɴᴛᴏs!\n┊ 🪙 +200 ᴍᴏɴᴇᴅᴀs · ✨ +30 xᴘ`)
      }
      if (!body.guess) {
        return m.reply(
          `🎮 *ᴀᴅɪᴠɪɴᴀ ᴇʟ ɴúᴍᴇʀᴏ*\n┊ ᴘɪᴇɴsᴀ ᴇɴ ᴜɴ ɴúᴍᴇʀᴏ ᴇɴᴛʀᴇ ${d.range?.min || 1} ʏ ${d.range?.max || 100}\n┊ ᴇsᴄʀɪʙᴇ : ${ctx.prefix}ᴀᴅɪᴠɪɴᴀ <ɴúᴍᴇʀᴏ>`
        )
      }
      return m.reply(
        `🔎 ᴛᴜ ɪɴᴛᴇɴᴛᴏ : *${guess}*\n┊ ᴘɪsᴛᴀ : ᴇs *${d.result === 'mayor' ? 'ᴍᴀʏᴏʀ ⬆️' : d.result === 'menor' ? 'ᴍᴇɴᴏʀ ⬇️' : d.result}*\n┊ ɪɴᴛᴇɴᴛᴏs : ${d.attempts}\n┊ ʀᴀɴɢᴏ : ${d.range?.min}-${d.range?.max}`
      )
    }
  },

  /* ── AHORCADO ─────────────────────────────────────────── */
  {
    name: 'ahorcado',
    alias: ['hangman'],
    category: 'games',
    desc: 'Juega al ahorcado',
    usage: '.ahorcado  ·  .ahorcado a',
    limit: 1,
    async run(m, ctx) {
      const current = game(m)
      const letter = (m.arg || '').toLowerCase()
      const body = {}
      if (current?.name === 'ahorcado') body.session = current.session
      if (/^[a-zñ]$/.test(letter)) body.letter = letter
      const r = await ctx.api.json('/api/hangman', {}, { method: 'POST', body })
      if (!r.ok) return m.reply(r.message)
      const d = r.data
      save(m, { name: 'ahorcado', session: d.session })
      const hearts = '❤️'.repeat(Math.max(0, d.attemptsLeft)) + '🖤'.repeat(Math.max(0, 6 - d.attemptsLeft))
      if (d.finished) {
        clear(m)
        const won = !d.word?.includes('_')
        if (won) {
          m.user.coins += 150
          db.markDirty()
        }
        return m.reply(
          won
            ? `🎉 ¡ɢᴀɴᴀsᴛᴇ! ʟᴀ ᴘᴀʟᴀʙʀᴀ ᴇʀᴀ *${d.word}*\n┊ 🪙 +150 ᴍᴏɴᴇᴅᴀs`
            : `💀 ᴘᴇʀᴅɪsᴛᴇ 😢 ʟᴀ ᴘᴀʟᴀʙʀᴀ ᴇʀᴀ *${d.word}*`
        )
      }
      return m.reply(
        [
          `🎮 *ᴀʜᴏʀᴄᴀᴅᴏ*`,
          `┊ ${d.word}`,
          `┊ ${hearts}`,
          `┊ ꜰᴀʟʟᴀᴅᴀs : ${(d.wrongLetters || []).join(', ') || '—'}`,
          `┊ ᴇsᴄʀɪʙᴇ : ${ctx.prefix}ᴀʜᴏʀᴄᴀᴅᴏ <ʟᴇᴛʀᴀ>`
        ].join('\n')
      )
    }
  },

  /* ── WORDLE ───────────────────────────────────────────── */
  {
    name: 'wordle',
    alias: ['palabra5'],
    category: 'games',
    desc: 'Adivina la palabra de 5 letras en 6 intentos',
    usage: '.wordle gatos',
    limit: 1,
    async run(m, ctx) {
      const current = game(m)
      const word = norm(m.arg || '')
      const body = {}
      if (current?.name === 'wordle') body.session = current.session
      if (/^[a-zñ]{5}$/.test(word)) body.word = word
      const r = await ctx.api.json('/api/wordle', {}, { method: 'POST', body })
      if (!r.ok) return m.reply(r.message)
      const d = r.data
      save(m, { name: 'wordle', session: d.session })
      const emojis = { correct: '🟩', misplaced: '🟨', absent: '⬛' }
      const row = (d.feedback || []).map((f) => emojis[f.state] || '⬛').join('')
      if (d.finished) {
        clear(m)
        if (d.won) {
          m.user.coins += 250
          const { levelUp, level } = addXp(m.user, 35, m.role)
          db.markDirty()
          if (levelUp) ctx.onLevelUp?.(m, level)
        }
        return m.reply(d.won ? `🎉 ¡ᴄᴏʀʀᴇᴄᴛᴏ ᴇɴ ${d.attempt} ɪɴᴛᴇɴᴛᴏs! ʟᴀ ᴘᴀʟᴀʙʀᴀ ᴇʀᴀ *${d.word || word}*\n┊ 🪙 +250 ᴍᴏɴᴇᴅᴀs` : `😢 sᴇ ᴀᴄᴀʙᴀʀᴏɴ ʟᴏs ɪɴᴛᴇɴᴛᴏs, ʟᴀ ᴘᴀʟᴀʙʀᴀ ᴇʀᴀ *${d.word || '?'}*`)
      }
      if (!body.word) {
        return m.reply(`🎮 *ᴡᴏʀᴅʟᴇ*\n┊ ᴀᴅɪᴠɪɴᴀ ʟᴀ ᴘᴀʟᴀʙʀᴀ ᴅᴇ 5 ʟᴇᴛʀᴀs\n┊ ᴇsᴄʀɪʙᴇ : ${ctx.prefix}ᴡᴏʀᴅʟᴇ <ᴘᴀʟᴀʙʀᴀ>`)
      }
      return m.reply(
        [`🎮 *ᴡᴏʀᴅʟᴇ* ${d.attempt}/6`, row, `┊ ᴛᴇ ǫᴜᴇᴅᴀɴ ${d.attemptsLeft} ɪɴᴛᴇɴᴛᴏs`, `┊ 🟩 ᴄᴏʀʀᴇᴄᴛᴀ · 🟨 ᴍᴀʟ ᴘᴜᴇsᴛᴀ · ⬛ ɴᴏ ᴇsᴛᴀ́`].join('\n'))
    }
  },

  /* ── MATEMÁTICAS CONTRA EL RELOJ ──────────────────────── */
  {
    name: 'mates',
    alias: ['mathquiz', 'calculo'],
    category: 'games',
    desc: 'Resuelve operaciones contra el reloj',
    usage: '.mates 24',
    limit: 1,
    async run(m, ctx) {
      const current = game(m)
      const body = {}
      const answer = parseInt(m.arg || '', 10)
      if (current?.name === 'mates') body.session = current.session
      if (!Number.isNaN(answer)) body.answer = answer
      const r = await ctx.api.json('/api/mathquiz', {}, { method: 'POST', body })
      if (!r.ok) return m.reply(r.message)
      const d = r.data
      save(m, { name: 'mates', session: d.session })
      if (body.answer === undefined) {
        return m.reply(`🧮 ʀᴇsᴜᴇʟᴠᴇ : *${d.current?.expression}*\n┊ ᴛɪᴇᴍᴘᴏ : ${d.timeLimit || 30}s\n┊ ᴇsᴄʀɪʙᴇ : ${ctx.prefix}ᴍᴀᴛᴇs <ʀᴇsᴘᴜᴇsᴛᴀ>`)
      }
      return m.reply(
        [
          `${d.correct ? '✅ ᴄᴏʀʀᴇᴄᴛᴏ' : '❌ ꜰᴀʟʟᴀsᴛᴇ'}`,
          `┊ ɴᴜᴇᴠᴀ : *${d.current?.expression}*`,
          `┊ ᴘᴜɴᴛᴏs : ${d.score} · ʀᴀᴄʜᴀ 🔥 ${d.streak}`
        ].join('\n')
      )
    }
  },

  /* ── TRIVIA / QUIZ ────────────────────────────────────── */
  {
    name: 'trivia',
    alias: ['cultura'],
    category: 'games',
    desc: 'Preguntas de cultura general (el que acierta gana monedas)',
    usage: '.trivia 3 medio',
    limit: 1,
    async run(m, ctx) {
      const amount = Math.min(10, Math.max(1, parseInt(m.arg || '1', 10) || 1))
      const diffArg = (m.args[1] || '').toLowerCase()
      const difficulty = ['facil', 'medio', 'dificil'].includes(diffArg) ? diffArg : undefined
      const r = await ctx.api.json('/api/trivia', { amount, difficulty })
      if (!r.ok) return m.reply(r.message)
      const questions = r.data.questions || []
      if (!questions.length) return m.reply('😕 No hay preguntas disponibles.')
      db.updateChat(m.chat, { trivia: { items: questions, at: Date.now() } })
      return m.reply(
        [
          `🧠 *ᴛʀɪᴠɪᴀ (${questions.length})*`,
          `┊ ᴇsᴄʀɪʙᴇ ʟᴀ ʀᴇsᴘᴜᴇsᴛᴀ ᴇɴ ᴇʟ ᴄʜᴀᴛ ᴘᴀʀᴀ ɢᴀɴᴀʀ 🪙`,
          '',
          ...questions.map((q, i) => `*${i + 1}. ${q.question}*\n┊ ${(q.options || []).map((o) => `\`${o}\``).join('  ')}`)
        ].join('\n')
      )
    }
  },
  {
    name: 'quiz',
    alias: ['preguntas'],
    category: 'games',
    desc: 'Preguntas por categoría (ciencia, historia, cine…)',
    usage: '.quiz ciencia 3',
    limit: 1,
    async run(m, ctx) {
      const cats = ['ciencia', 'historia', 'geografia', 'tecnologia', 'cine', 'deportes']
      const catArg = (m.arg || '').toLowerCase()
      const category = cats.includes(catArg) ? catArg : undefined
      const amount = Math.min(10, Math.max(1, parseInt(m.args[1] || m.arg || '3', 10) || 3))
      const r = await ctx.api.json('/api/quiz', { category, amount })
      if (!r.ok) return m.reply(r.message)
      const questions = r.data.questions || []
      if (!questions.length) return m.reply('😕 Sin preguntas ahora mismo.')
      db.updateChat(m.chat, { trivia: { items: questions, at: Date.now() } })
      return m.reply(
        [
          `❓ *ǫᴜɪᴢ ${category ? `(${category})` : ''}*`,
          `┊ ᴇsᴄʀɪʙᴇ ʟᴀ ʀᴇsᴘᴜᴇsᴛᴀ ᴘᴀʀᴀ ɢᴀɴᴀʀ 🪙`,
          '',
          ...questions.map((q, i) => `*${i + 1}. ${q.question}*\n┊ ${(q.options || []).map((o) => `\`${o}\``).join('  ')}`)
        ].join('\n')
      )
    }
  },
  {
    name: 'acertijo',
    alias: ['riddle', 'adivinanza'],
    category: 'games',
    desc: 'Acertijos para romperse la cabeza',
    usage: '.acertijo 1 revelar',
    limit: 1,
    async run(m, ctx) {
      const amount = Math.min(5, Math.max(1, parseInt(m.arg || '1', 10) || 1))
      const reveal = ['revelar', 'reveal', 'si', 'sí', 'respuesta'].includes(norm(m.args[1] || ''))
      const r = await ctx.api.json('/api/riddle', { amount, reveal })
      if (!r.ok) return m.reply(r.message)
      const riddles = r.data.riddles || []
      return m.reply(
        [
          `🧩 *ᴀᴄᴇʀᴛɪᴊᴏs*`,
          '',
          ...riddles.map((x, i) => `*${i + 1}. ${x.riddle}*${x.answer ? `\n┊ 💡 ʀᴇsᴘᴜᴇsᴛᴀ : ${x.answer}` : ''}`)
        ].join('\n')
      )
    }
  },

  /* ── MEMORIA ──────────────────────────────────────────── */
  {
    name: 'memoria',
    alias: ['memory', 'parejas'],
    category: 'games',
    desc: 'Encuentra las parejas en el tablero 4x4',
    usage: '.memoria 3',
    limit: 1,
    async run(m, ctx) {
      const current = game(m)
      const card = parseInt(m.arg || '', 10)
      const body = {}
      if (current?.name === 'memoria') body.session = current.session
      if (!Number.isNaN(card) && card >= 0 && card <= 15) body.card = card
      const r = await ctx.api.json('/api/memory', {}, { method: 'POST', body })
      if (!r.ok) return m.reply(r.message)
      const d = r.data
      save(m, { name: 'memoria', session: d.session })
      if (d.finished) {
        clear(m)
        m.user.coins += 180
        db.markDirty()
        return m.reply(`🎉 ¡ᴄᴏᴍᴘʟᴇᴛᴀᴅᴏ ᴇɴ ${d.moves} ᴍᴏᴠɪᴍɪᴇɴᴛᴏs!\n┊ 🪙 +180 ᴍᴏɴᴇᴅᴀs`)
      }
      return m.reply(
        [
          `🎮 *ᴍᴇᴍᴏʀɪᴀ* · ᴘᴀʀᴇᴊᴀs ${d.matched} · ᴍᴏᴠɪᴍɪᴇɴᴛᴏs ${d.moves}`,
          '',
          renderMemory(d.board),
          '',
          `ᴇʟɪɢᴇ ᴜɴᴀ ᴄᴀʀᴛᴀ : ${ctx.prefix}ᴍᴇᴍᴏʀɪᴀ <0-15>`
        ].join('\n')
      )
    }
  },

  /* ── SERPIENTE ────────────────────────────────────────── */
  {
    name: 'serpiente',
    alias: ['snake'],
    category: 'games',
    desc: 'Juega a la serpiente paso a paso',
    usage: '.serpiente derecha',
    limit: 1,
    async run(m, ctx) {
      const current = game(m)
      const dir = DIRS[norm(m.arg || '')]
      const body = {}
      if (current?.name === 'serpiente') body.session = current.session
      if (dir) body.direction = dir
      const r = await ctx.api.json('/api/snake', {}, { method: 'POST', body })
      if (!r.ok) return m.reply(r.message)
      const d = r.data
      save(m, { name: 'serpiente', session: d.session })
      if (!d.alive) {
        clear(m)
        m.user.coins += d.score * 25
        db.markDirty()
        return m.reply(`💀 ᴄʜᴏᴄᴀsᴛᴇ! ᴘᴜɴᴛᴏs : ${d.score}\n┊ 🪙 +${d.score * 25} ᴍᴏɴᴇᴅᴀs`)
      }
      return m.reply(
        [
          `🐍 *sᴇʀᴘɪᴇɴᴛᴇ* · ᴘᴜɴᴛᴏs : ${d.score}`,
          '',
          renderSnake(d),
          '',
          `ᴍᴜéᴠᴇᴛᴇ : ${ctx.prefix}sᴇʀᴘɪᴇɴᴛᴇ ᴀʀʀɪʙᴀ/ᴀʙᴀᴊᴏ/ɪᴢǫᴜɪᴇʀᴅᴀ/ᴅᴇʀᴇᴄʜᴀ`
        ].join('\n')
      )
    }
  },

  /* ── 2048 ─────────────────────────────────────────────── */
  {
    name: '2048',
    alias: ['g2048'],
    category: 'games',
    desc: 'Junta los números hasta llegar a 2048',
    usage: '.2048 izquierda',
    limit: 1,
    async run(m, ctx) {
      const current = game(m)
      const dir = DIRS[norm(m.arg || '')]
      const body = {}
      if (current?.name === '2048') body.session = current.session
      if (dir) body.move = dir
      const r = await ctx.api.json('/api/2048', {}, { method: 'POST', body })
      if (!r.ok) return m.reply(r.message)
      const d = r.data
      save(m, { name: '2048', session: d.session })
      if (d.finished || d.won === false && d.finished) {
        clear(m)
      }
      return m.reply(
        [
          `🔢 *2048* · ᴘᴜɴᴛᴏs : ${d.score}`,
          '',
          render2048(d.board),
          '',
          d.finished ? '💀 ꜱɪɴ ᴍᴏᴠɪᴍɪᴇɴᴛᴏꜱ — ᴇꜱᴄʀɪʙᴇ 2048 ᴘᴀʀᴀ ᴇᴍᴘᴇᴢᴀʀ ᴅᴇ ɴᴜᴇᴠᴏ' : `ᴍᴜéᴠᴇᴛᴇ : ${ctx.prefix}2048 ɪᴢǫᴜɪᴇʀᴅᴀ/ᴅᴇʀᴇᴄʜᴀ/ᴀʀʀɪʙᴀ/ᴀʙᴀᴊᴏ`
        ].join('\n')
      )
    }
  },

  /* ── TRAGAMONEDAS ─────────────────────────────────────── */
  {
    name: 'tragamonedas',
    alias: ['slot', 'casino'],
    category: 'games',
    desc: 'Tragamonedas con tus monedas',
    usage: '.tragamonedas 50',
    limit: 1,
    async run(m, ctx) {
      const bet = Math.min(1000, Math.max(1, parseInt(m.arg || '10', 10) || 10))
      if (m.user.coins < bet) return m.reply(`💸 ɴᴏ ᴛɪᴇɴᴇs sᴜꜰɪᴄɪᴇɴᴛᴇs ᴍᴏɴᴇᴅᴀs (ᴛɪᴇɴᴇs ${formatNumber(m.user.coins)}).\nᴜsᴀ ${ctx.prefix}ᴅᴀɪʟʏ ᴏ ${ctx.prefix}ᴡᴏʀᴋ`)
      const r = await ctx.api.json('/api/slot', { bet })
      if (!r.ok) return m.reply(r.message)
      const d = r.data
      const won = Number(d.won || 0)
      m.user.coins += won - bet
      if (m.user.coins < 0) m.user.coins = 0
      db.markDirty()
      const net = won - bet
      return m.reply(
        [
          `🎰 *ᴛʀᴀɢᴀᴍᴏɴᴇᴅᴀs*`,
          `┊ ${(d.reels || []).join(' ┃ ')}`,
          `┊ ʀᴇsᴜʟᴛᴀᴅᴏ : ${d.result}`,
          `┊ ᴀᴘᴜᴇsᴛᴀ : ${bet} · ɢᴀɴᴀɴᴄɪᴀ : ${won}`,
          `┊ ${net >= 0 ? `🟢 ɢᴀɴᴀsᴛᴇ ${net}` : `🔴 ᴘᴇʀᴅɪsᴛᴇ ${Math.abs(net)}`} 🪙`,
          `┊ sᴀʟᴅᴏ : ${formatNumber(m.user.coins)} 🪙`
        ].join('\n')
      )
    }
  },

  /* ── HELPERS ──────────────────────────────────────────── */
  {
    name: 'juegos',
    alias: ['games', 'gamehelp'],
    category: 'games',
    desc: 'Lista todos los juegos disponibles',
    usage: '.juegos',
    limit: false,
    async run(m, ctx) {
      const p = ctx.prefix
      return m.reply(
        [
          `╭───「 ᴊᴜᴇɢᴏs 」`,
          `│`,
          `│ ✿ ${p}ᴛᴛᴛ <1-9> — ᴛʀᴇs ᴇɴ ʀᴀʏᴀ`,
          `│ ✿ ${p}ᴘᴘᴛ ᴘɪᴇᴅʀᴀ — ᴘɪᴇᴅʀᴀ ᴘᴀᴘᴇʟ ᴛɪᴊᴇʀᴀ`,
          `│ ✿ ${p}ᴀᴅɪᴠɪɴᴀ <ɴ> — ᴀᴅɪᴠɪɴᴀ ᴇʟ ɴúᴍᴇʀᴏ`,
          `│ ✿ ${p}ᴀʜᴏʀᴄᴀᴅᴏ <ʟᴇᴛʀᴀ> — ᴀʜᴏʀᴄᴀᴅᴏ`,
          `│ ✿ ${p}ᴡᴏʀᴅʟᴇ <ᴘᴀʟᴀʙʀᴀ> — ᴡᴏʀᴅʟᴇ`,
          `│ ✿ ${p}ᴍᴀᴛᴇs <ʀᴇsᴘᴜᴇsᴛᴀ> — ᴍᴀᴛᴇᴍáᴛɪᴄᴀs`,
          `│ ✿ ${p}ᴛʀɪᴠɪᴀ <ᴄᴀɴᴛ> — ᴛʀɪᴠɪᴀ`,
          `│ ✿ ${p}ǫᴜɪᴢ <ᴄᴀᴛ> — ǫᴜɪᴢ`,
          `│ ✿ ${p}ᴀᴄᴇʀᴛɪᴊᴏ — ᴀᴄᴇʀᴛɪᴊᴏs`,
          `│ ✿ ${p}ᴍᴇᴍᴏʀɪᴀ <0-15> — ᴍᴇᴍᴏʀɪᴀ`,
          `│ ✿ ${p}sᴇʀᴘɪᴇɴᴛᴇ <ᴅɪʀ> — sᴇʀᴘɪᴇɴᴛᴇ`,
          `│ ✿ ${p}2048 <ᴅɪʀ> — 2048`,
          `│ ✿ ${p}ᴛʀᴀɢᴀᴍᴏɴᴇᴅᴀs <ᴀᴘᴜᴇsᴛᴀ> — sʟᴏᴛ`,
          `│ ✿ ${p}ᴛᴇʀᴍɪɴᴀʀ — ᴛᴇʀᴍɪɴᴀ ᴛᴜ ᴘᴀʀᴛɪᴅᴀ`,
          `│`,
          `╰───「 ${ctx.botName} 」`
        ].join('\n')
      )
    }
  },
  {
    name: 'terminar',
    alias: ['resetgame', 'abandonar'],
    category: 'games',
    desc: 'Termina la partida actual de este chat',
    usage: '.terminar',
    limit: false,
    async run(m) {
      const current = game(m)
      clear(m)
      db.updateChat(m.chat, { trivia: null })
      return m.reply(current ? `🏳️ ᴘᴀʀᴛɪᴅᴀ ᴅᴇ *${current.name}* ᴛᴇʀᴍɪɴᴀᴅᴀ` : 'ℹ️ No había ninguna partida activa.')
    }
  },
  {
    name: 'trivia-answer',
    category: 'games',
    hidden: true,
    limit: false,
    async onMessage(m, ctx) {
      const chatData = db.chat(m.chat)
      const pending = chatData.trivia
      if (!pending?.items?.length) return
      if (m.isCommand || m.fromMe) return
      if (Date.now() - pending.at > 10 * 60 * 1000) {
        db.updateChat(m.chat, { trivia: null })
        return
      }
      const answer = norm(m.text)
      if (!answer || answer.length > 40) return
      const index = pending.items.findIndex((q) => norm(q.answer) === answer)
      if (index === -1) return
      const item = pending.items.splice(index, 1)[0]
      if (!pending.items.length) db.updateChat(m.chat, { trivia: null })
      else db.markDirty()

      const reward = randomInt(60, 160)
      m.user.coins += reward
      const { levelUp, level } = addXp(m.user, 20, m.role)
      db.markDirty()
      await m.react('✅')
      await m.reply(
        [
          `🎉 ¡ᴄᴏʀʀᴇᴄᴛᴏ! ${m.pushName} ᴀᴄᴇʀᴛó *${item.answer}*`,
          `┊ ${smallCaps(item.category || 'general')}`,
          `┊ 🪙 +${reward} ᴍᴏɴᴇᴅᴀs · ✨ +20 xᴘ`
        ].join('\n')
      )
      if (levelUp) ctx.onLevelUp?.(m, level)
    }
  }
]
