-- ============================================================================
-- Enable row-level security on EVERY table (CLAUDE.md §3)
-- ============================================================================
--
-- A table without RLS is a defect and must fail CI. Enabling RLS with no policy
-- denies everything, which is the correct default: each table's grants are
-- added in its own file.

alter table public.organizations     enable row level security;
alter table public.sites             enable row level security;
alter table public.users             enable row level security;
alter table public.course_versions   enable row level security;
alter table public.roster_sections   enable row level security;
alter table public.enrollments       enable row level security;
alter table public.lesson_states     enable row level security;
alter table public.evidence          enable row level security;
alter table public.grade_categories  enable row level security;
alter table public.gradebook_configs enable row level security;
alter table public.grade_records     enable row level security;
alter table public.skill_profiles    enable row level security;
alter table public.mastery_estimates enable row level security;
alter table public.mastery_confidence enable row level security;
alter table public.interventions     enable row level security;
alter table public.teacher_messages  enable row level security;
alter table public.export_records    enable row level security;
alter table public.audit_events      enable row level security;
alter table public.idempotency_keys  enable row level security;

-- Added in migration 0006 — authored lesson content.
alter table public.authored_lessons  enable row level security;
alter table public.lesson_videos     enable row level security;
alter table public.lesson_items      enable row level security;

-- Added in migration 0007 — the lesson canvas.
alter table public.lesson_blocks     enable row level security;

-- Views inherit the policies of their base tables when created with
-- security_invoker, which is what makes `evidence_current` safe to read.
alter view public.evidence_current       set (security_invoker = on);
alter view public.grade_records_current  set (security_invoker = on);
