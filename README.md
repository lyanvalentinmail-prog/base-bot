# 🟢 bot base — Bot de WhatsApp (Baileys · Termux · API SiputZX)

Bot de WhatsApp en **Node.js** con **[Baileys](https://github.com/WhiskeySockets/Baileys)**, que se conecta con **código de emparejamiento (pairing code)** o **código QR**, funciona en **Termux (Android)**, y usa todos los endpoints de tu API **[SiputZX](https://siputzx-api.onrender.com/)** (`https://siputzx-api.onrender.com`).

Incluye **205 comandos** en las **18 categorías** del menú, sistema de **roles y límites diarios**, **tarjetas canvas** propias (bienvenida, despedida, ship, level up, perfil), **economía, RPG y Pokémon** (Pokédex de Kanto completa), protección de grupos y un panel de dueño.

```
ʜᴏʟᴀ, sᴏʏ bot base,
ɢʀᴀᴄɪᴀs ᴘᴏʀ ɪɴᴠɪᴛᴀʀᴍᴇ ᴀʟ ɢʀᴜᴘᴏ — sᴇʟᴇᴄᴄɪᴏɴᴀ ᴇʟ ᴍᴇɴᴜ́ ǫᴜᴇ ɴᴇᴄᴇsɪᴛᴇs ᴀʙᴀᴊᴏ.
⋮
❏ ᴍᴇɴᴜ   ❏ ɪɴғᴏ   ❏ ᴏᴡɴᴇʀ   ❏ ᴘᴀɴᴇʟ   ❏ ɢʀᴏᴜᴘ   ❏ ᴛᴏᴏʟs   ❏ sᴇᴀʀᴄʜ   ❏ ᴀɪ
❏ ᴅᴏᴡɴʟᴏᴀᴅs   ❏ sᴛɪᴄᴋᴇʀs   ❏ ɪᴍᴀɢᴇ   ❏ ᴀᴜᴅɪᴏ   ❏ ᴀɴɪᴍᴇ   ❏ ғᴜɴ
❏ ɢᴀᴍᴇs   ❏ ᴇᴄᴏɴᴏᴍʏ   ❏ ʀᴘɢ   ❏ ᴘᴏᴋᴇᴍᴏɴ
```

---

## ✨ Características

| | |
|---|---|
| 🔗 **Doble conexión** | Código de emparejamiento (8 dígitos) **o** QR escaneable, con detección automática de sesión guardada |
| 🤖 **Baileys 6.7** | multidispositivo, reconexión automática, manejo de sesión en `data/session` |
| 🌐 **API SiputZX** | herramientas, buscadores, IA, descargas, stickers, imágenes, audio, anime y **15 juegos** |
| 🖼️ **Canvas propio** | tarjetas de bienvenida/despedida/ship/level-up/perfil generadas localmente (`@napi-rs/canvas`) con fondos incluidos, y respaldo automático por API si no hay canvas |
| 🎭 **Roles y límites** | ɴᴇᴡʙɪᴇ · ᴍᴀsᴛᴇʀ · ᴘʀᴇᴍɪᴜᴍ · ᴠɪᴘ · ᴀᴅᴍɪɴ · ᴏᴡɴᴇʀ con límites diarios y XP |
| 💰 **Economía / RPG / Pokémon** | daily, work, mine, fish, rob, banco, tienda, mazmorras, jefes, Pokédex 151 con tablas de tipos |
| 🛡️ **Protección de grupos** | antilink, antidelete, antispam, cierre del grupo, advertencias con expulsión 3/3, bienvenidas |
| ⚙️ **Panel de dueño** | setrole, addpremium, addvip, addlimit, ban, broadcast, join/leave, exec, reload, restart, logout |
| 🧪 **Tests incluidos** | `npm test` ejecuta los 205 comandos con WhatsApp y API simulados (no se conecta a nada) |

---

## 📋 Requisitos

- **Node.js 20 o superior** (en Termux: `pkg install nodejs`)
- Conexión a internet
- Un número de WhatsApp para el bot (**recomendado: otro número, no tu principal**)
- Opcional (Windows/Linux/macOS): no hace falta nada más — `@napi-rs/canvas` es opcional

---

## 📱 Instalación en Termux (paso a paso)

### Opción A — script automático (recomendado)

```bash
pkg update && pkg install -y git
git clone https://github.com/lyanvalentinmail-prog/base-bot.git
cd base-bot
bash scripts/termux-install.sh
```

El script instala Node, las dependencias, genera los fondos y corre las pruebas.

### Opción B — manual

```bash
# 1) paquetes base
pkg update && pkg upgrade -y
pkg install -y nodejs git
node -v          # debe decir v20.x o superior

# 2) descargar el bot
git clone https://github.com/lyanvalentinmail-prog/base-bot.git
cd base-bot

# 3) dependencias
npm install --no-audit --no-fund
#   si el canvas nativo da problemas en tu teléfono:
#   npm install --no-audit --no-fund --omit=optional

# 4) (opcional) generar/rehacer los fondos de las tarjetas
node scripts/make-canvas.js

# 5) configura tu número de owner
nano config.js      # bot.owners: ['5491112345678']
```

> 💡 En Termux, `npm install` puede tardar unos minutos la primera vez (compila módulos nativos). Si aparece `--omit=optional`, el bot sigue funcionando: en ese caso las tarjetas las genera la API.

### Actualizar el bot a la última versión

```bash
cd ~/base-bot
bash scripts/update.sh        # trae los cambios, reinstala y corre las pruebas
```

O a mano:

```bash
cd ~/base-bot
git pull origin arena/e8b64dd1-s   # o: git pull origin main
npm install
```

> 🔁 **¿Clonaste cuando el repo se llamaba `---s-`?** No pasa nada (GitHub redirige), pero
> conviene actualizar la dirección:
> ```bash
> cd ~/---s-                     # carpeta con el nombre viejo
> git remote set-url origin https://github.com/lyanvalentinmail-prog/base-bot.git
> git pull origin arena/e8b64dd1-s
> ```
> Y si querés renombrar la carpeta local: `mv ~/---s- ~/base-bot`

> ⚠️ El comando del bot vive en la rama **`arena/e8b64dd1-s`**. Si clonaste y `npm start` da
> «Cannot find module», casi seguro estás en `main`: haz `git checkout arena/e8b64dd1-s`.

### Mantener el bot vivo en Android

```bash
termux-wake-lock          # evita que Android duerma el proceso
pkg install tmux
tmux new -s bot           # dentro de tmux:
npm start                 #   Ctrl+B y luego D  → salir sin cerrar el bot
tmux attach -t bot        # volver a la sesión del bot
```

También puedes usar **Termux:Boot** y un script en `~/.termux/boot/` para arrancarlo al reiniciar el teléfono.

---

## 💻 Instalación en PC (Linux / Windows / macOS)

```bash
git clone https://github.com/lyanvalentinmail-prog/base-bot.git
cd base-bot
npm install
npm start
```

---

## ⚙️ Configuración (`config.js`)

Todo lo importante está en **`config.js`**:

| Clave | Qué hace |
|---|---|
| `bot.name` | Nombre del bot (aparece en el menú: «ʜᴏʟᴀ, sᴏʏ …») |
| `bot.prefix` | Prefijo de comandos (`.`) — se puede cambiar en caliente con `.setprefix` |
| `bot.owners` | Números con permisos totales: `['5491112345678']` (con código de país, sin `+`) |
| `bot.autoOwnerOnPairing` | Añade el número vinculado como owner automáticamente (`true`) |
| `login.mode` | `'ask'` (pregunta al vincular), `'qr'` o `'pairing'` |
| `login.countryCode` | Código de país para números cortos al pedir el pairing (ej. `'54'`) |
| `api.baseUrl` | URL de tu API (`https://siputzx-api.onrender.com`) |
| `api.timeout` / `api.retries` | Los dejamos altos porque Render (plan gratis) se duerme: **cold start lento** |
| `roles.*.limit` | Límite diario por rol |
| `economy.*` / `xp.*` | Recompensas de monedas, XP y probabilidad de robo |
| `behavior.selfMode` | Solo owners pueden usar el bot |
| `behavior.only` | `'both'` / `'group'` / `'private'` |
| `canvas.preferred` | `'auto'` (local → API), `'local'` o `'api'` |
| `group.welcome` / `group.goodbye` | Bienvenidas y despedidas con tarjeta |
| `aiFallback` | Opcional: si tu API no tiene `OPENAI_API_KEY`, puedes poner tu propia clave de OpenAI para `.ai` e `.imagine` |

---

## 🔗 Cómo vincular el bot

### 📱 Con código de emparejamiento (pairing code)

```bash
npm run pair
# o indicando el número directamente:
npm run pair 5491112345678
```

1. El bot pide el número del bot (con código de país, sin `+`).
2. Aparece un **código de 8 dígitos** en la terminal.
3. En el teléfono del bot: **WhatsApp → Ajustes → Dispositivos vinculados → Vincular un dispositivo → Vincular con número de teléfono**.
4. Escribe el código. ¡Listo! La sesión queda guardada en `data/session` y no habrá que repetirlo.

> Si el código caduca, vuelve a ejecutar `npm run pair`.

### 🔳 Con código QR

```bash
npm run qr
```

1. La terminal muestra un QR (se regenera solo si caduca).
2. **WhatsApp → Dispositivos vinculados → Vincular un dispositivo** y escanea.

### Modo interactivo (sin argumentos)

```bash
npm start
```

Si no hay sesión guardada, el bot te pregunta: `1) 📱 Pairing code` o `2) 🔳 QR`.

### Otros comandos útiles

```bash
node index.js --help      # ayuda
node index.js --logout    # borra la sesión guardada (para vincular otro número)
node index.js --debug     # logs detallados
node index.js --test      # pruebas internas sin conectar WhatsApp
npm test                  # pruebas internas (205 comandos)
```

---

## 🎮 Comandos

Los límites (Ⓛ) se consumen **por uso**; los owners (Ⓞ) tienen todo en ∞.

### ❏ ᴍᴇɴᴜ
`.menu [categoría]` · `.allmenu` · `.ping` · `.roles` · `.categorias`

### ❏ ɪɴғᴏ
`.bot` · `.perfil` · `.grupo` · `.owner` · `.report <msg>` · `.apistatus` · `.uptime` · `.id` · `.afk [motivo]`

### ❏ ᴏᴡɴᴇʀ Ⓞ
`.self` · `.autotype` · `.autoread` · `.chatbot` · `.setprefix` · `.setbotname` · `.addowner` · `.delowner` · `.owners` · `.reload` · `.save` · `.restart` · `.shutdown` · `.logout` · `.exec` · `.bc` · `.join` · `.leave` · `.grupos` · `.setpp` · `.setbio` · `.ban` · `.unban` · `.files` · `.clearcache`

### ❏ ᴘᴀɴᴇʟ Ⓞ
`.panel` · `.stats` · `.cmdsstats` · `.users` · `.user` · `.setrole` · `.addlimit` · `.resetlimit` · `.addpremium` · `.delpremium` · `.addvip` · `.delvip` · `.addxp` · `.addcoins` · `.setcoins` · `.resetuser` · `.top [coins|xp|nivel|rpg]`

### ❏ ɢʀᴏᴜᴘ Ⓐ
`.link` · `.revoke` · `.kick` · `.promote` · `.demote` · `.tagall` · `.hidetag` · `.setname` · `.setdesc` · `.seticon` · `.mute` / `.unmute` · `.welcome` · `.despedida` · `.antilink` · `.antidelete` · `.antispam` · `.warn` · `.unwarn` · `.warns` · `.resetwarns` · `.admins` · `.miembros` · `.everyone`

### ❏ ᴛᴏᴏʟs
`.qr` Ⓛ · `.calc` Ⓛ · `.tr <idioma> <texto>` Ⓛ · `.shorturl` Ⓛ · `.tinyurl` Ⓛ · `.hash` · `.base64 enc/dec` · `.password` · `.uuid` · `.style <tipo> <texto>` · `.readmore` · `.ip` Ⓞ · `.idiomas`

### ❏ sᴇᴀʀᴄʜ
`.google` Ⓛ · `.wiki` Ⓛ · `.imgsearch` Ⓛ · `.pinterest` Ⓛ · `.lyrics` Ⓛ · `.spotify` Ⓛ · `.play` Ⓛ · `.github` Ⓛ

### ❏ ᴀɪ
`.ai <pregunta>` Ⓛ · `.blackbox` Ⓛ · `.imagine <prompt>` Ⓛ · `.removebg` Ⓛ · `.enhance` Ⓛ · `.aiclear`
> Con `.chatbot on` el bot responde con IA a los mensajes que no son comandos (en grupos solo si lo mencionan).

### ❏ ᴅᴏᴡɴʟᴏᴀᴅs
`.tiktok` · `.instagram` · `.facebook` · `.twitter` · `.youtube [360|720]` · `.ytmp3` · `.ytmp4` · `.dlhelp`
> ⚠️ Estos endpoints necesitan **yt-dlp** instalado en tu servidor (ver más abajo). `.dlhelp` te muestra el estado.

### ❏ sᴛɪᴄᴋᴇʀs
`.sticker` · `.brat` · `.brathd` · `.bratv` · `.ttp` · `.attp` · `.toimg` · `.emojimix`

### ❏ ɪᴍᴀɢᴇ
`.blur` · `.darkness` · `.pixel` · `.wanted` · `.trigger` · `.beautiful` (respondiendo a una imagen o con enlace)

### ❏ ᴀᴜᴅɪᴏ
`.tts <texto> [idioma]` · `.reversa` · `.robot` · `.zueira` · `.bass` · `.efectos`

### ❏ ᴀɴɪᴍᴇ
`.anime` · `.manga` · `.waifu` · `.neko` · `.fraseanime`

### ❏ ғᴜɴ
`.gay @user` 🖼️ · `.iq @user` 🖼️ · `.ship @a @b` 🖼️ · `.8ball` · `.rate` · `.reverse` · `.verdad` · `.reto` · `.piropo` · `.dado` · `.moneda` · `.chiste`

### ❏ ɢᴀᴍᴇs
`.ttt <1-9>` · `.ppt piedra` · `.adivina <n>` · `.ahorcado <letra>` · `.wordle <palabra>` · `.mates <n>` · `.trivia` · `.quiz <categoría>` · `.acertijo` · `.memoria <0-15>` · `.serpiente <dirección>` · `.2048 <dirección>` · `.tragamonedas <apuesta>` · `.juegos` · `.terminar`

### ❏ ᴇᴄᴏɴᴏᴍʏ
`.bal` · `.daily` · `.work` · `.crime` · `.mine` · `.fish` · `.rob` · `.pay` · `.dep` / `.ret` · `.shop` · `.buy` · `.inv` · `.economy`

### ❏ ʀᴘɢ
`.rpg` · `.aventura` · `.cazar` · `.mazmorra` · `.jefe` · `.curar` · `.entrenar` · `.equipar` · `.usar` · `.rpgshop`

### ❏ ᴘᴏᴋᴇᴍᴏɴ
`.pokedex <nombre|nº>` · `.atrapar` · `.equipo` · `.box` · `.pcinfo <n>` · `.pelear` · `.pccurar` · `.liberar <n>` · `.pctop` · `.pokealeatorio` · `.pokehelp`

---

## 🎭 Roles y límites diarios

| Rol | Límite por día | Multiplicador de XP |
|---|---|---|
| ɴᴇᴡʙɪᴇ ツ | 25 | ×1 |
| ᴍᴀsᴛᴇʀ ツツ | 50 | ×1.2 |
| ᴘʀᴇᴍɪᴜᴍ 🜲 | 100 | ×1.5 |
| ᴠͥɪͣᴘͫ✮⃝🜲 | 125 | ×2 |
| ᴀᴅᴍɪɴ ツ | 100 | ×1.3 |
| ᴏᴡɴᴇʀ 🜲🜲 | ∞ | ×3 |

- Los límites se **renuevan a las 00:00** (hora del dispositivo).
- Los **admins de un grupo** obtienen el rol ᴀᴅᴍɪɴ automáticamente en ese grupo.
- Puedes subir de rol con `.addpremium`, `.addvip` (panel) o comprándolo en `.shop` con monedas.
- Comandos sin límite llevan `limit: false` y no consumen nada (menús, juegos de consulta, economía básica…).

---

## 🌐 La API SiputZX — qué usa cada comando

Base: **`https://siputzx-api.onrender.com`** · catálogo: `/api/meta/endpoints`

| Categoría del bot | Endpoints usados |
|---|---|
| ᴛᴏᴏʟs | `/api/qr` · `/api/calculate` · `/api/translate` · `/api/shorturl` · `/api/tinyurl` |
| sᴇᴀʀᴄʜ | `/api/search/google` · `/api/search/wikipedia` · `/api/search/images` · `/api/search/pinterest` · `/api/music/lyrics` · `/api/music/play` · `/api/music/spotify` |
| ᴀɪ | `/api/chatgpt` · `/api/blackbox` · `/api/imagine` · `/api/removebg` · `/api/enhance` |
| ᴅᴏᴡɴʟᴏᴀᴅs | `/api/tiktok` · `/api/instagram` · `/api/facebook` · `/api/twitter` · `/api/youtube` |
| sᴛɪᴄᴋᴇʀs | `/api/sticker` · `/api/brat` · `/api/brathd` · `/api/bratv` · `/api/ttp` · `/api/attp` |
| ɪᴍᴀɢᴇ | `/api/blur` · `/api/darkness` · `/api/pixel` · `/api/wanted` · `/api/trigger` · `/api/beautiful` |
| ᴀᴜᴅɪᴏ | `/api/tts` · `/api/audio/reverse` · `/api/audio/robot` · `/api/audio/zueira` · `/api/audio/bass` |
| ᴀɴɪᴍᴇ | `/api/anime` · `/api/manga` · `/api/waifu` · `/api/neko` · `/api/quoteanime` |
| ғᴜɴ | `/api/dice` · `/api/coinflip` |
| ɢᴀᴍᴇs | `/api/tictactoe` · `/api/ptt` · `/api/guessnumber` · `/api/hangman` · `/api/wordle` · `/api/mathquiz` · `/api/trivia` · `/api/quiz` · `/api/riddle` · `/api/memory` · `/api/snake` · `/api/2048` · `/api/slot` |
| ᴄᴀɴᴠᴀs (respaldo) | `/api/welcome` · `/api/goodbye` · `/api/ship` · `/api/gay` · `/api/iqc` |

### Activar los endpoints que piden credenciales

En el panel de **Render → tu servicio → Environment**, añade las claves que quieras usar y redespliega:

```
OPENAI_API_KEY          → .ai y .imagine
BLACKBOX_API_KEY        → .blackbox
REMOVEBG_API_KEY        → .removebg
TINYURL_API_KEY         → .tinyurl
GOOGLE_API_KEY + GOOGLE_CSE_ID   → .google
SPOTIFY_CLIENT_ID + SECRET       → .spotify
SOUNDCLOUD_CLIENT_ID             → (música)
GOOGLE_VISION_API_KEY            → reverse image
```

Para las **descargas** y los **efectos de audio** necesitas instalar los servicios en el servidor (Render → Settings → **Build Command**):

```bash
apt-get update && apt-get install -y python3 python3-pip ffmpeg && pip install yt-dlp
```

Comprueba el estado real de cada endpoint con **`.apistatus`** y **`.dlhelp`**. Si un endpoint no está disponible, el bot te avisa con un mensaje claro (nunca inventa datos).

> ⏰ El plan gratis de Render **duerme** la API: la primera petición puede tardar ~30 segundos. El bot calienta la API al arrancar y tiene reintentos automáticos para disimularlo.

---

## 🖼️ Tarjetas canvas (bienvenida, despedida, ship, level up, perfil)

El bot dibuja las tarjetas **localmente** con `@napi-rs/canvas` usando los fondos de **`assets/canvas/`**:

```
assets/canvas/welcome.jpg    → tarjeta de bienvenida
assets/canvas/despedida.jpg  → tarjeta de despedida
assets/canvas/ship.jpg       → .ship (compatibilidad)
assets/canvas/gay.jpg        → .gay (porcentaje arcoíris)
assets/canvas/levelup.jpg    → subir de nivel
assets/canvas/levelup2.jpg   → .iq
assets/canvas/rank.jpg       → .perfil
```

**Puedes reemplazarlos por tus propias imágenes** (por ejemplo los PNG de tu Drive): ponlas en `assets/canvas/` con esos nombres, en `.png` o `.jpg`, de **1024×450 o mayor** y apaisadas. El bot recorta y oscurece lo necesario para que el texto siempre se lea.

- ¿No tienes canvas nativo instalado? Entonces las tarjetas se generan con los endpoints `/api/welcome`, `/api/goodbye`, `/api/ship`, `/api/gay` e `/api/iqc` de tu API (esas imágenes viven en tu servidor).
- Forzar un motor: `canvas.preferred: 'local'` o `'api'` en `config.js`.
- Regenerar los fondos incluidos: `node scripts/make-canvas.js --force`.

---

## 🗂️ Estructura del proyecto

```
index.js               arranque, CLI y contexto compartido
config.js              TODA la configuración
assets/canvas/         fondos de las tarjetas (reemplazables)
scripts/
  termux-install.sh    instalación automática en Termux
  make-canvas.js       genera los fondos
src/core/
  api.js               cliente de la API SiputZX
  canvas.js            motor de tarjetas (local + API)
  connection.js        conexión Baileys: pairing code y QR
  handler.js           antispam, permisos, límites, XP, ejecución
  message.js           mensajes cómodos para los plugins (m.reply, m.download…)
  events.js            bienvenidas, antidelete, llamadas, level up
  loader.js            carga de plugins
  menu.js              menús (principal, categoría, allmenu, roles)
  roles.js             roles, límites y XP
  store.js             base de datos JSON con backups
  utils.js             utilidades (jids, texto, medias…)
src/plugins/           205 comandos en 18 categorías (un archivo por categoría)
src/data/pokemon.js    Pokédex de Kanto + tablas de tipos
tests/selftest.js      pruebas sin WhatsApp (npm test)
data/                  sesión de WhatsApp y base de datos (no se sube a git)
```

---

## 🧪 Pruebas

```bash
npm test            # o: node index.js --test
```

Ejecuta **205 comandos** con un WhatsApp falso y una API simulada, comprueba los menús, genera las tarjetas canvas y verifica permisos, límites y XP. No se conecta a nada, así que puedes probar cambios sin gastar tu sesión.

---

## ❓ Problemas frecuentes

| Problema | Solución |
|---|---|
| `npm install` falla compilando módulos | `npm install --omit=optional` (el bot funciona igual) |
| El código de emparejamiento no llega | Reinicia con `npm run pair`, espera 30s y pide otro; si sigue fallando usa `npm run qr` |
| «La API no respondió» / comandos lentos | La API de Render estaba dormida: el bot reintenta; espera ~30s. Comprueba con `.apistatus` |
| `⚠️ Necesitas yt-dlp` en descargas | Instálalo en el servidor de la API (ver arriba) o usa los comandos locales |
| Quiero vincular otro número | `node index.js --logout` y vuelve a arrancar |
| Sesión corrupta / errores raros de conexión | `node index.js --logout`, o borra `data/session` y re-vincula |
| El bot se apaga al cerrar Termux | Usa `tmux` / `termux-wake-lock` (ver arriba) |
| No aparecen las tarjetas | Instala canvas (`npm i @napi-rs/canvas`) o deja que use los endpoints de la API |
| Quiero quitar la marca del menú | `config.js` → `bot.footer` |
| `data/database.json` creció mucho | Se guarda solo cada 30s y hace backup diario en `data/backup/`; puedes borrar usuarios con `.resetuser` |

---

## ⚖️ Uso responsable

- Este proyecto usa una librería **no oficial** de WhatsApp (Baileys). Úsalo con tu propio número y con responsabilidad: el spam, el envío masivo o el acoso pueden hacer que WhatsApp **bloquee** la cuenta.
- No lo uses para enviar publicidad no deseada ni para rastrear personas.
- Respeta las condiciones de servicio de WhatsApp y de las plataformas que descargues.
- El código se ofrece **tal cual**, sin garantías.

---

## 🤝 Créditos

- **[Baileys](https://github.com/WhiskeySockets/Baileys)** — conexión a WhatsApp
- **[SiputZX API](https://siputzx-api.onrender.com)** — endpoints de herramientas, IA, descargas, canvas y juegos
- **[@napi-rs/canvas](https://github.com/Brooooooklyn/canvas)** — generación de tarjetas
- **[qrcode-terminal](https://www.npmjs.com/package/qrcode-terminal)** — QR en la terminal
- Bot y menús hechos para **bot base** 💚
