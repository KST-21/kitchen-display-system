import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicBaseUrl } from "@/lib/public-url";
import { listTables } from "@/lib/kitchen-db";
import { PrintButton } from "@/components/PrintButton";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

const PrintTableQrPage = async ({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) => {
  const { tableId: rawId } = await params;
  const id = Number(rawId);
  const tables = listTables();
  const table = tables.find((t) => t.table_id === id);
  if (!table) notFound();

  const base = await getPublicBaseUrl();
  const orderUrl = `${base}/order/${encodeURIComponent(table.qr_token)}`;
  const qrDataUrl = await QRCode.toDataURL(orderUrl, {
    width: 280,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased print:min-h-0 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="mx-auto flex max-w-sm items-center justify-center gap-4 py-6 print:hidden">
        <PrintButton />
        <Link
          href="/tables"
          className="text-sm text-slate-600 underline hover:text-slate-900"
        >
          Back to tables
        </Link>
      </div>

      {/* Slip */}
      <div className="mx-auto max-w-[320px] rounded-2xl border-2 border-slate-200 bg-white px-6 pb-6 pt-7 text-center shadow-md print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Restaurant branding */}
        <p className="text-xl font-extrabold tracking-tight">Kitchen OS</p>
        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
          Fresh food · made with care
        </p>

        <hr className="my-4 border-dashed border-slate-300" />

        {/* Table number */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          Table
        </p>
        <p className="mt-1 text-5xl font-extrabold leading-none">
          {table.table_number}
        </p>

        {/* QR */}
        <div className="mt-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            width={220}
            height={220}
            alt={`QR code for table ${table.table_number}`}
            className="mx-auto rounded-xl border border-slate-200"
          />
        </div>

        <p className="mt-4 text-base font-bold">Scan to order</p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          Open your phone camera and point it at the QR code. Browse our menu,
          add items, and your order goes straight to the kitchen — no waiting.
        </p>

        {/* WiFi / useful info */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-[11px]">
          <div className="flex justify-between text-slate-600">
            <span className="font-semibold text-slate-800">WiFi</span>
            <span>KitchenOS-Guest</span>
          </div>
          <div className="mt-1.5 flex justify-between text-slate-600">
            <span className="font-semibold text-slate-800">Password</span>
            <span>welcome2025</span>
          </div>
        </div>

        <hr className="my-4 border-dashed border-slate-300" />

        <p className="text-[10px] leading-relaxed text-slate-400">
          Need help? Flag down any team member.
          <br />
          Thank you for dining with us!
        </p>
      </div>
    </div>
  );
};

export default PrintTableQrPage;
