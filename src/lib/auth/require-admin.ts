import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-email";

export { isAdminEmail };

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
  if (!user || !isAdminEmail(user.email)) throw new AuthRequiredError();
  return user;
}
