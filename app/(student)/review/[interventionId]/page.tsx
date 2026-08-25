import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  readinessItemsForStandard,
  transferItemForStandard,
} from "@/lib/curriculum/lesson-bank";
import { lessonContent } from "@/lib/db/demo-lesson-content";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  FactList,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { evidenceByIds } from "@/lib/evidence/ledger";
import { lessonLabel, skillLabel } from "@/lib/views/learning-focus";
import { entryById } from "@/lib/intervention/library";
import { INTERVENTION_STATUS_PRESENTATION } from "@/lib/intervention/status";
import { LessonBlocks } from "@/lib/design/lesson-blocks";
import { ANTI_LOOP_MAX_CYCLES } from "@/lib/rules/versions";

import { ReadinessRunner, StartSupportForm, TransferForm } from "./support-forms";

/**
 * The intervention player (blueprint §7).
 *
 * One non-negotiable objective: activate prior understanding, teach one
 * essential move, model the reasoning, practise with fading support, check
 * readiness independently, and finish with a grade-level transfer item. The
 * return destination is shown on every screen, because that is the point.
 */
export default async function SupportPage({
  params,
}: {
  params: Promise<{ interventionId: string }>;
}) {
  const { interventionId } = await params;
  const student = await requireUser();
  const d = db();

  const plan = d.interventions.find(
    (i) => i.id === interventionId && i.studentId === student.id,
  );
  if (!plan) notFound();

  const presentation = INTERVENTION_STATUS_PRESENTATION[plan.status];
  const entry = entryById(plan.interventionLessonId);
  const triggers = evidenceByIds(plan.triggerEvidenceIds);
  const standard = plan.targetStandard ?? plan.targetSkill;
  // Items resolve against the enrollment's own course version, so a support
  // plan runs on the curriculum that class is actually taking.
  const planEnrollment = d.enrollments.find((e) => e.id === plan.enrollmentId);
  const versionId = planEnrollment?.courseVersionId ?? null;
  const readiness = readinessItemsForStandard(standard, versionId);
  const transfer = transferItemForStandard(standard, versionId);
  // The model and practice come from the lesson that teaches this standard.
  const teaching = entry ? lessonContent(entry.linkedLessonCode) : undefined;

  const toRunner = (i: { id: string; stem: string; choices: { id: string; text: string }[]; rationale: string; correctChoiceId: string }) => ({
    id: i.id,
    stem: i.stem,
    choices: i.choices.map((c) => ({ id: c.id, text: c.text })),
    rationale: i.rationale,
    correctChoiceId: i.correctChoiceId,
  });

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/review" className={`underline underline-offset-4 hover:text-primary ${FOCUS_RING}`}>
          Review
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{entry?.target ?? "Extra help"}</span>
      </nav>

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip label={presentation.label} tone={presentation.tone} />
          <span className="text-xs text-ink-muted">
            About {plan.estimatedMinutes} minutes
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
          {entry?.target ?? "Extra help"}
        </h1>
        <p className="mt-1.5 text-base text-ink-muted">{presentation.studentMeaning}</p>
      </header>

      <div className="mt-5">
        <Card className="border-primary-line p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            When you finish, you go straight back here
          </p>
          <p className="mt-1.5 text-lg font-semibold text-ink">
            {lessonLabel(plan.returnLessonCode)}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            This pauses your grade-level lesson. It does not replace it, and you
            do not restart the unit.
          </p>
        </Card>
      </div>

      <div className="mt-5">
        <Card className="p-5">
          <FactList
            columns={2}
            items={[
              { label: "What this is about", value: skillLabel(plan.targetSkill) },
              {
                label: "What you need to show",
                value: `${plan.readinessMinPercent}% on a short check, plus ${plan.transferItemsRequired} question that uses it in your current work`,
              },
              {
                label: "Rounds so far",
                value: `${plan.cycles} of ${ANTI_LOOP_MAX_CYCLES} before your teacher picks it up`,
              },
            ]}
          />
          <div className="mt-4 rounded-lg bg-surface-sunken px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Why you have this
            </p>
            <p className="mt-1 text-sm text-ink">{plan.triggerSummary}</p>
            {triggers.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                {triggers.map((t) => (
                  <li key={t.id}>
                    {lessonLabel(t.lessonCode)}
                    {t.correct ? " — you got this one" : " — this one did not go through"}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Card>
      </div>

      {plan.status === "escalated" ? (
        <div className="mt-6">
          <Banner title="This is with your teacher now." tone="notice">
            After {ANTI_LOOP_MAX_CYCLES} rounds on the same skill, the rule sends
            this to a person rather than a third try on your own.
          </Banner>
        </div>
      ) : plan.status === "returned_to_pathway" || plan.status === "closed" ? (
        <div className="mt-6">
          <Banner title="Finished." tone="positive">
            You are back in{" "}
            {lessonLabel(plan.returnLessonCode)}.
          </Banner>
        </div>
      ) : readiness.length < 2 || !transfer ? (
        <div className="mt-6">
          <Banner title="This help has not been written yet." tone="notice">
            Why you have it and where you go back to are real. The activity
            itself does not exist yet, so there is nothing to work through here.
          </Banner>
        </div>
      ) : (
        <>
          {teaching ? (
            <div className="mt-6 flex flex-col gap-5">
              <Card>
                <CardHeader
                  title="The one move"
                  hint="A short support teaches one thing, not the whole lesson again."
                />
                <div className="p-5">
                  <p className="text-base font-semibold text-ink">{teaching.goal}</p>
                  <div className="mt-3">
                    <LessonBlocks blocks={teaching.instruction.slice(0, 2)} />
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Worked model" hint="The reasoning, step by step." />
                <div className="p-5">
                  <ol className="space-y-4">
                    {teaching.workedModel.map((step, i) => (
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
                </div>
              </Card>

              <Card>
                <CardHeader title="Guided practice" hint="Two examples, with support fading." />
                <div className="p-5">
                  <ol className="space-y-4">
                    {teaching.guidedPractice.slice(0, 2).map((g, i) => (
                      <li key={g.prompt}>
                        <p className="text-base text-ink">
                          <span className="font-semibold">{i + 1}. </span>
                          {g.prompt}
                        </p>
                        {i === 0 ? (
                          <p className="mt-1.5 text-sm text-ink-muted">{g.hint}</p>
                        ) : (
                          <details className="mt-1.5">
                            <summary
                              className={`inline-block cursor-pointer text-sm font-medium text-primary underline underline-offset-4 ${FOCUS_RING}`}
                            >
                              Nudge
                            </summary>
                            <p className="mt-1.5 text-sm text-ink-muted">{g.hint}</p>
                          </details>
                        )}
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
                </div>
              </Card>
            </div>
          ) : (
            <div className="mt-6">
              <Banner title="The teaching text for this support has not been authored." tone="notice">
                The readiness check and transfer item below are real and are scored
                against the return rule.
              </Banner>
            </div>
          )}

          {plan.status === "assigned" ? (
            <div className="mt-6">
              <Card className="border-primary-line p-5">
                <h2 className="text-lg font-semibold text-ink">Ready for the check</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Starting records that you began. The readiness check appears next.
                </p>
                <div className="mt-4">
                  <StartSupportForm
                    interventionId={plan.id}
                    idempotencyKey={`support-start:${plan.id}`}
                  />
                </div>
              </Card>
            </div>
          ) : null}

          {plan.status === "in_progress" ? (
            <div className="mt-6">
              <Card>
                <CardHeader
                  title="Readiness check"
                  hint={`On your own. You need ${plan.readinessMinPercent}% or better.`}
                />
                <div className="p-5">
                  <ReadinessRunner
                    items={readiness.map(toRunner)}
                    interventionId={plan.id}
                    idempotencyKey={`readiness:${plan.id}`}
                    cycle={plan.cycles}
                  />
                </div>
              </Card>
            </div>
          ) : null}

          {plan.status === "readiness_check" ? (
            <div className="mt-6">
              <Card>
                <CardHeader
                  title="Transfer item"
                  hint="One item that uses the skill in the work you are doing right now."
                />
                <div className="p-5">
                  <div className="mb-5">
                    <Banner
                      title={`Readiness check: ${plan.readinessPercent}%`}
                      tone={
                        (plan.readinessPercent ?? 0) >= plan.readinessMinPercent
                          ? "positive"
                          : "notice"
                      }
                    >
                      {(plan.readinessPercent ?? 0) >= plan.readinessMinPercent
                        ? `That clears the ${plan.readinessMinPercent}% mark. One more question and you are back in your lesson.`
                        : `Under the ${plan.readinessMinPercent}% mark. Do the next question anyway — both count, and your teacher sees both.`}
                    </Banner>
                  </div>
                  <TransferForm
                    item={toRunner(transfer)}
                    interventionId={plan.id}
                    idempotencyKey={`transfer:${plan.id}`}
                    cycle={plan.cycles}
                  />
                </div>
              </Card>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
