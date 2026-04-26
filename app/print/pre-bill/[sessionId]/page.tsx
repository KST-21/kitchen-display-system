import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintButton } from "@/components/PrintButton";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { getSessionItemsWithOrderInfoPrisma } from "@/lib/kitchen-db";

export const dynamic = "force-dynamic";

const PreBillPage = async ({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) => {
  await requireRole(["ADMIN", "STAFF"]);

  const { sessionId: rawId } = await params;
  const sessionId = Number(rawId);
  if (!Number.isFinite(sessionId)) notFound();

  const session = await prisma.tableSession.findUnique({
    where: { session_id: sessionId },
    include: { table: true },
  });

  if (!session) notFound();

  const rawItems = await getSessionItemsWithOrderInfoPrisma(sessionId);

  const lines = rawItems.map((i) => ({
    name: i.menu.item_name,
    qty: i.quantity,
    price: i.menu.price,
  }));

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const now = new Date();

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased print:min-h-0 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="mx-auto flex max-w-sm items-center justify-center gap-4 py-6 print:hidden">
        <PrintButton />
        <Link
          href="/orders"
          className="text-sm text-slate-600 underline hover:text-slate-900"
        >
          Back to orders
        </Link>
      </div>

      {/* Receipt slip */}
      <div className="mx-auto max-w-[320px] rounded-2xl border-2 border-slate-200 bg-white px-6 pb-6 pt-7 text-center shadow-md print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Restaurant branding */}
        <p className="text-xl font-extrabold tracking-tight">Kitchen OS</p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Fresh food &middot; made with care
        </p>

        <hr className="my-4 border-dashed border-slate-300" />

        {/* Table & session info */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Table
        </p>
        <p className="mt-1 text-5xl font-extrabold leading-none">
          {session.table.table_number}
        </p>
        <p className="mt-2 text-[11px] text-slate-400">
          Session #{session.session_id} &middot;{" "}
          {now.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}{" "}
          {now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <hr className="my-4 border-dashed border-slate-300" />

        <p className="mb-3 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Order summary
        </p>

        {/* Line items */}
        {lines.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">No items ordered yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Amt</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => (
                <tr
                  key={idx}
                  className="border-b border-dotted border-slate-200"
                >
                  <td className="py-1.5 pr-2 text-slate-800">{l.name}</td>
                  <td className="py-1.5 text-center text-slate-600">{l.qty}</td>
                  <td className="py-1.5 text-right font-medium">
                    THB {(l.price * l.qty).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <hr className="my-4 border-dashed border-slate-300" />

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold">THB {subtotal.toFixed(2)}</span>
          </div>
        </div>

        <hr className="my-4 border-dashed border-slate-300" />

        <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Pre-bill &middot; Not a final receipt
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
          This is a courtesy summary of your current orders.
          <br />
          Final bill may include additional charges.
          <br />
          Thank you for dining with us!
        </p>
      </div>
    </div>
  );
};

export default PreBillPage;
