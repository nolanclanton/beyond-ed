-- course_structures, course_structure_units, course_structure_foundations
--
-- How one course version differs from the curriculum architecture workbook: the
-- order it runs its units and lessons in, the framing a unit is taught under,
-- and how hard each foundation link binds (ADR 0013).
--
-- POSITIVE: everyone in the organization READS the structure. Curriculum is not
--           secret, and the sequence is not an internal detail — it is the order
--           a student's own course runs in, and the teacher planning against it
--           needs the same answer. A curriculum author writes the sequence, the
--           framing, and the foundation weights while the owning course version
--           is a DRAFT.
-- NEGATIVE: an org admin WITHOUT the curriculum_author authorization cannot
--           re-sequence a course or weight a foundation, however wide their
--           scope over student records. Curriculum authoring is an
--           authorization, not a hierarchy level (CLAUDE.md §3). And nobody —
--           author included — writes structure once the version has left draft:
--           a roster section keeps the version it was created with, so a
--           published sequence changing underneath a running class is exactly
--           what versioning exists to prevent (CLAUDE.md §7).
--
-- The two rules that make the foundation map hold — a foundation runs BEFORE
-- the lesson that needs it, and a support can return a student INTO this course
-- — are not expressible here. Both need the generated catalog and the
-- intervention bank, which live in the application, so both are enforced in
-- `lib/curriculum/foundations.ts` on every write, re-checked as a publication
-- gate in `publicationGate`, and covered by tests in /tests/integration.
--
-- Deletes are permitted only on draft content, and only ever remove an
-- OVERRIDE: dropping a row returns that unit or that link to what the workbook
-- says, which is a state transition rather than a loss. Retiring a foundation
-- is not a delete at all — it sets `removed`, so the workbook link stays
-- readable and the reason sits on the audit event (CLAUDE.md §6).

create policy course_structures_select_own_org
  on public.course_structures for select
  using (org_id = public.current_org());

create policy course_structure_units_select_own_org
  on public.course_structure_units for select
  using (
    exists (
      select 1 from public.course_structures s
      where s.id = course_structure_id and s.org_id = public.current_org()
    )
  );

create policy course_structure_foundations_select_own_org
  on public.course_structure_foundations for select
  using (
    exists (
      select 1 from public.course_structures s
      where s.id = course_structure_id and s.org_id = public.current_org()
    )
  );

create policy course_structures_write_author_draft
  on public.course_structures for all
  using (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and public.version_is_draft(course_version_id)
  )
  with check (
    org_id = public.current_org()
    and public.is_curriculum_author()
    and public.version_is_draft(course_version_id)
  );

create policy course_structure_units_write_author_draft
  on public.course_structure_units for all
  using (public.structure_is_editable(course_structure_id))
  with check (public.structure_is_editable(course_structure_id));

create policy course_structure_foundations_write_author_draft
  on public.course_structure_foundations for all
  using (public.structure_is_editable(course_structure_id))
  with check (public.structure_is_editable(course_structure_id));
