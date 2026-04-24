import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { Network, LogOut, BookOpen, Settings, ShieldCheck } from "lucide-react";
import { UpdateBanner } from "@/components/update-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user   = session.user as { id?: string; name?: string | null; email?: string | null; role?: string };
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.06),transparent_34%)]" />

      {/* Sidebar */}
      <aside className="relative z-10 flex w-56 shrink-0 flex-col border-r border-zinc-800/70 bg-zinc-950/80 backdrop-blur" data-print="hide">
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-zinc-800/70 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30">
            <Network className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-tight text-zinc-100">Topograph</p>
            <p className="text-[9px] text-zinc-500">Systemdokumentation</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <Link href="/diagrams" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100">
            <Network className="h-4 w-4" />Diagramme
          </Link>
          <Link href="/overview" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100">
            <BookOpen className="h-4 w-4" />Übersicht
          </Link>
          {isAdmin && (
            <>
              <div className="my-2 border-t border-zinc-800/60" />
              <p className="px-3 pb-1 text-[9px] uppercase tracking-widest text-zinc-600">Administration</p>
              <Link href="/admin/users" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100">
                <ShieldCheck className="h-4 w-4" />Nutzer
              </Link>
              <Link href="/admin/system" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100">
                <Settings className="h-4 w-4" />System
              </Link>
            </>
          )}
        </nav>

        <div className="border-t border-zinc-800/70 p-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${isAdmin ? "bg-indigo-600/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>
              {(user.name ?? user.email ?? "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-200">{user.name ?? user.email}</p>
              <p className="text-[9px] text-zinc-600">{isAdmin ? "Administrator" : "Mitglied"}</p>
            </div>
            <Link href="/api/auth/signout" className="rounded p-1 text-zinc-600 hover:text-zinc-300">
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {isAdmin && <UpdateBanner />}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
