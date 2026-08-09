# Instrucciones para agentes

Este repositorio es una colección canónica de recetas. Prioriza legibilidad humana y diferencias estables en Git sobre esquemas complejos o herramientas generadas.

## Antes de editar

1. Lee este fichero y `README.md`.
2. Revisa categoría objetivo y recetas relacionadas para evitar duplicados.
3. No alteres ficheros no relacionados ni cambios existentes del usuario.

## Reglas de recetas

- Una receta por fichero en `recetas/<categoria>/<nombre>.md`.
- Categorías permitidas: `entrantes`, `principales`, `panes`, `dulces`, `guarniciones`, `salsas`, `bebidas`.
- Usa exactamente el YAML y orden de secciones Markdown definido en `README.md`.
- Nombre de fichero: minúsculas sin tildes, números y guiones. No uses espacios ni guiones bajos.
- El H1 coincide con `titulo`; carpeta coincide con `categoria`.
- Ingredientes usan viñetas; pasos usan lista numerada; cada paso describe una acción.
- Conserva cantidades, unidades, temperaturas, tiempos, incertidumbre y atribución de fuentes recibidas. No inventes datos ausentes: usa `desconocido` o explica incertidumbre en `Notas`.
- Escribe recetas, metadatos y notas en español, salvo que usuario pida expresamente otro idioma.

## Reglas de cambio

- Aplica el cambio mínimo necesario. No reformatees recetas masivamente salvo petición explícita del usuario.
- Al modificar receta, conserva toda información existente salvo petición explícita para eliminarla.
- Actualiza `estado` a `borrador` para transcripciones no probadas, `probada` para recetas confirmadas y `adaptada` para variaciones deliberadas.
- No hagas commit, push, abras pull requests ni cambies configuración Git sin petición explícita.

## Validación

Antes de terminar, comprueba delimitadores YAML, claves obligatorias, exactamente un H1 y secciones H2 requeridas en orden. Confirma que `git diff` solo contiene cambios previstos.
