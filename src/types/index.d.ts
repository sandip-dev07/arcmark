export type BookmarkRow = {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description: string | null;
  tags: string[];
  created_at: string;
};

export type TagRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};
