export function formatMoney(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

