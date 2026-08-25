import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { courseLessons, getCourse } from "@/lib/curriculum/catalog";
import { db, lessonStatesFor } from "@/lib/db/store";
import {
  Banner,
  Card,
  Empty,
  ScrollX,
  SectionHeading,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { currentEvidence } from "@/lib/evidence/ledger";
import { courseGrade } from "@/lib/grades/gradebook";
import { skillProfile } from "@/lib/mastery/profile";
import { recommendationsForStudent } from "@/lib/intervention/queue";

export const metadata: Metadata = {
  title: "Reports · Beyond.Ed",
  description: "Pace, performance, mastery, engagement, and intervention load — kept separate.",
};

/**
 * Teacher reports (blueprint §5).
 *
 * Pace, performance, mastery, engagement, intervention load, and missing
 * evidence are SEPARATE measures. They are presented in separate tables with
 * separate headings and are never combined into one score — in particular,
 * grade and mastery never appear in the same column (CLAUDE.md §4).
 */
export default async function ReportsPage() {
  const teacher = await requireUser();
  const d = db();

  const sections = d.sections.filter((s) => s.teacherId === teacher.id);
  const rows = sections.flatMap((section) => {
    const course = getCourse(section.courseTitle);
    const lessons = course ? courseLessons(course) : [];
    return d.enrollments
      .filter((e) => e.sectionId === section.id)
      .map((e) => {
        const student = d.users.find((u) => u.id === e.studentId);
        const states = lessonStatesFor(e.id);
        const doneCodes = new Set(
          states.filter((s) => s.status === "completed").map((s) => s.lessonCode),
        );
        const days = lessons.filter((l) => doneCodes.has(l.code)).length;
        const evidence = currentEvidence({ enrollmentId: e.id });
        const plans = d.interventions.filter(
          (i) =>
            i.enrollmentId === e.id &&
            i.status !== "closed" &&
            i.status !== "returned_to_pathway",
        );
        return {
          enrollment: e,
          section,
          student,
          courseTitle: e.courseTitle,
          pathwayDays: course?.pathwayDays ?? 135,
          daysDone: days,
          grade: courseGrade(e.id, e.courseTitle),
          evidenceCount: evidence.length,
          minutes: Math.round(evidence.reduce((n, r) => n + r.meaningfulMinutes, 0)),
          openPlans: plans.length,
          openMinutes: plans.reduce((n, p) => n + p.estimatedMinutes, 0),
        };
      });
  });

  const studentIds = [...new Set(rows.map((r) => r.enrollment.studentId))];

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Reports</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Pace, official performance, readiness, engagement, and intervention load
          for your {sections.length} roster section{sections.length === 1 ? "" : "s"}.
        </p>
      </header>

      <div className="mt-5">
        <Banner title="These are separate measures and stay separate." tone="info">
          Pace is not performance. Official grades are not readiness. Engagement is
          not either of them. Nothing on this page is combined into a single score,
          and no table puts a grade and a readiness estimate in the same row as
          though they measured the same thing.
        </Banner>
      </div>

      <section aria-labelledby="pace" className="mt-8">
        <SectionHeading id="pace" hint="Pathway days completed against the 135-day budget.">
          Pace
        </SectionHeading>
        {rows.length === 0 ? (
          <Empty>No roster sections assigned.</Empty>
        ) : (
          <Card>
            <ScrollX>
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Course</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Pathway days</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Section cycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.enrollment.id}>
                      <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                        <Link
                          href={`/teacher/students/${r.enrollment.studentId}`}
                          className={`text-primary underline underline-offset-4 ${FOCUS_RING}`}
                        >
                          {r.student?.firstName} {r.student?.lastName}
                        </Link>
                      </th>
                      <td className="px-5 py-2.5 text-xs text-ink-muted">{r.courseTitle}</td>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {r.daysDone} of {r.pathwayDays}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-ink-muted">
                        Cycle {r.section.cycle}, day {r.section.dayInCycle}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        )}
      </section>

      <section aria-labelledby="performance" className="mt-10">
        <SectionHeading id="performance" hint="Official gradebook results only.">
          Performance
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Course</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Official grade</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Rule version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.enrollment.id}>
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                      {r.student?.firstName} {r.student?.lastName}
                    </th>
                    <td className="px-5 py-2.5 text-xs text-ink-muted">{r.courseTitle}</td>
                    <td className="px-5 py-2.5 text-ink">
                      {r.grade.percent === null ? "—" : `${r.grade.percent}% ${r.grade.letter}`}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-xs text-ink-muted">
                      {r.grade.ruleVersion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="mastery" className="mt-10">
        <SectionHeading
          id="mastery"
          hint="Readiness, counted by band. Skills with insufficient evidence are counted separately, not folded in."
        >
          Readiness
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Needs support</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Developing</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Secure or strong</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Not enough evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {studentIds.map((id) => {
                  const student = d.users.find((u) => u.id === id);
                  const profile = skillProfile(id);
                  const enough = profile.filter((m) => m.confidence !== "insufficient");
                  return (
                    <tr key={id}>
                      <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                        {student?.firstName} {student?.lastName}
                      </th>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {enough.filter((m) => m.band === "needs_support").length}
                      </td>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {enough.filter((m) => m.band === "developing").length}
                      </td>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {enough.filter((m) => m.band === "secure" || m.band === "strong").length}
                      </td>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {profile.filter((m) => m.confidence === "insufficient").length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="engagement" className="mt-10">
        <SectionHeading
          id="engagement"
          hint="Meaningful activity only — time responds to substantive interaction, not page-open time."
        >
          Engagement
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Course</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Responses</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Meaningful minutes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.enrollment.id}>
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                      {r.student?.firstName} {r.student?.lastName}
                    </th>
                    <td className="px-5 py-2.5 text-xs text-ink-muted">{r.courseTitle}</td>
                    <td className="px-5 py-2.5 text-ink-muted">{r.evidenceCount}</td>
                    <td className="px-5 py-2.5 text-ink-muted">{r.minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="load" className="mt-10">
        <SectionHeading
          id="load"
          hint="Open plans and their estimated time, so you can see collisions before assigning more."
        >
          Intervention load
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Open plans</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Estimated minutes</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Recommendations waiting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {studentIds.map((id) => {
                  const student = d.users.find((u) => u.id === id);
                  const mine = rows.filter((r) => r.enrollment.studentId === id);
                  return (
                    <tr key={id}>
                      <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                        {student?.firstName} {student?.lastName}
                      </th>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {mine.reduce((n, r) => n + r.openPlans, 0)}
                      </td>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {mine.reduce((n, r) => n + r.openMinutes, 0)}
                      </td>
                      <td className="px-5 py-2.5 text-ink-muted">
                        {recommendationsForStudent(id).length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="integrity" className="mt-10">
        <SectionHeading
          id="integrity"
          hint="Responses submitted with under a minute of meaningful activity and no hints."
        >
          Integrity review
        </SectionHeading>
        <Card className="p-5">
          <p className="text-sm text-ink-muted">
            Unusually rapid completion is a recommendation trigger, not an
            accusation. When the pattern appears, it routes to you as a
            &ldquo;needs your judgment&rdquo; item on the action queue rather than
            producing an automatic support assignment.
          </p>
        </Card>
      </section>
    </div>
  );
}
