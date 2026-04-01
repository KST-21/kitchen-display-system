const GuestOrderLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {children}
    </div>
  );
};

export default GuestOrderLayout;
