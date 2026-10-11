# 🎨 Fondos de las tarjetas

El bot dibuja las tarjetas (bienvenida, despedida, ship, level up, perfil) usando estos PNG/JPG como fondo.
Puedes **reemplazarlos por tus propias imágenes** (por ejemplo las de tu Drive) sin tocar código.

## Nombres esperados

| Archivo | Se usa en |
|---|---|
| `welcome.png` / `.jpg` | tarjeta de bienvenida de grupos (`.welcome on`) |
| `despedida.png` / `.jpg` | tarjeta de despedida (`.despedida on`) |
| `ship.png` / `.jpg` | `.ship @a @b` |
| `gay.png` / `.jpg` | `.gay @usuario` |
| `levelup.png` / `.jpg` | aviso de subida de nivel |
| `levelup2.png` / `.jpg` | `.iq @usuario` |
| `rank.png` / `.jpg` | `.perfil` |

## Requisitos de las imágenes

- Formato **PNG o JPG**
- Apaisadas, **1024×450 o más grandes** (recomendado 1376×768 o 1280×720)
- El bot las recorta al centro y añade una capa oscura para que el texto sea legible, así que evita imágenes muy claras o con el sujeto en el borde izquierdo (ahí van el avatar y el texto).

## Regenerar los fondos incluidos

```bash
node scripts/make-canvas.js --force
```

No hace falta canvas instalado para **usar** esta carpeta: solo para regenerar los fondos con ese script.
