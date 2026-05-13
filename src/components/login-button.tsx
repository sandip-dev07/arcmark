"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/supabase/auth";

type LoginButtonProps = {
  error?: string;
  next?: string;
};

export default function LoginButton({ error, next }: LoginButtonProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error === "oauth_callback") {
      toast.error("Google sign-in could not be completed. Please try again.");
    }

    if (error === "oauth_start") {
      toast.error("Unable to start Google sign-in.");
    }
  }, [error]);

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await signInWithGoogle(next);

    if (error) {
      setLoading(false);
      toast.error("Unable to start Google sign-in.");
    }
  };

  return (
    <Button
      variant="default"
      size="lg"
      className="w-full gap-2"
      onClick={handleLogin}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FcGoogle />}
      Continue with Google
    </Button>
  );
}
