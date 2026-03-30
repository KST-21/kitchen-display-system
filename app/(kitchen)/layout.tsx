import Link from "next/link";

export const dynamic = "force-dynamic";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/tables", label: "Tables" },
  { href: "/chefs", label: "Chefs" },
  { href: "/menu", label: "Menu" },
  { href: "/orders", label: "Orders" },
  { href: "/queue", label: "Kitchen queue" },
  { href: "/display/queue", label: "Queue display" },
];

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-600">
            Operations
          </div>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Kitchen OS</h1>
          <p className="mt-1 text-xs text-slate-500">Bright console · tables &amp; queue</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-amber-50 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
