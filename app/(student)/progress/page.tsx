import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/clock";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  MetricTile,
  ScrollX,
  SectionHeading,
  StatusChip,
  UnitProgressRow,
} from "@/lib/design/primitives";
import { SUBJECTS } from "@/lib/curriculum/catalog";
import { studentMetrics } from "@/lib/views/metrics";
import { unitProgress } from "@/lib/views/pathway";
import { FOCUS_RING } from "@/lib/design/tokens";
import {
  CONFIDENCE_BANDS,
  READINESS_BANDS,
  skillProfile,
} from "@/lib/mastery/profile";
import { coursesFor, evidenceFor } from "@/lib/views/student";
import { focusForSkill, lessonLabel, skillLabel } from "@/lib/views/learning-focus";
import { interventionsForStudent } from "@/lib/intervention/lifecycle";
import { INTERVENTION_STATUS_PRESENTATION } from "@/lib/intervention/status";

export const metadata: Metadata = {
  title: "Progress · Beyond.Ed",
  description: "Pathway, skills, evidence, pace, and review history.",
};

/**
 * Progress (blueprint §4).
 *
 * Pathway, skill, evidence, and review history are SEPARATE views. This page
 * shows readiness, never a grade — no number here is a grade, and the page says
 * so in words (CLAUDE.md §4).
 */
export default async function ProgressPage() {
  const student = await requireUser();
  const courses = coursesFor(student);
  const profile = skillProfile(student.id);
  const evidence = evidenceFor(student, 25);
  const plans = interventionsForStudent(student.id);
  const metrics = studentMetrics(student);

  /**
   * Six subject areas are shown, not four. Foreign language and physical
   * education are part of a full schedule, and saying "not in the catalog yet"
   * is more useful than pretending the schedule is only four subjects
   * (CLAUDE.md §14 — name what is missing rather than inventing it).
   */
  const OFFERED = new Set<string>(SUBJECTS);
  const ALL_SUBJECTS = [...SUBJECTS, "Foreign language", "Physical education"];

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Progress</h1>
        <p className="mt-2 max-w-2xl text-base text-ink-muted">
          How far you have moved through each course, and how ready each skill is.
        </p>
      </header>

      <div className="mt-5">
        <Banner title="Nothing on this page is a grade." tone="info">
          Readiness estimates say what you are likely able to do on your own, and
          they decide what comes back for review. Your official results are on the{" "}
          <Link href="/grades" className={`font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}>
            Grades
          </Link>{" "}
          page. The two are kept separate on purpose and are never combined.
        </Banner>
      </div>

      <section aria-labelledby="snapshot" className="mt-8">
        <SectionHeading id="snapshot" hint="Two different measures, reported separately.">
          Where you stand
        </SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            value={metrics.performancePercent === null ? "—" : `${metrics.performancePercent}%`}
            label="Overall grade"
            caption="Official results"
            tone="info"
          />
          <MetricTile
            value={metrics.completionPercent === null ? "—" : `${metrics.completionPercent}%`}
            label="Work completed"
            caption="Of the lessons you have reached"
          />
          <MetricTile
            value={`${metrics.courses.reduce((n, c) => n + c.pathwayDaysComplete, 0)}`}
            label="Pathway days done"
            caption={`Of ${metrics.courses.reduce((n, c) => n + c.pathwayDaysTotal, 0)} across your courses`}
          />
          <MetricTile
            value={`${metrics.activeMinutes}`}
            label="Active minutes"
            caption="Meaningful work only"
          />
        </div>
      </section>

      <section aria-labelledby="subjects" className="mt-10">
        <SectionHeading id="subjects" hint="What you are taking this year.">
          Subjects
        </SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_SUBJECTS.map((subject) => {
            const mine = courses.filter((c) => c.course.subject === subject);
            const offered = OFFERED.has(subject);
            return (
              <Card key={subject} className="p-4">
                <p className="text-sm font-semibold text-ink">{subject}</p>
                {!offered ? (
                  <p className="mt-1 text-xs text-ink-muted">
                    Not one of your courses here yet. Right now Beyond.Ed covers
                    maths, English, science, and social science.
                  </p>
                ) : mine.length === 0 ? (
                  <p className="mt-1 text-xs text-ink-muted">No course placed.</p>
                ) : (
                  mine.map((c) => (
                    <p key={c.enrollment.id} className="mt-1 text-sm text-ink-muted">
                      <Link
                        href={`/learn/${c.enrollment.id}`}
                        className={`font-medium text-primary underline underline-offset-4 ${FOCUS_RING}`}
                      >
                        {c.course.title}
                      </Link>
                      <span className="block text-xs">
                        {c.daysCompleted} of {c.daysTotal} class days
                      </span>
                    </p>
                  ))
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="pathway" className="mt-10">
        <SectionHeading
          id="pathway"
          hint="Every unit in every course, and roughly when you will work on it."
        >
          Course progress map
        </SectionHeading>
        <div className="flex flex-col gap-4">
          {courses.map((progress) => {
            const units = unitProgress(progress.enrollment);
            const done = units.filter((u) => u.state === "complete").length;
            return (
              <Card key={progress.enrollment.id}>
                <CardHeader
                  title={progress.course.title}
                  hint={`${done} of ${units.length} units complete · ${progress.daysCompleted} of ${progress.daysTotal} class days`}
                  action={
                    progress.current ? (
                      <Link
                        href={progress.current.href}
                        className={`text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
                      >
                        Continue current lesson
                      </Link>
                    ) : undefined
                  }
                />
                <ul className="divide-y divide-line">
                  {units.map((u) => (
                    <UnitProgressRow
                      key={u.unit.id}
                      label={`Unit ${u.unit.order}. ${u.unit.title}`}
                      detail={`${u.month} · ${u.daysTotal} days · ${u.lessonsComplete} of ${u.lessonsTotal} lessons`}
                      percent={u.percent}
                      state={u.state}
                    />
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="skills" className="mt-10">
        <SectionHeading
          id="skills"
          hint="How ready each one feels, and how sure we are about that."
        >
          What you are learning
        </SectionHeading>
        {profile.length === 0 ? (
          <Empty>No recorded work yet.</Empty>
        ) : (
          <Card>
            <ScrollX>
              <table className="w-full min-w-[46rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">What you are learning</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Readiness</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">How sure we are</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Based on</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {profile.map((m) => {
                    const insufficient = m.confidence === "insufficient";
                    return (
                      <tr key={m.skill}>
                        <th scope="row" className="px-5 py-3 text-left">
                          <span className="text-sm font-semibold text-ink">
                            {skillLabel(m.skill)}
                          </span>
                          <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                            {focusForSkill(m.skill)?.courseTitle}
                          </span>
                        </th>
                        <td className="px-5 py-3">
                          {insufficient ? (
                            <span className="text-ink-muted">Not enough evidence yet</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <StatusChip
                                label={READINESS_BANDS[m.band].label}
                                tone={
                                  m.band === "strong" || m.band === "secure"
                                    ? "positive"
                                    : m.band === "developing"
                                      ? "attention"
                                      : "neutral"
                                }
                              />
                              <span className="text-xs text-ink-muted">
                                {READINESS_BANDS[m.band].studentMeaning}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-medium text-ink">
                            {CONFIDENCE_BANDS[m.confidence].label}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-muted">
                            {m.confidenceReason}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-ink-muted">
                          {m.inputs.attempts} attempt{m.inputs.attempts === 1 ? "" : "s"} ·{" "}
                          {m.inputs.distinctSources.length} kind
                          {m.inputs.distinctSources.length === 1 ? "" : "s"} of work
                          {m.inputs.transferAttempts > 0
                            ? ` · ${m.inputs.transferAttempts} transfer`
                            : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        )}
      </section>

      <section aria-labelledby="review-history" className="mt-10">
        <SectionHeading id="review-history" hint="Every support you have had, and how it ended.">
          Review history
        </SectionHeading>
        {plans.length === 0 ? (
          <Empty>You have not had any assigned support.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {plans.map((plan) => {
              const presentation = INTERVENTION_STATUS_PRESENTATION[plan.status];
              return (
                <Card as="li" key={plan.id} className="p-5">
                  <StatusChip label={presentation.label} tone={presentation.tone} />
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {skillLabel(plan.targetSkill)}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{presentation.studentMeaning}</p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Needed {plan.readinessMinPercent}% on a short check plus{" "}
                    {plan.transferItemsRequired} follow-up question
                    {plan.readinessPercent !== null
                      ? ` · you scored ${plan.readinessPercent}%`
                      : ""}
                    {plan.transferPassed !== null
                      ? ` · the follow-up ${plan.transferPassed ? "went through" : "did not go through"}`
                      : ""}
                  </p>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="evidence" className="mt-10">
        <SectionHeading
          id="evidence"
          hint="Your most recent work. Nothing here is ever changed or removed — if something needs correcting, the correction is added alongside it."
        >
          Evidence
        </SectionHeading>
        <Card>
          <CardHeader title="Recent work" hint={`${evidence.length} most recent responses`} />
          <ScrollX>
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">When</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Lesson</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Kind</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {evidence.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-5 py-2.5 text-xs text-ink-muted">
                      {formatDateTime(row.recordedAt)}
                    </td>
                    <td className="px-5 py-2.5 text-xs text-ink">
                      {lessonLabel(row.lessonCode)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-xs text-ink-muted">
                      {row.source.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-2.5 text-xs">
                      {row.correct === null ? (
                        <span className="text-ink-muted">Not scored</span>
                      ) : row.correct ? (
                        <span className="font-medium text-positive">Correct</span>
                      ) : (
                        <span className="font-medium text-urgent">
                          Missed
                          {row.errorCode ? ` — ${row.errorCode.replace(/-/g, " ")}` : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>
    </div>
  );
}
