import { createClient } from "@supabase/supabase-js";

/**
 * Supabase browser client — for client-side use only.
 * Used for optional features like real-time subscriptions or file storage.
 * Core data operations go through Prisma, not directly through Supabase.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment variables."
    );
  }

  return createClient(url, key);
}
