"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { BookmarkRow, TagRow } from "@/types";

const MAX_TAGS_PER_BOOKMARK = 2;

const bookmarkInputSchema = z.object({
  url: z.string().trim().url("Enter a valid URL."),
  title: z.string().trim().min(3, "Title is required.").max(200),
  tags: z
    .array(z.string().trim().min(1).max(20))
    .max(MAX_TAGS_PER_BOOKMARK)
    .default([]),
});

export type CreateBookmarkInput = z.infer<typeof bookmarkInputSchema>;

const isBookmarksTableMissing = (message: string) =>
  (message.includes("public.bookmarks") ||
    message.includes("public.tags") ||
    message.includes("public.bookmark_tags")) &&
  message.toLowerCase().includes("schema cache");

const missingTableMessage =
  "Bookmarks table is not set up yet. Run supabase/bookmarks.sql in the Supabase SQL Editor first.";

type BookmarkTagRelationRow = {
  bookmark_id: string;
  tags: { name: string } | { name: string }[] | null;
};

const mapBookmarkTags = (rows: BookmarkTagRelationRow[]) => {
  const tagsByBookmarkId = new Map<string, string[]>();

  for (const row of rows) {
    const relatedTags = Array.isArray(row.tags)
      ? row.tags
      : row.tags
        ? [row.tags]
        : [];

    const currentTags = tagsByBookmarkId.get(row.bookmark_id) ?? [];
    const nextTags = [...currentTags, ...relatedTags.map((tag) => tag.name)];

    tagsByBookmarkId.set(
      row.bookmark_id,
      [...new Set(nextTags)].slice(0, MAX_TAGS_PER_BOOKMARK)
    );
  }

  return tagsByBookmarkId;
};

const getAuthenticatedUser = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
};

const upsertTagsForUser = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tags: string[]
) => {
  const uniqueTags = [...new Set(tags)];

  if (uniqueTags.length === 0) {
    return { ok: true as const, data: [] as Array<{ id: string; name: string }> };
  }

  const { error: tagsError } = await supabase.from("tags").upsert(
    uniqueTags.map((name) => ({
      user_id: userId,
      name,
    })),
    {
      onConflict: "user_id,name",
      ignoreDuplicates: false,
    }
  );

  if (tagsError) {
    return {
      ok: false as const,
      error: tagsError.message,
    };
  }

  const { data: tagRows, error: tagRowsError } = await supabase
    .from("tags")
    .select("id, name")
    .eq("user_id", userId)
    .in("name", uniqueTags);

  if (tagRowsError) {
    return {
      ok: false as const,
      error: tagRowsError.message,
    };
  }

  return {
    ok: true as const,
    data: (tagRows ?? []) as Array<{ id: string; name: string }>,
  };
};

export const getTags = async (): Promise<TagRow[]> => {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    if (isBookmarksTableMissing(error.message)) {
      return [];
    }

    throw new Error(`Failed to load tags: ${error.message}`);
  }

  return (data ?? []) as TagRow[];
};

export const getBookmarks = async (): Promise<BookmarkRow[]> => {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return [];
  }

  const { data: bookmarks, error } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isBookmarksTableMissing(error.message)) {
      return [];
    }

    throw new Error(`Failed to load bookmarks: ${error.message}`);
  }

  const bookmarkIds = (bookmarks ?? []).map((bookmark) => bookmark.id);

  if (bookmarkIds.length === 0) {
    return [];
  }

  const { data: bookmarkTags, error: bookmarkTagsError } = await supabase
    .from("bookmark_tags")
    .select("bookmark_id, tags(name)")
    .in("bookmark_id", bookmarkIds);

  if (bookmarkTagsError) {
    if (isBookmarksTableMissing(bookmarkTagsError.message)) {
      return [];
    }

    throw new Error(
      `Failed to load bookmark tags: ${bookmarkTagsError.message}`
    );
  }

  const tagsByBookmarkId = mapBookmarkTags(
    (bookmarkTags ?? []) as BookmarkTagRelationRow[]
  );

  return (bookmarks ?? []).map((bookmark) => ({
    ...(bookmark as Omit<BookmarkRow, "tags">),
    tags: tagsByBookmarkId.get(bookmark.id) ?? [],
  }));
};

export const createBookmark = async (input: CreateBookmarkInput) => {
  const parsed = bookmarkInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid bookmark values.",
    };
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return {
      ok: false as const,
      error: "You must be logged in to save bookmarks.",
    };
  }

  const { data: bookmark, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: user.id,
      url: parsed.data.url,
      title: parsed.data.title,
      description: null,
    })
    .select("*")
    .single();

  if (error) {
    if (isBookmarksTableMissing(error.message)) {
      return {
        ok: false as const,
        error: missingTableMessage,
      };
    }

    return {
      ok: false as const,
      error: error.message,
    };
  }

  if (parsed.data.tags.length > 0) {
    const tagResult = await upsertTagsForUser(
      supabase,
      user.id,
      parsed.data.tags
    );

    if (!tagResult.ok) {
      return tagResult;
    }

    const { error: bookmarkTagsError } = await supabase.from("bookmark_tags").insert(
      tagResult.data.map((tag) => ({
        bookmark_id: bookmark.id,
        tag_id: tag.id,
      }))
    );

    if (bookmarkTagsError) {
      return {
        ok: false as const,
        error: bookmarkTagsError.message,
      };
    }
  }

  revalidatePath("/bookmarks");

  return {
    ok: true as const,
    data: {
      ...(bookmark as Omit<BookmarkRow, "tags">),
      tags: parsed.data.tags,
    } as BookmarkRow,
  };
};

const syncBookmarkTags = async (
  bookmarkId: string,
  userId: string,
  tags: string[]
) => {
  const supabase = await createClient();

  const { error: deleteExistingError } = await supabase
    .from("bookmark_tags")
    .delete()
    .eq("bookmark_id", bookmarkId);

  if (deleteExistingError) {
    return {
      ok: false as const,
      error: deleteExistingError.message,
    };
  }

  if (tags.length === 0) {
    return { ok: true as const };
  }

  const tagResult = await upsertTagsForUser(supabase, userId, tags);

  if (!tagResult.ok) {
    return tagResult;
  }

  const { error: bookmarkTagsError } = await supabase.from("bookmark_tags").insert(
    tagResult.data.map((tag) => ({
      bookmark_id: bookmarkId,
      tag_id: tag.id,
    }))
  );

  if (bookmarkTagsError) {
    return {
      ok: false as const,
      error: bookmarkTagsError.message,
    };
  }

  return { ok: true as const };
};

export const updateBookmark = async (
  bookmarkId: string,
  input: CreateBookmarkInput
) => {
  const parsed = bookmarkInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid bookmark values.",
    };
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return {
      ok: false as const,
      error: "You must be logged in to update bookmarks.",
    };
  }

  const { data: bookmark, error } = await supabase
    .from("bookmarks")
    .update({
      url: parsed.data.url,
      title: parsed.data.title,
    })
    .eq("id", bookmarkId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    if (isBookmarksTableMissing(error.message)) {
      return {
        ok: false as const,
        error: missingTableMessage,
      };
    }

    return {
      ok: false as const,
      error: error.message,
    };
  }

  const syncResult = await syncBookmarkTags(
    bookmark.id,
    user.id,
    parsed.data.tags
  );

  if (!syncResult.ok) {
    return syncResult;
  }

  revalidatePath("/bookmarks");

  return {
    ok: true as const,
    data: {
      ...(bookmark as Omit<BookmarkRow, "tags">),
      tags: parsed.data.tags,
    } as BookmarkRow,
  };
};

export const deleteBookmark = async (bookmarkId: string) => {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return {
      ok: false as const,
      error: "You must be logged in to delete bookmarks.",
    };
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", user.id);

  if (error) {
    if (isBookmarksTableMissing(error.message)) {
      return {
        ok: false as const,
        error: missingTableMessage,
      };
    }

    return {
      ok: false as const,
      error: error.message,
    };
  }

  revalidatePath("/bookmarks");

  return { ok: true as const };
};

export const deleteTag = async (tagId: string) => {
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return {
      ok: false as const,
      error: "You must be logged in to delete tags.",
    };
  }

  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", tagId)
    .eq("user_id", user.id);

  if (error) {
    if (isBookmarksTableMissing(error.message)) {
      return {
        ok: false as const,
        error: missingTableMessage,
      };
    }

    return {
      ok: false as const,
      error: error.message,
    };
  }

  revalidatePath("/bookmarks");

  return { ok: true as const };
};
