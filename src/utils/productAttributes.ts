import { ProductAttribute, ProductAttributeOption } from "@/types/product";

export function isColorAttribute(attribute: ProductAttribute): boolean {
  const slug = attribute.slug.toLowerCase();
  const name = attribute.name.toLowerCase();

  return (
    slug.includes("color") ||
    slug.includes("colour") ||
    name.includes("color") ||
    name.includes("colour")
  );
}

export function extractColorValue(
  option: ProductAttributeOption
): string | null {
  const candidates = [option.description, option.slug, option.name];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const hexMatch = candidate.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
    if (hexMatch) {
      return normalizeHex(hexMatch[0]);
    }

    const rgbMatch = candidate.match(/rgb(a)?\([^)]+\)/i);
    if (rgbMatch) {
      return rgbMatch[0];
    }
  }

  return null;
}

export function createAttributeOptionKey(
  attribute: ProductAttribute,
  option: ProductAttributeOption
): string {
  return `${attribute.slug}-${option.slug ?? option.id ?? option.name}`;
}

export function getContrastingTextColor(
  color: string | null | undefined
): "#000000" | "#ffffff" {
  if (!color) {
    return "#000000";
  }

  const rgb = toRgb(color);
  if (!rgb) {
    return "#000000";
  }

  const [r, g, b] = rgb.map((component) => {
    const channel = component / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 0.5 ? "#000000" : "#ffffff";
}

function toRgb(color: string): [number, number, number] | null {
  if (color.startsWith("#")) {
    return hexToRgb(color);
  }

  if (color.toLowerCase().startsWith("rgb")) {
    return rgbStringToRgb(color);
  }

  return null;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  const value = normalized.slice(1);
  const bigint = parseInt(value, 16);
  if (Number.isNaN(bigint)) return null;

  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function normalizeHex(hex: string): string | null {
  const clean = hex.trim();
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean)) {
    return null;
  }

  if (clean.length === 4) {
    const [, r, g, b] = clean;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return clean.toLowerCase();
}

function rgbStringToRgb(color: string): [number, number, number] | null {
  const match = color
    .replace(/\s+/g, "")
    .match(/^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,\d*\.?\d+)?\)$/i);

  if (!match) return null;

  const [, r, g, b] = match;
  return [Number(r), Number(g), Number(b)].map((channel) => {
    if (channel < 0) return 0;
    if (channel > 255) return 255;
    return channel;
  }) as [number, number, number];
}
