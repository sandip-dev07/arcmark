import AppLogo from "@/components/app-logo";
import LoginButton from "@/components/login-button";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    next?: string | string[];
  }>;
};

const getFirstValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function Login({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = getFirstValue(params.error);
  const next = getFirstValue(params.next);

  return (
    <main className="relative w-full min-h-svh flex items-center justify-center">
      <div className="absolute inset-x-0 top-0 -z-10 h-176 bg-[radial-gradient(circle_at_top,rgba(187,211,255,0.7),transparent_60%)]" />

      <section className="max-w-xs px-2 mx-auto w-full">
        <div className="flex items-center justify-center flex-col gap-1">
          <AppLogo />
          <h3>Sign in to your account</h3>
        </div>

        <div className="w-full mt-6">
          <LoginButton error={error} next={next} />
        </div>
      </section>
    </main>
  );
}
