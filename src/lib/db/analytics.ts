import { createClient } from "@/lib/supabase/server";

export type DishStats = {
  id: string;
  name: string;
  views30d: number;
  viewsAllTime: number;
};

export type DayCount = { day: string; count: number };

export async function getTopDishesByViews(days = 30): Promise<DishStats[]> {
  const supabase = await createClient();

  const [dishesRes, recentRes, allTimeRes] = await Promise.all([
    supabase.from("dishes").select("id, name"),
    supabase
      .from("dish_views")
      .select("dish_id")
      .gte(
        "viewed_at",
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      ),
    supabase.from("dish_views").select("dish_id"),
  ]);

  if (dishesRes.error || recentRes.error || allTimeRes.error) {
    return [];
  }

  const recentCounts = new Map<string, number>();
  for (const row of recentRes.data ?? []) {
    recentCounts.set(row.dish_id, (recentCounts.get(row.dish_id) ?? 0) + 1);
  }
  const allTimeCounts = new Map<string, number>();
  for (const row of allTimeRes.data ?? []) {
    allTimeCounts.set(row.dish_id, (allTimeCounts.get(row.dish_id) ?? 0) + 1);
  }

  return (dishesRes.data ?? [])
    .map((d) => ({
      id: d.id,
      name: d.name,
      views30d: recentCounts.get(d.id) ?? 0,
      viewsAllTime: allTimeCounts.get(d.id) ?? 0,
    }))
    .sort((a, b) => b.views30d - a.views30d || b.viewsAllTime - a.viewsAllTime);
}

export async function getViewsByDay(days = 30): Promise<DayCount[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("dish_views")
    .select("viewed_at")
    .gte("viewed_at", since.toISOString());

  if (error) return [];

  const perDay = new Map<string, number>();
  for (const row of data ?? []) {
    const day = new Date(row.viewed_at).toISOString().slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }

  const out: DayCount[] = [];
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, count: perDay.get(key) ?? 0 });
  }
  return out;
}
