import BookmarksClient from "@/components/bookmarks-client";
import { createClient } from "@/lib/supabase/server";
import { getBookmarks, getTags } from "@/lib/supabase/query";

export default async function Bookmarks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [bookmarks, tags] = await Promise.all([getBookmarks(), getTags()]);

  return (
    <main className="w-full">
      <BookmarksClient
        initialBookmarks={bookmarks}
        initialTags={tags}
        userId={user?.id}
      />
    </main>
  );
}
