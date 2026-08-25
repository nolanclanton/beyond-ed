import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  assessmentDescription,
  getCourse,
  lessonType,
} from "@/lib/curriculum/catalog";
import { LESSON_STATUS_PRESENTATION } from "@/lib/curriculum/lesson-status";
import { db } from "@/lib/db/store";
import {
  Card,
  CardHeader,
  FactList,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { locationFor } from "@/lib/views/student";
import { focusForLesson } from "@/lib/views/learning-focus";
import { CAPACITY_CONTRACT } from "@/lib/rules/versions";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const student = await requireUser();
  const d = db();
  const enrollment = d.enrollments.find(
    (e) => e.id === enrollmentId && e.studentId === student.id,
  );
  if (!enrollment) notFound();
  const course = getCourse(enrollment.courseTitle);
  if (!course) notFound();

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/learn" className={`underline underline-offset-4 hover:text-primary ${FOCUS_RING}`}>
          Learn
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{course.title}</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{course.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{course.subject}</p>
      </header>

      <div className="mt-5">
        <Card className="p-5">
          <FactList
            columns={3}
            items={[
              { label: "Subject", value: course.subject },
              { label: "Units", value: `${course.units.length}` },
              {
                label: "Class days this year",
                value: `${course.pathwayDays}, plus ${CAPACITY_CONTRACT.interventionDays} kept free for extra help`,
              },
            ]}
          />
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {course.units.map((unit) => (
          <Card key={unit.id}>
            <CardHeader
              title={`Unit ${unit.order}. ${unit.title}`}
              hint={unit.essentialQuestion}
            />
            <ul className="divide-y divide-line">
              {unit.lessons.map((lesson, index) => {
                const location = locationFor(enrollment, lesson.code);
                const presentation = location
                  ? LESSON_STATUS_PRESENTATION[location.status]
                  : null;
                const locked = location?.status === "locked";
                const description = focusForLesson(lesson.code)?.description;
                return (
                  <li key={lesson.code} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {presentation ? (
                            <StatusChip
                              label={presentation.label}
                              tone={
                                location?.status === "completed" ||
                                location?.status === "passed" ||
                                location?.status === "review_scheduled"
                                  ? "positive"
                                  : locked
                                    ? "neutral"
                                    : "info"
                              }
                            />
                          ) : null}
                          <span className="text-xs text-ink-muted">
                            Lesson {index + 1} of {unit.lessons.length} &middot;{" "}
                            {lessonType(lesson).toLowerCase()}
                          </span>
                        </div>
                        <p className="mt-1.5 text-base font-semibold text-ink">
                          {lesson.title}
                        </p>
                        {/*
                          Where no goal has been written, the focus description
                          falls back to the unit's essential question, which the
                          card header above already carries. Showing it twice
                          reads as a rendering bug.
                        */}
                        {description && description !== unit.essentialQuestion ? (
                          <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
                        ) : null}
                        <p className="mt-1.5 text-xs text-ink-muted">
                          What you show: {assessmentDescription(lesson)}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {locked ? (
                          <p className="text-xs text-ink-muted">
                            {presentation?.studentMeaning}
                          </p>
                        ) : (
                          <Link
                            href={`/learn/${enrollment.id}/${lesson.code}`}
                            className={`text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
                          >
                            Open
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
