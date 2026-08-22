import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { findLesson, getCourse } from "@/lib/curriculum/catalog";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  FactList,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { evidenceByIds } from "@/lib/evidence/ledger";
import { actionQueue } from "@/lib/intervention/queue";
import { entryById, MINUTES_CAVEAT } from "@/lib/intervention/library";
import { INTERVENTION_STATUS_PRESENTATION } from "@/lib/intervention/status";
import { CONFIDENCE_BANDS } from "@/lib/mastery/profile";
import { RULE_VERSIONS } from "@/lib/rules/versions";

import { DecideForm } from "./queue-forms";

export const metadata: Metadata = {
  title: "Action queue · Beyond.Ed",
  description: "Triage: what needs a decision, with the evidence behind it.",
};

const SEVERITY_PRESENTATION = {
  immediate: { label: "Immediate", tone: "attention" as const },
  teacher_review: { label: "Needs your judgment", tone: "attention" as const },
  targeted: { label: "Targeted", tone: "info" as const },
  // Amber: spaced review is retrieval practice, which is the memory role.
  spaced: { label: "Spaced review", tone: "attention" as const },
};

/**
 * Teacher action queue (blueprint §5).
 *
 * A triage workspace, not a dashboard. Each row carries the student, subject,
 * bounded skill, severity, confidence, triggering evidence, current lesson,
 * upcoming dependency, estimated time, and suggested return rule — everything
 * needed to decide without leaving the page.
 */
export default async function TeacherQueuePage() {
  const teacher = await requireUser();
  const d = db();
  const queue = actionQueue(teacher);

  const sections = d.sections.filter((s) => s.teacherId === teacher.id);
  const students = new Set(
    d.enrollments
      .filter((e) => sections.some((s) => s.id === e.sectionId))
      .map((e) => e.studentId),
  );
  const openPlans = d.interventions.filter(
    (i) =>
      students.has(i.studentId) &&
      i.status !== "closed" &&
      i.status !== "returned_to_pathway",
  );
  const escalated = openPlans.filter((i) => i.status === "escalated");
  const awaitingCheck = openPlans.filter((i) => i.status === "readiness_check");

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Action queue</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          {queue.length === 0
            ? "Nothing is waiting on a decision."
            : `${queue.length} item${queue.length === 1 ? "" : "s"} need a decision. Each one names the evidence that produced it.`}
        </p>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-2xl font-bold text-ink">{queue.length}</p>
          <p className="text-sm text-ink-muted">Recommendations awaiting a decision</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-ink">{escalated.length}</p>
          <p className="text-sm text-ink-muted">Escalated — the anti-loop rule sent these to you</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-ink">{awaitingCheck.length}</p>
          <p className="text-sm text-ink-muted">One short check from returning to the pathway</p>
        </Card>
      </div>

      <div className="mt-5">
        <Banner title="These are proposals, not actions." tone="info">
          Nothing below has been assigned. The engine is a pure function of stored
          evidence and rule version{" "}
          <span className="font-mono text-xs">{RULE_VERSIONS.recommend}</span> — same
          evidence, same list, every time. It creates nothing; you decide.
        </Banner>
      </div>

      <section aria-labelledby="queue" className="mt-8">
        <SectionHeading id="queue" hint="Most urgent first, then by ranking score.">
          Needs a decision
        </SectionHeading>

        {queue.length === 0 ? (
          <Empty>Nothing in the queue. Your students&rsquo; evidence does not warrant support right now.</Empty>
        ) : (
          <ul className="flex flex-col gap-5">
            {queue.map(({ recommendation: rec, student, courseTitle, unitName }) => {
              const severity = SEVERITY_PRESENTATION[rec.severity];
              const triggers = evidenceByIds(rec.triggerEvidenceIds);
              const entry = entryById(rec.interventionLessonId);
              const course = getCourse(courseTitle);
              const lesson = course ? findLesson(course, rec.currentLessonCode) : undefined;
              const openForStudent = d.interventions.filter(
                (i) =>
                  i.studentId === student.id &&
                  i.status !== "closed" &&
                  i.status !== "returned_to_pathway",
              );
              const openMinutes = openForStudent.reduce((n, i) => n + i.estimatedMinutes, 0);
              const salt = `${rec.enrollmentId}:${rec.skill}:${rec.trigger}`;

              return (
                <Card as="li" key={rec.id}>
                  <CardHeader
                    title={`${student.firstName} ${student.lastName} — ${rec.standard ?? rec.skill}`}
                    hint={`${courseTitle} · ${unitName}`}
                    action={<StatusChip label={severity.label} tone={severity.tone} />}
                  />

                  <div className="p-5">
                    <div className="rounded-lg bg-surface-sunken px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Trigger
                      </p>
                      <p className="mt-1 text-sm text-ink">{rec.triggerSummary}</p>
                      <p className="mt-1 font-mono text-xs text-ink-muted">
                        {rec.trigger.replace(/_/g, " ")}
                      </p>
                      {triggers.length > 0 ? (
                        <ScrollX>
                          <table className="mt-3 w-full min-w-[32rem] border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-line-strong text-left">
                                <th scope="col" className="py-1.5 pr-4 font-semibold text-ink">Evidence</th>
                                <th scope="col" className="py-1.5 pr-4 font-semibold text-ink">Lesson</th>
                                <th scope="col" className="py-1.5 pr-4 font-semibold text-ink">Item</th>
                                <th scope="col" className="py-1.5 pr-4 font-semibold text-ink">Result</th>
                                <th scope="col" className="py-1.5 font-semibold text-ink">Error</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                              {triggers.map((t) => (
                                <tr key={t.id}>
                                  <td className="py-1.5 pr-4 font-mono text-ink-muted">{t.id}</td>
                                  <td className="py-1.5 pr-4 font-mono text-ink">{t.lessonCode}</td>
                                  <td className="py-1.5 pr-4 font-mono text-ink-muted">{t.itemId}</td>
                                  <td className="py-1.5 pr-4">
                                    {t.correct ? (
                                      <span className="text-positive">Correct</span>
                                    ) : (
                                      <span className="text-urgent">
                                        Missed (attempt {t.attempt})
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-1.5 text-ink-muted">
                                    {t.errorCode ? t.errorCode.replace(/-/g, " ") : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </ScrollX>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <FactList
                        columns={3}
                        items={[
                          {
                            label: "Suggested support",
                            value: (
                              <>
                                <span className="font-mono text-xs">{rec.interventionLessonId}</span>
                                <span className="block">
                                  {entry?.target ?? rec.interventionTarget}
                                </span>
                              </>
                            ),
                          },
                          {
                            label: "Estimated time",
                            value: `About ${rec.estimatedMinutes} minutes`,
                          },
                          {
                            label: "Confidence in the estimate",
                            value: CONFIDENCE_BANDS[rec.confidence].label,
                          },
                          {
                            label: "Current lesson",
                            value: (
                              <>
                                <span className="font-mono text-xs">{rec.currentLessonCode}</span>
                                {lesson ? (
                                  <span className="block">{lesson.lesson.sequence}</span>
                                ) : null}
                              </>
                            ),
                          },
                          {
                            label: "Upcoming dependency",
                            value: rec.upcomingDependency ?? "None in the next five lessons",
                          },
                          {
                            label: "Return destination",
                            value: `${rec.returnLessonCode}, stage ${rec.returnStage}`,
                          },
                          { label: "Return rule", value: rec.returnRule },
                          {
                            label: "Rule versions",
                            value: (
                              <span className="font-mono text-xs">
                                {rec.ruleVersion} / {rec.returnRuleVersion}
                              </span>
                            ),
                          },
                          {
                            label: "Student's current load",
                            value: `${openForStudent.length} open plan${openForStudent.length === 1 ? "" : "s"}, about ${openMinutes} minutes`,
                          },
                        ]}
                      />
                    </div>

                    <details className="mt-4">
                      <summary
                        className={`inline-block cursor-pointer text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
                      >
                        How this ranked
                      </summary>
                      <ScrollX>
                        <table className="mt-2 w-full min-w-[36rem] border-collapse text-xs">
                          <tbody className="divide-y divide-line">
                            {Object.entries(rec.ranking).map(([key, value]) => (
                              <tr key={key}>
                                <th scope="row" className="py-1.5 pr-4 text-left font-medium text-ink">
                                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                                </th>
                                <td className="py-1.5 text-ink-muted">{value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </ScrollX>
                      <p className="mt-2 text-xs text-ink-muted">
                        Every input is stored with the recommendation. {MINUTES_CAVEAT}
                      </p>
                    </details>

                    <details className="mt-3">
                      <summary
                        className={`inline-block cursor-pointer text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
                      >
                        What {student.firstName} would see
                      </summary>
                      <div className="mt-2 rounded-lg border border-line bg-surface-sunken p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">
                          Start here
                        </p>
                        <p className="mt-1.5 text-base font-semibold text-ink">
                          Short support: {rec.standard ?? rec.skill}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          Your teacher picked this for you. Ready to start.
                        </p>
                        <p className="mt-2 text-sm text-ink">
                          <span className="font-semibold">Why this: </span>
                          {rec.triggerSummary}
                        </p>
                        <p className="mt-2 text-sm text-ink-muted">
                          You go back to {rec.returnLessonCode}, stage {rec.returnStage}. You
                          need {rec.returnRule}.
                        </p>
                      </div>
                    </details>

                    <div className="mt-5">
                      <DecideForm
                        refInput={{
                          enrollmentId: rec.enrollmentId,
                          skill: rec.skill,
                          trigger: rec.trigger,
                        }}
                        suggestedReason={rec.triggerSummary}
                        idempotencySalt={salt}
                      />
                    </div>

                    <p className="mt-4 text-sm">
                      <Link
                        href={`/teacher/students/${student.id}`}
                        className={`font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
                      >
                        Open {student.firstName}&rsquo;s full record
                      </Link>
                    </p>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      {openPlans.length > 0 ? (
        <section aria-labelledby="active" className="mt-10">
          <SectionHeading id="active" hint="Plans you have already assigned.">
            Active plans
          </SectionHeading>
          <Card>
            <ScrollX>
              <table className="w-full min-w-[46rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Skill</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Support</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Returns to</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {openPlans.map((plan) => {
                    const s = d.users.find((u) => u.id === plan.studentId);
                    const presentation = INTERVENTION_STATUS_PRESENTATION[plan.status];
                    const entry = entryById(plan.interventionLessonId);
                    return (
                      <tr key={plan.id}>
                        <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                          <Link
                            href={`/teacher/students/${plan.studentId}`}
                            className={`text-primary underline underline-offset-4 ${FOCUS_RING}`}
                          >
                            {s?.firstName} {s?.lastName}
                          </Link>
                        </th>
                        <td className="px-5 py-3 font-mono text-xs text-ink">
                          {plan.targetStandard ?? plan.targetSkill}
                        </td>
                        <td className="px-5 py-3 text-xs text-ink-muted">
                          <span className="font-mono">{plan.interventionLessonId}</span>
                          <span className="block">{entry?.target}</span>
                        </td>
                        <td className="px-5 py-3">
                          <StatusChip label={presentation.label} tone={presentation.tone} />
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-ink-muted">
                          {plan.returnLessonCode} / {plan.returnStage}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
