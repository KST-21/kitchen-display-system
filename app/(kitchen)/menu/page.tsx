import { deleteMenuItemAction, upsertMenuItemAction } from "@/app/actions";
import { SortHeader } from "@/components/SortHeader";
import { parseSortParams, sort } from "@/lib/utils/sort";
import { listMenuItemsWithDeleteFlag } from "@/lib/kitchen-db";
import Link from "next/link";
import { hasRole, requireRole } from "@/lib/require-role";
import { Role } from "@prisma/client";

const MenuPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    error?: string;
    sortKey?: string;
    dir?: string;
  }>;
}) => {
  await requireRole(["ADMIN", "STAFF"]);

  const isAdmin = await hasRole([Role.ADMIN]);

  const sp = await searchParams;
  const editId = sp.edit ? Number(sp.edit) : null;
  const allRows = await listMenuItemsWithDeleteFlag();
  const editing = editId ? allRows.find((r) => r.menu_id === editId) : null;
  const { sortKey, dir } = parseSortParams(sp);
  const rows = sort(allRows, sortKey, dir, {
    menu_id: (r) => r.menu_id,
    item_name: (r) => r.item_name,
    price: (r) => r.price,
    is_available: (r) => r.is_available,
  });

  const sh = (col: string, label: string) => (
    <SortHeader
      basePath="/menu"
      column={col}
      label={label}
      currentSort={sortKey}
      currentDir={dir}
    />
  );

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Menu
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {allRows.length} item{allRows.length !== 1 ? "s" : ""} total
        {" · "}
        {allRows.filter((r) => r.is_available).length} available
        {" · "}
        {allRows.filter((r) => !r.is_available).length} unavailable
      </p>

      {sp.error === "in_use" ? (
        <div
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          Cannot delete a menu item that still appears on past orders. Mark
          &quot;not available&quot; instead.
        </div>
      ) : null}

      {isAdmin && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-900">
            {editing ? "Edit item" : "Add item"}
          </h3>
          <form
            action={upsertMenuItemAction}
            className="mt-4 flex flex-wrap items-end gap-4"
          >
            {editing ? (
              <input type="hidden" name="menu_id" value={editing.menu_id} />
            ) : null}
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Item name
              <input
                name="item_name"
                required
                defaultValue={editing?.item_name ?? ""}
                className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Price (USD)
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={editing?.price ?? ""}
                className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex min-w-[min(100%,28rem)] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
              Image URL{" "}
              <span className="font-normal text-slate-400">
                (optional — shown on guest QR menu)
              </span>
              <input
                name="image_url"
                type="url"
                inputMode="url"
                placeholder="https://… or /your-file.jpg in public/"
                defaultValue={editing?.image_url ?? ""}
                className="w-full max-w-xl rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 pt-5 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_available"
                defaultChecked={editing ? editing.is_available : true}
                className="h-4 w-4 rounded border-slate-300"
              />
              Available
            </label>
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
            >
              {editing ? "Save" : "Add"}
            </button>
            {editing ? (
              <Link
                href="/menu"
                className="text-sm text-slate-600 underline hover:text-slate-900"
              >
                Cancel edit
              </Link>
            ) : null}
          </form>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Menu items, prices, and availability
          </caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              {sh("menu_id", "ID")}
              {sh("item_name", "Item")}
              {sh("price", "Price")}
              {sh("is_available", "Available")}
              <th className="px-3 py-3">Photo</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.menu_id} className="hover:bg-slate-50/80">
                <td className="px-3 py-3 tabular-nums text-slate-500">
                  {r.menu_id}
                </td>
                <td className="px-3 py-3 font-medium text-slate-900">
                  {r.item_name}
                </td>
                <td className="px-3 py-3 tabular-nums">
                  ${r.price.toFixed(2)}
                </td>
                <td className="px-3 py-3">{r.is_available ? "Yes" : "No"}</td>
                <td className="px-3 py-3">
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image_url}
                      alt=""
                      className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  <Link
                    href={`/menu?edit=${r.menu_id}`}
                    className="text-amber-700 hover:underline"
                  >
                    Edit
                  </Link>
                  {isAdmin && (
                    <form action={deleteMenuItemAction} className="ml-4 inline">
                      <input type="hidden" name="menu_id" value={r.menu_id} />
                      <button
                        type="submit"
                        disabled={!r.can_delete}
                        className="text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          r.can_delete
                            ? "Delete item"
                            : "On past orders — mark unavailable instead"
                        }
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuPage;
