"use client";

import { resetAndSeedAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ResetDatabaseButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      onClick={() => {
        if (
          !confirm(
            "Delete ALL data and load the full test fixture? This cannot be undone."
          )
        )
          return;
        startTransition(async () => {
          await resetAndSeedAction();
          router.refresh();
        });
      }}
    >
      {pending ? "Resetting…" : "Reset DB & load full test data"}
    </button>
  );
}
