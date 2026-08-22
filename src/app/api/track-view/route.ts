import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeActionError } from "@/lib/errors/sanitize";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  let dishId: unknown;
  try {
    const body = await request.json();
    dishId = body?.dishId;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (typeof dishId !== "string" || !UUID_RE.test(dishId)) {
    return NextResponse.json({ error: "invalid dishId" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;
  const supabase = await createClient();

  const { error } = await supabase
    .from("dish_views")
    .insert({ dish_id: dishId, user_agent: userAgent });

  if (error) {
    sanitizeActionError(error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
