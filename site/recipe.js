(() => {
  "use strict";

  const input = document.querySelector("[data-static-recipe-multiplier]");
  if (!input) return;

  const ingredients = [...document.querySelectorAll("[data-base-ingredient]")];
  let currentMultiplier = "1";

  input.addEventListener("change", () => {
    const multiplier = window.recipeMultiplier.normalize(input.value);
    if (!multiplier) {
      input.value = currentMultiplier;
      input.setCustomValidity("Introduce un multiplicador decimal mayor que cero.");
      input.reportValidity();
      return;
    }

    input.setCustomValidity("");
    currentMultiplier = multiplier;
    input.value = multiplier;
    ingredients.forEach((ingredient) => {
      ingredient.textContent = window.recipeMultiplier.scaleIngredient(ingredient.dataset.baseIngredient, multiplier);
    });
  });
})();
