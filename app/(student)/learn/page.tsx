import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { Card, CardHeader, Meter, SectionHeading, StatusChip } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { LESSON_STATUS_PRESENTATION } from "@/lib/curriculum/lesson-status";
import { coursesFor } from "@/lib/views/student";

export const metadata: Metadata = {
  title: "Learn · Beyond.Ed",
  description: "Your courses, units, and lessons.",
};

/** Learn (blueprint §4): subject, course, unit, lesson, stage. */
export default async function LearnPage() {
  const student = await requireUser();
  const courses = coursesFor(student);
  const subjects = [...new Set(courses.map((c) => c.course.subject))];

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Learn</h1>
        <p className="mt-2 max-w-2xl text-base text-ink-muted">
          Your four courses. Each one opens at the exact lesson you are on.
        </p>
      </header>

      {subjects.map((subject) => (
        <section key={subject} aria-labelledby={`s-${subject}`} className="mt-8">
          <SectionHeading id={`s-${subject}`}>{subject}</SectionHeading>
          <div className="grid gap-4 md:grid-cols-2">
            {courses
              .filter((c) => c.course.subject === subject)
              .map((progress) => {
                const location = progress.current;
                const presentation = location
                  ? LESSON_STATUS_PRESENTATION[location.status]
                  : null;
                return (
                  <Card key={progress.enrollment.id}>
                    <CardHeader
                      title={progress.course.title}
                      hint={`Course version ${progress.courseVersion} · ${progress.course.units.length} units · ${progress.daysTotal} pathway days`}
                    />
                    <div className="p-5">
                      <Meter
                        percent={(progress.daysCompleted / progress.daysTotal) * 100}
                        tone="info"
                        label={`${progress.daysCompleted} of ${progress.daysTotal} pathway days`}
                      />
                      {location ? (
                        <div className="mt-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusChip
                              label={presentation?.label ?? ""}
                              tone={presentation ? "info" : "neutral"}
                            />
                            <span className="text-xs text-ink-muted">
                              {location.lesson.code}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-ink">{location.topic}</p>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            Unit {location.unit.id}: {location.unit.name} &middot;{" "}
                            {location.instructionalSection}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-4">
                            <Link
                              href={location.href}
                              className={`text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
                            >
                              Resume this lesson
                            </Link>
                            <Link
                              href={`/learn/${progress.enrollment.id}`}
                              className={`text-sm text-ink-muted underline underline-offset-4 hover:text-primary ${FOCUS_RING}`}
                            >
                              See all units
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-ink-muted">Course complete.</p>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
