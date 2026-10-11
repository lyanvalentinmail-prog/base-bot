/**
 *  Categoría: ᴘᴀɴᴇʟ — administración de usuarios y estadísticas
 */
import config from '../../config.js'
import db from '../core/store.js'
import { formatNumber, jidToNumber, mentionTag, today } from '../core/utils.js'
import { formatLimit, remainingLimit, roleLabel, roleList, roleLimit } from '../core/roles.js'
import { getTarget, parseRole, roleTable } from './_shared.js'

const find = (number) => Object.values(db.data.users).find((u) => u.number === number || u.jid.startsWith(number))

export default [
  {
    name: 'panel',
    alias: ['panelmenu'],
    category: 'panel',
    desc: 'Panel de administración del bot',
    usage: '.panel',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const p = ctx.prefix
      const text = [
        `╭───「 ᴘᴀɴᴇʟ ᴅᴇ ᴄᴏɴᴛʀᴏʟ 」`,
        `│ 👥 ${Object.keys(db.data.users).length} ᴜsᴜᴀʀɪᴏs · 💬 ${Object.keys(db.data.groups).length} ɢʀᴜᴘᴏs`,
        `│`,
        `│ ❏ ɢᴇsᴛɪᴏ́ɴ ᴅᴇ ᴜsᴜᴀʀɪᴏs`,
        `│ ┊ ✿ ${p}sᴇᴛʀᴏʟᴇ @ᴜsᴜᴀʀɪᴏ <ʀᴏʟ>`,
        `│ ┊ ✿ ${p}ᴀᴅᴅʟɪᴍɪᴛ @ᴜsᴜᴀʀɪᴏ <ᴄᴀɴᴛ> · ${p}ʀᴇsᴇᴛʟɪᴍɪᴛ @ᴜsᴜᴀʀɪᴏ`,
        `│ ┊ ✿ ${p}ᴀᴅᴅᴘʀᴇᴍɪᴜᴍ @ᴜsᴜᴀʀɪᴏ <ᴅíᴀs> · ${p}ᴅᴇʟᴘʀᴇᴍɪᴜᴍ @ᴜsᴜᴀʀɪᴏ`,
        `│ ┊ ✿ ${p}ᴀᴅᴅᴠɪᴘ @ᴜsᴜᴀʀɪᴏ <ᴅíᴀs> · ${p}ᴅᴇʟᴠɪᴘ @ᴜsᴜᴀʀɪᴏ`,
        `│ ┊ ✿ ${p}ᴀᴅᴅxᴘ @ᴜsᴜᴀʀɪᴏ <ᴄᴀɴᴛ> · ${p}ᴀᴅᴅᴄᴏɪɴs @ᴜsᴜᴀʀɪᴏ <ᴄᴀɴᴛ>`,
        `│ ┊ ✿ ${p}sᴇᴛᴄᴏɪɴs @ᴜsᴜᴀʀɪᴏ <ᴄᴀɴᴛ> · ${p}ʀᴇsᴇᴛᴜsᴇʀ @ᴜsᴜᴀʀɪᴏ`,
        `│ ┊ ✿ ${p}ᴜsᴇʀ @ᴜsᴜᴀʀɪᴏ · ${p}ᴜsᴇʀs <ᴘáɢɪɴᴀ>`,
        `│`,
        `│ ❏ ᴇsᴛᴀᴅísᴛɪᴄᴀs`,
        `│ ┊ ✿ ${p}sᴛᴀᴛs · ${p}ᴄᴍᴅsᴛᴀᴛs · ${p}ᴛᴏᴘ <ᴄᴏɪɴs|xᴘ|ɴɪᴠᴇʟ>`,
        `│`,
        `│ ❏ ᴍᴏᴅᴇʀᴀᴄɪᴏ́ɴ`,
        `│ ┊ ✿ ${p}ʙᴀɴ @ᴜsᴜᴀʀɪᴏ · ${p}ᴜɴʙᴀɴ @ᴜsᴜᴀʀɪᴏ`,
        `│`,
        `│ ʀᴏʟᴇs : ${roleTable()}`,
        `│`,
        `╰───「 ${ctx.botName} 」`
      ].join('\n')
      return m.reply(text)
    }
  },
  {
    name: 'stats',
    alias: ['estadisticas', 'statsbot'],
    category: 'panel',
    desc: 'Estadísticas generales del bot',
    usage: '.stats',
    owner: true,
    limit: false,
    async run(m, ctx) {
      const users = Object.values(db.data.users)
      const activeToday = users.filter((u) => u.limitDate === today()).length
      const withRole = users.filter((u) => u.role && u.role !== 'newbie').length
      const top = db.top('coins', 3)
      const text = [
        `╭───「 ᴇsᴛᴀᴅísᴛɪᴄᴀs 」`,
        `│ 👥 ᴜsᴜᴀʀɪᴏs : ${users.length}`,
        `│ 🌞 ᴀᴄᴛɪᴠᴏs ʜᴏʏ : ${activeToday}`,
        `│ 🎭 ᴄᴏɴ ʀᴏʟ : ${withRole}`,
        `│ 💬 ɢʀᴜᴘᴏs : ${Object.keys(db.data.groups).length}`,
        `│ 📨 ᴍᴇɴsᴀᴊᴇs : ${formatNumber(db.stats.messages)}`,
        `│ ⌨️ ᴄᴏᴍᴀɴᴅᴏs : ${formatNumber(db.stats.commands)}`,
        `│ 🔁 ɪɴɪᴄɪᴏs ᴅᴇʟ ʙᴏᴛ : ${db.stats.startups}`,
        `│ 🧩 ᴘʟᴜɢɪɴs : ${ctx.pluginList.length}`,
        `│ 🚫 ʙᴀɴᴇᴀᴅᴏs : ${db.data.bans.length}`,
        `│`,
        `│ 💰 ᴛᴏᴘ ᴍᴏɴᴇᴅᴀs`,
        ...top.map((u, i) => `│ ┊ ${['🥇', '🥈', '🥉'][i]} ${u.name || jidToNumber(u.jid)} — ${formatNumber(u.coins + u.bank)}`),
        `│`,
        `╰───「 ${ctx.botName} 」`
      ].join('\n')
      return m.reply(text)
    }
  },
  {
    name: 'cmdsstats',
    alias: ['cmdstats', 'topcomandos'],
    category: 'panel',
    desc: 'Los comandos más usados',
    usage: '.cmdsstats',
    owner: true,
    limit: false,
    async run(m) {
      const usage = Object.entries(db.stats.usage || {}).sort((a, b) => b[1] - a[1]).slice(0, 15)
      if (!usage.length) return m.reply('📭 ᴛᴏᴅᴀᴠíᴀ ɴᴏ ʜᴀʏ ᴜsᴏs ʀᴇɢɪsᴛʀᴀᴅᴏs.')
      const max = usage[0][1]
      const text = usage
        .map(([name, count], i) => {
          const bar = '▰'.repeat(Math.max(1, Math.round((count / max) * 10)))
          return `${String(i + 1).padStart(2, '0')}. ${name.padEnd(14)} ${String(count).padStart(5)} ${bar}`
        })
        .join('\n')
      return m.reply(`📊 *ᴄᴏᴍᴀɴᴅᴏs ᴍᴀ́s ᴜsᴀᴅᴏs*\n\n${text}`)
    }
  },
  {
    name: 'users',
    alias: ['usuarios', 'userlist'],
    category: 'panel',
    desc: 'Lista los usuarios registrados',
    usage: '.users [página]',
    owner: true,
    limit: false,
    async run(m) {
      const list = Object.values(db.data.users).sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
      if (!list.length) return m.reply('📭 ᴛᴏᴅᴀᴠíᴀ ɴᴏ ʜᴀʏ ᴜsᴜᴀʀɪᴏs.')
      const page = Math.max(1, parseInt(m.arg || '1', 10) || 1)
      const perPage = 15
      const slice = list.slice((page - 1) * perPage, page * perPage)
      const totalPages = Math.ceil(list.length / perPage)
      const text = [
        `╭───「 ᴜsᴜᴀʀɪᴏs 」 ᴘᴀ́ɢ ${page}/${totalPages}`,
        `│`,
        ...slice.map(
          (u, i) =>
            `│ ${(page - 1) * perPage + i + 1}. ${u.name || '—'} · ${roleLabel(u.role || 'newbie')}\n│    +${u.number} · xᴘ ${u.xp} · ${formatNumber(u.coins)} 🪙`
        ),
        `│`,
        `│ ᴜsᴀ .ᴜsᴇʀs ${page + 1} ᴘᴀʀᴀ ᴠᴇʀ ᴍᴀ́s`,
        `╰───「 ${config.bot.footer} 」`
      ].join('\n')
      return m.reply(text.slice(0, 6000))
    }
  },
  {
    name: 'user',
    alias: ['getuser', 'veruser'],
    category: 'panel',
    desc: 'Muestra la ficha completa de un usuario',
    usage: '.user @usuario / .user 54911...',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      if (!target) return m.reply('⚙️ ᴜsᴏ : .ᴜsᴇʀ @ᴜsᴜᴀʀɪᴏ ᴏ .ᴜsᴇʀ <ɴúᴍᴇʀᴏ>')
      const u = target.user
      const role = u.role || 'newbie'
      const text = [
        `╭───「 ꜰɪᴄʜᴀ ᴅᴇ ᴜsᴜᴀʀɪᴏ 」`,
        `│ 👤 ${u.name || '—'}`,
        `│ 📞 +${u.number}`,
        `│ 🆔 ${u.jid}`,
        `│ 🎭 ʀᴏʟ : ${roleLabel(role)} (ʟíᴍɪᴛᴇ ${formatLimit(roleLimit(role))}/ᴅíᴀ)`,
        `│ Ⓛ ᴜsᴀᴅᴏ ʜᴏʏ : ${u.limitUsed} · ʀᴇsᴛᴀɴᴛᴇ ${formatLimit(remainingLimit(u, role))}`,
        `│ 📈 ɴɪᴠᴇʟ ${u.level} · xᴘ ${formatNumber(u.xp)}`,
        `│ 🪙 ᴇғᴇᴄᴛɪᴠᴏ ${formatNumber(u.coins)} · 🏦 ʙᴀɴᴄᴏ ${formatNumber(u.bank)}`,
        `│ ⚔️ ʀᴘɢ ɴᴠ ${u.rpg.level} · 🐾 ᴘᴏᴋᴇᴍᴏɴ ${u.pokemon.party.length}`,
        `│ 💬 ᴍsɢ ${formatNumber(u.stats.messages)} · ⌨️ ᴄᴍᴅs ${formatNumber(u.stats.commands)}`,
        `│ ⚠️ ᴀᴅᴠᴇʀᴛᴇɴᴄɪᴀs ${u.warns} · 🚫 ʙᴀɴ ${u.banned ? 'sí' : 'no'}`,
        `│ ⏰ úʟᴛɪᴍᴀ ᴠᴇᴢ : ${u.lastSeen ? new Date(u.lastSeen).toLocaleString('es-ES') : '—'}`,
        `╰───「 ${m.ctx.botName} 」`
      ].join('\n')
      return m.reply(text)
    }
  },
  {
    name: 'setrole',
    alias: ['setrol', 'darrol'],
    category: 'panel',
    desc: 'Asigna un rol manualmente',
    usage: '.setrole @usuario premium',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      const roleArg = m.args.find((a) => parseRole(a) !== undefined)
      const role = parseRole(roleArg || '')
      if (!target || role === undefined) return m.reply(`⚙️ ᴜsᴏ : .sᴇᴛʀᴏʟᴇ @ᴜsᴜᴀʀɪᴏ <ʀᴏʟ>\n${roleTable()}`)
      db.updateUser(target.jid, { role })
      return m.reply(`✅ ${target.user.name || '+' + target.number} ᴀʜᴏʀᴀ ᴛɪᴇɴᴇ ᴇʟ ʀᴏʟ ${roleLabel(role || 'newbie')}`)
    }
  },
  {
    name: 'addlimit',
    alias: ['darlelimite', 'addlimite'],
    category: 'panel',
    desc: 'Suma límite diario a un usuario (se resta de lo usado)',
    usage: '.addlimit @usuario 50',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      const amount = parseInt(m.args.find((a) => /^\d+$/.test(a)) || '0', 10)
      if (!target || !amount) return m.reply('⚙️ ᴜsᴏ : .ᴀᴅᴅʟɪᴍɪᴛ @ᴜsᴜᴀʀɪᴏ 50')
      target.user.limitUsed = Math.max(0, (target.user.limitUsed || 0) - amount)
      db.markDirty()
      return m.reply(`✅ +${amount} ᴅᴇ ʟíᴍɪᴛᴇ ᴘᴀʀᴀ ${mentionTag(target.jid)}\n┊ ʀᴇsᴛᴀɴᴛᴇ : ${formatLimit(remainingLimit(target.user, target.user.role || 'newbie'))}`, {
        mentions: [target.jid]
      })
    }
  },
  {
    name: 'resetlimit',
    alias: ['resetlimite'],
    category: 'panel',
    desc: 'Reinicia el límite diario de un usuario',
    usage: '.resetlimit @usuario',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      if (!target) return m.reply('⚙️ ᴜsᴏ : .ʀᴇsᴇᴛʟɪᴍɪᴛ @ᴜsᴜᴀʀɪᴏ')
      db.updateUser(target.jid, { limitUsed: 0, limitDate: today() })
      return m.reply(`♻️ ʟíᴍɪᴛᴇ ᴅᴇ ${mentionTag(target.jid)} ʀᴇɪɴɪᴄɪᴀᴅᴏ`, { mentions: [target.jid] })
    }
  },
  {
    name: 'addpremium',
    alias: ['darpremium', 'premium'],
    category: 'panel',
    desc: 'Da rol premium por N días',
    usage: '.addpremium @usuario 30',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      const days = parseInt(m.args.find((a) => /^\d+$/.test(a)) || '30', 10)
      if (!target) return m.reply('⚙️ ᴜsᴏ : .ᴀᴅᴅᴘʀᴇᴍɪᴜᴍ @ᴜsᴜᴀʀɪᴏ 30')
      const until = Date.now() + days * 86400000
      db.updateUser(target.jid, { role: 'premium', premiumUntil: until })
      return m.reply(`👑 ${mentionTag(target.jid)} ᴇs ᴘʀᴇᴍɪᴜᴍ ᴘᴏʀ ${days} ᴅíᴀs`, { mentions: [target.jid] })
    }
  },
  {
    name: 'delpremium',
    alias: ['quitarpremium'],
    category: 'panel',
    desc: 'Quita el rol premium',
    usage: '.delpremium @usuario',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      if (!target) return m.reply('⚙️ ᴜsᴏ : .ᴅᴇʟᴘʀᴇᴍɪᴜᴍ @ᴜsᴜᴀʀɪᴏ')
      db.updateUser(target.jid, { role: target.user.role === 'premium' ? null : target.user.role, premiumUntil: null })
      return m.reply(`➖ ᴘʀᴇᴍɪᴜᴍ ʀᴇᴛɪʀᴀᴅᴏ ᴀ ${mentionTag(target.jid)}`, { mentions: [target.jid] })
    }
  },
  {
    name: 'addvip',
    alias: ['darvip', 'vip'],
    category: 'panel',
    desc: 'Da rol VIP por N días',
    usage: '.addvip @usuario 30',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      const days = parseInt(m.args.find((a) => /^\d+$/.test(a)) || '30', 10)
      if (!target) return m.reply('⚙️ ᴜsᴏ : .ᴀᴅᴅᴠɪᴘ @ᴜsᴜᴀʀɪᴏ 30')
      db.updateUser(target.jid, { role: 'vip', vipUntil: Date.now() + days * 86400000 })
      return m.reply(`💎 ${mentionTag(target.jid)} ᴇs ᴠɪᴘ ᴘᴏʀ ${days} ᴅíᴀs`, { mentions: [target.jid] })
    }
  },
  {
    name: 'delvip',
    alias: ['quitarvip'],
    category: 'panel',
    desc: 'Quita el rol VIP',
    usage: '.delvip @usuario',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      if (!target) return m.reply('⚙️ ᴜsᴏ : .ᴅᴇʟᴠɪᴘ @ᴜsᴜᴀʀɪᴏ')
      db.updateUser(target.jid, { role: target.user.role === 'vip' ? null : target.user.role, vipUntil: null })
      return m.reply(`➖ ᴠɪᴘ ʀᴇᴛɪʀᴀᴅᴏ ᴀ ${mentionTag(target.jid)}`, { mentions: [target.jid] })
    }
  },
  {
    name: 'addxp',
    alias: ['darxp'],
    category: 'panel',
    desc: 'Suma XP a un usuario',
    usage: '.addxp @usuario 500',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      const amount = parseInt(m.args.find((a) => /^-?\d+$/.test(a)) || '0', 10)
      if (!target || !amount) return m.reply('⚙️ ᴜsᴏ : .ᴀᴅᴅxᴘ @ᴜsᴜᴀʀɪᴏ 500')
      target.user.xp = Math.max(0, (target.user.xp || 0) + amount)
      target.user.level = (await import('../core/roles.js')).levelFromXp(target.user.xp)
      db.markDirty()
      return m.reply(`✨ ${amount > 0 ? '+' : ''}${amount} xᴘ ᴘᴀʀᴀ ${mentionTag(target.jid)} (ɴɪᴠᴇʟ ${target.user.level})`, {
        mentions: [target.jid]
      })
    }
  },
  {
    name: 'addcoins',
    alias: ['dardinero', 'addmoney'],
    category: 'panel',
    desc: 'Suma monedas a un usuario',
    usage: '.addcoins @usuario 5000',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      const amount = parseInt(m.args.find((a) => /^-?\d+$/.test(a)) || '0', 10)
      if (!target || !amount) return m.reply('⚙️ ᴜsᴏ : .ᴀᴅᴅᴄᴏɪɴs @ᴜsᴜᴀʀɪᴏ 5000')
      target.user.coins = Math.max(0, (target.user.coins || 0) + amount)
      db.markDirty()
      return m.reply(`${amount > 0 ? '➕' : '➖'} ${formatNumber(Math.abs(amount))} 🪙 ᴘᴀʀᴀ ${mentionTag(target.jid)}`, {
        mentions: [target.jid]
      })
    }
  },
  {
    name: 'setcoins',
    alias: ['poncoins', 'setmoney'],
    category: 'panel',
    desc: 'Establece las monedas exactas de un usuario',
    usage: '.setcoins @usuario 1000',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      const amount = parseInt(m.args.find((a) => /^\d+$/.test(a)) || '', 10)
      if (!target || Number.isNaN(amount)) return m.reply('⚙️ ᴜsᴏ : .sᴇᴛᴄᴏɪɴs @ᴜsᴜᴀʀɪᴏ 1000')
      db.updateUser(target.jid, { coins: amount })
      return m.reply(`🪙 ${mentionTag(target.jid)} ᴀʜᴏʀᴀ ᴛɪᴇɴᴇ ${formatNumber(amount)} ᴍᴏɴᴇᴅᴀs`, { mentions: [target.jid] })
    }
  },
  {
    name: 'resetuser',
    alias: ['borraruser', 'resetear'],
    category: 'panel',
    desc: 'Reinicia por completo a un usuario',
    usage: '.resetuser @usuario',
    owner: true,
    limit: false,
    async run(m) {
      const target = getTarget(m)
      if (!target) return m.reply('⚙️ ᴜsᴏ : .ʀᴇsᴇᴛᴜsᴇʀ @ᴜsᴜᴀʀɪᴏ')
      delete db.data.users[target.jid]
      db.user(target.jid)
      db.markDirty()
      return m.reply(`♻️ ᴜsᴜᴀʀɪᴏ ${mentionTag(target.jid)} ʀᴇɪɴɪᴄɪᴀᴅᴏ ᴀ ᴄᴇʀᴏ`, { mentions: [target.jid] })
    }
  },
  {
    name: 'top',
    alias: ['ranking', 'topglobal'],
    category: 'panel',
    desc: 'Ranking del bot: coins, xp, nivel, rpg, mensajes',
    usage: '.top coins',
    limit: false,
    async run(m, ctx) {
      const metric = (m.arg || 'coins').toLowerCase()
      const metrics = { coins: '🪙 ᴍᴏɴᴇᴅᴀs', money: '🪙 ᴍᴏɴᴇᴅᴀs', xp: '✨ xᴘ', nivel: '📈 ɴɪᴠᴇʟ', level: '📈 ɴɪᴠᴇʟ', rpg: '⚔️ ʀᴘɢ', msgs: '💬 ᴍᴇɴsᴀᴊᴇs', commands: '⌨️ ᴄᴏᴍᴀɴᴅᴏs', pokemon: '🐾 ᴘᴏᴋᴇᴍᴏɴ' }
      const key = Object.keys(metrics).find((k) => k.startsWith(metric)) || 'coins'
      const list = db.top(key === 'msgs' ? 'commands' : key, 10)
      const text = [
        `╭───「 ᴛᴏᴘ ${metrics[key]} 」`,
        `│`,
        ...list.map((u, i) => {
          const value =
            key === 'coins' || key === 'money'
              ? formatNumber((u.coins || 0) + (u.bank || 0))
              : key === 'xp'
                ? formatNumber(u.xp)
                : key === 'nivel' || key === 'level'
                  ? u.level
                  : key === 'rpg'
                    ? u.rpg.level
                    : key === 'pokemon'
                      ? u.pokemon.party.length
                      : formatNumber(u.stats.commands)
          return `│ ${['🥇', '🥈', '🥉'][i] || `#${i + 1}`} ${u.name || jidToNumber(u.jid)} — ${value}`
        }),
        `│`,
        `│ ꜰɪʟᴛʀᴏs : ${Object.keys(metrics).join(' · ')}`,
        `╰───「 ${ctx.botName} 」`
      ].join('\n')
      return m.reply(text)
    }
  }
]
