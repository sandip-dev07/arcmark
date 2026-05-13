"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ChevronsUpDown,
  Loader2,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { z } from "zod";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  createBookmark,
  deleteTag,
  updateBookmark,
} from "@/lib/supabase/query";
import { publishBookmarksSync } from "@/lib/bookmarks-sync";
import { normalizeTag } from "@/lib/normalize-tag";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BookmarkRow, TagRow } from "@/types";

const MAX_TAG_NAME_LENGTH = 20;
const bookmarkSchema = z.object({
  url: z.string().url("Enter a valid URL."),
  title: z.string().trim().min(3, "Title is required.").max(200),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(3, "Tags must be at least 3 characters.")
        .max(MAX_TAG_NAME_LENGTH, `Tags must be at most ${MAX_TAG_NAME_LENGTH} characters.`)
    )
    .max(2),
});

const MAX_TAGS_PER_BOOKMARK = 2;

type BookmarkFormValues = z.infer<typeof bookmarkSchema>;
type BookmarkFormErrors = Partial<Record<keyof BookmarkFormValues, string>>;

type TagOption = {
  id: string;
  name: string;
  isLocal?: boolean;
};

type BookmarkFormProps = {
  availableTags?: TagRow[];
  bookmark?: BookmarkRow;
  trigger?: ReactNode;
};

const getDisplayTagName = (tag: string) =>
  tag.length > MAX_TAG_NAME_LENGTH
    ? `${tag.slice(0, MAX_TAG_NAME_LENGTH - 1)}…`
    : tag;

export default function BookmarkForm({
  availableTags: initialAvailableTags = [],
  bookmark,
  trigger,
}: BookmarkFormProps) {
  const router = useRouter();
  const clampedBookmarkTags =
    bookmark?.tags.slice(0, MAX_TAGS_PER_BOOKMARK) ?? [];
  const bookmarkTagKey = clampedBookmarkTags.join("|");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prefetchingTitle, setPrefetchingTitle] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [url, setUrl] = useState(bookmark?.url ?? "");
  const [title, setTitle] = useState(bookmark?.title ?? "");
  const [lastPrefetchedUrl, setLastPrefetchedUrl] = useState<string | null>(
    bookmark?.url ?? null
  );
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] =
    useState<string[]>(clampedBookmarkTags);
  const [errors, setErrors] = useState<BookmarkFormErrors>({});
  const [availableTags, setAvailableTags] = useState<TagOption[]>(
    initialAvailableTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
    }))
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(bookmark);

  const normalizedInput = tagInput.trim().toLowerCase();
  const filteredOptions = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(normalizedInput)
  );
  const canCreate =
    normalizedInput.length > 0 &&
    !availableTags.some((tag) => tag.name.toLowerCase() === normalizedInput) &&
    selectedTags.length < MAX_TAGS_PER_BOOKMARK;

  const resetForm = () => {
    setUrl(bookmark?.url ?? "");
    setTitle(bookmark?.title ?? "");
    setLastPrefetchedUrl(bookmark?.url ?? null);
    setTagInput("");
    setSelectedTags(clampedBookmarkTags);
    setErrors({});
    setTagPickerOpen(false);
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [bookmark?.id, bookmark?.title, bookmark?.url, bookmarkTagKey, open]);

  const getFormValues = (): BookmarkFormValues => ({
    url,
    title,
    tags: selectedTags,
  });

  const validateForm = () => {
    const result = bookmarkSchema.safeParse(getFormValues());

    if (result.success) {
      setErrors({});
      return result;
    }

    const fieldErrors = result.error.flatten().fieldErrors;
    setErrors({
      url: fieldErrors.url?.[0],
      title: fieldErrors.title?.[0],
      tags: fieldErrors.tags?.[0],
    });

    return result;
  };

  useEffect(() => {
    const normalizedUrl = url.trim();

    if (
      !open ||
      !normalizedUrl ||
      isEditing ||
      normalizedUrl === lastPrefetchedUrl
    ) {
      return;
    }

    let cancelled = false;

    try {
      new URL(normalizedUrl);
    } catch {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setPrefetchingTitle(true);

      try {
        const response = await fetch(
          `/api/url-metadata?url=${encodeURIComponent(normalizedUrl)}`
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          ok?: boolean;
          title?: string;
        };

        if (!cancelled && data.ok && data.title) {
          setTitle(data.title);
          setLastPrefetchedUrl(normalizedUrl);
        }
      } finally {
        if (!cancelled) {
          setPrefetchingTitle(false);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isEditing, lastPrefetchedUrl, open, url]);

  const addTag = (tagName: string) => {
    const normalizedTag = normalizeTag(tagName);

    if (!normalizedTag) {
      return;
    }

    if (normalizedTag.length < 3) {
      setErrors((current) => ({
        ...current,
        tags: "Tags must be at least 3 characters.",
      }));
      return;
    }

    if (selectedTags.includes(normalizedTag)) {
      setTagInput("");
      return;
    }

    if (selectedTags.length >= MAX_TAGS_PER_BOOKMARK) {
      setErrors({
        ...errors,
        tags: `You can select up to ${MAX_TAGS_PER_BOOKMARK} tags.`,
      });
      return;
    }

    setSelectedTags((current) => [...current, normalizedTag]);
    setErrors((current) => ({ ...current, tags: undefined }));
    setAvailableTags((current) =>
      current.some((tag) => tag.name.toLowerCase() === normalizedTag)
        ? current
        : [
            ...current,
            {
              id: `local:${normalizedTag}`,
              name: normalizedTag,
              isLocal: true,
            },
          ]
    );
    setTagInput("");
    inputRef.current?.focus();
  };

  const removeSelected = (tagName: string) => {
    setSelectedTags((current) => current.filter((tag) => tag !== tagName));
    setErrors((current) => ({ ...current, tags: undefined }));
  };

  const deleteFromLibrary = async (tagToDelete: TagOption) => {
    if (tagToDelete.isLocal) {
      setAvailableTags((current) =>
        current.filter((tag) => tag.id !== tagToDelete.id)
      );
      setSelectedTags((current) =>
        current.filter((tag) => tag !== tagToDelete.name)
      );
      setErrors((current) => ({ ...current, tags: undefined }));
      return;
    }

    const response = await deleteTag(tagToDelete.id);

    if (!response.ok) {
      toast.error(response.error);
      return;
    }

    setAvailableTags((current) =>
      current.filter((tag) => tag.id !== tagToDelete.id)
    );
    setSelectedTags((current) =>
      current.filter((tag) => tag !== tagToDelete.name)
    );
    setErrors((current) => ({ ...current, tags: undefined }));
    publishBookmarksSync();
    toast.success(`Deleted tag "${tagToDelete.name}".`);
    router.refresh();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = validateForm();

    if (!result.success) {
      return;
    }

    setSubmitting(true);

    try {
      const response = isEditing
        ? await updateBookmark(bookmark!.id, result.data)
        : await createBookmark(result.data);

      if (!response.ok) {
        toast.error(response.error);
        return;
      }

      toast.success(
        isEditing ? "Bookmark updated successfully." : "Bookmark saved successfully."
      );
      publishBookmarksSync();
      resetForm();
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="w-fit">
            <Plus />
            Add
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Edit link" : "Save a link"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the URL, title, and tags for your bookmark."
              : "Add the URL, title, and tags for your bookmark."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="bookmark-url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setLastPrefetchedUrl(null);
                setErrors((current) => ({ ...current, url: undefined }));
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(errors.url)}
              required
              autoFocus
            />
            {errors.url ? (
              <p className="text-xs text-destructive">{errors.url}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <div className="relative">
              <Input
                id="title"
                name="bookmark-title"
                placeholder="What to call it"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setErrors((current) => ({ ...current, title: undefined }));
                }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                required
                maxLength={200}
                aria-invalid={Boolean(errors.title)}
                className={prefetchingTitle ? "pr-9" : undefined}
              />
              {!isEditing && prefetchingTitle ? (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : null}
            </div>
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="space-y-2">
              <Popover open={tagPickerOpen} onOpenChange={setTagPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={tagPickerOpen}
                    aria-invalid={Boolean(errors.tags)}
                    className="w-full justify-between font-normal"
                  >
                    <span className="text-muted-foreground">
                      {selectedTags.length === 0
                        ? "Select or add tags..."
                        : `${selectedTags.length} selected`}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] gap-0 p-0"
                  align="start"
                >
                  <div className="border-b p-2">
                    <Input
                      ref={inputRef}
                      value={tagInput}
                      onChange={(event) => {
                        setTagInput(event.target.value);
                        setErrors((current) => ({ ...current, tags: undefined }));
                      }}
                      placeholder="Search or create a tag..."
                      className="h-9"
                      maxLength={MAX_TAG_NAME_LENGTH}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();

                          if (canCreate) {
                            addTag(normalizedInput);
                          } else if (filteredOptions[0]) {
                            addTag(filteredOptions[0].name);
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="max-h-60 overflow-auto p-1">
                    {canCreate ? (
                      <button
                        type="button"
                        onClick={() => addTag(normalizedInput)}
                        className="inline-flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                        title={normalizedInput}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="truncate">
                          Create "{getDisplayTagName(normalizedInput)}"
                        </span>
                      </button>
                    ) : null}

                    {filteredOptions.length === 0 && !canCreate ? (
                      <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                        {availableTags.length === 0
                          ? "No tags yet - type to create one."
                          : "No matches."}
                      </p>
                    ) : null}

                    {filteredOptions.map((tag) => (
                      <div
                        key={tag.id}
                        className="group/row flex items-center justify-between gap-1 rounded hover:bg-muted"
                      >
                        <button
                          type="button"
                          onClick={() => addTag(tag.name)}
                          className="inline-flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1.5 text-left text-sm"
                          title={tag.name}
                        >
                          <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{getDisplayTagName(tag.name)}</span>
                        </button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              className="mr-1 grid h-6 w-6 place-items-center rounded text-muted-foreground opacity-0 transition group-hover/row:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete tag ${tag.name} from library`}
                              title={`Delete ${tag.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle
                                className="w-full break-all"
                                title={tag.name}
                              >
                                Delete tag "{getDisplayTagName(tag.name)}"?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the tag from your library and from
                                any bookmarks using it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteFromLibrary(tag)}
                                variant={"destructive"}
                              >
                                Delete tag
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>

                  <div className="border-t px-2 py-1.5 text-[11px] text-muted-foreground">
                    {selectedTags.length}/{MAX_TAGS_PER_BOOKMARK} selected |
                    Enter to add
                  </div>
                </PopoverContent>
              </Popover>
              {errors.tags ? (
                <p className="text-xs text-destructive">{errors.tags}</p>
              ) : null}

              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="max-w-full gap-1 pl-1.5 pr-1 text-[11px]"
                      title={tag}
                    >
                      <Tag className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{getDisplayTagName(tag)}</span>
                      <button
                        type="button"
                        onClick={() => removeSelected(tag)}
                        className="ml-0.5 grid h-4 w-4 place-items-center rounded-full transition hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="py-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEditing ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
