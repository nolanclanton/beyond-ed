import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  courseSlug,
  getCourseBySlug,
  getUnit,
  lessonPosition,
} from "@/lib/curriculum/catalog";
import { conceptEdgesForUnit, strengthMeaning } from "@/lib/curriculum/concepts";
import { resolvePrerequisites } from "@/lib/curriculum/prerequisites";
import { describeStandard } from "@/lib/curriculum/standards";
import { supportById } from "@/lib/intervention/bank";
import {
  Card,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { ConceptChain, UnitArc } from "@/lib/design/curriculum";
import { FOCUS_RING } from "@/lib/design/tokens";

export const metadata: Metadata = {
  title: "Unit · Beyond.Ed",
  description: "A unit's fifteen lessons, its concept map, and what each lesson depends on.",
};

/**
 * One unit.
 *
 * The fifteen lessons in order with what each one teaches and claims, the
 * concept graph underneath them, and — for any lesson you open — the six pieces
 * of prior learning the curriculum says it rests on. The prerequisites are why
 * a recommendation can cite something: they are stated in the curriculum rather
 * than inferred at request time (CLAUDE.md §8).
 */
export default async function UnitPage({
  params,
}: {
  params: Promise<{ courseId: string; unitId: string }>;
}) {
  await requireUser();
  const { courseId, unitId } = await params;
  const course = getCourseBySlug(courseId);
  if (!course) notFound();
  const unit = getUnit(course, unitId);
  if (!unit) notFound();

  const edges = conceptEdgesForUnit(unit.id);
  const slug = courseSlug(course);
  const at = course.units.findIndex((u) => u.id === unit.id);
  const previous = at > 0 ? course.units[at - 1] : null;
  const following = at < course.units.length - 1 ? course.units[at + 1] : null;

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/org/curriculum/courses" className={`hover:underline ${FOCUS_RING}`}>
          Courses
        </Link>
        <span aria-hidden="true"> / </span>
        <Link
          href={`/org/curriculum/courses/${slug}`}
          className={`hover:underline ${FOCUS_RING}`}
        >
          {course.title}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">Unit {unit.order}</span>
      </nav>

      <header className="mt-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Unit {unit.order} &middot; days {unit.startDay}&ndash;{unit.endDay}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{unit.title}</h1>
        <p className="mt-2 max-w-3xl text-lg text-ink-muted">{unit.essentialQuestion}</p>
      </header>

      <div className="mt-5">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Concepts, in the order the graph puts them
          </p>
          <div className="mt-2">
            <ConceptChain concepts={unit.concepts} />
          </div>
        </Card>
      </div>

      <section aria-labelledby="lessons" className="mt-9">
        <SectionHeading
          id="lessons"
          hint="Open a lesson to see the six pieces of prior learning it rests on."
        >
          Fifteen lessons
        </SectionHeading>

        <div className="mb-3">
          <UnitArc />
        </div>

        <Card>
          <ul className="divide-y divide-line">
            {unit.lessons.map((lesson) => {
              const position = lessonPosition(lesson);
              const standard = describeStandard(lesson.primaryStandard);
              const prerequisites = resolvePrerequisites(lesson.code);
              return (
                <li key={lesson.code} className="px-5 py-4">
                  <div className="flex min-w-0 gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-bold text-ink-muted"
                    >
                      {position}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-sm font-semibold text-ink">{lesson.title}</p>
                        <StatusChip
                          label={lesson.primaryStandard}
                          tone="info"
                          title={standard?.description}
                        />
                      </div>
                      <p className="mt-0.5 text-sm text-ink-muted">{lesson.objective}</p>
                      <p className="mt-1 font-mono text-xs text-ink-muted">
                        {lesson.code} &middot; day {lesson.day}
                        {lesson.practice.length > 0
                          ? ` · ${lesson.practice.join(" · ")}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <details className="mt-2 pl-10">
                    <summary
                      className={`cursor-pointer text-xs font-semibold text-primary ${FOCUS_RING}`}
                    >
                      What this lesson rests on ({prerequisites.length})
                    </summary>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {prerequisites.map((prerequisite) => {
                        const support =
                          prerequisite.kind === "support"
                            ? supportById(prerequisite.id)
                            : undefined;
                        return (
                          <li key={prerequisite.id} className="text-xs">
                            <span className="font-mono text-ink-muted">
                              {prerequisite.id}
                            </span>{" "}
                            <span className="text-ink">
                              {support ? support.skill : (prerequisite.title ?? "")}
                            </span>
                            <span className="block text-ink-muted">
                              {prerequisite.reason}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="graph" className="mt-10">
        <SectionHeading
          id="graph"
          hint="Which concept has to come before which, and how strongly. A ranking input for recommendations, and inspectable."
        >
          Concept dependencies
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-2.5 font-semibold text-ink">
                    Before
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold text-ink">
                    Enables
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold text-ink">
                    Strength
                  </th>
                  <th scope="col" className="px-5 py-2.5 font-semibold text-ink">
                    First bites at
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {edges.map((edge) => (
                  <tr key={`${edge.from}->${edge.to}`}>
                    <th scope="row" className="px-5 py-2 text-left font-medium text-ink">
                      {edge.from}
                    </th>
                    <td className="px-5 py-2 text-ink">{edge.to}</td>
                    <td className="px-5 py-2 text-xs text-ink-muted">
                      {edge.strength} of 5 &middot; {strengthMeaning(edge.strength)}
                    </td>
                    <td className="px-5 py-2 font-mono text-xs text-ink-muted">
                      {edge.exampleLessonCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <nav aria-label="Adjacent units" className="mt-9 flex flex-wrap justify-between gap-3">
        {previous ? (
          <Link
            href={`/org/curriculum/courses/${slug}/${previous.id}`}
            className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
          >
            &larr; Unit {previous.order}. {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {following ? (
          <Link
            href={`/org/curriculum/courses/${slug}/${following.id}`}
            className={`text-sm font-semibold text-primary underline-offset-4 hover:underline ${FOCUS_RING}`}
          >
            Unit {following.order}. {following.title} &rarr;
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
