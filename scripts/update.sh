#!/data/data/com.termux/files/usr/bin/bash
# ─────────────────────────────────────────────────────────────
#  scripts/update.sh — actualiza el bot a la última versión
#  Uso:   bash scripts/update.sh
# ─────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")/.."

echo ""
echo "╭──────────────────────────────────────────────╮"
echo "│  ACTUALIZANDO EL BOT                          │"
echo "╰──────────────────────────────────────────────╯"

RAMAS="arena/e8b64dd1-s main"
RAMA_ACTUAL="$(git rev-parse --abbrev-ref HEAD)"
echo "▶ Rama actual: $RAMA_ACTUAL"

if [ -n "$(git status --porcelain -- ':!data' 2>/dev/null)" ]; then
  echo "⚠️ Tienes cambios locales sin guardar en el código."
  echo "   Guardándolos temporalmente (stash)…"
  git stash push -u -m "update-automatico-$(date +%s)" >/dev/null
  STASH=1
fi

for RAMA in $RAMA_ACTUAL $RAMAS; do
  echo "▶ Intentando traer cambios de '$RAMA'…"
  if git pull --ff-only origin "$RAMA"; then
    echo "✅ Actualizado desde '$RAMA'"
    break
  fi
  echo "   no se pudo desde '$RAMA', probando la siguiente…"
done

if [ -n "$STASH" ]; then
  echo "▶ Restaurando tus cambios locales…"
  git stash pop || echo "⚠️ Revisa 'git stash list' si hubo conflictos"
fi

echo ""
echo "▶ Instalando dependencias nuevas (si las hay)…"
npm install --no-audit --no-fund || npm install --no-audit --no-fund --omit=optional

echo ""
echo "▶ Verificando que todo siga bien…"
node tests/selftest.js | tail -4 || true

echo ""
echo "✅ LISTO. Arranca el bot con:  npm start"
echo ""
