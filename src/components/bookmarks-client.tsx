"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import BookmarkForm from "@/components/bookmark-form";
import LinkCard from "@/components/link-card";
import { Input } from "@/components/ui/input";
import { bookmarksSyncConfig } from "@/lib/bookmarks-sync";
import { createClient } from "@/lib/supabase/client";
import type { BookmarkRow, TagRow } from "@/types";

type BookmarksClientProps = {
  initialBookmarks: BookmarkRow[];
  initialTags: TagRow[];
  userId?: string;
};

type BookmarkTagJoinRow = {
  bookmark_id: string;
  tags: { name: string } | { name: string }[] | null;
};

const mapBookmarkTags = (rows: BookmarkTagJoinRow[]) => {
  const tagsByBookmarkId = new Map<string, string[]>();

  for (const row of rows) {
    const relatedTags = Array.isArray(row.tags)
      ? row.tags
      : row.tags
        ? [row.tags]
        : [];

    tagsByBookmarkId.set(
      row.bookmark_id,
      relatedTags.map((tag) => tag.name)
    );
  }

  return tagsByBookmarkId;
};

export default function BookmarksClient({
  initialBookmarks,
  initialTags,
  userId,
}: BookmarksClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [tags, setTags] = useState(initialTags);
  const [search, setSearch] = useState("");
  const refreshTimeoutRef = useRef<number | null>(null);

  const visibleBookmarks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return bookmarks;
    }

    return bookmarks.filter((bookmark) => {
      const inTitle = bookmark.title.toLowerCase().includes(query);
      const inUrl = bookmark.url.toLowerCase().includes(query);
      const inTags = bookmark.tags.some((tag) => tag.toLowerCase().includes(query));

      return inTitle || inUrl || inTags;
    });
  }, [bookmarks, search]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const loadLatest = async () => {
      const { data: latestBookmarks, error: bookmarksError } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookmarksError) {
        return;
      }

      const bookmarkRows = (latestBookmarks ?? []) as Omit<BookmarkRow, "tags">[];
      const bookmarkIds = bookmarkRows.map((bookmark) => bookmark.id);

      const { data: latestTags, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true });

      if (tagsError) {
        return;
      }

      let tagsByBookmarkId = new Map<string, string[]>();

      if (bookmarkIds.length > 0) {
        const { data: latestBookmarkTags, error: bookmarkTagsError } =
          await supabase
            .from("bookmark_tags")
            .select("bookmark_id, tags(name)")
            .in("bookmark_id", bookmarkIds);

        if (bookmarkTagsError) {
          return;
        }

        tagsByBookmarkId = mapBookmarkTags(
          (latestBookmarkTags ?? []) as BookmarkTagJoinRow[]
        );
      }

      startTransition(() => {
        setBookmarks(
          bookmarkRows.map((bookmark) => ({
            ...bookmark,
            tags: tagsByBookmarkId.get(bookmark.id) ?? [],
          }))
        );
        setTags((latestTags ?? []) as TagRow[]);
      });
    };

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current !== null) {
        return;
      }

      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshTimeoutRef.current = null;
        void loadLatest();
      }, 150);
    };

    const broadcastChannel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(bookmarksSyncConfig.channel)
        : null;

    const onBroadcastMessage = () => scheduleRefresh();
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === bookmarksSyncConfig.storageKey &&
        event.newValue?.startsWith(bookmarksSyncConfig.event)
      ) {
        scheduleRefresh();
      }
    };

    broadcastChannel?.addEventListener("message", onBroadcastMessage);
    window.addEventListener("storage", onStorage);

    const channel = supabase
      .channel(`bookmarks-sync:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmarks" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tags" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookmark_tags" },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }

      broadcastChannel?.close();
      window.removeEventListener("storage", onStorage);
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return (
    <>
      <section className="w-full bg-[#F7F9F7] border-b border-border/70 py-8">
        <div className="max-w-container mt-6">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-4xl tracking-tight font-medium text-foreground">
                  Bookmarks
                </h1>
                <p className="text-sm text-muted-foreground">
                  {bookmarks.length} {bookmarks.length === 1 ? "link" : "links"} in
                  your private vault.
                </p>
              </div>

              <div className="flex gap-1.5 flex-row sm:items-center">
                <div className="relative w-full sm:w-70">
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="h-9 bg-white"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <BookmarkForm availableTags={tags} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-container py-8">
        {visibleBookmarks.length > 0 ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
            {visibleBookmarks.map((bookmark) => (
              <LinkCard
                key={bookmark.id}
                bookmark={bookmark}
                availableTags={tags}
              />
            ))}
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="px-6 py-14 text-center">
            <h2 className="text-lg font-medium text-foreground">No matches</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different search term.
            </p>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <h2 className="text-lg font-medium text-foreground">
              No bookmarks yet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Save your first private link to start building your vault.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
