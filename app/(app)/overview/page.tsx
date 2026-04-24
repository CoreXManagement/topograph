import Link from "next/link";
import { Network, Boxes, GitBranch, Clock } from "lucide-react";
import pool, { ensureSchema } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OverviewPage() {
  await ensureSchema();

  const { rows: stats } = await pool.query<{
    diagram_count: string;
    node_count: string;
    edge_count: string;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM docs_diagrams)::text AS diagram_count,
      (SELECT COUNT(*) FROM docs_nodes)::text    AS node_count,
      (SELECT COUNT(*) FROM docs_edges)::text    AS edge_count
  `);

  const { rows: recent } = await pool.query<{
    id: string; title: string; description: string | null;
    updated_at: string; node_count: string;
  }>(`
    SELECT d.id, d.title, d.description, d.updated_at,
           COUNT(n.id)::text AS node_count
    FROM docs_diagrams d
    LEFT JOIN docs_nodes n ON n.diagram_id = d.id
    GROUP BY d.id
    ORDER BY d.updated_at DESC
    LIMIT 6
  `);

  const s = stats[0] ?? { diagram_count: "0", node_count: "0", edge_count: "0" };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Übersicht</h1>
        <p className="text-sm text-muted-foreground">Systemdokumentation auf einen Blick</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Diagramme",   value: s.diagram_count, icon: Network,   color: "text-cyan-400" },
          { label: "Nodes",       value: s.node_count,    icon: Boxes,     color: "text-amber-400" },
          { label: "Verbindungen",value: s.edge_count,    icon: GitBranch, color: "text-purple-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-xs uppercase tracking-widest text-zinc-500">{label}</span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent diagrams */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-400">Zuletzt geändert</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((d) => (
            <Link key={d.id} href={`/diagrams/${d.id}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-all hover:border-zinc-600 hover:bg-zinc-900/70">
              <div className="flex items-start justify-between gap-2">
                <Network className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                  <Clock className="h-3 w-3" />
                  {new Date(d.updated_at).toLocaleDateString("de-DE")}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-zinc-200 group-hover:text-zinc-100">{d.title}</p>
              {d.description && <p className="mt-0.5 line-clamp-1 text-xs text-zinc-600">{d.description}</p>}
              <p className="mt-2 text-[10px] text-zinc-700">{d.node_count} Nodes</p>
            </Link>
          ))}
        </div>
        {recent.length === 0 && (
          <p className="text-sm text-muted-foreground">Noch keine Diagramme. <Link href="/diagrams" className="text-cyan-400 hover:underline">Jetzt erstellen →</Link></p>
        )}
      </div>
    </div>
  );
}
