import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { assertCanReadStudent } from "@/lib/auth/scope";
import { formatDateTime } from "@/lib/clock";
import { assessmentId, courseLessons, getCourse } from "@/lib/curriculum/catalog";
import { db, lessonStatesFor } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  FactList,
  Meter,
  ScrollX,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { allEvidence, currentEvidence, supersessionChain } from "@/lib/evidence/ledger";
import { courseGrade, gradeHistory } from "@/lib/grades/gradebook";
import { interventionsForStudent } from "@/lib/intervention/lifecycle";
import { INTERVENTION_STATUS_PRESENTATION } from "@/lib/intervention/status";
import { CONFIDENCE_BANDS, READINESS_BANDS, skillProfile } from "@/lib/mastery/profile";
import { LESSON_STATUS_PRESENTATION } from "@/lib/curriculum/lesson-status";
import { recommendationsForStudent } from "@/lib/intervention/queue";

import { GradeEntryForm, ObservationForm } from "./student-forms";

const TABS = [
  "overview",
  "pathway",
  "skills",
  "evidence",
  "interventions",
  "grades",
  "activity",
] as const;
type Tab = (typeof TABS)[number];

/**
 * Student 360 (blueprint §5).
 *
 * Overview, Pathway, Skills, Evidence, Interventions, Grades, and Activity all
 * share ONE student context — the tab changes the view, never the subject.
 *
 * Skills and Grades are separate tabs on purpose. No view here joins a
 * readiness estimate to a grade (CLAUDE.md §4).
 */
export default async function Student360Page({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { studentId } = await params;
  const { tab: tabParam } = await searchParams;
  const teacher = await requireUser();
  const d = db();

  const student = d.users.find((u) => u.id === studentId && u.role === "student");
  if (!student) notFound();
  assertCanReadStudent(teacher, student.id);

  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as Tab)
    : "overview";

  const enrollments = d.enrollments.filter((e) => e.studentId === student.id);
  const site = d.sites.find((s) => s.id === student.siteId);
  const plans = interventionsForStudent(student.id);
  const profile = skillProfile(student.id);
  const recommendations = recommendationsForStudent(student.id);

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/teacher" className={`underline underline-offset-4 hover:text-primary ${FOCUS_RING}`}>
          Action queue
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">
          {student.firstName} {student.lastName}
        </span>
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          {student.firstName} {student.lastName}
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Grade {student.gradeLevel} &middot; {site?.name} &middot; {enrollments.length} courses
        </p>
      </header>

      <nav aria-label="Student record sections" className="mt-5">
        <ul className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <li key={t}>
              <Link
                href={`/teacher/students/${student.id}?tab=${t}`}
                aria-current={t === tab ? "page" : undefined}
                className={`inline-block rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${FOCUS_RING} ${
                  t === tab
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-surface text-ink-muted hover:border-primary-line hover:text-primary"
                }`}
              >
                {t}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6">
        {tab === "overview" ? (
          <div className="flex flex-col gap-5">
            <Card className="p-5">
              <FactList
                columns={3}
                items={[
                  { label: "Site", value: site?.shortName ?? "—" },
                  { label: "Grade", value: `${student.gradeLevel}` },
                  { label: "Courses", value: `${enrollments.length}` },
                  {
                    label: "Open support plans",
                    value: `${plans.filter((p) => p.status !== "closed" && p.status !== "returned_to_pathway").length}`,
                  },
                  { label: "Recommendations waiting", value: `${recommendations.length}` },
                  {
                    label: "Evidence rows",
                    value: `${currentEvidence({ studentId: student.id }).length} current, ${allEvidence(student.id).length} total`,
                  },
                ]}
              />
            </Card>

            {enrollments.some((e) => e.transferredFromEnrollmentId) ? (
              <Banner title="This student transferred between sites." tone="info">
                Pathway state, evidence, mastery, grades, interventions, and audit
                history carried across. There is no duplicate enrollment.
              </Banner>
            ) : null}

            <Card>
              <CardHeader title="Courses" hint="One approved course version per roster section." />
              <ul className="divide-y divide-line">
                {enrollments.map((e) => {
                  const course = getCourse(e.courseTitle);
                  const version = d.courseVersions.find((v) => v.id === e.courseVersionId);
                  const states = lessonStatesFor(e.id);
                  const active = states.find(
                    (s) => s.status === "available" || s.status === "in_progress",
                  );
                  const done = states.filter((s) => s.status === "completed");
                  const lessons = course ? courseLessons(course) : [];
                  const doneCodes = new Set(done.map((s) => s.lessonCode));
                  const days = lessons.filter((l) => doneCodes.has(l.code)).length;
                  return (
                    <li key={e.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{e.courseTitle}</p>
                        <p className="text-xs text-ink-muted">
                          version {version?.version} &middot; {e.status}
                        </p>
                      </div>
                      <div className="mt-2">
                        <Meter
                          percent={course ? (days / course.pathwayDays) * 100 : 0}
                          label={`${days} of ${course?.pathwayDays ?? 135} pathway days`}
                        />
                      </div>
                      {active ? (
                        <p className="mt-1.5 font-mono text-xs text-ink-muted">
                          now on {active.lessonCode}, stage {active.stage}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        ) : null}

        {tab === "pathway" ? (
          <div className="flex flex-col gap-5">
            {enrollments.map((e) => {
              const course = getCourse(e.courseTitle);
              if (!course) return null;
              const states = lessonStatesFor(e.id);
              return (
                <Card key={e.id}>
                  <CardHeader title={e.courseTitle} hint={`${course.units.length} units`} />
                  <ScrollX>
                    <table className="w-full min-w-[40rem] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-line text-left">
                          <th scope="col" className="px-5 py-3 font-semibold text-ink">Lesson</th>
                          <th scope="col" className="px-5 py-3 font-semibold text-ink">Unit</th>
                          <th scope="col" className="px-5 py-3 font-semibold text-ink">Standards</th>
                          <th scope="col" className="px-5 py-3 font-semibold text-ink">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {course.units.flatMap((u) =>
                          u.lessons.map((l) => {
                            const st = states.find((s) => s.lessonCode === l.code);
                            const presentation = st
                              ? LESSON_STATUS_PRESENTATION[st.status]
                              : undefined;
                            return (
                              <tr key={l.code}>
                                <th scope="row" className="px-5 py-2 text-left font-mono text-xs text-ink">
                                  {l.code}
                                </th>
                                <td className="px-5 py-2 text-xs text-ink-muted">{u.title}</td>
                                <td className="px-5 py-2 font-mono text-xs text-ink-muted">
                                  {l.primaryStandard}
                                </td>
                                <td className="px-5 py-2">
                                  {presentation ? (
                                    <StatusChip
                                      label={presentation.label}
                                      tone={
                                        st?.status === "completed"
                                          ? "positive"
                                          : st?.status === "locked"
                                            ? "neutral"
                                            : "info"
                                      }
                                    />
                                  ) : (
                                    <span className="text-xs text-ink-muted">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          }),
                        )}
                      </tbody>
                    </table>
                  </ScrollX>
                </Card>
              );
            })}
          </div>
        ) : null}

        {tab === "skills" ? (
          <>
            <Banner title="These are readiness estimates, not grades." tone="info">
              Confidence is stored and shown separately, so thin evidence is never
              presented as a precise score. Official results are on the Grades tab
              and are never combined with anything here.
            </Banner>
            <div className="mt-4">
              {profile.length === 0 ? (
                <Empty>No recorded work yet.</Empty>
              ) : (
                <Card>
                  <ScrollX>
                    <table className="w-full min-w-[46rem] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-line text-left">
                          <th scope="col" className="px-5 py-3 font-semibold text-ink">Skill</th>
                          <th scope="col" className="px-5 py-3 font-semibold text-ink">Estimate</th>
                          <th scope="col" className="px-5 py-3 font-semibold text-ink">Readiness</th>
                          <th scope="col" className="px-5 py-3 font-semibold text-ink">Confidence</th>
                          <th scope="col" className="px-5 py-3 font-semibold text-ink">Inputs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {profile.map((m) => (
                          <tr key={m.skill}>
                            <th scope="row" className="px-5 py-3 text-left font-mono text-xs font-medium text-ink">
                              {m.skill}
                            </th>
                            <td className="px-5 py-3 text-ink">
                              {m.confidence === "insufficient" ? (
                                <span className="text-ink-muted">Withheld</span>
                              ) : (
                                `${m.estimate}`
                              )}
                            </td>
                            <td className="px-5 py-3">
                              {/*
                                A band is a claim about readiness. With
                                insufficient evidence there is no claim to make,
                                so none is shown — asserting "needs support" on
                                one attempt is exactly the failure CLAUDE.md §4
                                forbids.
                              */}
                              {m.confidence === "insufficient" ? (
                                <span className="text-xs text-ink-muted">
                                  Not established
                                </span>
                              ) : (
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
                              )}
                            </td>
                            <td className="px-5 py-3 text-xs">
                              <span className="font-medium text-ink">
                                {CONFIDENCE_BANDS[m.confidence].label}
                              </span>
                              <span className="mt-0.5 block text-ink-muted">
                                {m.confidenceReason}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs text-ink-muted">
                              {m.inputs.attempts}{" "}
                              {m.inputs.attempts === 1 ? "attempt" : "attempts"},{" "}
                              {m.inputs.correct} correct · {m.inputs.hintsUsed}{" "}
                              {m.inputs.hintsUsed === 1 ? "hint" : "hints"} ·{" "}
                              {m.inputs.distinctSources
                                .map((x) => x.replace(/_/g, " "))
                                .join(", ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollX>
                </Card>
              )}
            </div>
          </>
        ) : null}

        {tab === "evidence" ? (
          <div className="flex flex-col gap-5">
            <Banner title="The evidence ledger is append-only." tone="info">
              Nothing here is edited or deleted. A correction is a new row linked to
              the original, and the original stays readable.
            </Banner>

            <Card>
              <CardHeader title="Record an observation" hint="Appends to the ledger. Never overwrites." />
              <div className="p-5">
                <ObservationForm
                  studentId={student.id}
                  idempotencySalt={`${student.id}:${allEvidence(student.id).length}`}
                  enrollments={enrollments.map((e) => {
                    const st = d.lessonStates.find(
                      (s) =>
                        s.enrollmentId === e.id &&
                        (s.status === "available" || s.status === "in_progress"),
                    );
                    return {
                      id: e.id,
                      label: e.courseTitle,
                      lessonCode: st?.lessonCode ?? "",
                    };
                  })}
                  correctableEvidence={currentEvidence({ studentId: student.id })
                    .slice(-12)
                    .map((row) => ({
                      id: row.id,
                      label: `${row.lessonCode} · ${row.skill} · ${row.correct ? "correct" : "missed"} (${row.id})`,
                    }))}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                title="All evidence"
                hint={`${allEvidence(student.id).length} rows, superseded rows included`}
              />
              <ScrollX>
                <table className="w-full min-w-[52rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-left">
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">Id</th>
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">When</th>
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">Lesson</th>
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">Skill</th>
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">Source</th>
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">Result</th>
                      <th scope="col" className="px-5 py-3 font-semibold text-ink">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {allEvidence(student.id)
                      .slice()
                      .reverse()
                      .slice(0, 60)
                      .map((row) => {
                        const chain = supersessionChain(row.id);
                        const isSuperseded = allEvidence(student.id).some(
                          (r) => r.supersedesEvidenceId === row.id,
                        );
                        return (
                          <tr key={row.id} className={isSuperseded ? "text-ink-muted" : ""}>
                            <td className="px-5 py-2 font-mono text-xs">{row.id}</td>
                            <td className="whitespace-nowrap px-5 py-2 text-xs">
                              {formatDateTime(row.recordedAt)}
                            </td>
                            <td className="px-5 py-2 font-mono text-xs">{row.lessonCode}</td>
                            <td className="px-5 py-2 font-mono text-xs">{row.skill}</td>
                            <td className="px-5 py-2 text-xs">{row.source.replace(/_/g, " ")}</td>
                            <td className="px-5 py-2 text-xs">
                              {row.correct === null
                                ? "Not scored"
                                : row.correct
                                  ? "Correct"
                                  : `Missed${row.errorCode ? ` — ${row.errorCode.replace(/-/g, " ")}` : ""}`}
                            </td>
                            <td className="px-5 py-2 text-xs">
                              {isSuperseded
                                ? "Superseded — retained"
                                : chain.length > 1
                                  ? `Current (corrects ${row.supersedesEvidenceId})`
                                  : "Current"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </ScrollX>
            </Card>
          </div>
        ) : null}

        {tab === "interventions" ? (
          <div className="flex flex-col gap-4">
            {plans.length === 0 ? (
              <Empty>No support plans on record.</Empty>
            ) : (
              plans.map((plan) => {
                const presentation = INTERVENTION_STATUS_PRESENTATION[plan.status];
                const decider = d.users.find((u) => u.id === plan.decidedByUserId);
                return (
                  <Card key={plan.id}>
                    <CardHeader
                      title={plan.targetStandard ?? plan.targetSkill}
                      hint={`${plan.interventionLessonId} · ${plan.severity.replace(/_/g, " ")}`}
                      action={<StatusChip label={presentation.label} tone={presentation.tone} />}
                    />
                    <div className="p-5">
                      <p className="text-sm text-ink">{plan.triggerSummary}</p>
                      <div className="mt-4">
                        <FactList
                          columns={3}
                          items={[
                            {
                              label: "Decided by",
                              value: decider
                                ? `${decider.firstName} ${decider.lastName} (${decider.role.replace(/_/g, " ")})`
                                : "Not yet decided",
                            },
                            { label: "Reason", value: plan.decisionReason ?? "—" },
                            { label: "Due", value: plan.dueExpectation },
                            {
                              label: "Return destination",
                              value: `${plan.returnLessonCode}, stage ${plan.returnStage}`,
                            },
                            {
                              label: "Return rule",
                              value: `${plan.readinessMinPercent}% + ${plan.transferItemsRequired} transfer`,
                            },
                            {
                              label: "Outcome",
                              value:
                                plan.readinessPercent === null
                                  ? "Not attempted yet"
                                  : `Readiness ${plan.readinessPercent}%, transfer ${
                                      plan.transferPassed === null
                                        ? "not attempted"
                                        : plan.transferPassed
                                          ? "passed"
                                          : "not passed"
                                    }, ${plan.cycles} cycle(s)`,
                            },
                          ]}
                        />
                      </div>
                      <p className="mt-3 font-mono text-xs text-ink-muted">
                        Recommended by {plan.recommendedByRuleVersion} · return rule{" "}
                        {plan.returnRuleVersion}
                      </p>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        ) : null}

        {tab === "grades" ? (
          <div className="flex flex-col gap-5">
            <Banner title="Official results only." tone="info">
              No readiness estimate appears on this tab. A grade change writes a new
              record and keeps the original — the system never changes a grade on
              its own.
            </Banner>
            {enrollments.map((e) => {
              const grade = courseGrade(e.id, e.courseTitle);
              const course = getCourse(e.courseTitle);
              const history = gradeHistory(e.id);
              const categories = d.gradeCategories.filter(
                (c) => c.courseTitle === e.courseTitle,
              );
              const lessons = course
                ? courseLessons(course)
                    .slice(0, 12)
                    .map((l) => ({
                      code: l.code,
                      assessmentId: assessmentId(l),
                      label: `${l.code} — ${assessmentId(l)}`,
                    }))
                : [];
              return (
                <Card key={e.id}>
                  <CardHeader
                    title={e.courseTitle}
                    hint={`Rule ${grade.ruleVersion}`}
                    action={
                      <p className="text-xl font-bold text-ink">
                        {grade.percent === null ? "—" : `${grade.percent}% ${grade.letter}`}
                      </p>
                    }
                  />
                  <div className="p-5">
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-muted">
                      {grade.explanation.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ol>

                    <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-ink-muted">
                      Enter or change a result
                    </h3>
                    <div className="mt-2">
                      <GradeEntryForm
                        enrollmentId={e.id}
                        lessons={lessons}
                        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                        idempotencySalt={`${e.id}:${history.length}`}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}

        {tab === "activity" ? (
          <Card>
            <CardHeader
              title="Meaningful activity"
              hint="Time responds to substantive interaction, not page-open time. Idle tracking pauses after five minutes."
            />
            <ScrollX>
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Course</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Responses</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Meaningful minutes</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-ink">Hints used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {enrollments.map((e) => {
                    const rows = currentEvidence({ enrollmentId: e.id });
                    return (
                      <tr key={e.id}>
                        <th scope="row" className="px-5 py-3 text-left font-medium text-ink">
                          {e.courseTitle}
                        </th>
                        <td className="px-5 py-3 text-ink-muted">{rows.length}</td>
                        <td className="px-5 py-3 text-ink-muted">
                          {Math.round(rows.reduce((n, r) => n + r.meaningfulMinutes, 0))}
                        </td>
                        <td className="px-5 py-3 text-ink-muted">
                          {rows.reduce((n, r) => n + r.hintsUsed, 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollX>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
