(() => {
  "use strict";

  function decimalParts(value) {
    const normalized = String(value).trim().replace(",", ".");
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
    const [whole, fraction = ""] = normalized.split(".");
    return { value: BigInt(`${whole}${fraction}`), scale: fraction.length };
  }

  function normalize(value) {
    const canonical = String(value).trim().replace(",", ".");
    const parts = decimalParts(canonical);
    if (!parts || parts.value <= 0n) return null;
    const [whole, fraction = ""] = canonical.split(".");
    const trimmedFraction = fraction.replace(/0+$/, "");
    return trimmedFraction ? `${whole},${trimmedFraction}` : whole;
  }

  function multiplyDecimals(value, multiplier) {
    const left = decimalParts(value);
    const right = decimalParts(multiplier);
    if (!left || !right) return value;

    const scale = left.scale + right.scale;
    const product = (left.value * right.value).toString().padStart(scale + 1, "0");
    if (scale === 0) return product;

    const integer = product.slice(0, -scale) || "0";
    const fraction = product.slice(-scale).replace(/0+$/, "");
    return fraction ? `${integer},${fraction}` : integer;
  }

  const numberPattern = /(?<![\d/])\d+(?:[.,]\d+)?(?![\d/])/g;
  const percentagePattern = /(?<![\d/])\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*%/g;

  function scaleIngredient(item, multiplier) {
    const normalized = normalize(multiplier);
    if (!normalized || normalized === "1") return item;

    const percentageRanges = [...item.matchAll(percentagePattern)].map((match) => [match.index, match.index + match[0].length]);
    return item.replace(numberPattern, (number, offset) => {
      const belongsToPercentage = percentageRanges.some(([start, end]) => offset >= start && offset + number.length <= end);
      return belongsToPercentage ? number : multiplyDecimals(number, normalized);
    });
  }

  window.recipeMultiplier = { normalize, scaleIngredient };
})();
