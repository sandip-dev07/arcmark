# ArcMark

ArcMark is a private bookmark manager built with Next.js and Supabase. It supports Google OAuth login, per-user private bookmarks enforced with Supabase RLS, and real-time sync across tabs and devices.

## Features

- Google OAuth only authentication with Supabase Auth
- Private bookmarks per user with database-level RLS
- Add, edit, copy, and delete bookmarks
- URL metadata title autofill
- Real-time bookmark updates with Supabase Realtime
- Tag-based organization and filtering

## Bonus Feature

I chose **tags** as the bonus feature.

Why:

- bookmarks become much more useful once users can group links by intent, not just save them
- tags make retrieval faster for high-value links like `work`, `docs`, `design`, or `important`
- this improves product usability without adding heavy complexity to the main flow

In this app, tags help users organize links, surface important resources quickly, and filter their saved bookmarks with less friction than folder-heavy navigation.

## Tech Stack

- Next.js 16
- TypeScript
- Supabase Auth (OAuth)
- Supabase Postgres
- Supabase Realtime
- Tailwind CSS
- shadcn/ui

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables in `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=your_google_client_id
```

3. Run the database setup from:

```text
supabase/bookmarks.sql
```

Apply that SQL in the Supabase SQL Editor.

4. Enable Google provider in Supabase Auth and configure the correct callback URLs.

5. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes

- privacy is enforced in the database with Supabase Row Level Security, not just in the frontend
- real-time sync uses Supabase Realtime subscriptions, plus same-browser sync helpers for faster tab updates
