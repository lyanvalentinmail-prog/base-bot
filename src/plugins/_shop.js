/**
 *  src/plugins/_shop.js — tienda compartida (economía, RPG y Pokémon)
 */
export const SHOP = {
  pocion: { label: '🧪 Poción', price: 250, desc: 'ɴᴇᴄᴇsᴀʀɪᴀ ᴘᴀʀᴀ ᴄᴜʀᴀʀ ᴛᴜ ᴘᴏᴋᴇᴍᴏɴ (ʀᴇsᴛᴀᴜʀᴀ 50 ʜᴘ) ᴏ ᴛᴜ ᴠɪᴅᴀ ᴇɴ ᴇʟ ʀᴘɢ' },
  superpocion: { label: '⚗️ Súper poción', price: 700, desc: 'ʀᴇsᴛᴀᴜʀᴀ ᴛᴏᴅᴀ ʟᴀ ᴠɪᴅᴀ ᴅᴇʟ ᴇǫᴜɪᴘᴏ / ᴅᴇʟ ʀᴘɢ', heal: 'full' },
  pokeball: { label: '🔴 Pokéball', price: 350, desc: 'ᴘᴇʀᴍɪᴛᴇ ᴀᴛʀᴀᴘᴀʀ sɪɴ ᴇsᴘᴇʀᴀʀ ᴇʟ ᴛɪᴇᴍᴘᴏ ᴅᴇ ʀᴇᴄᴀʀɢᴀ' },
  espada: { label: '🗡️ Espada', price: 1200, desc: '+15 ᴀᴛǫ', equip: { slot: 'weapon', atk: 15 } },
  escudo: { label: '🛡️ Escudo', price: 1000, desc: '+12 ᴅᴇꜰ', equip: { slot: 'armor', def: 12 } },
  arco: { label: '🏹 Arco élfico', price: 2200, desc: '+28 ᴀᴛǫ', equip: { slot: 'weapon', atk: 28 } },
  martillo: { label: '🔨 Martillo de guerra', price: 3000, desc: '+35 ᴀᴛǫ · -5 ᴅᴇꜰ', equip: { slot: 'weapon', atk: 35, def: -5 } },
  limite5: { label: '⏳ +5 de límite', price: 500, desc: 'sᴜᴍᴀ 5 ᴄᴏᴍᴀɴᴅᴏs ᴀʟ ʟíᴍɪᴛᴇ ᴅᴇ ʜᴏʏ' },
  premium7: { label: '👑 Premium 7 días', price: 5000, desc: 'ʀᴏʟ ᴘʀᴇᴍɪᴜᴍ ᴘᴏʀ ᴜɴᴀ sᴇᴍᴀɴᴀ', role: 'premium', days: 7 },
  vip7: { label: '💎 VIP 7 días', price: 9000, desc: 'ʀᴏʟ ᴠɪᴘ ᴘᴏʀ ᴜɴᴀ sᴇᴍᴀɴᴀ', role: 'vip', days: 7 }
}

export const isEquip = (item) => !!item?.equip

export const findItem = (name = '') => {
  const key = Object.keys(SHOP).find((k) => k.startsWith(String(name).toLowerCase().trim()))
  return key ? { key, ...SHOP[key] } : null
}

export const shopList = () =>
  Object.entries(SHOP)
    .map(([key, it]) => `┊ ✿ *${key}* · ${it.label} — ${it.price} 🪙\n┊    ${it.desc}`)
    .join('\n')

export default SHOP
