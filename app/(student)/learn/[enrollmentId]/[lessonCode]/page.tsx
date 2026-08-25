import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  assessmentDescription,
  findLesson,
  getCourse,
  lessonType,
} from "@/lib/curriculum/catalog";
import { LESSON_STAGES, LESSON_STATUS_PRESENTATION } from "@/lib/curriculum/lesson-status";
import {
  LessonBlocks,
  LessonMaterialList,
  LessonVideoPlayer,
} from "@/lib/design/lesson-blocks";
import type { LessonContent } from "@/lib/db/demo-lesson-content";
import type { LessonMaterial, LessonVideo } from "@/lib/db/types";
import {
  itemsForLesson,
  resolveLessonContent,
} from "@/lib/curriculum/lesson-bank";
import { db } from "@/lib/db/store";
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
import { spiralReviewFor } from "@/lib/learning/lesson";
import { EXIT_BANDS } from "@/lib/rules/versions";
import { locationFor } from "@/lib/views/student";
import { focusForLesson, lessonLabel, skillLabel } from "@/lib/views/learning-focus";
import { recommendationsForEnrollment } from "@/lib/intervention/queue";
import { bankItemById as itemById } from "@/lib/curriculum/lesson-bank";

import {
  CompleteLessonForm,
  ExitTicketRunner,
  SpiralReviewRunner,
  StartLessonForm,
} from "./lesson-forms";

/**
 * The lesson player (blueprint §4 — core lesson structure).
 *
 * One dependable ten-stage pattern across all four subjects. Stage content
 * comes from the curriculum record; where instruction or items have not been
 * authored, the page says so instead of showing a control that cannot complete
 * its action (CLAUDE.md §12).
 */
export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string; lessonCode: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const { enrollmentId, lessonCode } = await params;
  const { stage: stageParam } = await searchParams;
  const student = await requireUser();
  const d = db();

  const enrollment = d.enrollments.find(
    (e) => e.id === enrollmentId && e.studentId === student.id,
  );
  if (!enrollment) notFound();
  const course = getCourse(enrollment.courseTitle);
  if (!course) notFound();
  const found = findLesson(course, lessonCode);
  if (!found) notFound();

  const location = locationFor(enrollment, lessonCode);
  if (!location) notFound();

  const state = d.lessonStates.find(
    (s) => s.enrollmentId === enrollmentId && s.lessonCode === lessonCode,
  );
  const status = state?.status ?? "locked";
  const presentation = LESSON_STATUS_PRESENTATION[status];
  // Content and items resolve against the version this enrollment is pinned
  // to: authored curriculum if this version published any, the demonstration
  // lesson if not, and neither where a lesson has not been written yet.
  const resolved = resolveLessonContent(enrollment.courseVersionId, lessonCode);
  const content = resolved.content;
  const focus = focusForLesson(lessonCode);
  const exitItems = itemsForLesson(
    lessonCode,
    "exit_ticket",
    enrollment.courseVersionId,
  );

  const stage = Math.min(10, Math.max(1, Number(stageParam ?? state?.stage ?? 1) || 1));
  const started = status === "in_progress" || status === "submitted";
  const finished =
    status === "passed" || status === "review_scheduled" || status === "completed";

  if (status === "locked") {
    return (
      <div className="py-6">
        <Breadcrumb
          course={course.title}
          enrollmentId={enrollmentId}
          title={lessonLabel(lessonCode)}
        />
        <h1 className="mt-3 text-2xl font-bold text-ink">{location.topic}</h1>
        <div className="mt-4">
          <Banner title="This lesson is locked." tone="neutral">
            {presentation.studentMeaning}
          </Banner>
        </div>
      </div>
    );
  }

  const spiral = started || finished ? spiralReviewFor(student.id, enrollmentId, lessonCode) : null;
  const spiralItems = (spiral?.items ?? [])
    .map((s) => itemById(s.itemId))
    .filter((i): i is NonNullable<typeof i> => i !== undefined)
    .map((i) => ({
      id: i.id,
      stem: i.stem,
      choices: i.choices.map((c) => ({ id: c.id, text: c.text })),
      rationale: i.rationale,
      correctChoiceId: i.correctChoiceId,
    }));

  const recommendations = recommendationsForEnrollment(enrollment);

  return (
    <div className="py-6">
      <Breadcrumb
          course={course.title}
          enrollmentId={enrollmentId}
          title={lessonLabel(lessonCode)}
        />

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip
            label={presentation.label}
            tone={finished ? "positive" : started ? "info" : "neutral"}
          />
          <span className="text-xs text-ink-muted">
            {focus?.position} &middot; {lessonType(found.lesson).toLowerCase()}
            &middot; day {found.lesson.day}
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {location.topic}
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-muted">
          {focus?.description}
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Unit {found.unit.order}: {found.unit.title} &middot; {presentation.studentMeaning}
        </p>
      </header>

      <div className="mt-5">
        <Card className="p-5">
          {/*
            No standard codes, assessment ids, support ids, or rule versions.
            Those are staff vocabulary — a teacher needs them to trace coverage,
            a student does not, and showing them makes ordinary learning look
            like paperwork (CLAUDE.md §13).
          */}
          <FactList
            columns={3}
            items={[
              {
                label: "What you are learning",
                value: focus?.description ?? location.topic,
              },
              {
                label: "Where you are",
                value: `${focus?.position ?? ""}${
                  found.unit.title ? ` in ${found.unit.title}` : ""
                }`,
              },
              {
                label: "What you will show",
                value: assessmentDescription(found.lesson),
              },
            ]}
          />
        </Card>
      </div>

      {resolved.source === "none" ? (
        <div className="mt-5">
          <Banner title="This lesson has not been written yet." tone="notice">
            Where it sits in the course is real. The teaching, the worked
            example, and the practice questions do not exist yet, so there is
            nothing here to work through and nothing to turn in.
          </Banner>
        </div>
      ) : resolved.source === "authored" ? (
        <div className="mt-5">
          <Banner title={`From ${resolved.versionLabel ?? "your course version"}.`} tone="neutral">
            This lesson was written for the version of the course you are
            enrolled in. A later version cannot change it underneath you.
          </Banner>
        </div>
      ) : (
        <div className="mt-5">
          <Banner title="Example lesson." tone="neutral">
            Where this lesson sits in the course is real. The teaching and the
            questions below were written to show how a lesson works, and have not
            yet been reviewed by a teacher.
          </Banner>
        </div>
      )}

      {!started && !finished ? (
        <div className="mt-6">
          <Card className="border-primary-line p-5">
            <h2 className="text-lg font-semibold text-ink">Ready when you are</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Opening the lesson records that you started it. Your place is saved as
              you go, so you can come back to the exact stage.
            </p>
            <div className="mt-4">
              <StartLessonForm
                enrollmentId={enrollmentId}
                lessonCode={lessonCode}
                idempotencyKey={`start:${enrollmentId}:${lessonCode}`}
                label="Open this lesson"
              />
            </div>
          </Card>
        </div>
      ) : (
        <>
          <StageNav
            enrollmentId={enrollmentId}
            lessonCode={lessonCode}
            current={stage}
          />

          <div className="mt-6">
            <StageBody
              stage={stage}
              enrollmentId={enrollmentId}
              lessonCode={lessonCode}
              content={content}
              videos={resolved.videos}
              materials={resolved.materials}
              spiralItems={spiralItems}
              spiralExplanation={spiral?.explanation ?? []}
              exitItems={exitItems.map((i) => ({
                id: i.id,
                stem: i.stem,
                choices: i.choices.map((c) => ({ id: c.id, text: c.text })),
                rationale: i.rationale,
                correctChoiceId: i.correctChoiceId,
              }))}
              assessment={assessmentDescription(found.lesson)}
              status={status}
              attempts={state?.attempts ?? 0}
              recommendationSummaries={recommendations.map((r) => ({
                skill: r.skill,
                summary: r.triggerSummary,
                minutes: r.estimatedMinutes,
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}

function Breadcrumb({
  course,
  enrollmentId,
  title,
}: {
  course: string;
  enrollmentId: string;
  title: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
      <Link href="/learn" className={`underline underline-offset-4 hover:text-primary ${FOCUS_RING}`}>
        Learn
      </Link>
      <span aria-hidden="true"> / </span>
      <Link
        href={`/learn/${enrollmentId}`}
        className={`underline underline-offset-4 hover:text-primary ${FOCUS_RING}`}
      >
        {course}
      </Link>
      <span aria-hidden="true"> / </span>
      <span className="text-ink">{title}</span>
    </nav>
  );
}

function StageNav({
  enrollmentId,
  lessonCode,
  current,
}: {
  enrollmentId: string;
  lessonCode: string;
  current: number;
}) {
  return (
    <nav aria-label="Lesson stages" className="mt-6">
      <ol className="flex flex-wrap gap-1.5">
        {LESSON_STAGES.map((label, index) => {
          const n = index + 1;
          const active = n === current;
          return (
            <li key={label}>
              <Link
                href={`/learn/${enrollmentId}/${lessonCode}?stage=${n}`}
                aria-current={active ? "step" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${FOCUS_RING} ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-surface text-ink-muted hover:border-primary-line hover:text-primary"
                }`}
              >
                <span className={active ? "text-white/70" : "text-ink-muted"}>{n}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type StageBodyProps = {
  stage: number;
  enrollmentId: string;
  lessonCode: string;
  content: LessonContent | null;
  videos: LessonVideo[];
  materials: LessonMaterial[];
  spiralItems: {
    id: string;
    stem: string;
    choices: { id: string; text: string }[];
    rationale?: string;
    correctChoiceId?: string;
  }[];
  spiralExplanation: string[];
  exitItems: {
    id: string;
    stem: string;
    choices: { id: string; text: string }[];
    rationale?: string;
    correctChoiceId?: string;
  }[];
  assessment: string;
  status: string;
  attempts: number;
  recommendationSummaries: {
    skill: string;
    summary: string;
    minutes: number;
  }[];
};

function StageBody(props: StageBodyProps) {
  const { stage, content, videos, materials } = props;
  // Videos and materials the author attached but did not place on the canvas.
  const placedVideoIds = new Set(
    (content?.instruction ?? [])
      .filter((b) => b.kind === "video")
      .map((b) => (b.kind === "video" ? b.videoId : "")),
  );
  const unplacedVideos = videos.filter((v) => !placedVideoIds.has(v.id));
  const placedMaterialIds = new Set(
    (content?.instruction ?? [])
      .filter((b) => b.kind === "material")
      .map((b) => (b.kind === "material" ? b.materialId : "")),
  );
  const unplacedMaterials = materials.filter((m) => !placedMaterialIds.has(m.id));
  const title = LESSON_STAGES[stage - 1];

  const notAuthored = (
    <Empty>
      This part of the lesson has not been written yet.
    </Empty>
  );

  switch (stage) {
    case 1:
      return (
        <Card>
          <CardHeader
            title={`1. ${title}`}
            hint="A record you can print or keep in a workbook. Available from every lesson."
          />
          <div className="p-5">
            {content ? (
              <>
                <p className="text-sm text-ink-muted">
                  Set these headings up before you start. Filling them in as you go is
                  the evidence for this stage.
                </p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-ink">
                  {content.notesOutline.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
                <p className="mt-4 text-xs text-ink-muted">
                  Use your browser&rsquo;s print command to keep a paper copy. A
                  downloadable workbook file is not built yet.
                </p>
              </>
            ) : (
              notAuthored
            )}
          </div>
        </Card>
      );

    case 2:
      return (
        <Card className="border-recall-line">
          <div className="border-b border-recall-line bg-recall-surface px-5 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-recall">
              Memory work — bringing earlier learning back
            </p>
          </div>
          <CardHeader
            title={`2. ${title}`}
            hint="Five to seven items chosen for you by rule, not at random."
          />
          <div className="p-5">
            {props.spiralItems.length === 0 ? (
              <Empty>
                There is not enough recorded work yet to select review items for you.
              </Empty>
            ) : (
              <>
                <div className="mb-5 rounded-lg bg-surface-sunken px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Why these items
                  </p>
                  {props.spiralExplanation.map((line) => (
                    <p key={line} className="mt-1 text-sm text-ink">
                      {line}
                    </p>
                  ))}

                </div>
                <SpiralReviewRunner
                  items={props.spiralItems}
                  enrollmentId={props.enrollmentId}
                  lessonCode={props.lessonCode}
                  idempotencyKey={`spiral:${props.enrollmentId}:${props.lessonCode}`}
                />
              </>
            )}
          </div>
        </Card>
      );

    case 3:
      return (
        <Card>
          <CardHeader title={`3. ${title}`} hint="What the problem is and why it matters." />
          <div className="p-5">
            {content ? (
              <p className="max-w-2xl text-base text-ink">{content.relevance}</p>
            ) : (
              notAuthored
            )}
          </div>
        </Card>
      );

    case 4:
      return (
        <Card>
          <CardHeader
            title={`4. ${title}`}
            hint="What you will learn, and what acceptable evidence looks like."
          />
          <div className="p-5">
            {content ? (
              <>
                <p className="text-base font-semibold text-ink">{content.goal}</p>
                <h3 className="mt-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">
                  You will know you have it when
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-ink">
                  {content.successCriteria.map((c) => (
                    <li key={c} className="flex gap-2">
                      <span aria-hidden="true" className="text-positive">
                        &#10003;
                      </span>
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-lg bg-surface-sunken px-4 py-3 text-sm text-ink">
                  <span className="font-semibold">Evidence required: </span>
                  {props.assessment}
                </p>
              </>
            ) : (
              notAuthored
            )}
          </div>
        </Card>
      );

    case 5:
      return (
        <Card>
          <CardHeader
            title={`5. ${title}`}
            hint={
              videos.length > 0
                ? "Readable text, with every video's transcript beside it."
                : materials.length > 0
                  ? "Readable text, with everything this lesson asks you to open."
                  : "Readable text. This lesson has no video."
            }
          />
          <div className="p-5">
            {content ? (
              <>
                <LessonBlocks
                  blocks={content.instruction}
                  videos={videos}
                  materials={materials}
                />

                {/*
                  Anything the author attached but did not place on the canvas
                  still belongs on the page: a video or a worksheet a student
                  cannot reach is a lesson they were not given.
                */}
                {unplacedVideos.length > 0 ? (
                  <div className="mt-6 flex max-w-2xl flex-col gap-4">
                    {unplacedVideos.map((video) => (
                      <LessonVideoPlayer key={video.id} video={video} />
                    ))}
                  </div>
                ) : null}
                {unplacedMaterials.length > 0 ? (
                  <div className="mt-6 max-w-2xl">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                      What to open for this lesson
                    </h3>
                    <div className="mt-2">
                      <LessonMaterialList materials={unplacedMaterials} />
                    </div>
                  </div>
                ) : null}
                <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-ink-muted">
                  Vocabulary
                </h3>
                <dl className="mt-2 space-y-2">
                  {content.vocabulary.map((v) => (
                    <div key={v.term} className="text-sm">
                      <dt className="inline font-semibold text-ink">{v.term}: </dt>
                      <dd className="inline text-ink-muted">{v.meaning}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              notAuthored
            )}
          </div>
        </Card>
      );

    case 6:
      return (
        <Card>
          <CardHeader
            title={`6. ${title}`}
            hint="The reasoning, not only the answer."
          />
          <div className="p-5">
            {content ? (
              <ol className="space-y-4">
                {content.workedModel.map((step, i) => (
                  <li key={step.step} className="flex gap-4">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-surface text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-base text-ink">{step.step}</p>
                      <p className="mt-1 text-sm text-ink-muted">{step.reasoning}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              notAuthored
            )}
          </div>
        </Card>
      );

    case 7:
      return (
        <Card>
          <CardHeader title={`7. ${title}`} hint="Hints fade as you go." />
          <div className="p-5">
            {content ? (
              <ol className="space-y-4">
                {content.guidedPractice.map((g, i) => (
                  <li key={g.prompt}>
                    <p className="text-base text-ink">
                      <span className="font-semibold">{i + 1}. </span>
                      {g.prompt}
                    </p>
                    <details className="mt-1.5">
                      <summary
                        className={`inline-block cursor-pointer text-sm font-medium text-primary underline underline-offset-4 ${FOCUS_RING}`}
                      >
                        {i === 0 ? "Hint" : i === 1 ? "Smaller hint" : "Nudge"}
                      </summary>
                      <p className="mt-1.5 text-sm text-ink-muted">{g.hint}</p>
                    </details>
                    <details className="mt-1">
                      <summary
                        className={`inline-block cursor-pointer text-sm font-medium text-ink-muted underline underline-offset-4 ${FOCUS_RING}`}
                      >
                        Check my answer
                      </summary>
                      <p className="mt-1.5 text-sm text-ink">{g.answer}</p>
                    </details>
                  </li>
                ))}
              </ol>
            ) : (
              notAuthored
            )}
            <p className="mt-5 text-xs text-ink-muted">
              Guided practice here is self-checked and is not recorded as evidence.
              Only the Spiral Review and the Exit Ticket write to your record.
            </p>
          </div>
        </Card>
      );

    case 8:
      return (
        <Card>
          <CardHeader
            title={`8. ${title}`}
            hint="A task aligned to the governing skill and standard."
          />
          <div className="p-5">
            {content ? (
              <>
                <p className="max-w-2xl text-base text-ink">{content.independentTask}</p>
                <p className="mt-4 text-sm text-ink-muted">
                  Do this in your notes or workbook. Uploading work from the browser
                  is not built yet, so your teacher collects it directly.
                </p>
              </>
            ) : (
              notAuthored
            )}
          </div>
        </Card>
      );

    case 9:
      return (
        <Card>
          <CardHeader
            title={`9. ${title}`}
            hint="A short measure that decides the next step."
          />
          <div className="p-5">
            {props.exitItems.length === 0 ? (
              <Banner title="This Exit Ticket has not been written yet." tone="notice">
                There is nothing to turn in here yet. How a result is read is
                still shown below.
              </Banner>
            ) : props.status === "review_scheduled" ||
              props.status === "passed" ||
              props.status === "completed" ? (
              <Banner title="You already submitted this Exit Ticket." tone="positive">
                Your result is on stage 10, and the record is on your Grades page.
              </Banner>
            ) : (
              <>
                {props.attempts >= 1 ? (
                  <div className="mb-5">
                    <Banner title="This is your supported retry." tone="notice">
                      You have one retry after a result below 50%. If this one does not
                      get there either, it goes to your teacher rather than a third try.
                    </Banner>
                  </div>
                ) : null}
                <ExitTicketRunner
                  items={props.exitItems}
                  enrollmentId={props.enrollmentId}
                  lessonCode={props.lessonCode}
                  idempotencyKey={`exit:${props.enrollmentId}:${props.lessonCode}:${props.attempts}`}
                />
              </>
            )}

            <div className="mt-8">
              <SectionHeading hint="The same bands apply to every lesson, for everyone.">
                How the result is read
              </SectionHeading>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {EXIT_BANDS.map((band) => (
                  <li key={band.id} className="px-4 py-3">
                    <p className="text-sm font-semibold text-ink">{band.label}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">{band.studentMeaning}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      );

    case 10:
    default:
      return (
        <Card>
          <CardHeader
            title={`10. ${title}`}
            hint="Complete, spaced review, targeted support, a supported retry, or a teacher check."
          />
          <div className="p-5">
            {props.status === "review_scheduled" ? (
              <>
                <Banner title="You met the goal for this lesson." tone="positive">
                  It is scheduled to come back later so it stays fresh. Marking it
                  reviewed unlocks the next lesson on your pathway.
                </Banner>
                <div className="mt-4">
                  <CompleteLessonForm
                    enrollmentId={props.enrollmentId}
                    lessonCode={props.lessonCode}
                    idempotencyKey={`complete:${props.enrollmentId}:${props.lessonCode}`}
                  />
                </div>
              </>
            ) : props.status === "completed" ? (
              <Banner title="This lesson is complete, review included." tone="positive" />
            ) : (
              <Banner title="No decision has been recorded yet." tone="neutral">
                Submit the Exit Ticket on stage 9 and the next step appears here.
              </Banner>
            )}

            {props.recommendationSummaries.length > 0 ? (
              <div className="mt-6">
                <SectionHeading hint="Proposals only. Your teacher decides whether any of these are assigned.">
                  What your evidence suggests
                </SectionHeading>
                <ul className="flex flex-col gap-3">
                  {props.recommendationSummaries.map((r) => (
                    <li key={r.skill} className="rounded-lg border border-line px-4 py-3">
                      <p className="text-sm font-semibold text-ink">
                        {skillLabel(r.skill)}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-muted">{r.summary}</p>
                      <p className="mt-1.5 text-xs text-ink-muted">
                        A short piece of work, about {r.minutes} minutes, if your
                        teacher decides it would help.
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Card>
      );
  }
}
