import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kitchen queue display — Kitchen OS",
  description: "Large-format kitchen pass queue",
};

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 text-slate-900 antialiased selection:bg-amber-200/80 selection:text-amber-950">
      {children}
    </div>
  );
}
