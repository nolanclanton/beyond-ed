import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  assessmentDescription,
  findLesson,
  getCourse,
  interventionId,
  lessonTopic,
  primaryStandards,
  subjectForLesson,
} from "@/lib/curriculum/catalog";
import {
  alignableStandards,
  authoredLesson,
  authoringGate,
  ITEM_PURPOSES,
  lessonReadiness,
} from "@/lib/curriculum/lesson-authoring";
import { ALL_ITEMS } from "@/lib/db/demo-items";
import { db } from "@/lib/db/store";
import type { AuthoredQuizItem } from "@/lib/db/types";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  FactList,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

import {
  AddVideoForm,
  QuizItemForm,
  RemoveItemForm,
  RemoveVideoForm,
  ScriptForm,
} from "../../studio-forms";

export const metadata: Metadata = {
  title: "Build a lesson · Beyond.Ed",
  description: "Write the script, attach the video, and build the quiz for one lesson.",
};

/**
 * The lesson editor.
 *
 * Everything a lesson is made of, on one page: the script a student reads, the
 * video that carries it, and the items that produce evidence. The course plan's
 * own record sits at the top — day range, standards, assessment, linked
 * intervention — because a lesson is written INTO a plan, not beside one.
 *
 * When the version is not a draft, or the reader does not hold the authoring
 * authorization, the same content renders read-only with the reason stated. No
 * control is shown that cannot complete its action (CLAUDE.md §12).
 */
export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ versionId: string; lessonCode: string }>;
}) {
  const { versionId, lessonCode } = await params;
  const actor = await requireUser();

  let gate;
  try {
    gate = authoringGate(actor, versionId);
  } catch {
    notFound();
  }
  const version = gate.version;
  const course = getCourse(version.courseTitle);
  if (!course) notFound();
  const found = findLesson(course, lessonCode);
  if (!found) notFound();

  const lesson = found.lesson;
  const draft = authoredLesson(version.id, lessonCode);
  const readiness = lessonReadiness(version.id, lessonCode);
  const standards = alignableStandards(version, lessonCode);
  const subject = subjectForLesson(lessonCode);

  /**
   * Error families already in use — the ones from this subject's existing items,
   * plus anything this version has authored. Offered as suggestions so an error
   * model stays consistent; the author can always type their own.
   */
  const errorCodeSuggestions = Array.from(
    new Set([
      ...ALL_ITEMS.filter((i) => subjectForLesson(i.lessonCode) === subject)
        .flatMap((i) => i.choices.map((c) => c.errorCode))
        .filter((c): c is string => Boolean(c)),
      ...db()
        .authoredLessons.filter((l) => l.courseVersionId === version.id)
        .flatMap((l) => l.items)
        .flatMap((i) => i.choices.map((c) => c.errorCode))
        .filter((c): c is string => Boolean(c)),
    ]),
  ).sort();

  const byPurpose = ITEM_PURPOSES.map((purpose) => ({
    ...purpose,
    items: (draft?.items ?? []).filter((i) => i.purpose === purpose.value),
  }));

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
        <span className="font-mono text-ink">{lessonCode}</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          {lessonTopic(lesson)}
        </h1>
        <p className="mt-2 text-base text-ink-muted">
          Unit {found.unit.order}. {found.unit.name} · course day {lesson.dayRange}
        </p>
      </header>

      {!gate.editable ? (
        <div className="mt-5">
          <Banner title="Read-only." tone="notice">
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {gate.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </Banner>
        </div>
      ) : null}

      <section aria-labelledby="record" className="mt-6">
        <SectionHeading
          id="record"
          hint="From the course plan. The studio writes content for this lesson; it never changes the plan."
        >
          The lesson&apos;s place in the course
        </SectionHeading>
        <Card>
          <div className="p-5">
            <FactList
              columns={3}
              items={[
                { label: "Lesson code", value: <span className="font-mono">{lesson.code}</span> },
                { label: "Course days", value: `${lesson.dayRange} (${lesson.days})` },
                {
                  label: "Primary standards",
                  value:
                    primaryStandards(lesson).length > 0
                      ? primaryStandards(lesson).join(", ")
                      : "No new primary standard",
                },
                { label: "Instructional sequence", value: lesson.sequence },
                { label: "Assessment record", value: assessmentDescription(lesson) },
                { label: "Linked intervention", value: interventionId(lesson) },
              ]}
            />
          </div>
        </Card>
      </section>

      <section aria-labelledby="readiness" className="mt-8">
        <SectionHeading
          id="readiness"
          hint="Advisory, not a gate. What a student would meet if this version were published today."
        >
          Before a student sees this
        </SectionHeading>
        <Card>
          <div className="p-5">
            <div className="mb-4">
              <StatusChip
                label={readiness.complete ? "Ready for students" : "Not finished"}
                tone={readiness.complete ? "positive" : "attention"}
              />
            </div>
            <ul className="flex flex-col gap-2.5">
              {readiness.checks.map((check) => (
                <li key={check.label} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      check.done
                        ? "border-positive-line bg-positive-surface text-positive"
                        : "border-line-strong bg-surface-sunken text-ink-muted"
                    }`}
                  >
                    {check.done ? "✓" : "·"}
                  </span>
                  <span>
                    <span className="text-sm font-semibold text-ink">
                      {check.label}
                      <span className="ml-2 font-normal text-ink-muted">
                        {check.done ? "done" : "still to do"}
                      </span>
                    </span>
                    <span className="block text-sm text-ink-muted">{check.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>

      <section aria-labelledby="script" className="mt-10">
        <SectionHeading
          id="script"
          hint="Stages 1 and 3 to 8 of the ten-stage lesson. Saved in one transaction, with a recorded reason."
        >
          Lesson script
        </SectionHeading>
        <Card>
          <div className="p-5">
            {gate.editable ? (
              <ScriptForm versionId={version.id} lessonCode={lessonCode} draft={draft} />
            ) : draft ? (
              <ReadOnlyScript draft={draft} />
            ) : (
              <Empty>Nothing has been written for this lesson.</Empty>
            )}
          </div>
        </Card>
      </section>

      <section aria-labelledby="video" className="mt-10">
        <SectionHeading
          id="video"
          hint="Referenced by address, with a transcript. This build stores the reference, not the file."
        >
          Video ({draft?.videos.length ?? 0})
        </SectionHeading>

        <div className="mb-3">
          <Banner title="Where the file itself lives." tone="neutral">
            Beyond.Ed holds the address of a video and its transcript, not the
            video file: file storage is not provisioned in this build, so an
            upload control here could not finish what it started. Host the file
            where your organization already hosts media and paste the address.
            Every video needs a transcript before it can be attached.
          </Banner>
        </div>

        <Card>
          <div className="p-5">
            {(draft?.videos ?? []).length === 0 ? (
              <Empty>No video is attached to this lesson.</Empty>
            ) : (
              <ul className="flex flex-col gap-4">
                {(draft?.videos ?? []).map((video) => (
                  <li key={video.id} className="rounded-lg border border-line p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{video.title}</p>
                        <p className="mt-0.5 break-all font-mono text-xs text-ink-muted">
                          {video.url}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {video.minutes ? `${video.minutes} minutes · ` : ""}
                          transcript included ·{" "}
                          {video.captionsUrl ? "captions file attached" : "no captions file"}
                        </p>
                      </div>
                      {gate.editable ? (
                        <RemoveVideoForm
                          versionId={version.id}
                          lessonCode={lessonCode}
                          videoId={video.id}
                          title={video.title}
                        />
                      ) : null}
                    </div>
                    <details className="mt-3">
                      <summary
                        className={`cursor-pointer text-sm font-semibold text-primary ${FOCUS_RING}`}
                      >
                        Read the transcript
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
                        {video.transcript}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            )}

            {gate.editable ? (
              <div className="mt-5">
                <AddVideoForm
                  versionId={version.id}
                  lessonCode={lessonCode}
                  count={draft?.videos.length ?? 0}
                />
              </div>
            ) : null}
          </div>
        </Card>
      </section>

      <section aria-labelledby="quiz" className="mt-10">
        <SectionHeading
          id="quiz"
          hint="Scored on the server against the four Exit Ticket bands. The browser reports a choice; it never decides a result."
        >
          Quiz ({draft?.items.length ?? 0}{" "}
          {(draft?.items.length ?? 0) === 1 ? "item" : "items"})
        </SectionHeading>

        {standards.length === 0 ? (
          <Banner title="This lesson has no standard to align an item to." tone="notice">
            {lesson.code} claims no new primary standard — it is a launch or
            diagnostic day. Items belong on the lessons that carry the coverage,
            so evidence can point at something.
          </Banner>
        ) : (
          <div className="flex flex-col gap-4">
            {byPurpose.map((group) => (
              <Card key={group.value}>
                <CardHeader
                  title={`${group.label} (${group.items.length})`}
                  hint={group.meaning}
                />
                <div className="p-5">
                  {group.items.length === 0 ? (
                    <Empty>No {group.label.toLowerCase()} items yet.</Empty>
                  ) : (
                    <ul className="flex flex-col gap-4">
                      {group.items.map((item) => (
                        <li key={item.id} className="rounded-lg border border-line p-4">
                          <QuizItemView item={item} />
                          {gate.editable ? (
                            <div className="mt-3 flex flex-wrap gap-3">
                              <QuizItemForm
                                versionId={version.id}
                                lessonCode={lessonCode}
                                standards={standards}
                                purposes={ITEM_PURPOSES}
                                item={item}
                                errorCodeSuggestions={errorCodeSuggestions}
                                seq={0}
                              />
                              <RemoveItemForm
                                versionId={version.id}
                                lessonCode={lessonCode}
                                itemId={item.id}
                              />
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            ))}

            {gate.editable ? (
              <Card>
                <CardHeader
                  title="Write a new item"
                  hint="One correct choice, and an error family behind every wrong one."
                />
                <div className="p-5">
                  <QuizItemForm
                    versionId={version.id}
                    lessonCode={lessonCode}
                    standards={standards}
                    purposes={ITEM_PURPOSES}
                    errorCodeSuggestions={errorCodeSuggestions}
                    seq={draft?.items.length ?? 0}
                  />
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function QuizItemView({ item }: { item: AuthoredQuizItem }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip label={item.standard} tone="info" />
        <span className="text-xs text-ink-muted">measures {item.skill}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-ink">{item.stem}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {item.choices.map((choice) => {
          const correct = choice.id === item.correctChoiceId;
          return (
            <li key={choice.id} className="text-sm">
              <span className={correct ? "font-semibold text-positive" : "text-ink"}>
                {choice.text}
              </span>
              <span className="ml-2 text-xs text-ink-muted">
                {correct ? "correct" : `reveals: ${choice.errorCode}`}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-sm text-ink-muted">
        <span className="font-semibold text-ink">Explanation: </span>
        {item.rationale}
      </p>
    </div>
  );
}

function ReadOnlyScript({
  draft,
}: {
  draft: NonNullable<ReturnType<typeof authoredLesson>>;
}) {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <Part title="Relevance">{draft.relevance || "—"}</Part>
      <Part title="Goal">{draft.goal || "—"}</Part>
      <Part title="Success criteria">
        <ul className="list-disc space-y-1 pl-5">
          {draft.successCriteria.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Part>
      <Part title="Instruction">
        <div className="space-y-2">
          {draft.instruction.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Part>
      <Part title="Vocabulary">
        <dl className="space-y-1">
          {draft.vocabulary.map((v) => (
            <div key={v.term}>
              <dt className="inline font-semibold text-ink">{v.term}: </dt>
              <dd className="inline text-ink-muted">{v.meaning}</dd>
            </div>
          ))}
        </dl>
      </Part>
      <Part title="Worked model">
        <ol className="list-decimal space-y-1 pl-5">
          {draft.workedModel.map((w) => (
            <li key={w.step}>
              <span className="text-ink">{w.step}</span>{" "}
              <span className="text-ink-muted">— {w.reasoning}</span>
            </li>
          ))}
        </ol>
      </Part>
      <Part title="Guided practice">
        <ol className="list-decimal space-y-1 pl-5">
          {draft.guidedPractice.map((g) => (
            <li key={g.prompt}>
              <span className="text-ink">{g.prompt}</span>{" "}
              <span className="text-ink-muted">— {g.answer}</span>
            </li>
          ))}
        </ol>
      </Part>
      <Part title="Independent task">{draft.independentTask || "—"}</Part>
      <Part title="Notes outline">
        <ul className="list-disc space-y-1 pl-5">
          {draft.notesOutline.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Part>
    </div>
  );
}

function Part({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h3>
      <div className="mt-1 text-ink">{children}</div>
    </div>
  );
}
