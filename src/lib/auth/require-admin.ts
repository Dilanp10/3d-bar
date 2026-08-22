import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export class AuthRequiredError extends Error {
  constructor(message = "Auth required") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export async function requireAdmin(supabase?: SupabaseClient) {
  const client = supabase ?? (await createClient());
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new AuthRequiredError();
  return user;
}
