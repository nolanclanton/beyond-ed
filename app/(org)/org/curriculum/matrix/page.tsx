import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { canAuthorCurriculum } from "@/lib/auth/scope";
import {
  COURSES,
  SUBJECTS,
  SUBJECT_SHORT,
  courseSlug,
  coursesForSubject,
} from "@/lib/curriculum/catalog";
import { PREREQUISITE_LINK_COUNT } from "@/lib/curriculum/prerequisites";
import { versionsForCourseId } from "@/lib/curriculum/structure";
import { SUPPORTS, supportsForSubject } from "@/lib/intervention/bank";
import {
  Card,
  CardHeader,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { CountStrip, SubjectChip } from "@/lib/design/curriculum";
import { FOCUS_RING } from "@/lib/design/tokens";

export const metadata: Metadata = {
  title: "Curriculum matrix · Beyond.Ed",
  description:
    "Every course and every intervention support in one navigable matrix, with the foundation map beneath it.",
};

/**
 * The curriculum matrix (CLAUDE.md §7, §8).
 *
 * The whole spine in one place: 38 courses, the 160 reusable supports, and
 * which supports serve which course. A course is a column of instruction; the
 * bank is a shelf of repair that cuts across all of them, and the only surface
 * where both are visible at once is this one.
 *
 * Read-only for everyone. The governing controls live one level down, inside a
 * DRAFT version of a course — because changing a foundation or a sequence
 * changes what a class will be taught, and that is a versioned decision.
 */
export default async function CurriculumMatrixPage() {
  const actor = await requireUser();
  const canAuthor = canAuthorCurriculum(actor);

  const units = COURSES.reduce((n, c) => n + c.units.length, 0);
  const lessons = COURSES.reduce(
    (n, c) => n + c.units.reduce((m, u) => m + u.lessons.length, 0),
    0,
  );

  /** Support categories per subject, in the bank's own order. */
  const categoriesBySubject = SUBJECTS.map((subject) => {
    const seen: string[] = [];
    for (const support of supportsForSubject(subject)) {
      if (!seen.includes(support.category)) seen.push(support.category);
    }
    return { subject, categories: seen };
  });

  /** `courseId::category` -> how many supports may return into that course. */
  const reach = new Map<string, number>();
  for (const support of SUPPORTS) {
    for (const courseId of support.returnCourseIds) {
      const key = `${courseId}::${support.category}`;
      reach.set(key, (reach.get(key) ?? 0) + 1);
    }
  }

  return (
    <div className="py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Curriculum matrix
          </h1>
          <p className="mt-2 max-w-3xl text-base text-ink-muted">
            Every course, every reusable support, and what rests on what. Open a
            course to walk its unit-by-lesson grid, govern which learning is
            foundational for which, and set the order the course runs in.
          </p>
        </div>
        <StatusChip
          label={canAuthor ? "You can govern drafts" : "Read-only for your role"}
          tone={canAuthor ? "positive" : "neutral"}
        />
      </header>

      <div className="mt-5">
        <Card className="p-5">
          <CountStrip
            items={[
              { value: `${COURSES.length}`, label: "Courses" },
              { value: `${units}`, label: "Units" },
              { value: `${lessons.toLocaleString()}`, label: "Pathway lessons" },
              { value: `${SUPPORTS.length}`, label: "Reusable supports" },
              {
                value: `${PREREQUISITE_LINK_COUNT.toLocaleString()}`,
                label: "Foundation links",
              },
            ]}
          />
          <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">
            Every number is read from the curriculum architecture workbook. The
            structure is ingested, never authored in code — what a version
            adapts is recorded against that version and shown as a difference
            from the baseline.
          </p>
        </Card>
      </div>

      <section aria-labelledby="courses" className="mt-9">
        <SectionHeading
          id="courses"
          hint="Each subject in its own progression. A course carries 9 units and 135 pathway lessons against a 40-day intervention reserve."
        >
          Courses
        </SectionHeading>

        <div className="flex flex-col gap-4">
          {SUBJECTS.map((subject) => {
            const subjectCourses = coursesForSubject(subject);
            return (
              <Card key={subject}>
                <CardHeader
                  title={subject}
                  hint={`${subjectCourses.length} courses · ${supportsForSubject(subject).length} supports in the bank`}
                  action={<SubjectChip subject={subject} />}
                />
                <div className="p-5">
                  <ul className="flex flex-wrap gap-2">
                    {subjectCourses.map((course) => {
                      const drafts = versionsForCourseId(course.id).filter(
                        (v) => v.status === "draft",
                      ).length;
                      return (
                        <li key={course.id}>
                          <Link
                            href={`/org/curriculum/matrix/${courseSlug(course)}`}
                            className={`flex min-w-[10rem] flex-col rounded-lg border border-line bg-surface px-3 py-2 transition-colors hover:border-primary ${FOCUS_RING}`}
                          >
                            <span className="font-mono text-[0.65rem] text-ink-muted">
                              {course.id} · grade {course.gradeBand}
                            </span>
                            <span className="mt-0.5 text-sm font-semibold text-ink">
                              {course.title}
                            </span>
                            <span className="mt-0.5 text-xs text-ink-muted">
                              {drafts > 0
                                ? `${drafts} draft version${drafts === 1 ? "" : "s"} to govern`
                                : "No draft version open"}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="reach" className="mt-10">
        <SectionHeading
          id="reach"
          hint="A support is not consumed by one course. The same skill repair serves every course it can return a student into, which is why the 40-day reserve is capacity rather than content."
        >
          Which supports serve which courses
        </SectionHeading>

        <div className="flex flex-col gap-4">
          {categoriesBySubject.map(({ subject, categories }) => (
            <Card key={subject}>
              <CardHeader
                title={`${SUBJECT_SHORT[subject]} · intervention reach`}
                hint="A number is how many supports in that category may return a student into that course. A blank means none."
              />
              <ScrollX>
                <table className="w-full min-w-[48rem] border-collapse text-sm">
                  <caption className="sr-only">
                    {subject} courses by intervention support category, showing
                    how many supports in each category can return a student into
                    each course.
                  </caption>
                  <thead>
                    <tr className="border-b border-line text-left">
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">
                        Course
                      </th>
                      {categories.map((category) => (
                        <th
                          key={category}
                          scope="col"
                          className="px-2 py-3 text-center text-xs font-semibold text-ink-muted"
                        >
                          {category}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {coursesForSubject(subject).map((course) => (
                      <tr key={course.id}>
                        <th
                          scope="row"
                          className="px-5 py-2.5 text-left font-medium text-ink"
                        >
                          <Link
                            href={`/org/curriculum/matrix/${courseSlug(course)}`}
                            className={`text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                          >
                            {course.title}
                          </Link>
                        </th>
                        {categories.map((category) => {
                          const n = reach.get(`${course.id}::${category}`) ?? 0;
                          return (
                            <td
                              key={category}
                              className={`px-2 py-2.5 text-center text-sm ${n > 0 ? "text-ink" : "text-line-strong"}`}
                            >
                              {n > 0 ? n : "—"}
                              <span className="sr-only">
                                {n > 0
                                  ? ` ${category} supports can return a student into ${course.title}`
                                  : ` no ${category} support returns into ${course.title}`}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollX>
            </Card>
          ))}
        </div>
      </section>

      <p className="mt-9 text-sm text-ink-muted">
        The bank itself — every support, its trigger, and its exit criterion —
        is in{" "}
        <Link
          href="/org/intervention"
          className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
        >
          the intervention system
        </Link>
        .
      </p>
    </div>
  );
}
