CREATE TABLE IF NOT EXISTS sync_records (
  owner_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  collection TEXT NOT NULL,
  record_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (owner_id, pack_id, collection, record_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_records_owner_pack_updated
  ON sync_records(owner_id, pack_id, updated_at);
