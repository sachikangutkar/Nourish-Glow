/**
 * Formats a numeric amount into Indian standard currency (INR / ₹)
 * Examples:
 * 299 -> ₹299
 * 1299 -> ₹1,299
 * 125000 -> ₹1,25,000
 */
export function formatINR(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹0";
  }
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount));

  return `₹${formatted}`;
}

/**
 * Calculates discount percentage safely
 */
export function calculateDiscountPercent(mrp: number, salePrice: number): number {
  if (!mrp || mrp <= salePrice) return 0;
  return Math.round(((mrp - salePrice) / mrp) * 100);
}
