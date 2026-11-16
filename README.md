# Recetas

Colección personal de recetas, versionada y basada en Markdown. Cada receta vive en un único fichero autocontenido: fácil de leer, revisar con Git y editar de forma fiable mediante agentes de IA.

## Estructura

```text
entrantes/      # Entrantes, tapas, ensaladas y sopas
desayunos/      # Desayunos y brunch
principales/    # Platos principales, organizados por proteína
├── carne/
├── pescado/
└── vegetarianos/
panificadora/   # Panes preparados en panificadora
masas/          # Masas de pizza y masas saladas
dulces/         # Tartas, galletas, bollería y dulces
guarniciones/   # Acompañamientos
salsas/         # Salsas, aliños y cremas para untar
```

Usa exactamente una categoría principal: la carpeta de categoría y el campo `categoria` deben coincidir. En `principales`, la subcarpeta indica `carne`, `pescado` o `vegetarianos`. Añade etiquetas transversales con `etiquetas`, sin duplicar recetas.

## Formato de receta

Crea `<categoria>/<nombre-de-receta>.md`. En `principales`, crea `principales/<subcategoria>/<nombre-de-receta>.md`, donde la subcategoría es `carne`, `pescado` o `vegetarianos`. Los nombres usan minúsculas sin tildes, números y guiones; por ejemplo, `tortilla-de-patatas.md`.

```markdown
---
version_esquema: 1
titulo: Tortilla de patatas
categoria: principales
etiquetas: [española, vegetariana, sin-gluten]
raciones: 4
---

# Tortilla de patatas

## Ingredientes

- 700 g de patatas, peladas y cortadas en láminas finas
- 1 cebolla, cortada en láminas finas
- 6 huevos
- 230 g de aceite de oliva
- sal

## Utensilios

- Sartén de 24 cm

## Pasos

1. Calienta el aceite a fuego bajo. Cocina patatas y cebolla hasta que estén tiernas, sin dorarlas.
2. Escurre las verduras. Bate los huevos con sal y mézclalos con las verduras.
3. Cocina en la sartén a fuego medio-bajo, da la vuelta con cuidado y cocina el otro lado al punto deseado.

## Notas

- Deja reposar 5 minutos antes de cortar.
- Variación: omite la cebolla.
```

### Campos y secciones obligatorios

- YAML: `version_esquema`, `titulo`, `categoria`, `etiquetas`, `raciones`.
- Markdown: un H1 que coincida con `titulo`; secciones H2 `Ingredientes`, `Utensilios`, `Pasos` y `Notas`, en ese orden.
- Ingredientes: lista sin orden. Indica cantidad, unidad, ingrediente y detalle de preparación.
- Todas las cantidades medibles se expresan preferentemente en masa, usando g o kg. Solo usa ml o l cuando no sea razonable expresar la cantidad en masa. No uses cucharaditas, cucharadas, tazas u otras medidas caseras.
- Pasos: lista ordenada. Cada paso contiene una acción observable; incluye temperatura, tiempo e indicios visuales cuando se conozcan.

## Navegador web

El repositorio incluye un navegador web estático generado a partir de las recetas Markdown. Permite explorar por categorías, buscar recetas y guardar ingredientes en una lista de la compra que persiste en el navegador. Para regenerarlo localmente:

Sitio público: [Recetas](https://miguellobato84.github.io/recipes/).

```sh
python3 scripts/generate_site.py
```

Abre `docs/index.html` en un navegador o sirve la carpeta `docs/` con un servidor estático. El generador solo usa la biblioteca estándar de Python. Edita la plantilla en `site/template.html`, los estilos en `site/styles.css` y las interacciones en `site/app.js`; no edites a mano los ficheros generados en `docs/`.

GitHub Actions vuelve a generar y despliega `docs/` a GitHub Pages en cada push a `main`. El workflow configura Pages para publicar mediante Actions. El enlace de publicación aparece en la ejecución del workflow.

## Flujo de Git

Un solo cambio de receta, o una sola receta, por commit. Usa mensajes imperativos en español, por ejemplo:

```text
Añade receta de tortilla de patatas
Aclara paso de cocción de tortilla
```

No reescribas historial ni reformatees recetas no relacionadas en el mismo commit. El historial de Git es el cuaderno de recetas: explica en el mensaje por qué cambia una cantidad, tiempo o método.
