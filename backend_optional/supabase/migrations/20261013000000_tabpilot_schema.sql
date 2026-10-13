-- TabPilot Optional Supabase PostgreSQL Schema
-- Supports multi-device sync with Row Level Security (RLS)

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT NOT NULL DEFAULT '#2563eb',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  sort_order INT NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspaces"
  ON public.workspaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
  ON public.workspaces FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces"
  ON public.workspaces FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_updated
  ON public.workspaces(user_id, updated_at DESC);

-- 2. Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  tabs JSONB NOT NULL DEFAULT '[]'::jsonb,
  tab_count INT NOT NULL DEFAULT 0,
  restore_options JSONB NOT NULL DEFAULT '{"openInNewWindow": false, "avoidDuplicates": true}'::jsonb,
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user_updated
  ON public.sessions(user_id, updated_at DESC);

-- 3. Saved Tabs
CREATE TABLE IF NOT EXISTS public.saved_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  favicon_url TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.saved_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved tabs"
  ON public.saved_tabs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved tabs"
  ON public.saved_tabs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved tabs"
  ON public.saved_tabs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved tabs"
  ON public.saved_tabs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_tabs_user_saved
  ON public.saved_tabs(user_id, saved_at DESC);
