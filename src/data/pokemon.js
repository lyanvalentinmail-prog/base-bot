/**
 *  src/data/pokemon.js — Pokédex de Kanto (151) para el minijuego
 *  formato: [id, nombre, tipos, hp, atk, def, spe, nivelEvo|null, evoA|null]
 */
export const TYPES = {
  planta: { emoji: '🌿', color: '#3fa129' },
  veneno: { emoji: '☠️', color: '#9141cb' },
  fuego: { emoji: '🔥', color: '#e62829' },
  volador: { emoji: '🕊️', color: '#81b9ef' },
  agua: { emoji: '💧', color: '#2980ef' },
  bicho: { emoji: '🐛', color: '#91a119' },
  normal: { emoji: '⭐', color: '#9fa19f' },
  electrico: { emoji: '⚡', color: '#fac000' },
  tierra: { emoji: '⛰️', color: '#915121' },
  hada: { emoji: '🎀', color: '#ef70ef' },
  lucha: { emoji: '🥊', color: '#ff8000' },
  psiquico: { emoji: '🌀', color: '#ef4179' },
  roca: { emoji: '🪨', color: '#afa981' },
  hielo: { emoji: '❄️', color: '#3dcef3' },
  fantasma: { emoji: '👻', color: '#704170' },
  dragon: { emoji: '🐉', color: '#5060e1' },
  acero: { emoji: '⚙️', color: '#60a1b8' },
  siniestro: { emoji: '🌑', color: '#50413f' }
}

// prettier-ignore
const RAW = [
  [1,'Bulbasaur',['planta','veneno'],45,49,49,45,16,2],[2,'Ivysaur',['planta','veneno'],60,62,63,60,32,3],[3,'Venusaur',['planta','veneno'],80,82,83,80,null,null],
  [4,'Charmander',['fuego'],39,52,43,65,16,5],[5,'Charmeleon',['fuego'],58,64,58,80,36,6],[6,'Charizard',['fuego','volador'],78,84,78,100,null,null],
  [7,'Squirtle',['agua'],44,48,65,43,16,8],[8,'Wartortle',['agua'],59,63,80,58,36,9],[9,'Blastoise',['agua'],79,83,100,78,null,null],
  [10,'Caterpie',['bicho'],45,30,35,45,7,11],[11,'Metapod',['bicho'],50,20,55,30,10,12],[12,'Butterfree',['bicho','volador'],60,45,50,70,null,null],
  [13,'Weedle',['bicho','veneno'],40,35,30,50,7,14],[14,'Kakuna',['bicho','veneno'],45,25,50,35,10,15],[15,'Beedrill',['bicho','veneno'],65,90,40,75,null,null],
  [16,'Pidgey',['normal','volador'],40,45,40,56,18,17],[17,'Pidgeotto',['normal','volador'],63,60,55,71,36,18],[18,'Pidgeot',['normal','volador'],83,80,75,101,null,null],
  [19,'Rattata',['normal'],30,56,35,72,20,20],[20,'Raticate',['normal'],55,81,60,97,null,null],
  [21,'Spearow',['normal','volador'],40,60,30,70,20,22],[22,'Fearow',['normal','volador'],65,90,65,100,null,null],
  [23,'Ekans',['veneno'],35,60,44,55,22,24],[24,'Arbok',['veneno'],60,95,69,80,null,null],
  [25,'Pikachu',['electrico'],35,55,40,90,30,26],[26,'Raichu',['electrico'],60,90,55,110,null,null],
  [27,'Sandshrew',['tierra'],50,75,85,40,22,28],[28,'Sandslash',['tierra'],75,100,110,65,null,null],
  [29,'Nidoran♀',['veneno'],55,47,52,41,16,30],[30,'Nidorina',['veneno'],70,62,67,56,32,31],[31,'Nidoqueen',['veneno','tierra'],90,92,87,76,null,null],
  [32,'Nidoran♂',['veneno'],46,57,40,50,16,33],[33,'Nidorino',['veneno'],61,72,57,65,32,34],[34,'Nidoking',['veneno','tierra'],81,102,77,85,null,null],
  [35,'Clefairy',['hada'],70,45,48,35,36,36],[36,'Clefable',['hada'],95,70,73,60,null,null],
  [37,'Vulpix',['fuego'],38,41,40,65,30,38],[38,'Ninetales',['fuego'],73,76,75,100,null,null],
  [39,'Jigglypuff',['normal','hada'],115,45,20,20,32,40],[40,'Wigglytuff',['normal','hada'],140,70,45,45,null,null],
  [41,'Zubat',['veneno','volador'],40,45,35,55,22,42],[42,'Golbat',['veneno','volador'],75,80,70,90,null,null],
  [43,'Oddish',['planta','veneno'],45,50,55,30,21,44],[44,'Gloom',['planta','veneno'],60,65,70,40,30,45],[45,'Vileplume',['planta','veneno'],75,80,85,50,null,null],
  [46,'Paras',['bicho','planta'],35,70,55,25,24,47],[47,'Parasect',['bicho','planta'],60,95,80,30,null,null],
  [48,'Venonat',['bicho','veneno'],60,55,50,45,31,49],[49,'Venomoth',['bicho','veneno'],70,65,60,90,null,null],
  [50,'Diglett',['tierra'],10,55,25,95,26,51],[51,'Dugtrio',['tierra'],35,100,50,120,null,null],
  [52,'Meowth',['normal'],40,45,35,90,28,53],[53,'Persian',['normal'],65,70,60,115,null,null],
  [54,'Psyduck',['agua'],50,52,48,55,33,55],[55,'Golduck',['agua'],80,82,78,85,null,null],
  [56,'Mankey',['lucha'],40,80,35,70,28,57],[57,'Primeape',['lucha'],65,105,60,95,null,null],
  [58,'Growlithe',['fuego'],55,70,45,60,30,59],[59,'Arcanine',['fuego'],90,110,80,95,null,null],
  [60,'Poliwag',['agua'],40,50,40,90,25,61],[61,'Poliwhirl',['agua'],65,65,65,90,37,62],[62,'Poliwrath',['agua','lucha'],90,95,95,70,null,null],
  [63,'Abra',['psiquico'],25,20,15,90,16,64],[64,'Kadabra',['psiquico'],40,35,30,105,36,65],[65,'Alakazam',['psiquico'],55,50,45,120,null,null],
  [66,'Machop',['lucha'],70,80,50,35,28,67],[67,'Machoke',['lucha'],80,100,70,45,42,68],[68,'Machamp',['lucha'],90,130,80,55,null,null],
  [69,'Bellsprout',['planta','veneno'],50,75,35,40,21,70],[70,'Weepinbell',['planta','veneno'],65,90,50,55,30,71],[71,'Victreebel',['planta','veneno'],80,105,65,70,null,null],
  [72,'Tentacool',['agua','veneno'],40,40,35,70,30,73],[73,'Tentacruel',['agua','veneno'],80,70,65,100,null,null],
  [74,'Geodude',['roca','tierra'],40,80,100,20,25,75],[75,'Graveler',['roca','tierra'],55,95,115,35,40,76],[76,'Golem',['roca','tierra'],80,120,130,45,null,null],
  [77,'Ponyta',['fuego'],50,85,55,90,40,78],[78,'Rapidash',['fuego'],65,100,70,105,null,null],
  [79,'Slowpoke',['agua','psiquico'],90,65,65,15,37,80],[80,'Slowbro',['agua','psiquico'],95,75,110,30,null,null],
  [81,'Magnemite',['electrico','acero'],25,35,70,45,30,82],[82,'Magneton',['electrico','acero'],50,60,95,70,null,null],
  [83,'Farfetchd',['normal','volador'],52,90,55,60,null,null],
  [84,'Doduo',['normal','volador'],35,85,45,75,31,85],[85,'Dodrio',['normal','volador'],60,110,70,110,null,null],
  [86,'Seel',['agua'],65,45,55,45,34,87],[87,'Dewgong',['agua','hielo'],90,70,80,70,null,null],
  [88,'Grimer',['veneno'],80,80,50,25,38,89],[89,'Muk',['veneno'],105,105,75,50,null,null],
  [90,'Shellder',['agua'],30,65,100,40,32,91],[91,'Cloyster',['agua','hielo'],50,95,180,70,null,null],
  [92,'Gastly',['fantasma','veneno'],30,35,30,80,25,93],[93,'Haunter',['fantasma','veneno'],45,50,45,95,40,94],[94,'Gengar',['fantasma','veneno'],60,65,60,110,null,null],
  [95,'Onix',['roca','tierra'],35,45,160,70,null,null],
  [96,'Drowzee',['psiquico'],60,48,45,42,26,97],[97,'Hypno',['psiquico'],85,73,70,67,null,null],
  [98,'Krabby',['agua'],30,105,90,50,28,99],[99,'Kingler',['agua'],55,130,115,75,null,null],
  [100,'Voltorb',['electrico'],40,30,50,100,30,101],[101,'Electrode',['electrico'],60,50,70,150,null,null],
  [102,'Exeggcute',['planta','psiquico'],60,40,80,40,34,103],[103,'Exeggutor',['planta','psiquico'],95,95,85,55,null,null],
  [104,'Cubone',['tierra'],50,50,95,35,28,105],[105,'Marowak',['tierra'],60,80,110,45,null,null],
  [106,'Hitmonlee',['lucha'],50,120,53,87,null,null],[107,'Hitmonchan',['lucha'],50,105,79,76,null,null],
  [108,'Lickitung',['normal'],90,55,75,30,null,null],
  [109,'Koffing',['veneno'],40,65,95,35,35,110],[110,'Weezing',['veneno'],65,90,120,60,null,null],
  [111,'Rhyhorn',['tierra','roca'],80,85,95,25,42,112],[112,'Rhydon',['tierra','roca'],105,130,120,40,null,null],
  [113,'Chansey',['normal'],250,5,5,50,null,null],
  [114,'Tangela',['planta'],65,55,115,60,null,null],
  [115,'Kangaskhan',['normal'],105,95,80,90,null,null],
  [116,'Horsea',['agua'],30,40,70,60,32,117],[117,'Seadra',['agua'],55,65,95,85,null,null],
  [118,'Goldeen',['agua'],45,67,60,63,33,119],[119,'Seaking',['agua'],80,92,65,68,null,null],
  [120,'Staryu',['agua'],30,45,55,85,33,121],[121,'Starmie',['agua','psiquico'],60,75,85,115,null,null],
  [122,'Mr. Mime',['psiquico','hada'],40,45,65,90,null,null],
  [123,'Scyther',['bicho','volador'],70,110,80,105,null,null],
  [124,'Jynx',['hielo','psiquico'],65,50,35,95,null,null],
  [125,'Electabuzz',['electrico'],65,83,57,105,null,null],
  [126,'Magmar',['fuego'],65,95,57,93,null,null],
  [127,'Pinsir',['bicho'],65,125,100,85,null,null],
  [128,'Tauros',['normal'],75,100,95,110,null,null],
  [129,'Magikarp',['agua'],20,10,55,80,20,130],[130,'Gyarados',['agua','volador'],95,125,79,81,null,null],
  [131,'Lapras',['agua','hielo'],130,85,80,60,null,null],
  [132,'Ditto',['normal'],48,48,48,48,null,null],
  [133,'Eevee',['normal'],55,55,50,55,null,null],
  [134,'Vaporeon',['agua'],130,65,60,65,null,null],[135,'Jolteon',['electrico'],65,65,60,130,null,null],[136,'Flareon',['fuego'],65,130,60,65,null,null],
  [137,'Porygon',['normal'],65,60,70,40,null,null],
  [138,'Omanyte',['roca','agua'],35,40,100,35,40,139],[139,'Omastar',['roca','agua'],70,60,125,55,null,null],
  [140,'Kabuto',['roca','agua'],30,80,90,55,40,141],[141,'Kabutops',['roca','agua'],60,115,105,80,null,null],
  [142,'Aerodactyl',['roca','volador'],80,105,65,130,null,null],
  [143,'Snorlax',['normal'],160,110,65,30,null,null],
  [144,'Articuno',['hielo','volador'],90,85,100,85,null,null],[145,'Zapdos',['electrico','volador'],90,90,85,100,null,null],[146,'Moltres',['fuego','volador'],90,100,90,90,null,null],
  [147,'Dratini',['dragon'],41,64,45,50,30,148],[148,'Dragonair',['dragon'],61,84,65,70,55,149],[149,'Dragonite',['dragon','volador'],91,134,95,80,null,null],
  [150,'Mewtwo',['psiquico'],106,110,90,130,null,null],[151,'Mew',['psiquico'],100,100,100,100,null,null]
]

export const POKEDEX = RAW.map(([id, name, types, hp, atk, def, spe, evoLevel, evoTo]) => ({
  id,
  name,
  types,
  hp,
  atk,
  def,
  spe,
  evoLevel,
  evoTo,
  bst: hp + atk + def + spe,
  legendary: [144, 145, 146, 150, 151].includes(id)
}))

export const byId = (id) => POKEDEX.find((p) => p.id === Number(id)) || null
export const byName = (name = '') => POKEDEX.find((p) => p.name.toLowerCase() === String(name).toLowerCase().trim()) || null

/** Pokémon salvajes: los más débiles son más comunes */
export function randomWild(maxBst = 999, minBst = 0) {
  const pool = POKEDEX.filter((p) => !p.legendary && p.bst <= maxBst && p.bst >= minBst)
  const weights = pool.map((p) => Math.max(1, 420 - p.bst))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

export const typeEmojis = (types = []) => types.map((t) => TYPES[t]?.emoji || '⭐').join('')
export const typesLabel = (types = []) => types.map((t) => `${TYPES[t]?.emoji || '⭐'} ${t}`).join(' · ')

export const MOVES = {
  planta: 'Látigo Cepa 🌿',
  fuego: 'Ascuas 🔥',
  agua: 'Pistola Agua 💧',
  electrico: 'Impactrueno ⚡',
  normal: 'Placaje 💥',
  bicho: 'Picadura 🐛',
  veneno: 'Picotazo Venenoso ☠️',
  volador: 'Tornado 🕊️',
  tierra: 'Terremoto ⛰️',
  hada: 'Viento Feérico 🎀',
  lucha: 'Golpe Kárate 🥊',
  psiquico: 'Confusión 🌀',
  roca: 'Lanzarrocas 🪨',
  hielo: 'Rayo Hielo ❄️',
  fantasma: 'Lengüetazo 👻',
  dragon: 'Furia Dragón 🐉',
  acero: 'Golpe Metal ⚙️',
  siniestro: 'Mordisco 🌑'
}

export default { POKEDEX, TYPES, MOVES, byId, byName, randomWild, typeEmojis, typesLabel }
