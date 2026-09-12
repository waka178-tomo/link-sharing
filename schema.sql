-- Supabase schema for Link Sharing project
-- Created: 2026-09-13

-- Links table
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT,
  favicon_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

-- Index for fast URL lookups
CREATE INDEX idx_links_url ON links(url);

-- Row Level Security
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Anyone can read links (public sharing)
CREATE POLICY "Public read access on links"
  ON links
  FOR SELECT
  USING (true);

-- Authenticated users can insert links
CREATE POLICY "Authenticated users can insert links"
  ON links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
