import { ChefDeleteForm } from "@/components/ChefDeleteForm";
import { ChefFormDialog } from "@/components/ChefFormDialog";
import { SortHeader } from "@/components/SortHeader";
import { parseSortParams, sort } from "@/lib/utils/sort";
import { listChefs } from "@/lib/kitchen-db";
import { hasRole, requireRole } from "@/lib/require-role";
import { Role } from "@prisma/client";

const ChefsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ sortKey?: string; dir?: string }>;
}) => {
  await requireRole(["ADMIN", "STAFF"]);

  const isAdmin = await hasRole([Role.ADMIN]);

  const sp = await searchParams;
  const allRows = await listChefs();
  const { sortKey, dir } = parseSortParams(sp);
  const rows = sort(allRows, sortKey, dir, {
    chef_id: (r) => r.chef_id,
    name: (r) => r.name,
    phone: (r) => r.phone,
  });

  const sh = (col: string, label: string) => (
    <SortHeader
      basePath="/chefs"
      column={col}
      label={label}
      currentSort={sortKey}
      currentDir={dir}
    />
  );

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Chefs
      </h2>
      <p className="mt-1 text-sm text-slate-600">Kitchen staff directory.</p>

      {isAdmin && (
        <div className="mt-6">
          <ChefFormDialog>
            <button className="inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800">
              + Add chef
            </button>
          </ChefFormDialog>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Chefs directory</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              {sh("chef_id", "ID")}
              {sh("name", "Name")}
              {sh("phone", "Phone")}
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.chef_id} className="hover:bg-slate-50/80">
                <td className="px-3 py-3 tabular-nums text-slate-500">
                  {r.chef_id}
                </td>
                <td className="px-3 py-3 font-medium text-slate-900">
                  {r.name}
                </td>
                <td className="px-3 py-3 text-slate-700">{r.phone}</td>
                <td className="px-3 py-3 text-right">
                  <span className="inline-flex flex-wrap items-center justify-end gap-3">
                    {isAdmin && (
                      <ChefFormDialog
                        editing={{
                          chef_id: r.chef_id,
                          name: r.name,
                          phone: r.phone,
                        }}
                      >
                        <button className="text-amber-700 hover:underline">
                          Edit
                        </button>
                      </ChefFormDialog>
                    )}
                    {isAdmin && <ChefDeleteForm chefId={r.chef_id} />}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChefsPage;
