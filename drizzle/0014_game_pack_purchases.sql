CREATE TABLE game_pack_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  cost INTEGER NOT NULL,
  purchased_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(user_id, game_id, pack_id)
);
