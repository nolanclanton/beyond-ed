import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import {
  COURSES,
  SUBJECTS,
  SUBJECT_SHORT,
  coursesForSubject,
  courseSlug,
  type Subject,
} from "@/lib/curriculum/catalog";
import { PREREQUISITE_LINK_COUNT } from "@/lib/curriculum/prerequisites";
import { standardsForCourse, STANDARDS } from "@/lib/curriculum/standards";
import { nextCourses, priorCourses } from "@/lib/curriculum/pathways";
import { SUPPORTS } from "@/lib/intervention/bank";
import {
  Card,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { CountStrip, LessonShape } from "@/lib/design/curriculum";
import { FOCUS_RING } from "@/lib/design/tokens";
import { CAPACITY_CONTRACT } from "@/lib/rules/versions";

export const metadata: Metadata = {
  title: "Courses · Beyond.Ed",
  description: "The course catalog, its pathways, and the structure underneath every lesson.",
};

/**
 * The course catalog.
 *
 * The whole instructional structure in one place: 38 courses, the pathways
 * between them, and the shape every course shares. A reader should be able to
 * see the architecture without being told about it — hence the counts, the
 * pathway arrows, and the lesson shape drawn to scale rather than described.
 */
export default async function CourseCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  await requireUser();
  const { subject: requested } = await searchParams;

  const selected = SUBJECTS.find((s) => s === requested) ?? null;
  const shown: Subject[] = selected ? [selected] : [...SUBJECTS];

  const unitCount = COURSES.reduce((n, c) => n + c.units.length, 0);
  const lessonCount = COURSES.reduce(
    (n, c) => n + c.units.reduce((m, u) => m + u.lessons.length, 0),
    0,
  );

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Courses</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Every course runs nine units of fifteen lessons, and every lesson is one
          thirty-minute course day.
        </p>
      </header>

      <div className="mt-5">
        <Card className="p-5">
          <CountStrip
            items={[
              { value: `${COURSES.length}`, label: "Courses" },
              { value: `${unitCount}`, label: "Units" },
              { value: lessonCount.toLocaleString("en-US"), label: "Lessons" },
              { value: `${STANDARDS.length.toLocaleString("en-US")}`, label: "Standards" },
              { value: `${SUPPORTS.length}`, label: "Reusable supports" },
              {
                value: PREREQUISITE_LINK_COUNT.toLocaleString("en-US"),
                label: "Prerequisite links",
              },
            ]}
          />
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Every lesson, every course
            </p>
            <div className="mt-2">
              <LessonShape />
            </div>
          </div>
        </Card>
      </div>

      <nav aria-label="Filter by subject" className="mt-6">
        <ScrollX>
          <ul className="flex min-w-max gap-2">
            <li>
              <FilterLink href="/org/curriculum/courses" active={selected === null}>
                All subjects
              </FilterLink>
            </li>
            {SUBJECTS.map((subject) => (
              <li key={subject}>
                <FilterLink
                  href={`/org/curriculum/courses?subject=${encodeURIComponent(subject)}`}
                  active={selected === subject}
                >
                  {SUBJECT_SHORT[subject]}
                </FilterLink>
              </li>
            ))}
          </ul>
        </ScrollX>
      </nav>

      {shown.map((subject) => {
        const courses = coursesForSubject(subject);
        return (
          <section key={subject} aria-labelledby={courseSectionId(subject)} className="mt-9">
            <SectionHeading
              id={courseSectionId(subject)}
              hint={`${courses.length} courses. Arrows are the pathways a student can take.`}
            >
              {subject}
            </SectionHeading>

            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((course) => {
                const standards = standardsForCourse(course.id);
                const next = nextCourses(course.id);
                const prior = priorCourses(course.id);
                return (
                  <Card key={course.id} className="flex flex-col p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-ink">
                        <Link
                          href={`/org/curriculum/courses/${courseSlug(course)}`}
                          className={`hover:text-primary ${FOCUS_RING}`}
                        >
                          {course.title}
                        </Link>
                      </h3>
                      <span className="font-mono text-xs text-ink-muted">{course.id}</span>
                    </div>

                    <p className="mt-1 text-sm text-ink-muted">
                      Grade {course.gradeBand} &middot; {course.standardsModel}
                    </p>

                    <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted">
                      <div>
                        <dt className="inline font-semibold text-ink">
                          {course.units.length}
                        </dt>{" "}
                        <dd className="inline">units</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-ink">
                          {course.pathwayDays}
                        </dt>{" "}
                        <dd className="inline">pathway days</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-ink">
                          {course.interventionCapacity}
                        </dt>{" "}
                        <dd className="inline">reserved for support</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-ink">{standards.length}</dt>{" "}
                        <dd className="inline">standards</dd>
                      </div>
                    </dl>

                    <div className="mt-auto pt-3 text-xs text-ink-muted">
                      {prior.length > 0 ? (
                        <p>
                          <span className="text-ink-muted">From </span>
                          {prior.map((p, i) => (
                            <span key={p.course.id}>
                              {i > 0 ? ", " : ""}
                              <Link
                                href={`/org/curriculum/courses/${courseSlug(p.course)}`}
                                className={`font-medium text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                              >
                                {p.course.title}
                              </Link>
                            </span>
                          ))}
                        </p>
                      ) : (
                        <p>Entry course for this subject.</p>
                      )}
                      {next.length > 0 ? (
                        <p className="mt-0.5">
                          <span aria-hidden="true">&rarr; </span>
                          {next.map((n, i) => (
                            <span key={n.course.id}>
                              {i > 0 ? ", " : ""}
                              <Link
                                href={`/org/curriculum/courses/${courseSlug(n.course)}`}
                                className={`font-medium text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
                              >
                                {n.course.title}
                              </Link>
                            </span>
                          ))}
                        </p>
                      ) : (
                        <p className="mt-0.5">
                          <StatusChip label="End of pathway" tone="neutral" />
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="mt-10 text-sm text-ink-muted">
        Each course validates {CAPACITY_CONTRACT.pathwayDays} +{" "}
        {CAPACITY_CONTRACT.interventionDays} = {CAPACITY_CONTRACT.totalDays} before it
        can be published.{" "}
        <Link
          href="/org/curriculum"
          className={`font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
        >
          See version status
        </Link>
        .
      </p>
    </div>
  );
}

function courseSectionId(subject: string): string {
  return `subject-${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-block whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium ${FOCUS_RING} ${
        active
          ? "border-primary bg-primary text-white"
          : "border-line bg-surface text-ink-muted hover:border-primary-line hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );
}
