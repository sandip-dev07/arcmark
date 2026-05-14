# ArcMark

ArcMark is a private bookmark manager built with Next.js and Supabase. It supports Google Sign-In, private bookmark storage, tags, and real-time updates whenever bookmark data changes.

## Features

- Google OAuth login with Supabase Auth
- Private bookmarks scoped per user using Row Level Security (RLS)
- Add, edit, copy, and delete bookmarks
- Tag support with filtering on the bookmarks page
- Automatic title prefill from URL metadata
- Real-time bookmark updates without a full page reload

## Tech Stack

- Next.js 16
- TypeScript
- zod validation
- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Tailwind CSS
- shadcn/ui

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a local environment file

Add your Supabase project values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 3. Run the SQL schema

Run the SQL inside `supabase/bookmarks.sql` using the Supabase SQL Editor.

### 4. Enable Google OAuth

In Supabase Auth, enable Google as an OAuth provider.

### 5. Configure callback URLs

Configure the callback URL in both Google Cloud Console and Supabase so the authentication flow redirects back to your application correctly.

### 6. Start the development server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
```

## Supabase Auth and Route Protection

This application uses Google OAuth only.

The client-side login flow starts in `src/lib/supabase/auth.ts`, where `signInWithGoogle()` calls:

```ts
supabase.auth.signInWithOAuth(...)
```

and redirects through `/auth/callback`.

Route protection is handled in `src/proxy.ts`.

- If a user is not signed in, they are redirected from `/bookmarks` to `/login`
- If a signed-in user visits `/login`, they are redirected to `/bookmarks`

Server-side session handling is implemented in:

- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`

## Database and Row Level Security (RLS)

RLS policies are defined in `supabase/bookmarks.sql`.

The schema uses three tables:

- `public.bookmarks`
- `public.tags`
- `public.bookmark_tags`

All three tables have Row Level Security enabled.

### `bookmarks`

This table stores bookmark data. Each bookmark belongs to a single user through `user_id`.

Policies:

- `SELECT` allowed only for rows owned by `auth.uid()`
- `INSERT` allowed only when `user_id = auth.uid()`
- `UPDATE` allowed only for rows owned by `auth.uid()`
- `DELETE` allowed only for rows owned by `auth.uid()`

This acts as the main privacy boundary for bookmark data.

### `tags`

This table stores private tags for each user.

Policies:

- `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are allowed only for rows owned by `auth.uid()`

The `(user_id, name)` unique constraint allows multiple users to create tags with the same name independently.

### `bookmark_tags`

This is the join table between bookmarks and tags.

It does not store `user_id`, so ownership validation is enforced through related bookmark and tag records.

Policies:

- `SELECT` allowed only when the related bookmark belongs to `auth.uid()`
- `INSERT` allowed only when both the bookmark and tag belong to `auth.uid()`
- `DELETE` allowed only when the related bookmark belongs to `auth.uid()`

This prevents cross-user relationships while keeping the schema normalized.

## Real-Time Sync

Real-time synchronization is implemented in:

```txt
src/components/bookmarks-client.tsx
```

The bookmarks page subscribes to Supabase Postgres Changes for:

- `public.bookmarks`
- `public.tags`
- `public.bookmark_tags`

Whenever a change occurs in the database, Supabase broadcasts the update instantly to all connected clients. The client then reloads the latest bookmarks, tags, and bookmark-tag mappings from Supabase and updates the local React state without requiring a full page reload.

### Sync Strategy

The page starts with server-rendered bookmark data and maintains a client-side state copy.

After receiving a realtime event, it fetches:

- Latest bookmarks ordered by `created_at`
- Latest tags ordered by `name`
- Latest bookmark-tag relationships for visible bookmark IDs

This approach is simple, reliable, and avoids manually patching local state using raw realtime payloads.

### Subscription Cleanup

The realtime subscription is created inside a `useEffect` hook and cleaned up within the same effect.

Cleanup includes:

- Clearing pending refresh timeouts
- Unsubscribing from the Supabase auth listener
- Removing the active realtime channel

This prevents duplicate listeners after rerenders or route transitions.

### Database Requirement

`supabase/bookmarks.sql` also adds these tables to the `supabase_realtime` publication:

- `public.bookmarks`
- `public.tags`
- `public.bookmark_tags`

Without this configuration, normal CRUD operations still work, but real-time synchronization across tabs and devices will not function.

## Bonus Feature

The bonus feature implemented is **Tags**.

Tags make bookmark organization more flexible and efficient. Users can group bookmarks using labels such as:

- `work`
- `docs`
- `important`
- `design`

and quickly filter bookmarks based on those tags.

Compared to folders, tags provide a lighter and faster workflow for bookmark organization.

## Challenges Faced

### Real-Time Synchronization Across Tabs and Devices

Implementing basic CRUD operations like adding, updating, and deleting bookmarks was relatively straightforward.

The more interesting challenge was implementing real-time synchronization across tabs and devices using Supabase Realtime.

Since it was my first time working with Supabase Realtime features, I spent time studying the documentation to understand how subscriptions and database broadcasts work internally.

After understanding the concepts, I implemented the feature successfully using VS Code and AI tools like Codex to improve development productivity.

Overall, it was not the most difficult part of the project, but definitely the most interesting and rewarding part because it gave me hands-on experience building real-time functionality.