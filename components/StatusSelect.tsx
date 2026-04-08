"use client";

import { useState, useTransition } from "react";

export const StatusSelect = ({
  tableId,
  currentStatus,
  action,
  statuses,
}: {
  tableId: number;
  currentStatus: string;
  action: (formData: FormData) => Promise<void>;
  statuses: readonly string[];
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleChange = (newStatus: string) => {
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
      onChange={(e) => handleChange(e.target.value)}
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
