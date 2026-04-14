import { upsertChefAction } from "@/app/actions";
import { ChefDeleteForm } from "@/components/ChefDeleteForm";
import { SortHeader } from "@/components/SortHeader";
import { parseSortParams, sort } from "@/lib/utils/sort";
import { listChefs } from "@/lib/kitchen-db";
import Link from "next/link";

const ChefsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; sortKey?: string; dir?: string }>;
}) => {
  const sp = await searchParams;
  const editId = sp.edit ? Number(sp.edit) : null;
  const allRows = await listChefs();
  const editing = editId ? allRows.find((r) => r.chef_id === editId) : null;
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

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium text-slate-900">
          {editing ? "Edit chef" : "Add chef"}
        </h3>
        <form
          action={upsertChefAction}
          className="mt-4 flex flex-wrap items-end gap-4"
        >
          {editing ? (
            <input type="hidden" name="chef_id" value={editing.chef_id} />
          ) : null}
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Name
            <input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Phone
            <input
              name="phone"
              required
              defaultValue={editing?.phone ?? ""}
              className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
          >
            {editing ? "Save" : "Add"}
          </button>
          {editing ? (
            <Link
              href="/chefs"
              className="text-sm text-slate-600 underline hover:text-slate-900"
            >
              Cancel edit
            </Link>
          ) : null}
        </form>
      </div>

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
                    <Link
                      href={`/chefs?edit=${r.chef_id}`}
                      className="text-amber-700 hover:underline"
                    >
                      Edit
                    </Link>
                    <ChefDeleteForm chefId={r.chef_id} />
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
