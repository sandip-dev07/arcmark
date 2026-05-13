import { createClient } from "@/lib/supabase/client";

const getSafeNext = (next: string | null | undefined) => {
  if (!next || !next.startsWith("/")) {
    return "/bookmarks";
  }

  return next;
};

export const signInWithGoogle = async (next?: string | null) => {
  const supabase = createClient();
  const redirectTo = new URL("/auth/callback", window.location.origin);

  redirectTo.searchParams.set("next", getSafeNext(next));

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
    },
  });
};

export const signOut = async () => {
  const supabase = createClient();

  return supabase.auth.signOut();
};
