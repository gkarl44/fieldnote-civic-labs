CREATE TABLE IF NOT EXISTS request_log (
  id TEXT PRIMARY KEY,
  observed_at TEXT NOT NULL,
  kind TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  query TEXT,
  status INTEGER,
  referrer TEXT,
  user_agent TEXT,
  crawler_family TEXT,
  country TEXT,
  asn INTEGER,
  as_organization TEXT,
  cf_ray TEXT,
  event_name TEXT,
  event_label TEXT
);

CREATE INDEX IF NOT EXISTS idx_request_log_observed_at ON request_log (observed_at);
CREATE INDEX IF NOT EXISTS idx_request_log_path ON request_log (path);
CREATE INDEX IF NOT EXISTS idx_request_log_crawler_family ON request_log (crawler_family);
CREATE INDEX IF NOT EXISTS idx_request_log_as_organization ON request_log (as_organization);
