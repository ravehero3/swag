export function isSoundKitType(productType: string | undefined): boolean {
  return productType === "sound_kit" || productType === "kit";
}

export interface PricedItem {
  price: number;
  productType?: string;
}

/** Promo discount applies to sound kits only; beats stay full price. */
export function calculateOrderTotal(
  items: PricedItem[],
  discountPercent: number
): {
  rawTotal: number;
  kitSubtotal: number;
  beatSubtotal: number;
  discountAmount: number;
  finalTotal: number;
} {
  const rawTotal = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  const kitSubtotal = items
    .filter((it) => isSoundKitType(it.productType))
    .reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  const beatSubtotal = rawTotal - kitSubtotal;
  const discountAmount =
    discountPercent > 0
      ? Math.round(kitSubtotal * (discountPercent / 100) * 100) / 100
      : 0;
  const finalTotal = Math.round((beatSubtotal + kitSubtotal - discountAmount) * 100) / 100;
  return { rawTotal, kitSubtotal, beatSubtotal, discountAmount, finalTotal };
}

export function orderQualifiesForLicence(order: {
  total: number | string;
  payment_method?: string | null;
}): boolean {
  return Number(order.total) > 0 && order.payment_method !== "free";
}
