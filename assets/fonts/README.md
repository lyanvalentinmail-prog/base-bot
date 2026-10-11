# 🔤 Fuentes (opcional)

El bot busca fuentes en este orden:

1. **`assets/fonts/`** (esta carpeta) — cualquier `.ttf` / `.otf` / `.ttc`
2. Fuentes del sistema: Android (`/system/fonts/Roboto…`), Linux (DejaVu, Noto), macOS y Windows

En **Termux** no hace falta hacer nada: usa las fuentes del sistema Android.
Si quieres una fuente concreta para las tarjetas canvas, copia aquí el archivo, por ejemplo:

```bash
# desde tu teléfono
cp /sdcard/Download/Inter-Bold.ttf assets/fonts/
```

y listo: el bot la registrará automáticamente al arrancar (`BotBold` para negritas).
