# Instrucciones para agentes

Este repositorio es una colección canónica de recetas. Prioriza legibilidad humana y diferencias estables en Git sobre esquemas complejos o herramientas generadas.

## Antes de editar

1. Lee este fichero y `README.md`.
2. Revisa categoría objetivo y recetas relacionadas para evitar duplicados.
3. No alteres ficheros no relacionados ni cambios existentes del usuario.

## Reglas de recetas

- Una receta por fichero en `<categoria>/<nombre>.md`. Para `principales`, usa `principales/<subcategoria>/<nombre>.md`.
- Categorías permitidas: `desayunos`, `entrantes`, `principales`, `panificadora`, `masas`, `dulces`, `guarniciones`, `salsas`.
- Subcategorías permitidas para `principales`: `carne`, `pescado`, `vegetarianos`.
- Usa exactamente el YAML y orden de secciones Markdown definido en `README.md`.
- Nombre de fichero: minúsculas sin tildes, números y guiones. No uses espacios ni guiones bajos.
- El H1 coincide con `titulo`; la carpeta de categoría coincide con `categoria`. En recetas de `principales`, la subcarpeta identifica la subcategoría.
- Ingredientes usan viñetas; pasos usan lista numerada; cada paso describe una acción.
- Todas las cantidades medibles se expresan preferentemente en masa, usando g o kg. Solo usa ml o l cuando no sea razonable expresar la cantidad en masa. No uses cucharaditas, cucharadas, tazas u otras medidas caseras.
- Escribe las cantidades con cifras, no con palabras. Usa decimales con coma para cantidades fraccionarias; no uses fracciones con barra como `1/2`.
- Conserva cantidades, unidades, temperaturas, tiempos e incertidumbre recibidas. No inventes datos ausentes: explica incertidumbre en `Notas`.
- Escribe recetas, metadatos y notas en español, salvo que usuario pida expresamente otro idioma.

## Reglas de cambio

- Aplica el cambio mínimo necesario. No reformatees recetas masivamente salvo petición explícita del usuario.
- Al modificar receta, conserva toda información existente salvo petición explícita para eliminarla.
- No hagas commit, push, abras pull requests ni cambies configuración Git sin petición explícita.
- En este repositorio, trabaja siempre en la rama `main`; nunca crees ramas.

## Web de recetas

- Las recetas Markdown son la fuente canónica del navegador web.
- El multiplicador del navegador actúa solo sobre números en líneas de ingredientes. Escala todos los números salvo porcentajes, que no se escalan; usa decimales y rangos numéricos, no fracciones con barra.
- Cada categoría y subcategoría del navegador tiene su propia URL. La navegación no debe ofrecer una vista que mezcle todas las recetas.
- Al seleccionar una categoría, muestra sus recetas debajo de ella en forma de árbol de navegación.
- Genera el sitio con `python3 scripts/generate_site.py`. La plantilla, los estilos y el JavaScript viven en `site/`; el resultado se escribe en `docs/`.
- El workflow de GitHub Actions despliega `docs/` a GitHub Pages cuando hay un push a `main`.
- No edites a mano los ficheros generados en `docs/`; vuelve a ejecutar el generador.

## Validación

Antes de terminar, comprueba delimitadores YAML, claves obligatorias, exactamente un H1 y secciones H2 requeridas en orden. Confirma que `git diff` solo contiene cambios previstos.
