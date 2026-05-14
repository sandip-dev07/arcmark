"use client";

import { useState } from "react";
import {
  Copy,
  EllipsisVertical,
  Link2,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import BookmarkForm from "@/components/bookmark-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBookmark } from "@/lib/supabase/query";
import { URLIcon } from "@/lib/url-utils";
import type { BookmarkRow, TagRow } from "@/types";

type LinkCardProps = {
  bookmark: BookmarkRow;
  availableTags?: TagRow[];
};

const MAX_TAG_NAME_LENGTH = 20;
const getDisplayTagName = (tag: string) =>
  tag.length > MAX_TAG_NAME_LENGTH
    ? `${tag.slice(0, MAX_TAG_NAME_LENGTH - 1)}…`
    : tag;

const getHostname = (value: string) => {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export default function LinkCard({
  bookmark,
  availableTags = [],
}: LinkCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [iconAttempt, setIconAttempt] = useState<"origin" | "google" | "fallback">(
    "origin"
  );
  const hostname = getHostname(bookmark.url);
  const displayTags = bookmark.tags.slice(0, 2);
  const originIconUrl = URLIcon(bookmark.url);
  const googleIconUrl = originIconUrl
    ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
    : null;
  const iconUrl =
    iconAttempt === "origin"
      ? originIconUrl
      : iconAttempt === "google"
        ? googleIconUrl
        : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookmark.url);
      toast.success("Link copied.");
    } catch {
      toast.error("Unable to copy link.");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    const response = await deleteBookmark(bookmark.id);

    if (!response.ok) {
      setDeleting(false);
      toast.error(response.error);
      return;
    }

    toast.success("Bookmark deleted.");
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-border bg-accent transition-all hover:shadow-[0_0_12px_rgba(0,0,0,0.12)]">
      <div className="rounded-xl border-b border-border bg-white p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="grid size-9 min-w-9 place-items-center overflow-hidden rounded-lg border border-border bg-accent text-xs font-semibold uppercase text-muted-foreground">
              {iconUrl && iconAttempt !== "fallback" ? (
                <img
                  src={iconUrl}
                  alt={hostname}
                  className="h-full w-full object-contain p-1 rounded-lg"
                  onError={() => {
                    setIconAttempt((current) =>
                      current === "origin" ? "google" : "fallback"
                    );
                  }}
                />
              ) : (
                hostname.slice(0, 2)
              )}
            </div>
            <div>
              <a
                title={bookmark.title}
                target="_blank"
                href={bookmark.url}
                rel="noreferrer"
                className="line-clamp-2 font-medium leading-5 transition-all hover:underline"
              >
                {bookmark.title}
              </a>
            </div>
          </div>

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
              <BookmarkForm
                bookmark={bookmark}
                availableTags={availableTags}
                trigger={
                  <DropdownMenuItem
                    onSelect={(event) => event.preventDefault()}
                  >
                    <Pencil className="size-3" />
                    Edit
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  void handleCopy();
                }}
              >
                <Copy className="size-3" />
                Copy Link
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <Trash2 className="size-3" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this bookmark?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes "{bookmark.title}" from your
                      private vault.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void handleDelete()}
                      variant={"destructive"}
                      disabled={deleting}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <a
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex w-fit items-center gap-1.5"
        >
          <Link2 size={16} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground transition-all">
            {hostname}
          </p>
        </a>
      </div>

      <div className="flex items-center justify-between px-2.5 py-0.75">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Tag size={12} />
          {displayTags.length > 0 ? (
            <span className="flex min-w-0 items-center gap-1">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  title={tag}
                  className="max-w-24 truncate rounded-sm bg-stone-200 px-1 py-px cursor-default"
                >
                  {getDisplayTagName(tag)}
                </span>
              ))}
            </span>
          ) : (
            <span className="rounded-sm px-1 py-px">No tags</span>
          )}
        </div>
        <p className="text-end text-xs text-muted-foreground">
          {formatDate(bookmark.created_at)}
        </p>
      </div>
    </div>
  );
}
