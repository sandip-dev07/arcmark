"use client";

const BOOKMARKS_SYNC_CHANNEL = "arcmark-bookmarks-sync";
const BOOKMARKS_SYNC_EVENT = "bookmarks-changed";
const BOOKMARKS_SYNC_STORAGE_KEY = "arcmark:bookmarks-sync";

export const publishBookmarksSync = () => {
  const payload = `${BOOKMARKS_SYNC_EVENT}:${Date.now()}`;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(BOOKMARKS_SYNC_STORAGE_KEY, payload);
  }

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(BOOKMARKS_SYNC_CHANNEL);
    channel.postMessage(BOOKMARKS_SYNC_EVENT);
    channel.close();
  }
};

export const bookmarksSyncConfig = {
  channel: BOOKMARKS_SYNC_CHANNEL,
  event: BOOKMARKS_SYNC_EVENT,
  storageKey: BOOKMARKS_SYNC_STORAGE_KEY,
};
