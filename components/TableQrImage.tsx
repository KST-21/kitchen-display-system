import QRCode from "qrcode";

export async function TableQrImage({
  url,
  label,
}: {
  url: string;
  label: string;
}) {
  const src = await QRCode.toDataURL(url, {
    width: 176,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        width={176}
        height={176}
        alt={label}
        className="rounded-xl border border-slate-200 bg-white shadow-sm"
      />
    </>
  );
}
