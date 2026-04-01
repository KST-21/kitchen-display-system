type Dir = "asc" | "desc";

export function sortRows<T>(
  rows: T[],
  sort: string | null,
  dir: Dir,
  getters: Record<string, (r: T) => string | number>
): T[] {
  if (!sort || !(sort in getters)) return rows;
  const getter = getters[sort]!;
  return [...rows].sort((a, b) => {
    const va = getter(a);
    const vb = getter(b);
    if (typeof va === "number" && typeof vb === "number") {
      return dir === "asc" ? va - vb : vb - va;
    }
    const sa = String(va);
    const sb = String(vb);
    // Use natural sort so table numbers like 1,2,10,11 sort correctly instead of 1,10,11,2
    const cmp = sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
    return dir === "asc" ? cmp : -cmp;
  });
}

export function parseSortParams(sp: { sort?: string; dir?: string }): {
  sort: string | null;
  dir: Dir;
} {
  return {
    sort: sp.sort ?? null,
    dir: sp.dir === "desc" ? "desc" : "asc",
  };
}
