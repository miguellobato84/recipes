(() => {
  "use strict";

  const recipes = JSON.parse(document.querySelector("#recipe-data").textContent);
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const cartStorageKey = "recetas-carrito-v1";
  const recipeMultiplier = window.recipeMultiplier;
  const assetPrefix = document.body.dataset.assetPrefix || "";
  const initialCategory = document.body.dataset.initialCategory || null;
  const hasCategoryChooserHash = window.location.hash === "#categorias";
  const categoryLabels = {
    desayunos: "Desayunos",
    entrantes: "Entrantes",
    principales: "Principales",
    panificadora: "Panificadora",
    masas: "Masas",
    dulces: "Dulces",
    guarniciones: "Guarniciones",
    salsas: "Salsas",
  };
  const subcategoryLabels = {
    carne: "Carne",
    pescado: "Pescado",
    vegetarianos: "Vegetarianos",
  };
  const categoryIcons = {
    desayunos: "☀",
    dulces: "✿",
    entrantes: "◉",
    guarniciones: "♨",
    masas: "⌁",
    panificadora: "▤",
    principales: "♨",
    salsas: "◡",
  };

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(cartStorageKey) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved
        .filter((entry) => entry && typeof entry.id === "string" && recipeById.has(entry.recipeId))
        .map((entry) => ({ ...entry, multiplier: recipeMultiplier.normalize(entry.multiplier ?? "1") || "1" }));
    } catch {
      return [];
    }
  }

  const state = {
    view: initialCategory || hasCategoryChooserHash ? "recipes" : "home",
    category: initialCategory,
    recipeId: null,
    search: "",
    cart: loadCart(),
    recipeMultipliers: new Map(),
  };

  const appShell = document.querySelector("#app-shell");
  const content = document.querySelector("#content");
  const pageTitle = document.querySelector("#page-title");
  const searchBox = document.querySelector("#search-box");
  const searchInput = document.querySelector("#recipe-search");
  const mobileCategories = document.querySelector("#mobile-categories");

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function multiplierControl(labelText, value, attributes = {}) {
    const control = element("div", "multiplier-control");
    const label = element("label", "multiplier-input-label");
    label.append(element("span", "multiplier-label", labelText));
    const input = element("input", "multiplier-input");
    input.type = "text";
    input.inputMode = "decimal";
    input.value = value;
    input.setAttribute("aria-label", labelText);
    Object.entries(attributes).forEach(([key, attributeValue]) => {
      input.dataset[key] = attributeValue;
    });
    label.append(input, element("span", "multiplier-suffix", "×"));
    control.append(label);

    const presets = element("div", "multiplier-presets");
    presets.setAttribute("role", "group");
    presets.setAttribute("aria-label", `${labelText}: valores predeterminados`);
    ["1", "2", "3"].forEach((factor) => {
      const button = actionButton(`${factor}×`, "multiplier-preset", `multiplier-preset${recipeMultiplier.normalize(value) === factor ? " is-active" : ""}`, `Usar multiplicador ${factor}×`);
      button.dataset.multiplierValue = factor;
      button.setAttribute("aria-pressed", recipeMultiplier.normalize(value) === factor ? "true" : "false");
      Object.entries(attributes).forEach(([key, attributeValue]) => {
        button.dataset[key] = attributeValue;
      });
      presets.append(button);
    });
    control.append(presets);
    return control;
  }

  function actionButton(label, action, className, title = label) {
    const button = element("button", className, label);
    button.type = "button";
    button.dataset.action = action;
    button.title = title;
    button.setAttribute("aria-label", title);
    return button;
  }

  function categoryKey(recipe) {
    return recipe.category === "principales" ? `${recipe.category}/${recipe.subcategory}` : recipe.category;
  }

  function categoryGroups() {
    const groups = new Map();
    recipes.forEach((recipe) => {
      const key = categoryKey(recipe);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          category: recipe.category,
          subcategory: recipe.subcategory,
          count: 0,
        });
      }
      groups.get(key).count += 1;
    });
    const order = ["desayunos", "entrantes", "principales/carne", "principales/pescado", "principales/vegetarianos", "panificadora", "masas", "dulces", "guarniciones", "salsas"];
    return [...groups.values()].sort((a, b) => {
      const aOrder = order.indexOf(a.key);
      const bOrder = order.indexOf(b.key);
      if (aOrder === -1 && bOrder === -1) return a.key.localeCompare(b.key, "es");
      return (aOrder === -1 ? order.length : aOrder) - (bOrder === -1 ? order.length : bOrder);
    });
  }

  const groups = categoryGroups();

  function groupLabel(group) {
    const category = categoryLabels[group.category] || group.category;
    return group.subcategory ? `${category} · ${subcategoryLabels[group.subcategory] || group.subcategory}` : category;
  }

  function categoryUrl(group) {
    return `${assetPrefix}${group.key}/`;
  }

  function saveCart() {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(state.cart));
    } catch {
      showToast("No se pudo guardar la lista en este navegador.");
    }
  }

  function renderTabs(container, desktop = false) {
    container.replaceChildren();
    [
      { view: "recipes", label: "Recetas", icon: "R" },
      { view: "cart", label: "Lista de la compra", icon: "☷" },
    ].forEach((tab) => {
      const button = element("button", `tab-button${state.view === tab.view ? " is-active" : ""}`);
      button.type = "button";
      button.dataset.action = tab.view;
      button.setAttribute("aria-current", state.view === tab.view ? "page" : "false");
      const icon = element("span", "tab-icon", tab.icon);
      icon.setAttribute("aria-hidden", "true");
      if (tab.view === "cart" && state.cart.length) {
        icon.append(element("span", "tab-badge", String(state.cart.length)));
      }
      button.append(icon, element("span", "tab-label", tab.label));
      if (desktop) button.classList.add("tab-button-desktop");
      container.append(button);
    });
  }

  function renderCategories(container) {
    container.replaceChildren();
    groups.forEach((group) => {
      const label = groupLabel(group);
      const selected = state.category === group.key;
      const button = element("a", `category-button${selected ? " is-active" : ""}`);
      button.href = categoryUrl(group);
      button.setAttribute("aria-current", selected ? "page" : "false");
      button.setAttribute("aria-label", `Abrir categoría ${label}`);
      button.style.setProperty("--icon-bg", iconBackground(group.category));
      const icon = element("span", "category-icon", categoryIcons[group.category] || "•");
      icon.setAttribute("aria-hidden", "true");
      button.append(icon, element("span", "category-name", label), element("span", "category-count", String(group.count)));
      container.append(button);
    });
  }

  function iconBackground(category) {
    const colors = {
      desayunos: "#40331e",
      dulces: "#422738",
      entrantes: "#203a36",
      guarniciones: "#3a3d24",
      masas: "#403823",
      panificadora: "#49372e",
      principales: "#493027",
      salsas: "#3d2d47",
    };
    return colors[category] || "#322a40";
  }

  function normalized(value) {
    return String(value).toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function filteredRecipes() {
    const query = normalized(state.search.trim());
    return recipes.filter((recipe) => {
      const inCategory = !state.category || categoryKey(recipe) === state.category;
      if (!inCategory) return false;
      if (!query) return true;
      const searchable = [recipe.title, ...recipe.ingredients, ...recipe.tags].join(" ");
      return normalized(searchable).includes(query);
    });
  }

  function recipeCategoryText(recipe) {
    const group = groups.find((item) => item.key === categoryKey(recipe));
    return group ? groupLabel(group) : categoryLabels[recipe.category] || recipe.category;
  }

  function renderCategoryChooser() {
    pageTitle.textContent = "Categorías";
    document.title = "Categorías · Recetas";
    const heading = element("div", "section-heading");
    heading.append(element("h2", "", "Elige una categoría"));
    content.append(heading);

    const chooser = element("div", "category-chooser");
    groups.forEach((group) => {
      const link = element("a", "category-chooser-link", groupLabel(group));
      link.href = categoryUrl(group);
      link.append(element("span", "category-count", String(group.count)));
      chooser.append(link);
    });
    content.append(chooser);
  }

  function renderRecipeList() {
    if (!state.category && !state.search.trim()) {
      renderCategoryChooser();
      return;
    }

    const visible = filteredRecipes();
    const heading = element("div", "section-heading");
    const text = element("div");
    const selectedGroup = groups.find((group) => group.key === state.category);
    const title = selectedGroup ? groupLabel(selectedGroup) : "Resultados de búsqueda";
    text.append(element("h2", "", title));
    text.append(element("p", "", state.search ? "Resultados de búsqueda" : "Ideas para cocinar hoy"));
    pageTitle.textContent = title;
    document.title = `${title} · Recetas`;
    heading.append(text, element("span", "result-count", `${visible.length} ${visible.length === 1 ? "receta" : "recetas"}`));
    content.append(heading);

    if (!visible.length) {
      const empty = element("div", "empty-state");
      empty.append(element("strong", "", "No encontramos recetas"), element("span", "", "Prueba con otro nombre, ingrediente o etiqueta."));
      content.append(empty);
      return;
    }

    const list = element("div", "recipe-list");
    visible.forEach((recipe) => {
      const row = element("article", "recipe-row");
      const open = element("a", "recipe-open");
      open.href = recipeUrl(recipe);
      open.setAttribute("aria-label", `Ver ${recipe.title}`);
      const mark = element("span", "recipe-mark", recipe.title.trim().charAt(0).toLocaleUpperCase("es"));
      mark.setAttribute("aria-hidden", "true");
      const copy = element("span", "recipe-copy");
      copy.append(element("span", "recipe-title", recipe.title));
      copy.append(element("span", "recipe-meta", recipeCategoryText(recipe)));
      open.append(mark, copy, element("span", "recipe-chevron", "›"));
      const add = actionButton("Añadir", "add-recipe", "add-button", `Añadir ${recipe.title} a la lista de la compra`);
      add.dataset.recipeId = recipe.id;
      row.append(open, add);
      list.append(row);
    });
    content.append(list);
  }

  function appendDetailSection(parent, title, items, ordered = false, extraClass = "") {
    if (!items.length) return;
    const section = element("section", `detail-section${extraClass ? ` ${extraClass}` : ""}`);
    section.append(element("h3", "", title));
    const list = element(ordered ? "ol" : "ul", `detail-list${extraClass ? ` ${extraClass}-list` : ""}`);
    items.forEach((item) => list.append(element("li", "", item)));
    section.append(list);
    parent.append(section);
  }

  function renderRecipeDetail(recipe) {
    const detail = element("article", "recipe-detail");
    const topLine = element("div", "detail-topline");
    topLine.append(actionButton("‹ Volver", "back-to-list", "back-button", "Volver a las recetas"));
    const actions = element("div", "detail-actions");
    actions.append(actionButton("Compartir", "share-recipe", "share-button", `Copiar enlace de ${recipe.title}`));
    const add = actionButton("Añadir al carrito", "add-recipe", "add-button", `Añadir ${recipe.title} a la lista de la compra`);
    add.dataset.recipeId = recipe.id;
    actions.append(add);
    topLine.append(actions);
    detail.append(topLine);
    detail.append(element("h2", "detail-title", recipe.title));

    const facts = element("div", "detail-facts");
    facts.append(element("span", "", `Raciones: ${recipe.servings}`));
    facts.append(element("span", "", recipeCategoryText(recipe)));
    detail.append(facts);
    const multiplier = state.recipeMultipliers.get(recipe.id) || "1";
    detail.append(multiplierControl("Multiplicador", multiplier, { recipeMultiplier: recipe.id }));

    if (recipe.tags.length) {
      const tags = element("div", "tag-list");
      recipe.tags.forEach((tag) => tags.append(element("span", "tag", tag)));
      detail.append(tags);
    }
    appendDetailSection(detail, "Ingredientes", recipe.ingredients.map((item) => recipeMultiplier.scaleIngredient(item, multiplier)));
    appendDetailSection(detail, "Utensilios", recipe.utensils);
    appendDetailSection(detail, "Pasos", recipe.steps, true);
    appendDetailSection(detail, "Notas", recipe.notes, false, "notes");
    content.append(detail);
  }

  function recipeUrl(recipe) {
    return `${assetPrefix}${recipe.url}`;
  }

  function appRootUrl() {
    return `${assetPrefix}index.html`;
  }

  function clearRecipeRoute() {
    if (window.location.hash.startsWith("#receta/")) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      return;
    }
    const routeRecipe = recipes.find((recipe) => window.location.pathname.endsWith(recipe.url));
    if (routeRecipe) {
      const homePath = window.location.pathname.slice(0, -routeRecipe.url.length) || "/";
      history.replaceState(null, "", `${homePath}${window.location.search}`);
    }
  }

  function recipeFromLocation() {
    const match = window.location.hash.match(/^#receta\/(.+)$/);
    if (!match) return null;
    try {
      const id = decodeURIComponent(match[1]);
      return recipeById.has(id) ? id : null;
    } catch {
      return null;
    }
  }

  function renderHome() {
    const home = element("section", "home-view");
    home.append(element("p", "eyebrow", "TU RECETARIO"));
    home.append(element("h2", "home-title", "¿Qué cocinamos hoy?"));
    home.append(element("p", "home-copy", "Explora las categorías o busca una receta para empezar."));
    home.append(actionButton("Explorar recetas", "browse-recipes", "home-button"));
    const categoryHeading = element("h3", "home-category-heading", "Explorar por categoría");
    home.append(categoryHeading);
    const categoryLinks = element("div", "home-categories");
    groups.forEach((group) => {
      const link = element("a", "home-category", groupLabel(group));
      link.href = categoryUrl(group);
      categoryLinks.append(link);
    });
    home.append(categoryLinks);
    content.append(home);
  }

  function makeEntryId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return globalThis.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function renderCart() {
    const header = element("div", "cart-header");
    header.append(element("h2", "", "Recetas incluidas e ingredientes"));
    const clear = actionButton("Vaciar lista", "clear-cart", "text-button", "Vaciar la lista de la compra");
    clear.disabled = state.cart.length === 0;
    header.append(clear);
    content.append(header);

    if (!state.cart.length) {
      const empty = element("div", "cart-empty");
      empty.append(element("span", "cart-empty-icon", "☷"));
      empty.append(element("h3", "", "Tu lista está vacía"));
      empty.append(element("p", "", "Añade una receta y sus ingredientes aparecerán aquí, agrupados por receta."));
      content.append(empty);
      return;
    }

    const list = element("div", "cart-list");
    state.cart.forEach((entry) => {
      const recipe = recipeById.get(entry.recipeId);
      if (!recipe) return;
      const card = element("article", "cart-entry");
      const heading = element("div", "cart-entry-header");
      const headingCopy = element("div");
      const multiplier = recipeMultiplier.normalize(entry.multiplier) || "1";
      const open = actionButton(`${multiplier}× ${recipe.title}`, "open-recipe", "cart-entry-title", `Ver ${recipe.title}`);
      open.dataset.recipeId = recipe.id;
      headingCopy.append(open, element("span", "cart-entry-path", recipe.path));
      const remove = actionButton("×", "remove-recipe", "icon-button", `Quitar ${recipe.title} de la lista`);
      remove.dataset.entryId = entry.id;
      heading.append(headingCopy, multiplierControl("Multiplicador", multiplier, { cartEntryMultiplier: entry.id }), remove);
      card.append(heading);

      const body = element("div", "cart-entry-body");
      body.append(element("p", "cart-entry-label", `Ingredientes a ${multiplier}×`));
      const ingredients = element("ul", "cart-ingredients");
      recipe.ingredients.forEach((item) => ingredients.append(element("li", "", recipeMultiplier.scaleIngredient(item, multiplier))));
      body.append(ingredients);
      card.append(body);
      list.append(card);
    });
    content.append(list);
  }

  let toastTimer;
  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = element("div", "toast");
      toast.setAttribute("role", "status");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2400);
  }

  function render() {
    renderTabs(document.querySelector("#desktop-tabs"), true);
    renderTabs(document.querySelector("#mobile-tabs"));
    renderCategories(document.querySelector("#desktop-categories"));
    renderCategories(document.querySelector("#mobile-category-list"));
    document.querySelector("#recipe-count").textContent = `${recipes.length} recetas en la colección`;
    appShell.classList.toggle("is-focused", state.view === "cart" || Boolean(state.recipeId));
    mobileCategories.hidden = state.view === "cart" || Boolean(state.recipeId);
    searchBox.hidden = state.view === "cart" || Boolean(state.recipeId);
    content.replaceChildren();

    if (state.view === "cart") {
      pageTitle.textContent = "Lista de la compra";
      document.title = "Lista de la compra · Recetas";
      renderCart();
      return;
    }

    if (state.recipeId && recipeById.has(state.recipeId)) {
      const recipe = recipeById.get(state.recipeId);
      pageTitle.textContent = recipe.title;
      document.title = `${recipe.title} · Recetas`;
      renderRecipeDetail(recipe);
      return;
    }

    state.recipeId = null;
    if (state.view === "home") {
      pageTitle.textContent = "Inicio";
      document.title = "Recetas";
      renderHome();
      return;
    }
    pageTitle.textContent = "Recetas";
    document.title = "Recetas";
    renderRecipeList();
  }

  function addRecipe(recipeId) {
    if (!recipeById.has(recipeId)) return;
    state.cart.push({ id: makeEntryId(), recipeId, multiplier: "1" });
    saveCart();
    render();
    showToast("Receta añadida a la lista de la compra.");
  }

  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || (!input.dataset.recipeMultiplier && !input.dataset.cartEntryMultiplier)) return;

    const multiplier = recipeMultiplier.normalize(input.value);
    if (!multiplier) {
      showToast("Introduce un multiplicador decimal mayor que cero.");
      render();
      return;
    }

    if (input.dataset.recipeMultiplier) {
      state.recipeMultipliers.set(input.dataset.recipeMultiplier, multiplier);
      render();
    } else if (input.dataset.cartEntryMultiplier) {
      const entry = state.cart.find((item) => item.id === input.dataset.cartEntryMultiplier);
      if (!entry) return;
      entry.multiplier = multiplier;
      saveCart();
      render();
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, recipeId, entryId } = button.dataset;
    if (action === "multiplier-preset") {
      const input = button.closest(".multiplier-control")?.querySelector(".multiplier-input");
      if (!input) return;
      input.value = button.dataset.multiplierValue;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    if (action === "home") event.preventDefault();

    if (action === "recipes") {
      window.location.href = `${appRootUrl()}#categorias`;
    } else if (action === "home") {
      window.location.href = appRootUrl();
    } else if (action === "browse-recipes") {
      state.view = "recipes";
      state.category = null;
      state.recipeId = null;
      render();
    } else if (action === "cart") {
      state.view = "cart";
      state.recipeId = null;
      clearRecipeRoute();
      render();
    } else if (action === "open-recipe") {
      state.view = "recipes";
      state.recipeId = recipeId;
      const recipe = recipeById.get(recipeId);
      if (recipe) history.pushState(null, "", recipeUrl(recipe));
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (action === "share-recipe") {
      const recipe = recipeById.get(state.recipeId);
      if (recipe) {
        const url = new URL(recipeUrl(recipe), window.location.href).href;
        navigator.clipboard?.writeText(url).then(
          () => showToast("Enlace copiado."),
          () => showToast(url),
        ) ?? showToast(url);
      }
    } else if (action === "add-recipe") {
      addRecipe(recipeId);
    } else if (action === "back-to-list") {
      clearRecipeRoute();
      state.recipeId = null;
      render();
    } else if (action === "remove-recipe") {
      state.cart = state.cart.filter((entry) => entry.id !== entryId);
      saveCart();
      render();
    } else if (action === "clear-cart") {
      state.cart = [];
      saveCart();
      render();
      showToast("Lista vaciada.");
    }
  });

  searchInput.addEventListener("input", () => {
    state.search = searchInput.value;
    state.view = "recipes";
    state.recipeId = null;
    render();
    searchInput.focus();
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape" && state.recipeId) {
      state.recipeId = null;
      clearRecipeRoute();
      render();
    }
  });

  state.recipeId = recipeFromLocation();
  if (state.recipeId) state.view = "recipes";
  function syncLocation() {
    state.recipeId = recipeFromLocation();
    state.view = state.recipeId || initialCategory || window.location.hash === "#categorias" ? "recipes" : "home";
    state.category = initialCategory;
    render();
  }
  window.addEventListener("popstate", syncLocation);
  window.addEventListener("hashchange", syncLocation);
  render();
})();
