-- 0002_tryon_runs: track when each try-on run started, and how many runs
-- have completed (Redo reuses the row, so this is how spending is counted).

alter table public.tryons
  add column started_at timestamptz,
  add column completed_runs integer not null default 0
    check (completed_runs >= 0);
