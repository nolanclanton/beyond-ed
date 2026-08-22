import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { getCourse } from "@/lib/curriculum/catalog";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  MetricTile,
  ScrollX,
  SectionHeading,
} from "@/lib/design/primitives";
import { actionQueue } from "@/lib/intervention/queue";

export const metadata: Metadata = {
  title: "Teacher assignments · Beyond.Ed",
  description: "Which teacher owns each roster section, and the load that carries.",
};

/**
 * Teacher assignments (blueprint §6 — teacher assignment and capacity checks).
 *
 * Read-only. Reassigning a section moves students between teachers and changes
 * who can see whose records, so it is a consequential write that needs a
 * confirmation step, an audit event, and a re-check of every scope involved.
 * Until that exists, this page reports rather than pretending to act
 * (CLAUDE.md §12 — no dead controls).
 */
export default async function AssignmentsPage() {
  const admin = await requireUser();
  const d = db();

  const site = d.sites.find((s) => s.id === admin.siteId);
  const sections = d.sections.filter((s) => s.siteId === admin.siteId);
  const teachers = d.users.filter(
    (u) => u.role === "teacher" && u.siteId === admin.siteId,
  );
  const queue = actionQueue(admin);
  const sectionOfEnrollment = new Map(d.enrollments.map((e) => [e.id, e.sectionId]));

  const rows = sections
    .map((section) => {
      const teacher = d.users.find((u) => u.id === section.teacherId);
      const enrollments = d.enrollments.filter((e) => e.sectionId === section.id);
      const course = getCourse(section.courseTitle);
      const openPlans = d.interventions.filter(
        (i) =>
          sectionOfEnrollment.get(i.enrollmentId) === section.id &&
          i.status !== "closed" &&
          i.status !== "returned_to_pathway",
      ).length;
      return {
        section,
        teacher,
        course,
        students: enrollments.length,
        openPlans,
        queueItems: queue.filter(
          (q) => sectionOfEnrollment.get(q.recommendation.enrollmentId) === section.id,
        ).length,
      };
    })
    .sort(
      (a, b) =>
        (a.course?.subject ?? "").localeCompare(b.course?.subject ?? "") ||
        a.section.courseTitle.localeCompare(b.section.courseTitle),
    );

  const loads = teachers
    .map((teacher) => {
      const mine = rows.filter((r) => r.section.teacherId === teacher.id);
      return {
        teacher,
        sections: mine.length,
        students: mine.reduce((n, r) => n + r.students, 0),
        openPlans: mine.reduce((n, r) => n + r.openPlans, 0),
        queueItems: mine.reduce((n, r) => n + r.queueItems, 0),
      };
    })
    .sort((a, b) => b.students - a.students);

  const unassigned = rows.filter((r) => !r.teacher).length;

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Teacher assignments</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Which teacher owns each roster section at {site?.shortName}, and the
          load that carries.
        </p>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile value={`${teachers.length}`} label="Teachers" caption="Active staff" />
        <MetricTile value={`${sections.length}`} label="Roster sections" caption="One per course" />
        <MetricTile
          value={`${Math.round(rows.reduce((n, r) => n + r.students, 0) / Math.max(1, teachers.length))}`}
          label="Median load"
          caption="Enrollments per teacher"
        />
        <MetricTile
          value={`${unassigned}`}
          label="Unassigned sections"
          caption="Every section needs a teacher"
          tone={unassigned > 0 ? "attention" : "positive"}
        />
      </div>

      <div className="mt-5">
        <Banner title="Reassignment is not built." tone="notice">
          Moving a section between teachers changes who can see whose records. It
          needs a confirmation step, an audit event, and a re-check of every
          scope involved. Until that is real, this page reports the assignment
          rather than offering a control that cannot safely complete it.
        </Banner>
      </div>

      <section aria-labelledby="loads" className="mt-8">
        <SectionHeading id="loads" hint="Before adding work, see who is already carrying it.">
          Load by teacher
        </SectionHeading>
        {loads.length === 0 ? (
          <Empty>No teachers at this site.</Empty>
        ) : (
          <Card>
            <ScrollX>
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Teacher</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Sections</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Enrollments</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Open support</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Queue items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loads.map((l) => (
                    <tr key={l.teacher.id}>
                      <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                        {l.teacher.firstName} {l.teacher.lastName}
                        {l.teacher.curriculumAuthor ? (
                          <span className="mt-0.5 block text-xs font-normal text-ink-muted">
                            Also holds curriculum authoring
                          </span>
                        ) : null}
                      </th>
                      <td className="px-5 py-3 text-ink-muted">{l.sections}</td>
                      <td className="px-5 py-3 text-ink-muted">{l.students}</td>
                      <td className="px-5 py-3 text-ink-muted">{l.openPlans}</td>
                      <td className="px-5 py-3 text-ink-muted">{l.queueItems}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        )}
      </section>

      <section aria-labelledby="sections" className="mt-10">
        <SectionHeading id="sections" hint="Every section references exactly one approved course version.">
          Sections
        </SectionHeading>
        <Card>
          <CardHeader title={`${rows.length} sections`} hint="Grouped by subject." />
          <ScrollX>
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Course</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Subject</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Teacher</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Students</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.section.id}>
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                      {r.section.courseTitle}
                    </th>
                    <td className="px-5 py-2.5 text-xs text-ink-muted">
                      {r.course?.subject}
                    </td>
                    <td className="px-5 py-2.5 text-ink-muted">
                      {r.teacher
                        ? `${r.teacher.firstName} ${r.teacher.lastName}`
                        : "Unassigned"}
                    </td>
                    <td className="px-5 py-2.5 text-ink-muted">{r.students}</td>
                    <td className="px-5 py-2.5 text-xs text-ink-muted">
                      {r.section.period}
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
