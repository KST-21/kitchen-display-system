type Dir = "asc" | "desc";

export const sortRows = <T>(
  rows: T[],
  sort: string | null,
  dir: Dir,
  getters: Record<string, (r: T) => string | number>,
): T[] => {
  if (!sort || !(sort in getters)) return rows;
  const getter = getters[sort]!;
  return [...rows].sort((a, b) => {
    const va = getter(a);
    const vb = getter(b);
    if (typeof va === "number" && typeof vb === "number") {
      return dir === "asc" ? va - vb : vb - va;
    }
    const sa = String(va).toLowerCase();
    const sb = String(vb).toLowerCase();
    const cmp = sa < sb ? -1 : sa > sb ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
};

export const parseSortParams = (sp: {
  sort?: string;
  dir?: string;
}): {
  sort: string | null;
  dir: Dir;
} => {
  return {
    sort: sp.sort ?? null,
    dir: sp.dir === "desc" ? "desc" : "asc",
  };
};
