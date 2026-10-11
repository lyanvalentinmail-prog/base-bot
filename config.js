/**
 * ─────────────────────────────────────────────────────────────
 *  CONFIGURACIÓN DEL BOT  ─  edita este archivo y listo
 * ─────────────────────────────────────────────────────────────
 *  Todo lo importante vive aquí. No hace falta tocar el código.
 */

export default {
  /* ── Identidad del bot ───────────────────────────────────── */
  bot: {
    name: 'bot base', // aparece en el menú: «ʜᴏʟᴀ, sᴏʏ …»
    prefix: '.', // prefijo de comandos
    // Los dueños del bot (código de país + número, SIN + ni espacios)
    owners: ['5491112345678'],
    // El número que uses para emparejar se añade solo a los owners (recomendado)
    autoOwnerOnPairing: true,
    // Nombre/emoji del banner del menú
    footer: '> bot base'
  },

  /* ── Conexión / sesión ───────────────────────────────────── */
  login: {
    // 'qr' | 'pairing' | 'ask'
    //  - qr      → muestra el código QR en la terminal
    //  - pairing → pide el número y genera un código de 8 dígitos
    //  - ask     → pregunta en la terminal qué método usar (por defecto)
    mode: 'ask',
    // Código de país por defecto: si escribes un número corto se le añade
    countryCode: '', // p.ej. '52', '54', '57', '591' …
    // Código de emparejamiento personalizado (8 caracteres) o null
    customPairingCode: null,
    // Teléfono por defecto (se puede pasar con  npm run pair -- 521234567890)
    phone: '',
    // Carpeta donde se guarda la sesión (no la borres si no quieres re-escanear)
    sessionDir: './data/session',
    // Reconexión automática
    reconnect: true,
    maxReconnectDelay: 60000
  },

  /* ── API SiputZX ─────────────────────────────────────────── */
  api: {
    baseUrl: 'https://siputzx-api.onrender.com',
    timeout: 90000, // Render (plan gratis) tarda en despertar
    retries: 2,
    // Manda una petición al arrancar para despertar la API (Render free duerme)
    warmup: true,
    // Aviso amistoso cuando un endpoint necesita claves (.env del servidor)
    credentialsHelp:
      'Este endpoint necesita una clave en el .env de tu API (Render → Environment). ' +
      'Añádela y vuelve a intentarlo.'
  },

  /* ── Roles y límites diarios ─────────────────────────────── */
  roles: {
    newbie: { label: 'ɴᴇᴡʙɪᴇ ツ', limit: 25, xpMultiplier: 1 },
    master: { label: 'ᴍᴀsᴛᴇʀ  ツツ', limit: 50, xpMultiplier: 1.2 },
    premium: { label: 'ᴘʀᴇᴍɪᴜᴍ 🜲', limit: 100, xpMultiplier: 1.5 },
    vip: { label: 'ᴠͥɪͣᴘͫ✮⃝🜲', limit: 125, xpMultiplier: 2 },
    admin: { label: 'ᴀᴅᴍɪɴ  ツ', limit: 100, xpMultiplier: 1.3 },
    owner: { label: 'ᴏᴡɴᴇʀ 🜲🜲', limit: Infinity, xpMultiplier: 3 }
  },

  /* ── Economía / RPG / XP ─────────────────────────────────── */
  economy: {
    currency: '🪙',
    dailyReward: 500,
    workRange: [80, 260],
    mineRange: [60, 320],
    fishRange: [50, 280],
    robSuccess: 0.45,
    robFine: 150
  },
  xp: {
    perCommand: [4, 14], // XP aleatoria por comando
    levelUpReward: 250 // monedas al subir de nivel
  },

  /* ── Comportamiento del bot ──────────────────────────────── */
  behavior: {
    // Si es true, solo los owners pueden usar comandos en privado
    selfMode: false,
    // Responder solo en grupos / solo en privado  → 'both' | 'group' | 'private'
    only: 'both',
    // Ignorar mensajes de estos números (código de país + número)
    blacklist: [],
    // Máximo de mensajes por minuto antes de aplicar antispam (0 = desactivado)
    spamLimit: 12,
    // Reaccionar con ✅ a los comandos ejecutados
    reactCommands: false,
    // Guardar en el menú solo categorías con comandos disponibles
    hideEmptyCategories: true,
    // Prefijos extra además del principal (ej: ['/', '!'])
    extraPrefixes: []
  },

  /* ── Canvas (tarjetas de bienvenida, ship, level up…) ────── */
  canvas: {
    preferred: 'auto', // 'auto' | 'local' | 'api'
    // Fondo alternativo si falta el PNG local (se genera al vuelo)
    width: 1024,
    height: 450,
    // Color de acento de las tarjetas
    accent: '#22c55e'
  },

  /* ── Mensajes automáticos de grupo ───────────────────────── */
  group: {
    welcome: true, // dar la bienvenida a los nuevos
    goodbye: true, // despedir a los que salen
    welcomeText: null, // texto extra (null = solo la tarjeta)
    goodbyeText: null
  },

  /* ── Respaldo opcional de IA (si tu API no tiene OPENAI_API_KEY) ── */
  aiFallback: {
    // Pon enabled: true y tu key si quieres que el bot use OpenAI directamente
    enabled: false,
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    textModel: 'gpt-4o-mini',
    imageModel: 'gpt-image-1'
  },

  /* ── Otros ───────────────────────────────────────────────── */
  paths: {
    database: './data/database.json',
    assets: './assets',
    canvas: './assets/canvas',
    session: './data/session'
  },

  // Nivel de logs: 'silent' | 'error' | 'warn' | 'info' | 'debug'
  logLevel: 'info'
}
