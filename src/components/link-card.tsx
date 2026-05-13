import {
  Copy,
  EllipsisVertical,
  Link2,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LinkCard() {
  return (
    <div className="rounded-xl bg-accent border border-border transition-all hover:shadow-[0_0_12px_rgba(0,0,0,0.12)]">
      <div className="rounded-xl border-b border-border bg-white p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="size-9 min-w-9 overflow-hidden rounded-lg border border-border p-1.5 bg-accent">
              <Image src="/gitlab.svg" alt="Gitlab" width={32} height={32} />
            </div>
            <div>
              <a
                title=""
                target="_blank"
                href="https://gitlab.com"
                className="line-clamp-2 font-medium leading-5 transition-all hover:underline"
              >
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
                Molestias, dignissimos. Molestiae possimus, saepe recusandae
                totam minima unde voluptates natus accusamus.
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-6 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Open actions"
                >
                  <EllipsisVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 min-w-36">
                <DropdownMenuItem>
                  <Pencil className="size-3" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="size-3" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  <Trash2 className="size-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <a
          href="https://gitlab.com"
          target="_blank"
          className="mt-2 flex items-center gap-1.5 w-fit"
        >
          <Link2 size={16} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground transition-all">
            gitlab.com
          </p>
        </a>
      </div>

      <div className="px-2.5 py-0.5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Tag size={12} />{" "}
          <span className="p-0.5 px-1 rounded-sm cursor-pointer hover:text-primary transition-all">Primary</span>
        </div>
        <p className="text-end text-xs text-muted-foreground">13 May 2026</p>
      </div>
    </div>
  );
}
