import { ArrowLeft, Plus, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LinkCard from "@/components/link-card";

export default function Bookmarks() {
  return (
    <main className="w-full">
      {/* header */}
      <section className="w-full bg-[#F7F9F7] border-b border-border/70 py-8">
        <div className="max-w-container mt-6">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-4xl tracking-tight font-medium text-foreground">
                  Bookmarks
                </h1>
                <p className="text-sm text-muted-foreground">
                  4 links in your private vault.
                </p>
              </div>

              <div className="flex gap-1.5 flex-row sm:items-center">
                <div className="relative w-full sm:w-70">
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="h-9 bg-white"
                  />
                </div>

                <Button size="lg" className="w-fit">
                  <Plus />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bookmark Links */}
      <section className="max-w-container py-8">
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
          <LinkCard />
        </div>
      </section>
    </main>
  );
}
