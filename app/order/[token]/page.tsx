import { notFound } from "next/navigation";
import { GuestOrderForm } from "@/components/GuestOrderForm";
import { getSessionByHash, listMenuItems } from "@/lib/kitchen-db";

export const dynamic = "force-dynamic";

const GuestOrderPage = async ({
  params,
}: {
  params: Promise<{ token: string }>;
}) => {
  const { token } = await params;
  const session = await getSessionByHash(token);

  if (!session) notFound();

  const menu = await listMenuItems();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/90 via-white to-slate-100 pb-10 pt-6 sm:pt-10">
      <div className="mx-auto max-w-lg px-4">
        <header className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 px-6 py-8 text-center shadow-lg shadow-amber-900/5 ring-1 ring-slate-900/[0.04] backdrop-blur-md">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-orange-200/35 blur-3xl"
            aria-hidden
          />
          <p className="relative text-[11px] font-bold uppercase tracking-[0.28em] text-amber-700">
            Self-order
          </p>
          <h1 className="relative mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
            Table {session.table.table_number}
          </h1>
          <p className="relative mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
            Browse the menu with photos, add notes, and send your order straight
            to the kitchen.
          </p>
        </header>
        <div className="mt-8">
          <GuestOrderForm
            qrToken={session.hash}
            menu={menu}
            tableNumber={session.table.table_number}
          />
        </div>
      </div>
    </div>
  );
};

export default GuestOrderPage;
