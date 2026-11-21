import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from generate_site import category_keys, collect_recipes, render_app_page, render_recipe_page


class StaticRecipeMultiplierTests(unittest.TestCase):
    def test_recipe_page_contains_multiplier_and_scalable_ingredients(self):
        recipe = next(item for item in collect_recipes() if item["id"] == "guarniciones/coliflor-al-horno")

        page = render_recipe_page(recipe)

        self.assertIn('data-static-recipe-multiplier', page)
        self.assertIn('data-base-ingredient="0,5 limón"', page)
        self.assertIn('data-static-multiplier-value="1"', page)
        self.assertIn('data-static-multiplier-value="2"', page)
        self.assertIn('data-static-multiplier-value="3"', page)
        self.assertIn('../../assets/multiplier.js', page)
        self.assertIn('../../assets/recipe.js', page)

    def test_category_page_has_own_route_configuration(self):
        recipes = collect_recipes()
        template = (ROOT / "site" / "template.html").read_text(encoding="utf-8")
        page = render_app_page(template, recipes, "../", "desayunos")

        self.assertIn('data-asset-prefix="../" data-initial-category="desayunos"', page)
        self.assertIn('href="../assets/styles.css"', page)
        self.assertIn("desayunos", category_keys(recipes))
        self.assertNotIn("{{", page)


if __name__ == "__main__":
    unittest.main()
