"use client";

import { upsertTableAction } from "@/app/actions";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const TableFormDialog = ({
  editing,
  children,
}: {
  editing?: { tableId: number; tableNumber: string };
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (editing) {
      fd.append("table_id", String(editing.tableId));
    }

    startTransition(async () => {
      await upsertTableAction(fd);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

        <Dialog.Content
          data-dialog-content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm outline-none"
        >
          <Dialog.Title className="text-xl font-semibold tracking-tight text-slate-900">
            {editing ? `Edit Table ${editing.tableNumber}` : "Add New Table"}
          </Dialog.Title>

          <Dialog.Description className="mt-1 text-sm text-slate-600">
            {editing
              ? "Update the table details below."
              : "Enter the details for the new table."}
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {editing && (
              <input type="hidden" name="table_id" value={editing.tableId} />
            )}

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Table number
              <input
                name="table_number"
                required
                defaultValue={editing?.tableNumber ?? ""}
                placeholder="e.g. 13 or Patio-A"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow transition hover:bg-slate-800 disabled:opacity-50"
              >
                {pending ? "Saving…" : editing ? "Save" : "Add table"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
