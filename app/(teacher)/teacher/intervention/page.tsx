import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { actionQueue } from "@/lib/intervention/queue";
import {
  entryById,
  families,
  familyTotals,
  searchLibrary,
  starterLessons,
} from "@/lib/intervention/library";
import { INTERVENTION_STATUS_PRESENTATION } from "@/lib/intervention/status";
import { CAPACITY_CONTRACT, DEFAULT_RETURN_RULE } from "@/lib/rules/versions";

export const metadata: Metadata = {
  title: "Intervention Center · Beyond.Ed",
  description: "Needs Review, Find Support, Active Plans, and Outcomes.",
};

/**
 * The Intervention Center (blueprint §5).
 *
 * Needs Review, Find Support, Active Plans, and Outcomes organise the whole
 * support workflow. Quick Assign lives on the action queue, where the evidence
 * is — a teacher should not have to leave the trigger to act on it.
 *
 * Outcome over completion: success reporting centres on readiness-check pass,
 * transfer-check pass, and return, not on whether a task was finished.
 */
export default async function InterventionCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const teacher = await requireUser();
  const d = db();
  const queue = actionQueue(teacher);

  const sections = d.sections.filter((s) => s.teacherId === teacher.id);
  const studentIds = new Set(
    d.enrollments
      .filter((e) => sections.some((s) => s.id === e.sectionId))
      .map((e) => e.studentId),
  );
  const plans = d.interventions.filter((i) => studentIds.has(i.studentId));
  const active = plans.filter(
    (p) => p.status !== "closed" && p.status !== "returned_to_pathway",
  );
  const finished = plans.filter(
    (p) => p.status === "closed" || p.status === "returned_to_pathway",
  );

  const returned = finished.filter((p) => p.status === "returned_to_pathway");
  const transferPassed = plans.filter((p) => p.transferPassed === true);
  const readinessAttempted = plans.filter((p) => p.readinessPercent !== null);
  const readinessPassed = readinessAttempted.filter(
    (p) => (p.readinessPercent ?? 0) >= p.readinessMinPercent,
  );

  const results = q ? searchLibrary(q) : [];
  const totals = familyTotals();

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Intervention Center</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          The whole support workflow in one place: what needs review, what is
          running, what it produced, and the library it draws on.
        </p>
      </header>

      <div className="mt-5">
        <Banner title={`${CAPACITY_CONTRACT.interventionDays} intervention-capacity days are reserved per course, per year.`} tone="info">
          Four days in each of the {CAPACITY_CONTRACT.planningCycles} planning cycles.
          They are student-specific, not universal — a student completes only the
          support the evidence justifies, and unused capacity becomes extension,
          cumulative practice, or conferencing rather than extra required work.
        </Banner>
      </div>

      <section aria-labelledby="needs-review" className="mt-8">
        <SectionHeading
          id="needs-review"
          hint="Proposals waiting on your decision. Quick Assign is on the action queue, next to the evidence."
        >
          Needs review ({queue.length})
        </SectionHeading>
        {queue.length === 0 ? (
          <Empty>Nothing waiting.</Empty>
        ) : (
          <Card>
            <ScrollX>
              <table className="w-full min-w-[48rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Course</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Skill</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Severity</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {queue.map((item) => (
                    <tr key={item.recommendation.id}>
                      <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                        <Link
                          href={`/teacher/students/${item.student.id}`}
                          className={`text-primary underline underline-offset-4 ${FOCUS_RING}`}
                        >
                          {item.student.firstName} {item.student.lastName}
                        </Link>
                      </th>
                      <td className="px-5 py-3 text-xs text-ink-muted">{item.courseTitle}</td>
                      <td className="px-5 py-3 font-mono text-xs text-ink">
                        {item.recommendation.standard ?? item.recommendation.skill}
                      </td>
                      <td className="px-5 py-3">
                        <StatusChip
                          label={item.recommendation.severity.replace(/_/g, " ")}
                          tone={
                            item.recommendation.severity === "immediate" ||
                            item.recommendation.severity === "teacher_review"
                              ? "attention"
                              : "info"
                          }
                        />
                      </td>
                      <td className="px-5 py-3 text-xs text-ink-muted">
                        {item.recommendation.triggerSummary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollX>
            <div className="border-t border-line px-5 py-3">
              <Link
                href="/teacher"
                className={`text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
              >
                Go to the action queue to decide
              </Link>
            </div>
          </Card>
        )}
      </section>

      <section aria-labelledby="find-support" className="mt-10">
        <SectionHeading
          id="find-support"
          hint={`${totals.total} lessons across ${families().length} families. Search by standard, lesson id, course, or target.`}
        >
          Find support
        </SectionHeading>
        <Card className="p-5">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="min-w-[16rem] flex-1">
              <label htmlFor="q" className="text-sm font-medium text-ink">
                Search the intervention library
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q ?? ""}
                placeholder="6.RP.2, fraction, I-M6-U1, Living Earth"
                className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
              />
            </div>
            <button
              type="submit"
              className={`rounded-lg border border-primary-line bg-surface px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-surface ${FOCUS_RING}`}
            >
              Search
            </button>
          </form>

          {q ? (
            results.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">
                Nothing in the library matches &ldquo;{q}&rdquo;.
              </p>
            ) : (
              <ScrollX>
                <table className="mt-4 w-full min-w-[40rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-left">
                      <th scope="col" className="py-2 pr-4 font-semibold text-ink">Lesson</th>
                      <th scope="col" className="py-2 pr-4 font-semibold text-ink">Target</th>
                      <th scope="col" className="py-2 pr-4 font-semibold text-ink">Course</th>
                      <th scope="col" className="py-2 font-semibold text-ink">Standards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {results.map((r) => (
                      <tr key={r.id}>
                        <th scope="row" className="py-2 pr-4 text-left font-mono text-xs text-ink">
                          {r.id}
                        </th>
                        <td className="py-2 pr-4 text-xs text-ink">{r.target}</td>
                        <td className="py-2 pr-4 text-xs text-ink-muted">{r.courseTitle}</td>
                        <td className="py-2 font-mono text-xs text-ink-muted">
                          {r.standards.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollX>
            )
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              A support is assigned from the action queue, where its trigger evidence
              is. This search is for looking one up.
            </p>
          )}
        </Card>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {totals.bySubject.map((s) => (
            <Card key={s.subject} className="p-4">
              <p className="text-2xl font-bold text-ink">{s.lessons}</p>
              <p className="text-sm text-ink-muted">{s.subject} lessons</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="active" className="mt-10">
        <SectionHeading id="active" hint="Everything currently running across your sections.">
          Active plans ({active.length})
        </SectionHeading>
        {active.length === 0 ? (
          <Empty>Nothing running.</Empty>
        ) : (
          <Card>
            <ScrollX>
              <table className="w-full min-w-[48rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Student</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Support</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Readiness</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Returns to</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {active.map((plan) => {
                    const s = d.users.find((u) => u.id === plan.studentId);
                    const presentation = INTERVENTION_STATUS_PRESENTATION[plan.status];
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
                        <td className="px-5 py-3 text-xs">
                          <span className="font-mono text-ink">{plan.interventionLessonId}</span>
                          <span className="block text-ink-muted">
                            {entryById(plan.interventionLessonId)?.target}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <StatusChip label={presentation.label} tone={presentation.tone} />
                        </td>
                        <td className="px-5 py-3 text-xs text-ink-muted">
                          {plan.readinessPercent === null
                            ? "Not attempted"
                            : `${plan.readinessPercent}% (bar ${plan.readinessMinPercent}%)`}
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
        )}
      </section>

      <section aria-labelledby="outcomes" className="mt-10">
        <SectionHeading
          id="outcomes"
          hint="Outcome over completion: readiness pass, transfer pass, and return — not whether a task was finished."
        >
          Outcomes
        </SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-2xl font-bold text-ink">
              {readinessAttempted.length === 0
                ? "—"
                : `${readinessPassed.length}/${readinessAttempted.length}`}
            </p>
            <p className="text-sm text-ink-muted">Readiness checks at or above the bar</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-ink">{transferPassed.length}</p>
            <p className="text-sm text-ink-muted">Transfer items passed</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-ink">{returned.length}</p>
            <p className="text-sm text-ink-muted">Returned to the pathway</p>
          </Card>
          <Card className="p-4">
            <p className="text-2xl font-bold text-ink">
              {plans.filter((p) => p.status === "escalated").length}
            </p>
            <p className="text-sm text-ink-muted">Escalated to teacher review</p>
          </Card>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Default return rule: {DEFAULT_RETURN_RULE.description} Rule version{" "}
          <span className="font-mono">{DEFAULT_RETURN_RULE.version}</span>.
        </p>
      </section>

      <section aria-labelledby="starter" className="mt-10">
        <SectionHeading
          id="starter"
          hint="From the blueprint's starter inventory — the minimum metadata each library lesson carries."
        >
          Starter lesson inventory
        </SectionHeading>
        <Card>
          <CardHeader title="Named seed lessons" hint={`${starterLessons().length} lessons across four subjects`} />
          <ScrollX>
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Lesson</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Target</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Typical trigger</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Transfer evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {starterLessons().map((l) => (
                  <tr key={l.lessonId}>
                    <th scope="row" className="px-5 py-2.5 text-left font-mono text-xs text-ink">
                      {l.lessonId}
                    </th>
                    <td className="px-5 py-2.5 text-xs text-ink">{l.target}</td>
                    <td className="px-5 py-2.5 text-xs text-ink-muted">{l.trigger}</td>
                    <td className="px-5 py-2.5 text-xs text-ink-muted">{l.transfer}</td>
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
