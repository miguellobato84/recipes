# Recetas

Colección personal de recetas, versionada y basada en Markdown. Cada receta vive en un único fichero autocontenido: fácil de leer, revisar con Git y editar de forma fiable mediante agentes de IA.

## Estructura

```text
recetas/
├── entrantes/      # Entrantes, tapas, ensaladas y sopas
├── principales/    # Platos principales
├── panes/          # Pan, masas de pizza y masas saladas
├── dulces/         # Tartas, galletas, bollería y dulces
├── guarniciones/   # Acompañamientos
├── salsas/         # Salsas, aliños y cremas para untar
└── bebidas/        # Bebidas frías y calientes
```

Usa exactamente una categoría principal: carpeta y campo `categoria` deben coincidir. Añade etiquetas transversales con `etiquetas`, sin duplicar recetas.

## Formato de receta

Crea `recetas/<categoria>/<nombre-de-receta>.md`. Los nombres usan minúsculas sin tildes, números y guiones; por ejemplo, `tortilla-de-patatas.md`.

```markdown
---
version_esquema: 1
titulo: Tortilla de patatas
categoria: principales
etiquetas: [española, vegetariana, sin-gluten]
raciones: 4
tiempo_preparacion: 20 min
tiempo_coccion: 30 min
tiempo_total: 50 min
fuente: propia
estado: probada
---

# Tortilla de patatas

## Ingredientes

- 700 g de patatas, peladas y cortadas en láminas finas
- 1 cebolla, cortada en láminas finas
- 6 huevos
- 250 ml de aceite de oliva
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

- YAML: `version_esquema`, `titulo`, `categoria`, `etiquetas`, `raciones`, `tiempo_preparacion`, `tiempo_coccion`, `tiempo_total`, `fuente`, `estado`.
- Markdown: un H1 que coincida con `titulo`; secciones H2 `Ingredientes`, `Utensilios`, `Pasos` y `Notas`, en ese orden.
- Ingredientes: lista sin orden. Indica cantidad, unidad, ingrediente y detalle de preparación.
- Pasos: lista ordenada. Cada paso contiene una acción observable; incluye temperatura, tiempo e indicios visuales cuando se conozcan.

Usa `desconocido` para metadatos ausentes. Usa `estado: borrador` si no se ha probado, `probada` al cocinarla con éxito o `adaptada` si se modifica desde una fuente. Registra una URL de fuente o `propia`; nunca atribuyas sin comprobar una receta a elaboración propia.

## Flujo de Git

Un solo cambio de receta, o una sola receta, por commit. Usa mensajes imperativos en español, por ejemplo:

```text
Añade receta de tortilla de patatas
Aclara paso de cocción de tortilla
```

No reescribas historial ni reformatees recetas no relacionadas en el mismo commit. El historial de Git es el cuaderno de recetas: explica en el mensaje por qué cambia una cantidad, tiempo o método.
