import Link from "next/link";

export const SortHeader = ({
  basePath,
  column,
  label,
  currentSort,
  currentDir,
  extraParams,
  align,
}: {
  basePath: string;
  column: string;
  label: string;
  currentSort: string | null;
  currentDir: "asc" | "desc";
  extraParams?: Record<string, string>;
  align?: "right";
}) => {
  const active = currentSort === column;
  const nextDir = active && currentDir === "asc" ? "desc" : "asc";
  const params = new URLSearchParams({
    ...extraParams,
    sortKey: column,
    dir: nextDir,
  });
  const arrow = active ? (currentDir === "asc" ? " ↑" : " ↓") : " ↕";

  return (
    <th className={`px-3 py-3 ${align === "right" ? "text-right" : ""}`}>
      <Link
        href={`${basePath}?${params.toString()}`}
        className="inline-flex items-center gap-0.5 hover:text-slate-700"
      >
        {label}
        <span className={active ? "text-amber-600" : "text-slate-300"}>
          {arrow}
        </span>
      </Link>
    </th>
  );
};
