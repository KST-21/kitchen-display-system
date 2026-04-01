import Link from "next/link";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">Page not found</h1>
      <p className="max-w-md text-sm text-zinc-600">
        That URL is not part of Kitchen OS. Use the sidebar or go back to the
        dashboard.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
