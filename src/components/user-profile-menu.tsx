"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signOut } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserProfileMenuProps = {
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

const getInitials = (name: string, email: string) => {
  const source = name.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
};

export default function UserProfileMenu({
  email,
  fullName,
  avatarUrl,
}: UserProfileMenuProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const displayName = fullName?.trim() || email.split("@")[0];
  const initials = getInitials(displayName, email);

  const handleLogout = async () => {
    setLoggingOut(true);

    const { error } = await signOut();

    if (error) {
      setLoggingOut(false);
      toast.error("Unable to log out. Please try again.");
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-fit border"
          aria-label="Open profile menu"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName.slice(0, 1)}
              className="h-8 w-8 rounded-lg object-cover bg-secondary uppercase flex items-center justify-center"
            />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-100 text-xs font-semibold text-sky-900">
              {initials}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 min-w-64">
        <DropdownMenuLabel className="py-2">
          <div className="flex flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {displayName}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
          variant="destructive"
          disabled={loggingOut}
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut />
          )}
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
