import type { CartItem } from "@/store/useCartStore";

export const getItemImageSrc = (item: CartItem): string => {
  const matchingVariation = item.variations.find((variation) =>
    variation.attributes.every(
      (variationAttr) =>
        item.selectedAttributes?.[variationAttr.id] === variationAttr.option
    )
  );

  if (matchingVariation?.image?.src) {
    return matchingVariation.image.src;
  }

  if (typeof item.image === "string") {
    return item.image;
  }

  if (item.image?.sourceUrl) {
    return item.image.sourceUrl;
  }

  if (item.images && item.images.length > 0) {
    return item.images[0].src;
  }

  return "/logo-belm-v2.png";
};
