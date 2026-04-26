"use client";

import { upsertMenuItemAction } from "@/app/actions";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const MenuItemFormDialog = ({
  editing,
  children,
}: {
  editing?: {
    menu_id: number;
    item_name: string;
    price: number;
    is_available: boolean;
    image_url: string | null;
  };
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await upsertMenuItemAction(fd);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <AlertDialogPrimitive.Trigger asChild>
        {children}
      </AlertDialogPrimitive.Trigger>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm outline-none sm:max-w-lg">
          <AlertDialogPrimitive.Title className="text-xl font-semibold tracking-tight text-slate-900">
            {editing ? "Edit Menu Item" : "Add Menu Item"}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-1 text-sm text-slate-600">
            {editing
              ? "Update the item details below."
              : "Enter the details for the new menu item."}
          </AlertDialogPrimitive.Description>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {editing && (
              <input type="hidden" name="menu_id" value={editing.menu_id} />
            )}

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Item name
              <input
                name="item_name"
                required
                defaultValue={editing?.item_name ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Price (USD)
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={editing?.price ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Image URL
              <span className="text-xs font-normal text-slate-400">
                Optional — shown on guest QR menu
              </span>
              <input
                name="image_url"
                type="url"
                inputMode="url"
                placeholder="https://… or /your-file.jpg in public/"
                defaultValue={editing?.image_url ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_available"
                defaultChecked={editing ? editing.is_available : true}
                className="h-4 w-4 rounded border-slate-300"
              />
              Available
            </label>

            <div className="flex gap-3 pt-2">
              <AlertDialogPrimitive.Cancel className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Cancel
              </AlertDialogPrimitive.Cancel>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow transition hover:bg-slate-800 disabled:opacity-50"
              >
                {pending ? "Saving…" : editing ? "Save" : "Add item"}
              </button>
            </div>
          </form>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
};
