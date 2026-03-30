"use client";

import { useEffect } from "react";

export default function KitchenError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50/80 px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-zinc-900">This page failed to load</h2>
      <p className="text-sm text-zinc-600">
        {error.message || "Something went wrong. You can try again."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Try again
      </button>
    </div>
  );
}
