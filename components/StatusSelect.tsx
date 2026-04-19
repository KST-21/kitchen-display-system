"use client";

import { TableStatus } from "@prisma/client";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const StatusSelect = ({
  tableId,
  currentStatus,
  action,
  statuses,
}: {
  tableId: number;
  currentStatus: TableStatus;
  action: (formData: FormData) => Promise<void>;
  statuses: readonly TableStatus[];
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [pendingStatus, setPendingStatus] = useState<TableStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const applyStatusChange = (newStatus: TableStatus) => {
    setStatus(newStatus);

    const formData = new FormData();
    formData.append("table_id", String(tableId));
    formData.append("status", newStatus);

    startTransition(() => {
      action(formData);
    });
  };

  const handleChange = (newStatus: TableStatus) => {
    if (
      currentStatus === TableStatus.Occupied &&
      newStatus !== TableStatus.Occupied
    ) {
      setPendingStatus(newStatus);
      return;
    }

    applyStatusChange(newStatus);
  };

  return (
    <>
      <select
        value={status}
        onChange={(e) => {
          const value = e.target.value;
          if (!statuses.includes(value as TableStatus)) return;
          handleChange(value as TableStatus);
        }}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        disabled={isPending}
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <AlertDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
      >
        <AlertDialogContent className="bg-white shadow-lg ring-slate-500 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              End active session?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-wrap text-slate-600">
              This table is currently occupied. Changing the status will end the
              active session and may stop ongoing orders.
              <br />
              <br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="border-0">
            <AlertDialogCancel className="hover:!bg-slate-100">
              Cancel
            </AlertDialogCancel>

            <button
              onClick={() => {
                if (!pendingStatus) return;
                applyStatusChange(pendingStatus);
                setPendingStatus(null);
              }}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-red-600 bg-red-600 px-2.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              Change status
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
