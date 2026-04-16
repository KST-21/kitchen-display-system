import { loginAction } from "@/app/actions";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md sm:max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Staff Login
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Enter your credentials to access the system.
        </p>

        <form action={loginAction} className="mt-8 space-y-5">
          <input
            name="email"
            placeholder="Email"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />

          <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow hover:bg-slate-800">
            Login
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-500">
          Staff only. Customers should scan the QR code again.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
