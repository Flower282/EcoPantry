export type ParsedQuantity = { value: number; unit: string };

export function parseQty(s: string): ParsedQuantity | null {
  const m = s.trim().match(/^([\d.,]+)\s*([a-zA-ZÀ-ỹ%]+.*)?$/);
  if (!m) return null;
  const value = parseFloat(m[1].replace(",", "."));
  if (Number.isNaN(value)) return null;
  const unit = (m[2] || "").trim().toLowerCase();
  return { value, unit };
}

export type NormalisedQuantity = {
  value: number;
  base: "g" | "ml" | "other";
  display: string;
};

export function normaliseWeight(value: number, unit: string): NormalisedQuantity {
  const u = unit.toLowerCase();
  if (u === "kg") return { value: value * 1000, base: "g", display: "g" };
  if (u === "g") return { value, base: "g", display: "g" };
  if (u === "l") return { value: value * 1000, base: "ml", display: "ml" };
  if (u === "ml") return { value, base: "ml", display: "ml" };
  return { value, base: "other", display: u };
}

export type Diff = "match" | "under" | "over";
export type QuantityComparison = { diff: Diff; deltaText: string };

export function compareQty(target: string, actual: string): QuantityComparison | null {
  const t = parseQty(target);
  const a = parseQty(actual);
  if (!t || !a) return null;

  const tn = normaliseWeight(t.value, t.unit);
  const an = normaliseWeight(a.value, a.unit);

  if (tn.base !== an.base || (tn.base === "other" && t.unit !== a.unit)) {
    // Different unit families — fall back to raw value compare
    if (a.value === t.value) return { diff: "match", deltaText: "" };
    return a.value < t.value
      ? { diff: "under", deltaText: `−${(t.value - a.value).toLocaleString("vi-VN")} ${t.unit}` }
      : { diff: "over", deltaText: `+${(a.value - t.value).toLocaleString("vi-VN")} ${a.unit}` };
  }

  if (an.value === tn.value) return { diff: "match", deltaText: "" };

  const delta = Math.abs(an.value - tn.value);
  const deltaText = `${delta.toLocaleString("vi-VN")} ${an.display}`;
  return an.value < tn.value
    ? { diff: "under", deltaText: `−${deltaText}` }
    : { diff: "over", deltaText: `+${deltaText}` };
}
