type Dir = "asc" | "desc";

export const sortRows = <T>(
  rows: T[],
  sort: string | null,
  dir: Dir,
  getters: Record<string, (r: T) => string | number | boolean>,
): T[] => {
  if (!sort || !(sort in getters)) return rows;
  const getter = getters[sort]!;
  return [...rows].sort((a, b) => {
    const va = getter(a);
    const vb = getter(b);

    const normalize = (v: string | number | boolean) => {
      if (typeof v === "boolean") return v ? 1 : 0;
      return v;
    };

    const na = normalize(va);
    const nb = normalize(vb);

    if (typeof na === "number" && typeof nb === "number") {
      return dir === "asc" ? na - nb : nb - na;
    }

    const sa = String(na).toLowerCase();
    const sb = String(nb).toLowerCase();

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
