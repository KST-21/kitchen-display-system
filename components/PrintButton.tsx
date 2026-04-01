"use client";

export const PrintButton = () => {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 print:hidden"
    >
      Print this slip
    </button>
  );
};
