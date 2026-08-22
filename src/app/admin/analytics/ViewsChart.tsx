import type { DayCount } from "@/lib/db/analytics";

function formatDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function ViewsChart({ data }: { data: DayCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-sm text-foreground-muted mb-3">
        Escaneos por día (últimos {data.length} días)
      </p>
      <div className="flex items-end gap-1 h-40">
        {data.map((d) => {
          const heightPct = (d.count / max) * 100;
          return (
            <div
              key={d.day}
              className="flex-1 flex flex-col items-center gap-1 group"
              title={`${formatDay(d.day)}: ${d.count} escaneos`}
            >
              <div className="flex-1 w-full flex items-end">
                <div
                  className="w-full bg-accent rounded-sm min-h-[2px] group-hover:opacity-80 transition-opacity"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d, i) => (
          <div
            key={d.day}
            className="flex-1 text-center text-[10px] text-foreground-dim"
          >
            {i % 5 === 0 || i === data.length - 1 ? formatDay(d.day) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
