"use client";

import { upsertChefAction } from "@/app/actions";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export const ChefFormDialog = ({
  editing,
  children,
}: {
  editing?: { chef_id: number; name: string; phone: string };
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await upsertChefAction(fd);
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
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm outline-none">
          <AlertDialogPrimitive.Title className="text-xl font-semibold tracking-tight text-slate-900">
            {editing ? "Edit Chef" : "Add Chef"}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-1 text-sm text-slate-600">
            {editing
              ? "Update the chef details below."
              : "Enter the details for the new chef."}
          </AlertDialogPrimitive.Description>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {editing && (
              <input type="hidden" name="chef_id" value={editing.chef_id} />
            )}

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Name
              <input
                name="name"
                required
                defaultValue={editing?.name ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Phone
              <input
                name="phone"
                required
                defaultValue={editing?.phone ?? ""}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
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
                {pending ? "Saving…" : editing ? "Save" : "Add chef"}
              </button>
            </div>
          </form>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
};
