import AppLogo from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { IoLogoGithub } from "react-icons/io";

export default function Home() {
  const browsers = [
    { src: "/chrome.webp", alt: "Google Chrome" },
    { src: "/safari.webp", alt: "Safari" },
    { src: "/edge.webp", alt: "Microsoft Edge" },
    { src: "/firefox.webp", alt: "Firefox" },
    { src: "/opera.webp", alt: "Opera" },
  ];

  return (
    <main className="relative h-full w-full">
      <div className="absolute inset-x-0 top-0 -z-10 h-176 bg-[radial-gradient(circle_at_top,rgba(187,211,255,0.7),transparent_60%)]" />

      {/* navbar */}
      <header className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <AppLogo />
          <div className="flex items-center gap-1.5 sm:w-auto">
            <Button variant={"ghost"} asChild className="flex-1 sm:flex-none hover:bg-transparent">
              <Link target="_blank" href="https://github.com/sandip-dev07/arcmark"><IoLogoGithub /></Link>
            </Button>
            <Button
              variant={"outline"}
              asChild
              className="hidden sm:flex flex-1 sm:flex-none"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button variant={"default"} asChild className="flex-1 sm:flex-none">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pb-32 sm:pt-30">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-card/60 px-3 py-1.5 text-xs text-muted-foreground border border-blue-100 backdrop-blur sm:text-sm">
              <Star className="h-3.5 w-3.5" />
              <span>Private to you. Synced in real-time.</span>
            </div>
            <h1 className="mt-6 text-4xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
              Your bookmarks,
              <br />
              <span className="">quiet and organized.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl px-2 text-sm leading-7 text-muted-foreground sm:mt-6 sm:px-0 sm:text-lg">
              Save the links worth coming back to. End-to-end private with
              row-level security — no one else sees your stash.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row items-center">
              <Button asChild size="lg" className="gap-2 w-fit">
                <Link href="/login">
                  Open your vault
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="flex max-w-full flex-col items-center justify-center gap-3 rounded-xl border border-sky-100 bg-sky-50 p-1 px-1.5 pl-2.5 sm:flex-row sm:rounded-full">
                <span className="text-center text-sm font-medium text-muted-foreground sm:text-left">
                  Seamless experience across browsers
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-full bg-white p-1 px-2">
                  {browsers.map((browser) => (
                    <span
                      key={browser.alt}
                      className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-black/5 sm:h-5 sm:w-5"
                    >
                      <Image
                        src={browser.src}
                        alt={browser.alt}
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
