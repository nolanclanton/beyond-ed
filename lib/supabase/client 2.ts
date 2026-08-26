"use client";

/**
 * The BROWSER Supabase client.
 *
 * It reads no records and writes none, and nothing uses it yet: signing in,
 * setting up an account, and every provisioning action are form posts to server
 * actions.
 *
 * It is kept for the one thing a browser legitimately does directly — uploading
 * to the private `student-uploads` bucket, where the storage policies in
 * migration 0013 scope the write to the uploader's own folder. When that
 * surface is built it belongs here.
 *
 * That restraint is the rule from CLAUDE.md §1, not a coincidence of this
 * build: completion, mastery, grades, enrollment, intervention state, and
 * permissions are computed and enforced on the server, and consequential writes
 * go through server actions that validate, authorize, and write the audit event
 * in the same transaction. A browser client that could write them would be a
 * second, unaudited path to the same rows.
 *
 * It carries the publishable key, which is safe in the browser — see
 * `lib/supabase/env.ts`.
 */
import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

export function createClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient(url, publishableKey);
}
