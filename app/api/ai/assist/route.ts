/**
 * POST /api/ai/assist — the design assistant's only HTTP surface.
 *
 * A thin shell around `assist`. Identity is resolved server-side from the
 * request's own cookies, exactly as every page does it; the browser never
 * asserts who it is and never names a role.
 *
 * The handler itself decides nothing. It resolves identity, hands the body
 * straight to the gateway, and turns the outcome into a response. Every
 * authorization check, every scope check, the capability check, the rate limit,
 * the context assembly, and the output validation happen in `/lib/ai` — so a
 * request that arrives some other way in future meets exactly the same rules
 * (CLAUDE.md §10.2).
 *
 * A refusal is a 200 carrying `{ ok: false, message }`, not an HTTP error. The
 * client renders the message beside the control the designer clicked; a status
 * code would tell them nothing, and the one thing they need to know — that
 * their work is untouched — is in the body.
 *
 * The two exceptions are the ones that are not about this request's content:
 * 401 when nobody is signed in, and 400 when the body is not JSON at all.
 */
import { NextResponse } from "next/server";

import { assist } from "@/lib/ai/gateway";
import { currentUser } from "@/lib/auth/session";

/** Identity comes from cookies, so this can never be prerendered or cached. */
export const dynamic = "force-dynamic";

/** A body larger than this is not a curriculum instruction. */
const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "You are not signed in to Beyond.Ed.",
        workPreserved: true,
      },
      { status: 401 },
    );
  }

  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        message: "That request is too large for design assistance.",
        workPreserved: true,
      },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "That request was not in a form Beyond.Ed accepts.",
        workPreserved: true,
      },
      { status: 400 },
    );
  }

  const outcome = await assist(user, body);
  return NextResponse.json(outcome, {
    status: 200,
    // A proposal is per-person and per-moment. Nothing caches it.
    headers: { "Cache-Control": "no-store" },
  });
}
