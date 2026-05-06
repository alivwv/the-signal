export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 bg-black rounded-md flex items-center justify-center text-white text-xs font-bold tracking-tight">
            PRt
          </div>
          <h1 className="font-[family-name:var(--font-plex-serif)] text-xl font-medium">
            <em className="text-teal">The</em> Signal
          </h1>
        </div>
        <div className="bg-bg-card border border-border rounded-[var(--radius-lg)] p-6 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
          {children}
        </div>
      </div>
    </div>
  );
}
