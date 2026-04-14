type Dir = "asc" | "desc";

export const sort = <T>(
  rows: T[],
  sortKey: string | null,
  dir: Dir,
  getters: Record<string, (r: T) => unknown>,
): T[] => {
  if (!sortKey || !(sortKey in getters)) return rows;

  const getter = getters[sortKey];

  const normalize = (v: unknown): number | string => {
    if (typeof v === "boolean") return v ? 1 : 0;

    if (typeof v === "number") return v;

    if (typeof v === "string") {
      const n = Number(v);
      if (!isNaN(n)) return n;
      return v.toLowerCase();
    }

    return String(v);
  };

  return [...rows].sort((a, b) => {
    const na = normalize(getter(a));
    const nb = normalize(getter(b));

    if (typeof na === "number" && typeof nb === "number") {
      return dir === "asc" ? na - nb : nb - na;
    }

    const cmp = String(na).localeCompare(String(nb));
    return dir === "asc" ? cmp : -cmp;
  });
};

export const parseSortParams = (sp: {
  sortKey?: string;
  dir?: string;
}): {
  sortKey: string | null;
  dir: Dir;
} => {
  return {
    sortKey: sp.sortKey ?? null,
    dir: sp.dir === "desc" ? "desc" : "asc",
  };
};
