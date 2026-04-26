"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { TableFormDialog } from "./TableFormDialog";
import { TableStatus } from "@prisma/client";

export const TableCardMenu = ({
  tableId,
  tableNumber,
  canDelete,
  isAdmin,
  onDelete,
}: {
  tableId: number;
  tableNumber: string;
  status: TableStatus;
  canDelete: boolean;
  isAdmin: boolean;
  onDelete: (formData: FormData) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest("[data-dialog-content]")) return;

      if (!ref.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 hover:bg-slate-100"
      >
        <MoreHorizontal size={18} />
      </button>

      {open && isAdmin && (
        <div className="absolute right-0 mt-2 w-32 rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
          <TableFormDialog
            editing={{
              tableId: tableId,
              tableNumber: tableNumber,
            }}
          >
            <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40">
              Edit
            </button>
          </TableFormDialog>

          <form action={onDelete}>
            <input type="hidden" name="table_id" value={tableId} />
            <button
              type="submit"
              disabled={!canDelete}
              className="w-full text-left px-3 py-2 text-sm text-red-600 enabled:hover:bg-red-50 disabled:opacity-40 disabled:select-none"
            >
              Delete
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
