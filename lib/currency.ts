/**
 * Currency formatting — Arkynex prices everything in US dollars.
 */

/** Full precision, e.g. `$12,400,000`. */
export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compact, e.g. `$12.4M`, `$1.2B`, `$450K`. */
export function formatMoneyCompact(amount: number | null | undefined): string {
  if (amount == null) return "";
  if (amount === 0) return "$0";
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}
