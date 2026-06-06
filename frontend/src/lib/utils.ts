export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatLimit(
  limit: number | string | null | undefined,
  planSlug?: string | null | undefined,
  type?: "store" | "user"
): string {
  const isDemo = planSlug === "demo" || planSlug === "baslangic" || (planSlug && planSlug.toLowerCase().includes("demo"));
  if (isDemo) {
    return type === "store" ? "1" : "5";
  }

  if (limit === null || limit === undefined) {
    return "Bilgi alınamadı";
  }

  const strLimit = String(limit).trim().toLowerCase();
  if (strLimit === "" || strLimit === "unknown") {
    return "Bilgi alınamadı";
  }

  if (
    strLimit === "unlimited" ||
    strLimit === "sınırsız" ||
    strLimit === "sinirsiz" ||
    strLimit === "999"
  ) {
    return "Sınırsız";
  }

  const parsed = parseInt(strLimit, 10);
  if (Number.isNaN(parsed)) {
    if (planSlug === "enterprise" || planSlug === "kurumsal") {
      return "Sınırsız";
    }
    return "Bilgi alınamadı";
  }

  return String(parsed);
}

export function parseLimit(
  limit: number | string | null | undefined,
  planSlug?: string | null | undefined
): number {
  const isDemo = planSlug === "demo" || planSlug === "baslangic" || (planSlug && planSlug.toLowerCase().includes("demo"));
  if (isDemo) return 1;
  if (limit === null || limit === undefined) return 1;

  const str = String(limit).trim().toLowerCase();
  if (
    str === "unlimited" ||
    str === "sınırsız" ||
    str === "sinirsiz" ||
    str === "999" ||
    str === ""
  ) {
    return 999;
  }

  const parsed = parseInt(str, 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}
