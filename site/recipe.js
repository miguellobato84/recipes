(() => {
  "use strict";

  const input = document.querySelector("[data-static-recipe-multiplier]");
  if (!input) return;

  const ingredients = [...document.querySelectorAll("[data-base-ingredient]")];
  const presets = [...document.querySelectorAll("[data-static-multiplier-value]")];
  let currentMultiplier = "1";

  function applyMultiplier() {
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
    presets.forEach((button) => {
      const isActive = button.dataset.staticMultiplierValue === multiplier;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    ingredients.forEach((ingredient) => {
      ingredient.textContent = window.recipeMultiplier.scaleIngredient(ingredient.dataset.baseIngredient, multiplier);
    });
  }

  input.addEventListener("change", applyMultiplier);
  presets.forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.staticMultiplierValue;
      applyMultiplier();
    });
  });
})();
