import { deleteMenuItemAction } from "@/app/actions";
import { MenuItemFormDialog } from "@/components/MenuItemFormDialog";
import { SortHeader } from "@/components/SortHeader";
import { parseSortParams, sort } from "@/lib/utils/sort";
import { listMenuItemsWithDeleteFlag } from "@/lib/kitchen-db";
import { hasRole, requireRole } from "@/lib/require-role";
import { Role } from "@prisma/client";

const MenuPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    sortKey?: string;
    dir?: string;
  }>;
}) => {
  await requireRole(["ADMIN", "STAFF"]);

  const isAdmin = await hasRole([Role.ADMIN]);

  const sp = await searchParams;
  const allRows = await listMenuItemsWithDeleteFlag();
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
        <div className="mt-6">
          <MenuItemFormDialog>
            <button className="inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800">
              + Add item
            </button>
          </MenuItemFormDialog>
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
                  THB {r.price.toFixed(2)}
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
                  <span className="inline-flex flex-wrap items-center justify-end gap-3">
                    {isAdmin && (
                      <MenuItemFormDialog
                        editing={{
                          menu_id: r.menu_id,
                          item_name: r.item_name,
                          price: r.price,
                          is_available: r.is_available,
                          image_url: r.image_url,
                        }}
                      >
                        <button className="text-amber-700 hover:underline">
                          Edit
                        </button>
                      </MenuItemFormDialog>
                    )}
                    {isAdmin && (
                      <form action={deleteMenuItemAction} className="inline">
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

export default MenuPage;
