"use client";

import { useState, useTransition } from "react";

export const QueueSelects = ({
  queueId,
  currentChefId,
  currentStatus,
  chefs,
  statuses,
  action,
}: {
  queueId: number;
  currentChefId: number | null;
  currentStatus: string;
  chefs: { chef_id: number; name: string }[];
  statuses: readonly string[];
  action: (formData: FormData) => Promise<void>;
}) => {
  const [chefId, setChefId] = useState(currentChefId ?? "");
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  const update = (newChefId: string | number, newStatus: string) => {
    setChefId(newChefId);
    setStatus(newStatus);

    const formData = new FormData();
    formData.append("queue_id", String(queueId));
    formData.append("chef_id", String(newChefId));
    formData.append("queue_status", newStatus);

    startTransition(() => {
      action(formData);
    });
  };

  return (
    <div className="inline-flex flex-wrap items-center justify-end gap-2">
      <select
        value={chefId}
        onChange={(e) => update(e.target.value, status)}
        disabled={isPending}
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
      >
        <option value="">Unassigned</option>
        {chefs.map((c) => (
          <option key={c.chef_id} value={c.chef_id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => update(chefId, e.target.value)}
        disabled={isPending}
        className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
};
