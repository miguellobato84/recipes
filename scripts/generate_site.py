#!/usr/bin/env python3
"""Genera el navegador estático a partir de las recetas Markdown."""

from __future__ import annotations

import csv
import html
import json
import re
import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SITE_DIR = ROOT / "site"
OUTPUT_DIR = ROOT / "docs"
PUBLIC_BASE_URL = "https://www.miguellobato.com/recipes/"
SECTIONS = ("Ingredientes", "Utensilios", "Pasos", "Notas")
NON_RECIPE_DIRS = {".git", "docs", "scripts", "site"}


def parse_front_matter(path: Path, text: str) -> dict[str, object]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"{path}: falta el delimitador YAML inicial")

    try:
        end = next(index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---")
    except StopIteration as error:
        raise ValueError(f"{path}: falta el delimitador YAML de cierre") from error

    metadata: dict[str, object] = {}
    for line in lines[1:end]:
        if not line.strip():
            continue
        key, separator, value = line.partition(":")
        if not separator:
            raise ValueError(f"{path}: campo YAML no válido: {line}")
        value = value.strip()
        if key.strip() == "etiquetas":
            if not (value.startswith("[") and value.endswith("]")):
                raise ValueError(f"{path}: etiquetas debe ser una lista YAML entre corchetes")
            metadata[key.strip()] = [item.strip().strip("\"'") for item in next(csv.reader([value[1:-1]], skipinitialspace=True)) if item.strip()]
        else:
            metadata[key.strip()] = value.strip("\"'")

    required = {"version_esquema", "titulo", "categoria", "etiquetas", "raciones"}
    missing = sorted(required - metadata.keys())
    if missing:
        raise ValueError(f"{path}: faltan campos YAML: {', '.join(missing)}")
    if metadata["version_esquema"] != "1":
        raise ValueError(f"{path}: versión de esquema no compatible: {metadata['version_esquema']}")
    return metadata


def parse_sections(path: Path, text: str, title: str) -> dict[str, list[str]]:
    headings = re.findall(r"^# .+$", text, flags=re.MULTILINE)
    if len(headings) != 1 or headings[0][2:].strip() != title:
        raise ValueError(f"{path}: debe contener un H1 que coincida con titulo")

    sections: dict[str, list[str]] = {}
    current: str | None = None
    collected: dict[str, list[str]] = {}
    for line in text.splitlines():
        heading = re.fullmatch(r"##\s+(.+?)\s*", line)
        if heading:
            current = heading.group(1)
            collected.setdefault(current, [])
            continue
        if current is None or not line.strip():
            continue

        value = re.sub(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)", "", line).strip()
        if not value:
            continue
        if line.lstrip().startswith(("- ", "* ", "+ ")) or re.match(r"^\s*\d+[.)]\s+", line):
            collected[current].append(value)
        elif collected[current]:
            collected[current][-1] += " " + value
        else:
            collected[current].append(value)

    order = list(collected)
    if order != list(SECTIONS):
        raise ValueError(f"{path}: las secciones H2 deben ser {', '.join(SECTIONS)} en ese orden")
    for section in SECTIONS:
        sections[section] = collected[section]
    return sections


def parse_recipe(path: Path) -> dict[str, object]:
    relative = path.relative_to(ROOT)
    if any(part.startswith(".") for part in relative.parts):
        raise ValueError(f"{path}: no se admiten recetas en rutas ocultas")

    text = path.read_text(encoding="utf-8")
    metadata = parse_front_matter(path, text)
    category = str(metadata["categoria"])
    if category != relative.parts[0]:
        raise ValueError(f"{path}: categoria no coincide con la carpeta {relative.parts[0]}")

    subcategory = ""
    if category == "principales":
        if len(relative.parts) != 3 or relative.parts[1] not in {"carne", "pescado", "vegetarianos"}:
            raise ValueError(f"{path}: principales requiere una subcarpeta válida")
        subcategory = relative.parts[1]
    elif len(relative.parts) != 2:
        raise ValueError(f"{path}: las categorías distintas de principales no admiten subcarpetas")

    sections = parse_sections(path, text, str(metadata["titulo"]))
    return {
        "id": relative.with_suffix("").as_posix(),
        "url": f"{relative.with_suffix('').as_posix()}/",
        "path": relative.as_posix(),
        "title": metadata["titulo"],
        "category": category,
        "subcategory": subcategory,
        "servings": metadata["raciones"],
        "tags": metadata["etiquetas"],
        "ingredients": sections["Ingredientes"],
        "utensils": sections["Utensilios"],
        "steps": sections["Pasos"],
        "notes": sections["Notas"],
    }


def collect_recipes() -> list[dict[str, object]]:
    candidates = [
        path
        for path in ROOT.rglob("*.md")
        if path.is_file()
        and len(path.relative_to(ROOT).parts) > 1
        and not any(part.startswith(".") for part in path.relative_to(ROOT).parts)
        and path.relative_to(ROOT).parts[0] not in NON_RECIPE_DIRS
    ]
    recipes = [parse_recipe(path) for path in sorted(candidates)]
    if not recipes:
        raise ValueError("No se encontraron recetas Markdown")
    return recipes


def escape(value: object) -> str:
    return html.escape(str(value), quote=True)


def render_list(items: list[str], ordered: bool = False) -> str:
    tag = "ol" if ordered else "ul"
    entries = "\n".join(f"            <li>{escape(item)}</li>" for item in items)
    return f"          <{tag} class=\"detail-list\">\n{entries}\n          </{tag}>"


def render_recipe_page(recipe: dict[str, object]) -> str:
    title = escape(recipe["title"])
    category = str(recipe["category"])
    category_labels = {
        "desayunos": "Desayunos",
        "entrantes": "Entrantes",
        "principales": "Principales",
        "panificadora": "Panificadora",
        "masas": "Masas",
        "dulces": "Dulces",
        "guarniciones": "Guarniciones",
        "salsas": "Salsas",
    }
    subcategory_labels = {"carne": "Carne", "pescado": "Pescado", "vegetarianos": "Vegetarianos"}
    category_label = category_labels.get(category, category)
    if recipe["subcategory"]:
        subcategory = subcategory_labels.get(str(recipe["subcategory"]), str(recipe["subcategory"]))
        category_label += f" · {subcategory}"

    absolute_url = PUBLIC_BASE_URL + str(recipe["url"])
    depth = len(str(recipe["url"]).strip("/").split("/"))
    asset_prefix = "../" * depth
    home_url = f"{asset_prefix}index.html"
    ingredients = recipe["ingredients"]
    utensils = recipe["utensils"]
    steps = recipe["steps"]
    notes = recipe["notes"]
    schema: dict[str, object] = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": recipe["title"],
        "url": absolute_url,
        "recipeCategory": category_label,
        "recipeYield": str(recipe["servings"]),
        "recipeIngredient": ingredients,
        "recipeInstructions": [
            {"@type": "HowToStep", "text": step} for step in steps
        ],
    }
    if recipe["tags"]:
        schema["keywords"] = recipe["tags"]
    schema_json = json.dumps(schema, ensure_ascii=False, indent=2)
    schema_json = schema_json.replace("<", "\\u003c").replace("&", "\\u0026")

    def section(name: str, items: list[str], ordered: bool = False) -> str:
        return (
            f"<section class=\"detail-section\"><h2>{name}</h2>\n"
            f"{render_list(items, ordered)}\n        </section>"
        )

    ingredient_entries = "\n".join(
        f'            <li data-base-ingredient="{escape(item)}">{escape(item)}</li>'
        for item in ingredients
    )
    ingredient_section = f"""<section class="detail-section"><h2>Ingredientes</h2>
          <div class="multiplier-control">
            <label class="multiplier-input-label">
              <span class="multiplier-label">Multiplicador</span>
              <input class="multiplier-input" type="text" inputmode="decimal" value="1" data-static-recipe-multiplier aria-label="Multiplicador de ingredientes">
              <span class="multiplier-suffix">×</span>
            </label>
            <div class="multiplier-presets" role="group" aria-label="Multiplicador: valores predeterminados">
              <button class="multiplier-preset is-active" type="button" data-static-multiplier-value="1" aria-pressed="true">1×</button>
              <button class="multiplier-preset" type="button" data-static-multiplier-value="2" aria-pressed="false">2×</button>
              <button class="multiplier-preset" type="button" data-static-multiplier-value="3" aria-pressed="false">3×</button>
            </div>
          </div>
          <ul class="detail-list">
{ingredient_entries}
          </ul>
        </section>"""

    return f"""<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#15131a">
    <meta name="description" content="Receta de {title}: ingredientes y pasos de preparación.">
    <meta property="og:type" content="article">
    <meta property="og:title" content="{title} · Recetas">
    <meta property="og:description" content="Ingredientes y pasos de preparación.">
    <link rel="canonical" href="{escape(absolute_url)}">
    <link rel="stylesheet" href="{asset_prefix}assets/styles.css">
    <title>{title} · Recetas</title>
    <script type="application/ld+json">{schema_json}</script>
  </head>
  <body>
    <main class="content">
      <article class="recipe-detail">
        <div class="detail-topline">
          <a class="back-button" href="{home_url}">‹ Ir al recetario</a>
          <button class="share-button" type="button" onclick="navigator.clipboard ? navigator.clipboard.writeText(location.href).then(() => this.textContent = 'Enlace copiado').catch(() => window.prompt('Copia el enlace', location.href)) : window.prompt('Copia el enlace', location.href)">Compartir</button>
        </div>
        <h1 class="detail-title">{title}</h1>
        <div class="detail-facts">
          <span>Raciones: {escape(recipe["servings"])}</span>
          <span>{escape(category_label)}</span>
        </div>
        {ingredient_section}
        {section("Utensilios", utensils)}
        {section("Pasos", steps, ordered=True)}
        {section("Notas", notes)}
      </article>
    </main>
    <script src="{asset_prefix}assets/multiplier.js" defer></script>
    <script src="{asset_prefix}assets/recipe.js" defer></script>
  </body>
</html>
"""


def category_keys(recipes: list[dict[str, object]]) -> list[str]:
    return sorted(
        {
            f"{recipe['category']}/{recipe['subcategory']}" if recipe["subcategory"] else str(recipe["category"])
            for recipe in recipes
        }
    )


def write_recipe_pages(recipes: list[dict[str, object]]) -> None:
    sitemap_urls = [PUBLIC_BASE_URL]
    for recipe in recipes:
        page_dir = OUTPUT_DIR / str(recipe["id"])
        page_dir.mkdir(parents=True, exist_ok=True)
        (page_dir / "index.html").write_text(render_recipe_page(recipe), encoding="utf-8")
        sitemap_urls.append(PUBLIC_BASE_URL + str(recipe["url"]))
    sitemap_urls.extend(PUBLIC_BASE_URL + category_key + "/" for category_key in category_keys(recipes))

    entries = "\n".join(f"  <url><loc>{escape(url)}</loc></url>" for url in sitemap_urls)
    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{entries}\n</urlset>\n"
    )
    (OUTPUT_DIR / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (OUTPUT_DIR / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nSitemap: {PUBLIC_BASE_URL}sitemap.xml\n",
        encoding="utf-8",
    )


def render_app_page(template: str, recipes: list[dict[str, object]], asset_prefix: str = "", initial_category: str = "") -> str:
    data = json.dumps(recipes, ensure_ascii=False, separators=(",", ":"))
    data = data.replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")
    return (
        template.replace("{{ASSET_PREFIX}}", asset_prefix)
        .replace("{{INITIAL_CATEGORY}}", html.escape(initial_category, quote=True))
        .replace("{{RECIPES_JSON}}", data)
    )


def write_category_pages(template: str, recipes: list[dict[str, object]]) -> None:
    for category_key in category_keys(recipes):
        category_parts = category_key.split("/")
        page_dir = OUTPUT_DIR.joinpath(*category_parts)
        page_dir.mkdir(parents=True, exist_ok=True)
        asset_prefix = "../" * len(category_parts)
        page = render_app_page(template, recipes, asset_prefix, category_key)
        (page_dir / "index.html").write_text(page, encoding="utf-8")


def main() -> int:
    try:
        recipes = collect_recipes()
        template_path = SITE_DIR / "template.html"
        template = template_path.read_text(encoding="utf-8")
        marker = "{{RECIPES_JSON}}"
        if template.count(marker) != 1:
            raise ValueError(f"{template_path}: se requiere exactamente un marcador {marker}")

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        if template.count("{{ASSET_PREFIX}}") != 4 or template.count("{{INITIAL_CATEGORY}}") != 1:
            raise ValueError(f"{template_path}: marcadores de categoría no válidos")
        (OUTPUT_DIR / "index.html").write_text(render_app_page(template, recipes), encoding="utf-8")
        write_category_pages(template, recipes)
        write_recipe_pages(recipes)
        assets_dir = OUTPUT_DIR / "assets"
        assets_dir.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(SITE_DIR / "styles.css", assets_dir / "styles.css")
        shutil.copyfile(SITE_DIR / "multiplier.js", assets_dir / "multiplier.js")
        shutil.copyfile(SITE_DIR / "app.js", assets_dir / "app.js")
        shutil.copyfile(SITE_DIR / "recipe.js", assets_dir / "recipe.js")
        print(f"Generadas {len(recipes)} páginas de receta y un sitemap en {OUTPUT_DIR.relative_to(ROOT)}")
        return 0
    except (OSError, ValueError) as error:
        print(f"Error al generar el sitio: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
