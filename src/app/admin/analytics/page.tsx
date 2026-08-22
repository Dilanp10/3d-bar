import { getTopDishesByViews, getViewsByDay } from "@/lib/db/analytics";
import { ViewsChart } from "./ViewsChart";

export default async function AnalyticsPage() {
  const [dishes, byDay] = await Promise.all([
    getTopDishesByViews(30),
    getViewsByDay(30),
  ]);

  const totalAllTime = dishes.reduce((sum, d) => sum + d.viewsAllTime, 0);

  if (totalAllTime === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-6">Analytics</h1>
        <div className="rounded-xl border border-border p-8 text-center text-foreground-muted">
          Todavía no hay escaneos registrados. Los datos aparecerán acá cuando
          alguien escanee un QR.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">Analytics</h1>

      <div className="mb-6">
        <ViewsChart data={byDay} />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background-elevated text-foreground-muted text-left">
              <th className="px-4 py-3 font-medium">Plato</th>
              <th className="px-4 py-3 font-medium text-right">Últimos 30d</th>
              <th className="px-4 py-3 font-medium text-right">All-time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dishes.map((d) => (
              <tr key={d.id} className="hover:bg-background-elevated/50">
                <td className="px-4 py-3 text-foreground">{d.name}</td>
                <td className="px-4 py-3 text-right text-foreground">
                  {d.views30d}
                </td>
                <td className="px-4 py-3 text-right text-foreground-muted">
                  {d.viewsAllTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
