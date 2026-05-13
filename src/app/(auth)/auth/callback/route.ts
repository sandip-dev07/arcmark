import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const getSafeRedirect = (next: string | null) => {
  if (!next || !next.startsWith("/")) {
    return "/bookmarks";
  }

  return next;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirect(requestUrl.searchParams.get("next"));
  const errorRedirectUrl = new URL("/login", request.url);

  errorRedirectUrl.searchParams.set("error", "oauth_callback");

  if (!code) {
    return NextResponse.redirect(errorRedirectUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(errorRedirectUrl);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
