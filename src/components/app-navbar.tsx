import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import AppLogo from "./app-logo";
import UserProfileMenu from "./user-profile-menu";

export default async function AppNavbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;
  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;

  return (
    <nav className="w-full border-b border-border/70 h-14 sm:h-16 flex items-center">
      <div className="max-w-container flex items-center justify-between gap-3">
        <AppLogo href="/bookmarks" />
        {user?.email ? (
          <UserProfileMenu
            email={user.email}
            fullName={fullName}
            avatarUrl={avatarUrl}
          />
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
