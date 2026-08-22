import { createClient as createRawClient } from "@supabase/supabase-js";

const TIMEOUT_MS = 3000;

export async function areSignupsOpen(): Promise<boolean | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const probe = createRawClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const probeEmail = `hardening-probe+${Date.now()}@example.invalid`;
  const probePassword = `probe-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    const result = await Promise.race([
      probe.auth.signUp({ email: probeEmail, password: probePassword }),
      new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), TIMEOUT_MS)),
    ]);

    if (result === "timeout") return null;

    const err = result.error;
    if (err) {
      const msg = err.message.toLowerCase();
      if (/signups?\s*not\s*allowed|signups?\s*disabled|signup\s*is\s*disabled/i.test(msg)) {
        return false;
      }
      return true;
    }

    return true;
  } catch {
    return null;
  }
}
