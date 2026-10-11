#!/data/data/com.termux/files/usr/bin/bash
# ─────────────────────────────────────────────────────────────
#  scripts/termux-install.sh — instalación automática en Termux
#  Uso:   bash scripts/termux-install.sh
# ─────────────────────────────────────────────────────────────
set -e

echo ""
echo "╭──────────────────────────────────────────────╮"
echo "│  BOT BASE · instalación para Termux           │"
echo "╰──────────────────────────────────────────────╯"
echo ""

# 1) paquetes base
echo "▶ Actualizando paquetes (puede tardar)…"
pkg update -y >/dev/null 2>&1 || true
echo "▶ Instalando nodejs, git y dependencias de compilación…"
pkg install -y nodejs git python make clang binutils libffi openssl pkg-config >/dev/null 2>&1 || \
  pkg install -y nodejs git python >/dev/null 2>&1

echo "▶ Versiones instaladas:"
node -v || { echo "❌ Node no se instaló. Prueba: pkg install nodejs"; exit 1; }
npm -v

# 2) dependencias del bot
echo ""
echo "▶ Instalando dependencias del bot…"
if npm install --no-audit --no-fund; then
  echo "✅ Dependencias instaladas (incluye canvas nativo si tu CPU lo permite)"
else
  echo "⚠️ Falló la instalación completa. Reintentando sin el canvas nativo…"
  npm install --no-audit --no-fund --omit=optional
  echo "ℹ️ Sin canvas nativo el bot funciona igual: las tarjetas las generará la API SiputZX."
fi

# 3) fondos de las tarjetas
if [ -f node_modules/@napi-rs/canvas/index.js ]; then
  echo ""
  echo "▶ Generando fondos de las tarjetas (assets/canvas)…"
  node scripts/make-canvas.js || true
fi

# 4) pruebas internas
echo ""
echo "▶ Ejecutando pruebas internas (no se conecta a WhatsApp)…"
node tests/selftest.js | tail -6 || true

# 5) listo
echo ""
echo "╭──────────────────────────────────────────────╮"
echo "│  ✅ INSTALACIÓN TERMINADA                     │"
echo "╰──────────────────────────────────────────────╯"
echo ""
echo "  Edita tu número de owner:   nano config.js"
echo ""
echo "  Vincular con CÓDIGO (pairing):   npm run pair"
echo "  Vincular con QR:                 npm run qr"
echo "  Arrancar normal:                 npm start"
echo ""
echo "  💡 Consejo: usa 'termux-wake-lock' para que Android no duerma el bot."
echo "  💡 Para dejarlo en segundo plano: pkg install tmux && tmux new -s bot"
echo ""
