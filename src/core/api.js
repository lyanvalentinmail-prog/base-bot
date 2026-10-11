/**
 *  src/core/api.js — cliente de la API SiputZX (https://siputzx-api.onrender.com)
 *
 *  Todas las respuestas siguen el formato:
 *    { status: true,  creator: 'SiputZX API', data: { … } }
 *    { status: false, creator: 'SiputZX API', code: 400, error: '…' }
 *
 *  Este cliente devuelve siempre objetos «planos» para que los plugins sean simples:
 *    const r = await api.json('/api/music/lyrics', { q: 'queen' })
 *    if (!r.ok) return m.reply(r.message)
 */
import config from '../../config.js'
import log from './logger.js'
import { sleep } from './utils.js'

export class ApiError extends Error {
  constructor(message, { code, needsCredentials = false, needsService = false, raw } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.needsCredentials = needsCredentials
    this.needsService = needsService
    this.raw = raw
  }
}

const CRED_HINTS = /falta configurar|api[_ ]?key|credencial|credentials|requiere.*clave|\.env|no configurad/i
const SERVICE_HINTS = /yt-?dlp|ffmpeg|servicio|no disponible|unavailable|501/i

export class SiputZXApi {
  constructor(opts = {}) {
    this.baseUrl = (opts.baseUrl || config.api.baseUrl).replace(/\/+$/, '')
    this.timeout = opts.timeout || config.api.timeout
    this.retries = opts.retries ?? config.api.retries
    this._meta = null
    this._metaAt = 0
  }

  /** URL completa (útil para mandar imágenes/audios por link a WhatsApp) */
  url(path, query = {}) {
    const u = new URL(this.baseUrl + (path.startsWith('/') ? path : `/${path}`))
    for (const [k, v] of Object.entries(query || {})) {
      if (v === undefined || v === null || v === '') continue
      u.searchParams.set(k, String(v))
    }
    return u.toString()
  }

  /** Petición cruda con reintentos */
  async request(method, path, { query, body, form, retries } = {}) {
    const url = this.url(path, query)
    const attempts = (retries ?? this.retries) + 1
    let lastError

    for (let i = 1; i <= attempts; i++) {
      try {
        const init = { method, signal: AbortSignal.timeout(this.timeout) }
        if (form) {
          init.body = form
        } else if (body !== undefined) {
          init.headers = { 'Content-Type': 'application/json' }
          init.body = JSON.stringify(body)
        }
        const res = await fetch(url, init)
        if (!res.ok && res.status >= 500) throw new ApiError(`HTTP ${res.status}`, { code: res.status, needsService: true })
        return res
      } catch (e) {
        lastError = e
        const isTimeout = /abort|timeout|terminated/i.test(e.message || '')
        log.debug(`API ${method} ${path} intento ${i}/${attempts} falló:`, e.message)
        if (i < attempts) await sleep(isTimeout ? 1500 * i : 900 * i)
      }
    }
    throw lastError instanceof ApiError
      ? lastError
      : new ApiError(
          'No pude conectar con la API. Si estás en Render (plan gratis) puede estar despertando: intenta de nuevo en ~30s.',
          { needsService: true }
        )
  }

  /** Respuesta JSON → { ok, data, error, message, code } */
  async json(path, query = {}, opts = {}) {
    try {
      const res = await this.request(opts.method || 'GET', path, {
        query,
        body: opts.body,
        form: opts.form,
        retries: opts.retries
      })
      const text = await res.text()
      let payload = null
      try {
        payload = JSON.parse(text)
      } catch {
        return { ok: false, code: res.status, error: 'respuesta inválida', message: 'La API devolvió algo que no entiendo 🤔', raw: text.slice(0, 300) }
      }
      return this._normalize(payload, res.status, opts)
    } catch (e) {
      return this._fromError(e)
    }
  }

  /** Respuesta binaria (imágenes, audio, webp, zip) → { ok, buffer, mimetype } */
  async buffer(path, query = {}, opts = {}) {
    try {
      const res = await this.request(opts.method || 'GET', path, { query, form: opts.form, body: opts.body, retries: opts.retries })
      const ct = res.headers.get('content-type') || 'application/octet-stream'
      if (!res.ok || ct.includes('application/json')) {
        const text = await res.text()
        let payload = null
        try {
          payload = JSON.parse(text)
        } catch {
          /* ignora */
        }
        if (payload) return { ...this._normalize(payload, res.status, opts), buffer: null }
        return { ok: false, code: res.status, message: `La API respondió ${res.status} (${ct})`, buffer: null }
      }
      const buffer = Buffer.from(await res.arrayBuffer())
      if (!buffer.length) return { ok: false, message: 'La API devolvió un archivo vacío 😕', buffer: null }
      return { ok: true, buffer, mimetype: ct.split(';')[0], size: buffer.length }
    } catch (e) {
      return { ...this._fromError(e), buffer: null }
    }
  }

  /** Subida multipart (POST con archivo) — para blur, sticker, welcome con avatar… */
  async upload(path, buffer, { filename = 'file', mimetype = 'image/jpeg', field = 'file', query = {}, fields = {}, method = 'POST' } = {}) {
    const form = new FormData()
    form.append(field, new Blob([buffer], { type: mimetype }), filename)
    for (const [k, v] of Object.entries(fields || {})) if (v !== undefined && v !== null) form.append(k, String(v))
    return this.buffer(path, query, { form, method })
  }

  async uploadJson(path, buffer, opts = {}) {
    const form = new FormData()
    form.append(opts.field || 'file', new Blob([buffer], { type: opts.mimetype || 'image/jpeg' }), opts.filename || 'file')
    for (const [k, v] of Object.entries(opts.fields || {})) if (v !== undefined && v !== null) form.append(k, String(v))
    return this.json(path, opts.query || {}, { form, method: opts.method || 'POST' })
  }

  /** GET binario con envío de datos JSON → para POST que devuelven imagen */
  async postBuffer(path, body, query = {}) {
    return this.buffer(path, query, { method: 'POST', body })
  }

  _normalize(payload, status, opts = {}) {
    if (payload && typeof payload === 'object' && 'status' in payload) {
      if (payload.status === true) return { ok: true, data: payload.data, creator: payload.creator, code: status }
      const error = payload.error || payload.message || 'Error desconocido'
      const needsCredentials = opts.detectHelp !== false && CRED_HINTS.test(error)
      const needsService = SERVICE_HINTS.test(error)
      return {
        ok: false,
        code: payload.code || status,
        error,
        needsCredentials,
        needsService,
        message: this._friendly(error, { needsCredentials, needsService, code: payload.code || status })
      }
    }
    // algunas respuestas vienen «peladas» (sin status)
    if (payload && typeof payload === 'object') return { ok: true, data: payload, code: status }
    return { ok: false, code: status, error: 'respuesta vacía', message: 'La API no devolvió datos 😕' }
  }

  _fromError(e) {
    const needsService = e.name === 'ApiError' ? !!e.needsService : /fetch|timeout|abort|socket|ECONN|ENOTFOUND/i.test(e.message || '')
    const message = needsService
      ? '⚠️ No pude conectar con la API.\n\nSi usas el plan gratis de Render, el servidor se duerme: espera ~30 segundos y vuelve a intentar.'
      : e.message || 'Error inesperado en la API'
    return { ok: false, error: e.message, message, needsService, needsCredentials: false, code: e.code }
  }

  _friendly(error, { needsCredentials, code }) {
    if (needsCredentials) return `🔑 ${error}\n\n${config.api.credentialsHelp}`
    if (code === 501) return `🚫 ${error}`
    return `⚠️ ${error}`
  }

  /* ── Metadatos / salud ─────────────────────────────────────── */
  async meta(force = false) {
    if (!force && this._meta && Date.now() - this._metaAt < 30 * 60 * 1000) return this._meta
    const r = await this.json('/api/meta/endpoints')
    if (r.ok) {
      this._meta = r.data
      this._metaAt = Date.now()
    }
    return this._meta
  }

  async healthy() {
    try {
      const res = await this.request('GET', '/api/meta/endpoints', { retries: 0 })
      return { ok: res.ok, status: res.status, ms: null }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }

  /** Despierta la API al arrancar (Render free = cold start lento) */
  async warmup() {
    const started = Date.now()
    const r = await this.json('/api/meta/endpoints', {}, { retries: 1 })
    const ms = Date.now() - started
    if (r.ok) log.api(`API SiputZX lista (${ms} ms) — ${r.data?.endpoints?.length || '?'} endpoints`)
    else log.warn('La API no respondió al arranque:', r.error || r.message)
    return r.ok
  }

  /** Perfil de un endpoint del catálogo */
  async findEndpoint(name) {
    const meta = await this.meta()
    return meta?.endpoints?.find((e) => e.id === name || e.name === name) || null
  }
}

export const api = new SiputZXApi()
export default api
