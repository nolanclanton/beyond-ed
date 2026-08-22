import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { courseLessons, getCourse } from "@/lib/curriculum/catalog";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  MetricTile,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { periodLabel } from "@/lib/calendar/periods";
import { siteRollup } from "@/lib/views/metrics";
import { FOCUS_RING } from "@/lib/design/tokens";
import { actionQueue } from "@/lib/intervention/queue";
import { INTERVENTION_STATUS_PRESENTATION } from "@/lib/intervention/status";
import { ENROLLMENT_STATUS_PRESENTATION } from "@/lib/enrollment/status";

export const metadata: Metadata = {
  title: "Site overview · Beyond.Ed",
  description: "Enrollment, staffing, loads, interventions, escalations, and data quality.",
};

/**
 * Site administration (blueprint §6).
 *
 * Operational health and academic support without replacing teacher
 * instructional judgment. Everything here is scoped to one site.
 */
export default async function SitePage() {
  const admin = await requireUser();
  const d = db();

  const site = d.sites.find((s) => s.id === admin.siteId);
  const sections = d.sections.filter((s) => s.siteId === admin.siteId);
  const students = d.users.filter(
    (u) => u.role === "student" && u.siteId === admin.siteId,
  );
  const teachers = d.users.filter(
    (u) => u.role === "teacher" && u.siteId === admin.siteId,
  );
  const enrollments = d.enrollments.filter((e) =>
    sections.some((s) => s.id === e.sectionId),
  );
  const studentIds = new Set(students.map((s) => s.id));
  const plans = d.interventions.filter((i) => studentIds.has(i.studentId));
  const escalations = plans.filter((i) => i.status === "escalated");
  const queue = actionQueue(admin);
  const rollup = siteRollup(admin.siteId ?? "");
  const anySection = sections[0];

  // Data quality: facts that would break a calculation if left alone.
  const unassigned = students.filter(
    (s) => !enrollments.some((e) => e.studentId === s.id),
  );
  const sectionsWithoutTeacher = sections.filter(
    (s) => !d.users.some((u) => u.id === s.teacherId),
  );
  const enrollmentsWithoutVersion = enrollments.filter(
    (e) => !d.courseVersions.some((v) => v.id === e.courseVersionId),
  );
  const shortPlacements = students.filter((s) => {
    const count = enrollments.filter((e) => e.studentId === s.id).length;
    return count > 0 && count < 4;
  });

  // Load is counted against the teacher's OWN sections, not against every
  // student they happen to share with a colleague. A mathematics teacher's
  // queue is their mathematics items.
  const sectionOfEnrollment = new Map(enrollments.map((e) => [e.id, e.sectionId]));
  const teacherLoads = teachers.map((t) => {
    const mine = new Set(sections.filter((s) => s.teacherId === t.id).map((s) => s.id));
    const roster = enrollments.filter((e) => mine.has(e.sectionId));
    const rosterStudents = new Set(roster.map((e) => e.studentId));
    return {
      teacher: t,
      sections: mine.size,
      students: rosterStudents.size,
      openPlans: plans.filter(
        (p) =>
          mine.has(sectionOfEnrollment.get(p.enrollmentId) ?? "") &&
          p.status !== "closed" &&
          p.status !== "returned_to_pathway",
      ).length,
      queue: queue.filter((q) =>
        mine.has(sectionOfEnrollment.get(q.recommendation.enrollmentId) ?? ""),
      ).length,
    };
  });

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">{site?.name}</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Grades 6&ndash;12 enrollment, staffing, course availability, teacher
          loads, active support, escalations, and data quality.
        </p>
      </header>

      {anySection ? (
        <p className="mt-1.5 text-sm text-ink-muted">
          {periodLabel(anySection.cycle, anySection.dayInCycle)}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          value={`${rollup.students}`}
          label="Students"
          caption={`Assigned to ${site?.shortName ?? "this site"}`}
        />
        <MetricTile
          value={`${rollup.teachers}`}
          label="Teachers"
          caption="Active staff accounts"
        />
        <MetricTile
          value={`${rollup.enrollments}`}
          label="Course enrollments"
          caption={`Across ${sections.length} roster sections`}
        />
        <MetricTile
          value={
            rollup.performancePercent === null ? "—" : `${rollup.performancePercent}%`
          }
          label="Average performance"
          caption="Current learning period"
          tone="info"
        />
      </div>

      <section aria-labelledby="manage" className="mt-8">
        <SectionHeading id="manage" hint="Everything this site controls.">
          Manage this site
        </SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-5">
            <p className="text-sm font-semibold text-ink">Students</p>
            <p className="mt-1 text-sm text-ink-muted">
              Every student assigned to {site?.shortName}, with pace,
              performance, and placement.
            </p>
            <p className="mt-3">
              <Link
                href="/site/students"
                className={`text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
              >
                Open students
              </Link>
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-ink">Teacher assignments</p>
            <p className="mt-1 text-sm text-ink-muted">
              Which teacher owns each roster section, and the load that carries.
            </p>
            <p className="mt-3">
              <Link
                href="/site/assignments"
                className={`text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
              >
                Open assignments
              </Link>
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-ink">Unresolved queue items</p>
            <p className="mt-1 text-sm text-ink-muted">
              Recommendations a teacher has not acted on. You can assign an
              approved support with a recorded reason.
            </p>
            <p className="mt-3">
              <Link
                href="/site/queue"
                className={`text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
              >
                Open queue ({queue.length})
              </Link>
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-ink">Site snapshot</p>
            <p className="mt-1 text-sm text-ink-muted">Current learning period.</p>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-ink-muted">Completion</dt>
                <dd className="text-xl font-bold text-ink">
                  {rollup.completionPercent === null ? "—" : `${rollup.completionPercent}%`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Performance</dt>
                <dd className="text-xl font-bold text-ink">
                  {rollup.performancePercent === null ? "—" : `${rollup.performancePercent}%`}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </section>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <MetricTile
          value={`${plans.filter((p) => p.status !== "closed" && p.status !== "returned_to_pathway").length}`}
          label="Open support plans"
          caption="Across this site"
        />
        <MetricTile
          value={`${escalations.length}`}
          label="Escalations"
          caption="Routed to a person by the anti-loop rule"
          tone={escalations.length > 0 ? "attention" : "neutral"}
        />
        <MetricTile
          value={`${queue.length}`}
          label="Unresolved recommendations"
          caption="Awaiting a teacher decision"
        />
      </div>

      <section aria-labelledby="quality" className="mt-10">
        <SectionHeading
          id="quality"
          hint="Facts that would quietly break a calculation if they were left alone."
        >
          Data quality
        </SectionHeading>
        <div className="flex flex-col gap-3">
          {unassigned.length === 0 &&
          sectionsWithoutTeacher.length === 0 &&
          enrollmentsWithoutVersion.length === 0 &&
          shortPlacements.length === 0 ? (
            <Banner title="No data-quality warnings." tone="positive">
              Every student has a placement, every section has a teacher, and every
              enrollment references an approved course version.
            </Banner>
          ) : (
            <>
              {unassigned.length > 0 ? (
                <Banner title={`${unassigned.length} student(s) have no course placement.`} tone="urgent">
                  {unassigned.map((s) => `${s.firstName} ${s.lastName}`).join(", ")}
                </Banner>
              ) : null}
              {sectionsWithoutTeacher.length > 0 ? (
                <Banner title={`${sectionsWithoutTeacher.length} section(s) have no assigned teacher.`} tone="urgent">
                  {sectionsWithoutTeacher.map((s) => s.courseTitle).join(", ")}
                </Banner>
              ) : null}
              {enrollmentsWithoutVersion.length > 0 ? (
                <Banner title={`${enrollmentsWithoutVersion.length} enrollment(s) reference a missing course version.`} tone="urgent">
                  A roster section must reference exactly one approved course version.
                </Banner>
              ) : null}
              {shortPlacements.length > 0 ? (
                <Banner title={`${shortPlacements.length} student(s) are placed in fewer than four core courses.`} tone="notice">
                  {shortPlacements.map((s) => `${s.firstName} ${s.lastName}`).join(", ")}. Placement
                  is policy-driven and is set by authorized staff — the platform does
                  not infer it.
                </Banner>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="loads" className="mt-10">
        <SectionHeading id="loads" hint="Before adding work, see who is already carrying it.">
          Teacher loads
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Teacher</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Sections</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Students</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">
                    Open plans in their sections
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">
                    Queue items in their sections
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {teacherLoads.map((l) => (
                  <tr key={l.teacher.id}>
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                      {l.teacher.firstName} {l.teacher.lastName}
                      {l.teacher.curriculumAuthor ? (
                        <span className="ml-2 text-xs font-normal text-ink-muted">
                          · also a curriculum author
                        </span>
                      ) : null}
                    </th>
                    <td className="px-5 py-2.5 text-ink-muted">{l.sections}</td>
                    <td className="px-5 py-2.5 text-ink-muted">{l.students}</td>
                    <td className="px-5 py-2.5 text-ink-muted">{l.openPlans}</td>
                    <td className="px-5 py-2.5 text-ink-muted">{l.queue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="escalations" className="mt-10">
        <SectionHeading
          id="escalations"
          hint="The anti-loop rule sent these to a person after two unsuccessful cycles."
        >
          Escalations
        </SectionHeading>
        {escalations.length === 0 ? (
          <Empty>No escalations at this site.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {escalations.map((plan) => {
              const s = d.users.find((u) => u.id === plan.studentId);
              const presentation = INTERVENTION_STATUS_PRESENTATION[plan.status];
              return (
                <Card as="li" key={plan.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip label={presentation.label} tone={presentation.tone} />
                    <span className="text-sm font-semibold text-ink">
                      {s?.firstName} {s?.lastName}
                    </span>
                    <span className="font-mono text-xs text-ink-muted">
                      {plan.targetStandard ?? plan.targetSkill}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">{plan.triggerSummary}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {plan.cycles} cycles &middot; last readiness {plan.readinessPercent ?? "—"}%
                  </p>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="enrollment" className="mt-10">
        <SectionHeading id="enrollment" hint="Placement is set by authorized staff, never inferred from age.">
          Enrollment and placement
        </SectionHeading>
        <Card>
          <CardHeader
            title="Students"
            hint={`${students.length} at this site · ${enrollments.length} enrollments`}
          />
          <ScrollX>
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Grade</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Courses</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Pathway days done</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {students.map((s) => {
                  const mine = enrollments.filter((e) => e.studentId === s.id);
                  const days = mine.reduce((n, e) => {
                    const course = getCourse(e.courseTitle);
                    if (!course) return n;
                    const done = new Set(
                      d.lessonStates
                        .filter((x) => x.enrollmentId === e.id && x.status === "completed")
                        .map((x) => x.lessonCode),
                    );
                    return (
                      n +
                      courseLessons(course)
                        .filter((l) => done.has(l.code))
                        .reduce((m, l) => m + l.days, 0)
                    );
                  }, 0);
                  const status = mine[0]?.status ?? "pending";
                  const transferred = mine.some((e) => e.transferredFromEnrollmentId);
                  return (
                    <tr key={s.id}>
                      <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                        <Link
                          href={`/site/queue`}
                          className={`text-primary underline underline-offset-4 ${FOCUS_RING}`}
                        >
                          {s.firstName} {s.lastName}
                        </Link>
                        {transferred ? (
                          <span className="ml-2 text-xs font-normal text-ink-muted">
                            · transferred in, history preserved
                          </span>
                        ) : null}
                      </th>
                      <td className="px-5 py-2.5 text-ink-muted">{s.gradeLevel}</td>
                      <td className="px-5 py-2.5 text-ink-muted">{mine.length}</td>
                      <td className="px-5 py-2.5 text-ink-muted">{days}</td>
                      <td className="px-5 py-2.5">
                        <StatusChip
                          label={ENROLLMENT_STATUS_PRESENTATION[status].label}
                          tone={ENROLLMENT_STATUS_PRESENTATION[status].tone}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>
    </div>
  );
}
