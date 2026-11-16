#!/usr/bin/env python3
"""Genera el navegador estático a partir de las recetas Markdown."""

from __future__ import annotations

import csv
import json
import re
import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SITE_DIR = ROOT / "site"
OUTPUT_DIR = ROOT / "docs"
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


def main() -> int:
    try:
        recipes = collect_recipes()
        template_path = SITE_DIR / "template.html"
        template = template_path.read_text(encoding="utf-8")
        marker = "{{RECIPES_JSON}}"
        if template.count(marker) != 1:
            raise ValueError(f"{template_path}: se requiere exactamente un marcador {marker}")

        data = json.dumps(recipes, ensure_ascii=False, separators=(",", ":"))
        data = data.replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        (OUTPUT_DIR / "index.html").write_text(template.replace(marker, data), encoding="utf-8")
        assets_dir = OUTPUT_DIR / "assets"
        assets_dir.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(SITE_DIR / "styles.css", assets_dir / "styles.css")
        shutil.copyfile(SITE_DIR / "app.js", assets_dir / "app.js")
        print(f"Generadas {len(recipes)} recetas en {OUTPUT_DIR.relative_to(ROOT)}/index.html")
        return 0
    except (OSError, ValueError) as error:
        print(f"Error al generar el sitio: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
