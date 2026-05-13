"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
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
import { toast } from "sonner";

const bookmarkSchema = z.object({
  url: z.string().url("Enter a valid URL."),
  title: z.string().trim().min(1, "Title is required.").max(200),
  tags: z.array(z.string().trim().min(1)).max(10),
});

type TagOption = {
  id: string;
  name: string;
};

const defaultTags: TagOption[] = [
  { id: "design", name: "design" },
  { id: "tools", name: "tools" },
  { id: "reading", name: "reading" },
];

export default function BookmarkForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>(defaultTags);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedInput = tagInput.trim().toLowerCase();
  const filteredOptions = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(normalizedInput)
  );
  const canCreate =
    normalizedInput.length > 0 &&
    !availableTags.some((tag) => tag.name.toLowerCase() === normalizedInput) &&
    selectedTags.length < 10;

  const resetForm = () => {
    setUrl("");
    setTitle("");
    setTagInput("");
    setSelectedTags([]);
    setTagPickerOpen(false);
  };

  const addTag = (tagName: string) => {
    const normalizedTag = tagName.trim().toLowerCase();

    if (!normalizedTag) {
      return;
    }

    if (selectedTags.includes(normalizedTag)) {
      setTagInput("");
      return;
    }

    if (selectedTags.length >= 10) {
      toast.error("You can select up to 10 tags.");
      return;
    }

    setSelectedTags((current) => [...current, normalizedTag]);
    setAvailableTags((current) =>
      current.some((tag) => tag.name.toLowerCase() === normalizedTag)
        ? current
        : [...current, { id: normalizedTag, name: normalizedTag }]
    );
    setTagInput("");
    inputRef.current?.focus();
  };

  const removeSelected = (tagName: string) => {
    setSelectedTags((current) => current.filter((tag) => tag !== tagName));
  };

  const deleteFromLibrary = (tagToDelete: TagOption) => {
    setAvailableTags((current) =>
      current.filter((tag) => tag.id !== tagToDelete.id)
    );
    setSelectedTags((current) =>
      current.filter((tag) => tag !== tagToDelete.name)
    );
    toast.success(`Deleted tag "${tagToDelete.name}".`);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = bookmarkSchema.safeParse({
      url,
      title,
      tags: selectedTags,
    });

    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Invalid form values.");
      return;
    }

    setSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success("Bookmark details captured.");
      resetForm();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-fit">
          <Plus />
          Add
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Save a link</DialogTitle>
          <DialogDescription>
            Add the URL, title, and tags for your bookmark.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What to call it"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={200}
            />
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
                      onChange={(event) => setTagInput(event.target.value)}
                      placeholder="Search or create a tag..."
                      className="h-9"
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
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create "{normalizedInput}"
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
                          className="inline-flex flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm"
                        >
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          {tag.name}
                        </button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              className="mr-1 grid h-6 w-6 place-items-center rounded text-muted-foreground opacity-0 transition group-hover/row:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete tag ${tag.name} from library`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete tag "{tag.name}"?
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
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                    {selectedTags.length}/10 selected | Enter to add
                  </div>
                </PopoverContent>
              </Popover>

              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pl-2 pr-1 text-[11px]"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
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
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
