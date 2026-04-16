"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";

export const TableCardMenu = ({
  tableId,
  canDelete,
  isAdmin,
  onDelete,
}: {
  tableId: number;
  canDelete: boolean;
  isAdmin: boolean;
  onDelete: (formData: FormData) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
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

      {open && (
        <div className="absolute right-0 mt-2 w-32 rounded-xl border border-slate-200 bg-white shadow-md">
          <Link
            href={`/tables?edit=${tableId}`}
            className="block px-3 py-2 text-sm hover:bg-slate-50"
          >
            Edit
          </Link>

          {isAdmin && (
            <form action={onDelete}>
              <input type="hidden" name="table_id" value={tableId} />
              <button
                type="submit"
                disabled={!canDelete}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                Delete
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
