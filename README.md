# ArcMark

ArcMark is a private bookmark manager built with Next.js and Supabase. Users sign in with Google, save personal bookmarks, organize them with tags, and see changes sync in real time across tabs and devices.

## Features

- Google OAuth login with Supabase Auth
- Private bookmarks protected by Supabase Row Level Security
- Add, edit, copy, and delete bookmarks
- Automatic title prefill from URL metadata
- Real-time bookmark sync
- Tag-based organization and filtering

## Tech Stack

- Next.js 16
- React 19
- Supabase Auth, Database, and Realtime
- TypeScript
- Tailwind CSS

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Add these variables to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

3. Run the SQL in `supabase/bookmarks.sql` inside the Supabase SQL Editor.

4. In Supabase Auth:

- enable the Google provider
- add the Supabase callback URL in Google Cloud
- add your app callback URL in Supabase URL configuration

5. Start the app:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run format
```

## Supabase Auth And Route Protection

This app uses Google OAuth only.

The client login flow starts in `src/lib/supabase/auth.ts`, where `signInWithGoogle()` calls `supabase.auth.signInWithOAuth(...)` and redirects through `/auth/callback`.

Route protection is handled in `src/proxy.ts`.

- if a user is not signed in, they are redirected from `/bookmarks` to `/login`
- if a signed-in user visits `/login`, they are redirected to `/bookmarks`
- the original destination is preserved through the `next` query parameter

Server-side session handling uses:

- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`

## Database And RLS

RLS is defined in `supabase/bookmarks.sql`.

The schema uses three tables:

- `public.bookmarks`
- `public.tags`
- `public.bookmark_tags`

All three tables have Row Level Security enabled.

### `bookmarks`

- `select`, `insert`, `update`, and `delete` are allowed only when `auth.uid() = user_id`

Why this is correct:

- every bookmark belongs to one user
- ownership is checked directly on the bookmark row
- one user cannot read or modify another user's bookmarks, even if they bypass the UI

### `tags`

- `select`, `insert`, `update`, and `delete` are allowed only when `auth.uid() = user_id`

Why this is correct:

- tags are private per user
- the unique constraint is `(user_id, name)`, so different users can still have tags with the same name
- one user cannot access another user's tag library

### `bookmark_tags`

This join table does not store `user_id` directly, so ownership is checked through the related bookmark and tag.

- `select` is allowed only if the linked bookmark belongs to `auth.uid()`
- `insert` is allowed only if both the linked bookmark and linked tag belong to `auth.uid()`
- `delete` is allowed only if the linked bookmark belongs to `auth.uid()`

Why this is correct:

- it prevents cross-user joins
- it stops a user from attaching their tag to someone else's bookmark
- it keeps the normalized schema private and internally consistent

The important point is that privacy is enforced in the database, not just in frontend code.

## Real-Time Sync

The realtime logic lives in `src/components/bookmarks-client.tsx`.

ArcMark subscribes to Supabase Realtime Postgres change events for:

- `public.bookmarks`
- `public.tags`
- `public.bookmark_tags`

The client creates a channel named:

- `bookmarks-sync:${userId}`

All three tables are required because a single bookmark action can affect multiple rows:

- creating a bookmark inserts into `bookmarks`
- creating a new tag may insert into `tags`
- attaching tags inserts into `bookmark_tags`
- editing or deleting a bookmark can also affect join rows

### Sync strategy

When an event arrives, the client does not try to patch one row optimistically from the payload. Instead, it:

1. schedules a small debounced refresh
2. refetches bookmarks, tags, and bookmark-tag joins from Supabase
3. rebuilds the bookmark-to-tags mapping
4. updates local React state in a transition

This approach is simpler and more reliable than manually reconciling partial updates across a normalized schema.

### Same-browser tab sync

`src/lib/bookmarks-sync.ts` adds an extra local sync layer using:

- `BroadcastChannel`
- `localStorage` storage events

That makes multiple tabs in the same browser feel instant, while Supabase Realtime handles cross-browser and cross-device updates.

### Subscription cleanup

Cleanup happens in the `useEffect` return function in `src/components/bookmarks-client.tsx`.

It:

- clears any pending refresh timeout
- closes the `BroadcastChannel`
- removes the `storage` event listener
- removes the Supabase channel with `supabase.removeChannel(channel)`

That prevents duplicated listeners and stale subscriptions after unmounts.

### Database requirement

`supabase/bookmarks.sql` also adds these tables to the `supabase_realtime` publication:

- `public.bookmarks`
- `public.tags`
- `public.bookmark_tags`

Without that, normal CRUD still works, but realtime updates across devices do not.

## URL Metadata Prefill

When a user enters a URL while creating a bookmark, the form waits briefly and then calls `/api/url-metadata`.

That route uses `src/lib/url-metadata.ts` and `open-graph-scraper` to try a few title sources in order:

- Open Graph title
- Twitter title
- Dublin Core title
- fallback page title

If a title is found, the form prefills it automatically.

## Bonus Feature

The bonus feature is tags.

Tags make the bookmark manager more useful without adding much complexity. Users can group links by intent like `work`, `docs`, `important`, or `design`, then filter quickly.

Compared with folders, tags fit this product better because they are lighter and faster to use during bookmark capture.

## Problems I Ran Into

### Realtime sync across tabs and devices

The main challenge was that bookmark data is normalized across three tables. A single user action can produce multiple database events, and trying to manually patch local state from each individual event becomes fragile quickly.

The fix was to stop treating Realtime events as full data updates. Instead, I used them as refresh triggers, added a short debounce.

### Keeping same-browser tabs feeling instant

Supabase Realtime is useful for cross-device sync, but local browser tabs can still feel slightly delayed. I added a lightweight helper with `BroadcastChannel` and `localStorage` events so tabs in the same browser respond immediately after create, update, or delete actions.

### Enforcing privacy in the join table

`bookmark_tags` does not have a `user_id` column, so ownership cannot be checked directly on that row. The RLS policies had to validate ownership through the related bookmark and tag records. That made the policies a little more complex, but it keeps the normalized schema secure.
