import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { assistantUnavailableReason } from "@/lib/ai/config";
import { capabilityCatalog } from "@/lib/ai/gateway";
import { requireUser } from "@/lib/auth/session";
import { authoringGate, authoredLesson } from "@/lib/curriculum/lesson-authoring";
import {
  blocksInSection,
  isLessonSection,
  LESSON_SECTION_PART,
  LESSON_SECTION_PARTS,
  sectionCounts,
} from "@/lib/curriculum/lesson-sections";
import { getCourse } from "@/lib/curriculum/catalog";
import { effectiveCourse, locateInCourse } from "@/lib/curriculum/structure";
import type { AuthoredLesson, LessonBlock, LessonSection } from "@/lib/db/types";
import { Banner, Card, Empty, StatusChip } from "@/lib/design/primitives";
import {
  BLOCK_LABELS,
  LessonBlocks,
  MATERIAL_LABELS,
} from "@/lib/design/lesson-blocks";
import { FOCUS_RING } from "@/lib/design/tokens";

import { AssistancePanel, type CapabilityOption } from "../../../../assistance";
import { MoveBlockForm, RemoveBlockForm, BlockForm } from "../../../studio-forms";
import { InsertGallery, PlaceAssetForm } from "./design-forms";

export const metadata: Metadata = {
  title: "Design studio · Beyond.Ed",
  description:
    "Compose a lesson part by part: add text, images, video, and materials, and arrange the order a student meets them in.",
};

/**
 * The design studio — where a lesson is laid out (blueprint §6, CLAUDE.md §7).
 *
 * Three panes, in the order a person works: the lesson's PARTS on the left, the
 * selected part's CANVAS in the middle, and what you can add or change to the
 * right. Selecting a part or an element is a link rather than hidden client
 * state, so the studio is keyboard reachable, survives a reload, and can be
 * sent to a colleague pointing at the exact thing being discussed.
 *
 * The canvas is the student's own renderer. There is no separate design-time
 * drawing of a lesson to drift out of step with what a class actually meets.
 *
 * What it does NOT compose is anything the engine reads to make a decision.
 * Spiral Review, the Exit Ticket, and the next-step decision are produced by
 * rule from stored evidence and authored items (CLAUDE.md §8), so they are
 * built in the quiz on the lesson page, not laid out here.
 */
export default async function DesignStudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ versionId: string; lessonCode: string }>;
  searchParams: Promise<{ part?: string; el?: string }>;
}) {
  const { versionId, lessonCode } = await params;
  const { part: partParam, el } = await searchParams;
  const actor = await requireUser();

  let gate;
  try {
    gate = authoringGate(actor, versionId);
  } catch {
    notFound();
  }
  const version = gate.version;
  if (!getCourse(version.courseTitle)) notFound();
  const course = effectiveCourse(version);
  const found = locateInCourse(course, lessonCode);
  if (!found) notFound();

  const lesson = found.lesson;
  const unit = found.unit;
  const draft = authoredLesson(version.id, lessonCode);
  const blocks = draft?.blocks ?? [];
  const videos = draft?.videos ?? [];
  const materials = draft?.materials ?? [];

  // An unknown or absent `part` falls back to instruction rather than 404-ing:
  // a stale bookmark should land somewhere useful, not on an error.
  const section: LessonSection = isLessonSection(partParam) ? partParam : "instruction";
  const part = LESSON_SECTION_PART[section];
  const counts = sectionCounts(blocks);
  const placed = blocksInSection(blocks, section);
  const selected = el ? placed.find((b) => b.id === el) : undefined;

  const href = (next: { part?: LessonSection; el?: string | null }) => {
    const q = new URLSearchParams();
    q.set("part", next.part ?? section);
    const element = next.el === undefined ? (selected?.id ?? null) : next.el;
    if (element) q.set("el", element);
    return `/org/curriculum/build/${version.id}/${lessonCode}/design?${q.toString()}`;
  };

  const totalElements = blocks.length;

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/org/curriculum/build" className={`hover:underline ${FOCUS_RING}`}>
          Lesson studio
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          href={`/org/curriculum/build/${version.id}`}
          className={`hover:underline ${FOCUS_RING}`}
        >
          {version.courseTitle} {version.version}
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          href={`/org/curriculum/build/${version.id}/${lessonCode}`}
          className={`hover:underline ${FOCUS_RING}`}
        >
          {lessonCode}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">Design</span>
      </nav>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Unit {unit.order} &middot; course day {lesson.day}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            {lesson.title}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {totalElements} element{totalElements === 1 ? "" : "s"} across{" "}
            {LESSON_SECTION_PARTS.length} parts &middot; reaches students when this
            version is published
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip
            label={gate.editable ? "Editing a draft" : "Read-only"}
            tone={gate.editable ? "info" : "neutral"}
          />
          <Link
            href={`/org/curriculum/build/${version.id}/${lessonCode}`}
            className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
          >
            Script, media, and quiz &rarr;
          </Link>
        </div>
      </header>

      {!gate.editable ? (
        <div className="mt-5">
          <Banner title="This lesson cannot be edited here." tone="notice">
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {gate.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="mt-2">
              The layout below is what a student meets. Nothing on this page will
              change it.
            </p>
          </Banner>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[13.5rem_minmax(0,1fr)] xl:grid-cols-[13.5rem_minmax(0,1fr)_19rem]">
        {/* ---------------------------------------------------------------
            Left: the lesson's parts
            --------------------------------------------------------------- */}
        <nav aria-label="Lesson parts" className="lg:sticky lg:top-4 lg:self-start">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Parts of the lesson
          </h2>
          <ol className="mt-2 flex flex-col gap-1.5">
            {LESSON_SECTION_PARTS.map((option) => {
              const active = option.value === section;
              const count = counts[option.value];
              return (
                <li key={option.value}>
                  <Link
                    href={href({ part: option.value, el: null })}
                    aria-current={active ? "true" : undefined}
                    className={`block rounded-lg border px-3 py-2.5 transition-colors ${FOCUS_RING} ${
                      active
                        ? "border-primary bg-primary-surface"
                        : "border-line bg-surface hover:border-primary-line"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wide ${
                        active ? "text-primary" : "text-ink-muted"
                      }`}
                    >
                      Stage {option.stage}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold leading-snug text-ink">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {count === 0
                        ? "No elements"
                        : `${count} element${count === 1 ? "" : "s"}`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 px-1 text-xs text-ink-muted">
            Spiral Review, the Exit Ticket, and the next-step decision are produced
            by rule from stored evidence, so they are not laid out here.
          </p>
        </nav>

        {/* ---------------------------------------------------------------
            Middle: the canvas for the selected part
            --------------------------------------------------------------- */}
        <section aria-label={`${part.label} canvas`} className="min-w-0">
          <Card>
            <div className="border-b border-line px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="text-base font-semibold text-ink">
                  {part.stage}. {part.label}
                </h2>
                <p className="text-xs text-ink-muted">
                  {placed.length} element{placed.length === 1 ? "" : "s"}
                </p>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{part.meaning}</p>
            </div>

            <div className="p-5">
              <ScriptContribution section={section} draft={draft} />

              {placed.length === 0 ? (
                <div className="mt-4">
                  <Empty>
                    Nothing has been laid out in this part yet.
                    {gate.editable
                      ? " Add something from the panel on the right."
                      : ""}
                  </Empty>
                </div>
              ) : (
                <ol className="mt-4 flex flex-col gap-4">
                  {placed.map((block, index) => {
                    const isSelected = block.id === selected?.id;
                    return (
                      <li key={block.id}>
                        <div
                          className={`rounded-xl border transition-colors ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/25"
                              : "border-line"
                          }`}
                        >
                          <div
                            className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-t-xl border-b px-3 py-1.5 ${
                              isSelected
                                ? "border-primary/40 bg-primary-surface"
                                : "border-line bg-surface-sunken"
                            }`}
                          >
                            <p className="text-xs font-semibold text-ink-muted">
                              <span className="text-ink">{index + 1}</span> of{" "}
                              {placed.length} &middot; {BLOCK_LABELS[block.kind]}
                              {isSelected ? (
                                <span className="ml-2 font-bold text-primary">
                                  Selected
                                </span>
                              ) : null}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {gate.editable ? (
                                <>
                                  <MoveBlockForm
                                    versionId={version.id}
                                    lessonCode={lessonCode}
                                    blockId={block.id}
                                    position={index}
                                    direction="up"
                                    disabled={index === 0}
                                  />
                                  <MoveBlockForm
                                    versionId={version.id}
                                    lessonCode={lessonCode}
                                    blockId={block.id}
                                    position={index}
                                    direction="down"
                                    disabled={index === placed.length - 1}
                                  />
                                </>
                              ) : null}
                              <Link
                                href={href({ el: isSelected ? null : block.id })}
                                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${FOCUS_RING} ${
                                  isSelected
                                    ? "border-primary bg-surface text-primary"
                                    : "border-line bg-surface text-ink-muted hover:border-primary-line hover:text-primary"
                                }`}
                              >
                                {isSelected ? "Deselect" : "Select"}
                                <span className="sr-only">
                                  {" "}
                                  {BLOCK_LABELS[block.kind]} {index + 1} of{" "}
                                  {placed.length}
                                </span>
                              </Link>
                            </div>
                          </div>
                          <div className="px-4 py-3">
                            <LessonBlocks
                              blocks={[block]}
                              videos={videos}
                              materials={materials}
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </Card>
        </section>

        {/* ---------------------------------------------------------------
            Right: what you can add, or what the selected element is
            --------------------------------------------------------------- */}
        <aside
          aria-label={selected ? "Selected element" : "Add to this part"}
          className="min-w-0 xl:sticky xl:top-4 xl:self-start"
        >
          {!gate.editable ? (
            <Card>
              <div className="p-5">
                <p className="text-sm text-ink-muted">
                  Editing is closed for this version, so there is nothing to add or
                  change. Open the next draft version to keep building.
                </p>
              </div>
            </Card>
          ) : selected ? (
            <>
            <Card>
              <div className="border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">
                  {BLOCK_LABELS[selected.kind]} in {part.label}
                </h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Change it, move it to another part, or take it out.
                </p>
              </div>
              <div className="p-4">
                <BlockForm
                  versionId={version.id}
                  lessonCode={lessonCode}
                  videos={videos}
                  materials={materials}
                  block={selected}
                  seq={0}
                />
                <div className="mt-4 border-t border-line pt-4">
                  <RemoveBlockForm
                    versionId={version.id}
                    lessonCode={lessonCode}
                    blockId={selected.id}
                  />
                </div>
                <p className="mt-4">
                  <Link
                    href={href({ el: null })}
                    className={`text-xs font-semibold text-ink-muted underline-offset-4 hover:underline ${FOCUS_RING}`}
                  >
                    Done with this element
                  </Link>
                </p>
              </div>
            </Card>

            {rewritableText(selected) === null ? null : (
              <div className="mt-4">
                <AssistancePanel
                  heading="Rewrite this element"
                  hint="Works on this passage only. The rest of the lesson is context the assistant reads, not something it may change."
                  capabilities={rewriteCapability(actor.orgId)}
                  target={{
                    courseVersionId: version.id,
                    lessonCode,
                    section,
                    blockId: selected.id,
                    blockKind:
                      selected.kind === "callout"
                        ? "callout"
                        : selected.kind === "heading"
                          ? "heading"
                          : "text",
                    blockTitle: selected.kind === "callout" ? selected.title : "",
                    blockTone: selected.kind === "callout" ? selected.tone : "note",
                    selection: rewritableText(selected) ?? "",
                  }}
                  unavailableReason={assistantUnavailableReason()}
                  seq={2}
                />
              </div>
            )}
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <Card>
                <div className="border-b border-line px-4 py-3">
                  <h2 className="text-sm font-semibold text-ink">
                    Add to {part.label}
                  </h2>
                </div>
                <div className="p-4">
                  <InsertGallery
                    versionId={version.id}
                    lessonCode={lessonCode}
                    section={section}
                    sectionLabel={part.label}
                    videos={videos}
                    materials={materials}
                    seq={placed.length}
                  />
                </div>
              </Card>

              <AssetLibrary
                versionId={version.id}
                lessonCode={lessonCode}
                section={section}
                sectionLabel={part.label}
                blocks={blocks}
                videos={videos}
                materials={materials}
                seq={placed.length}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/**
 * What the typed script already puts in this part, shown above the elements.
 *
 * The script is not free-form and is not composed here: the worked model's
 * steps and guided practice's fading hints are read by the product, so they
 * keep their own fields on the lesson page. Showing them means an author is
 * laying out the whole stage rather than half of it.
 */
function ScriptContribution({
  section,
  draft,
}: {
  section: LessonSection;
  draft: AuthoredLesson | undefined;
}) {
  const part = LESSON_SECTION_PART[section];

  const written = (() => {
    if (!draft) return null;
    switch (section) {
      case "notes":
        return draft.notesOutline.length > 0 ? draft.notesOutline.join(" · ") : null;
      case "relevance":
        return draft.relevance.trim() || null;
      case "goal":
        return draft.goal.trim()
          ? [draft.goal, ...draft.successCriteria].join(" · ")
          : null;
      case "instruction":
        return draft.vocabulary.length > 0
          ? `Vocabulary, shown after these elements: ${draft.vocabulary.map((v) => v.term).join(", ")}`
          : null;
      case "worked_model":
        return draft.workedModel.length > 0
          ? draft.workedModel.map((w) => w.step).join(" · ")
          : null;
      case "guided_practice":
        return draft.guidedPractice.length > 0
          ? draft.guidedPractice.map((g) => g.prompt).join(" · ")
          : null;
      case "independent":
        return draft.independentTask.trim() || null;
    }
  })();

  return (
    <div className="rounded-lg border border-line bg-surface-sunken px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        From the script &middot; shown{" "}
        {section === "instruction" ? "after" : "before"} these elements
      </p>
      <p className="mt-1 line-clamp-3 text-sm text-ink">
        {written ?? <span className="text-ink-muted">{part.script} Not written yet.</span>}
      </p>
    </div>
  );
}

/**
 * Everything attached to this lesson, and where it has been placed.
 *
 * Placing an asset links it rather than copying it, so a video's transcript and
 * a material's access note always travel with it. An asset attached but placed
 * nowhere still reaches the student at the end of the instruction stage — the
 * count says so, because a file a student cannot reach is a lesson they were
 * not given (CLAUDE.md §12).
 */
function AssetLibrary({
  versionId,
  lessonCode,
  section,
  sectionLabel,
  blocks,
  videos,
  materials,
  seq,
}: {
  versionId: string;
  lessonCode: string;
  section: LessonSection;
  sectionLabel: string;
  blocks: readonly LessonBlock[];
  videos: AuthoredLesson["videos"];
  materials: AuthoredLesson["materials"];
  seq: number;
}) {
  const placements = (id: string) =>
    blocks.filter(
      (b) =>
        (b.kind === "video" && b.videoId === id) ||
        (b.kind === "material" && b.materialId === id),
    ).length;

  return (
    <Card>
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">
          Attached to this lesson ({videos.length + materials.length})
        </h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Place one here and it keeps its transcript or access note.
        </p>
      </div>
      <div className="p-4">
        {videos.length === 0 && materials.length === 0 ? (
          <Empty>
            Nothing attached yet. Videos and materials are attached on the lesson
            page, then placed here.
          </Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {videos.map((video) => (
              <li key={video.id} className="rounded-lg border border-line px-3 py-2.5">
                <p className="text-sm font-semibold text-ink">{video.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Video &middot;{" "}
                  {placements(video.id) === 0
                    ? "not placed"
                    : `placed ${placements(video.id)}×`}
                </p>
                <div className="mt-1">
                  <PlaceAssetForm
                    versionId={versionId}
                    lessonCode={lessonCode}
                    section={section}
                    sectionLabel={sectionLabel}
                    asset={{ kind: "video", video }}
                    seq={seq}
                  />
                </div>
              </li>
            ))}
            {materials.map((material) => (
              <li
                key={material.id}
                className="rounded-lg border border-line px-3 py-2.5"
              >
                <p className="text-sm font-semibold text-ink">{material.title}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {MATERIAL_LABELS[material.kind]} &middot;{" "}
                  {placements(material.id) === 0
                    ? "not placed"
                    : `placed ${placements(material.id)}×`}
                </p>
                <div className="mt-1">
                  <PlaceAssetForm
                    versionId={versionId}
                    lessonCode={lessonCode}
                    section={section}
                    sectionLabel={sectionLabel}
                    asset={{ kind: "material", material }}
                    seq={seq}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

/**
 * The text of an element a rewrite can operate on, or null.
 *
 * Only the three kinds that are prose. A table, a list, an image, and a
 * reference to a video or a material are structure rather than a passage, and
 * offering a rewrite for them would be a control that cannot do what it says
 * (CLAUDE.md §12).
 */
function rewritableText(block: LessonBlock): string | null {
  switch (block.kind) {
    case "text":
    case "heading":
      return block.text;
    case "callout":
      return block.text;
    default:
      return null;
  }
}

/** The one capability that operates on a selection. */
function rewriteCapability(orgId: string): CapabilityOption[] {
  return capabilityCatalog(orgId)
    .filter((c) => c.name === "rewrite_selected_section" && c.enabled)
    .map((c) => ({
      name: c.name,
      label: c.label,
      summary: c.summary,
      advisory: false,
    }));
}
