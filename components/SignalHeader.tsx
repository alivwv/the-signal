import Link from "next/link";

export function SignalHeader({ userEmail }: { userEmail: string | null }) {
  return (
    <header className="border-b border-border-l bg-bg/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black rounded-md flex items-center justify-center text-white text-xs font-bold tracking-tight">
            PRt
          </div>
          <h1 className="font-[family-name:var(--font-plex-serif)] text-xl font-medium">
            <em className="text-teal">The</em> Signal
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="text-xs text-txt3 hidden sm:inline">
              {userEmail}
            </span>
          )}
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-xs font-medium text-txt2 border border-border rounded-[var(--radius-sm)] px-3 py-1.5 hover:bg-white transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
