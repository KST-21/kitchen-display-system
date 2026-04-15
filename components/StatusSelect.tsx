"use client";

import { TableStatus } from "@prisma/client";
import { useState, useTransition } from "react";

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
  const [isPending, startTransition] = useTransition();

  const handleChange = (newStatus: TableStatus) => {
    setStatus(newStatus);

    const formData = new FormData();
    formData.append("table_id", String(tableId));
    formData.append("status", newStatus);

    startTransition(() => {
      action(formData);
    });
  };

  return (
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
      {statuses.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
};
