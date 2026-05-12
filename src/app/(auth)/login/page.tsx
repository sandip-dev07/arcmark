import AppLogo from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  return (
    <main className="relative w-full min-h-svh flex items-center justify-center">
      <div className="absolute inset-x-0 top-0 -z-10 h-176 bg-[radial-gradient(circle_at_top,rgba(187,211,255,0.7),transparent_60%)]" />

      <section className="max-w-xs px-2 mx-auto w-full">
        <div className="flex items-center justify-center flex-col gap-1">
          <AppLogo />
          <h3>Sign in to your account</h3>
        </div>

        <div className="w-full mt-6">
          <Button variant={"default"} size={"lg"} className="w-full gap-1.5">
          <FcGoogle/>  Login with Google
          </Button>
        </div>
      </section>
    </main>
  );
}
