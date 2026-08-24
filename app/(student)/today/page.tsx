import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { assessmentDescription } from "@/lib/curriculum/catalog";
import { db } from "@/lib/db/store";
import {
  Banner,
  ButtonLink,
  Card,
  CardHeader,
  Empty,
  FactList,
  MetaItem,
  MetricTile,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { periodLabel } from "@/lib/calendar/periods";
import { studentMetrics } from "@/lib/views/metrics";
import { lessonPositionInUnit } from "@/lib/views/pathway";
import { FOCUS_RING } from "@/lib/design/tokens";
import {
  alertsFor,
  coursesFor,
  messagesFor,
  priorityActions,
  type PriorityAction,
} from "@/lib/views/student";

export const metadata: Metadata = {
  title: "Today · Beyond.Ed",
  description: "Your work for today, where you left off, and what to show next.",
};

/**
 * Student Today (blueprint §4).
 *
 * A daily decision page: no more than three prioritised actions, the exact
 * resume location, due evidence, teacher messages, and actionable alerts. The
 * target is one action from here to the exact activity.
 */
export default async function TodayPage() {
  const student = await requireUser();
  const d = db();
  const actions = priorityActions(student);
  const alerts = alertsFor(student);
  const messages = messagesFor(student);
  const courses = coursesFor(student);
  const section = d.sections.find((s) =>
    d.enrollments.some((e) => e.studentId === student.id && e.sectionId === s.id),
  );
  const metrics = studentMetrics(student);

  const [first, ...rest] = actions;

  return (
    <div className="py-6">
      <header>
        <p className="text-sm font-medium text-ink-muted">
          {section
            ? periodLabel(section.cycle, section.dayInCycle)
            : "Your school year"}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Good morning, {student.firstName}.
        </h1>
        <p className="mt-2 max-w-2xl text-base text-ink-muted">
          {actions.length === 0
            ? "Nothing is waiting on you right now."
            : `Here ${actions.length === 1 ? "is your one thing" : `are your ${actions.length} things`} for today, in the order that makes the rest easier.`}
        </p>
      </header>

      <section aria-labelledby="snapshot" className="mt-6">
        <h2 id="snapshot" className="sr-only">
          Where you stand
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            value={
              metrics.performancePercent === null
                ? "—"
                : `${metrics.performancePercent}%`
            }
            label="Overall grade"
            caption="Official results across your courses"
            tone="info"
          />
          <MetricTile
            value={
              metrics.completionPercent === null ? "—" : `${metrics.completionPercent}%`
            }
            label="Work completed"
            caption="Of the lessons you have reached so far"
            tone="positive"
          />
          <MetricTile
            value={`${metrics.courses.reduce((n, c) => n + c.lessonsComplete, 0)}`}
            label="Lessons finished"
            caption={`Across ${metrics.courses.length} courses`}
            tone="positive"
          />
          <MetricTile
            value={`${metrics.activeMinutes}`}
            label="Active minutes"
            caption="Meaningful work, not time with a page open"
          />
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Completion is how much of your work is finished. Your grade is how it
          went. They are different measures and are never combined.{" "}
          <Link
            href="/grades"
            className={`font-medium text-primary underline underline-offset-4 ${FOCUS_RING}`}
          >
            View grades
          </Link>
        </p>
      </section>

      {alerts.length > 0 ? (
        <section aria-labelledby="alerts" className="mt-6 flex flex-col gap-2">
          <h2 id="alerts" className="sr-only">
            Alerts
          </h2>
          {alerts.map((alert) => (
            <Banner key={alert.id} title={alert.title} tone={alert.tone}>
              {alert.detail}
              {alert.href ? (
                <>
                  {" "}
                  <Link href={alert.href} className={`font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}>
                    Open it
                  </Link>
                </>
              ) : null}
            </Banner>
          ))}
        </section>
      ) : null}

      {first ? (
        <section aria-labelledby="first-action" className="mt-6">
          <h2 id="first-action" className="sr-only">
            Start here
          </h2>
          <PrimaryAction action={first} />
        </section>
      ) : (
        <div className="mt-6">
          <Empty>
            No required work is open. Keep-fresh review is on your Review page
            whenever you want it.
          </Empty>
        </div>
      )}

      {rest.length > 0 ? (
        <section aria-labelledby="then" className="mt-8">
          <SectionHeading id="then">Then</SectionHeading>
          <ul className="flex flex-col gap-3">
            {rest.map((action) => (
              <SecondaryAction key={action.id} action={action} />
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card aria-labelledby="courses-heading">
          <CardHeader
            id="courses-heading"
            title="Where you are in each course"
            hint="Your exact place, not the top of a unit."
          />
          <ul className="divide-y divide-line">
            {courses.map((progress) => (
              <li key={progress.enrollment.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{progress.course.title}</p>
                  <p className="text-xs text-ink-muted">
                    {progress.daysCompleted} of {progress.daysTotal} class days
                  </p>
                </div>
                {progress.current ? (
                  <p className="mt-1 text-sm text-ink-muted">
                    <Link
                      href={progress.current.href}
                      className={`font-medium text-primary underline underline-offset-4 ${FOCUS_RING}`}
                    >
                      {progress.current.topic}
                    </Link>
                    <span className="block text-xs">
                      Unit {progress.current.unit.id}: {progress.current.unit.name}
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-ink-muted">Course complete.</p>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card aria-labelledby="messages-heading">
          <CardHeader
            id="messages-heading"
            title="Messages"
            hint="From people, not from the system."
          />
          {messages.length === 0 ? (
            <div className="p-5">
              <Empty>No messages.</Empty>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {messages.slice(0, 4).map((message) => {
                const from = d.users.find((u) => u.id === message.fromUserId);
                return (
                  <li key={message.id} className="px-5 py-4">
                    <p className="text-sm font-semibold text-ink">{message.subject}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {message.isHelpRequest && from?.id === student.id
                        ? "You asked for help — waiting on your teacher"
                        : `From ${from?.firstName} ${from?.lastName}`}
                    </p>
                    <p className="mt-1.5 text-sm text-ink-muted">{message.body}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function PrimaryAction({ action }: { action: PriorityAction }) {
  const position =
    action.kind === "lesson"
      ? lessonPositionInUnit(
          db().enrollments.find((e) => e.id === action.location.enrollmentId) ??
            ({} as never),
          action.location.lesson.code,
        )
      : null;
  return (
    <Card className="border-primary-line">
      <div className="border-b border-primary-line bg-primary-surface px-5 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Start here
        </p>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip label={action.statusLabel} tone="info" />
          <MetaItem>{action.effort}</MetaItem>
        </div>
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">
          {action.title}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">{action.statusMeaning}</p>

        <div className="mt-4 rounded-lg bg-surface-sunken px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Why this
          </p>
          <p className="mt-1 text-sm text-ink">{action.reason}</p>
        </div>

        {action.kind === "intervention" ? (
          <div className="mt-4">
            <FactList
              items={[
                { label: "You return to", value: action.returnTo },
                { label: "What you need to show", value: action.returnRule },
              ]}
            />
          </div>
        ) : (
          <div className="mt-4">
            <FactList
              items={[
                {
                  label: "Unit",
                  value: `${action.location.unit.id} — ${action.location.unit.name}`,
                },
                {
                  label: "Where you are in the unit",
                  value: position
                    ? `Lesson ${position.index} of ${position.total}`
                    : action.location.instructionalSection,
                },
                {
                  label: "What you will show",
                  value: assessmentDescription(action.location.lesson),
                },
              ]}
            />
          </div>
        )}

        <div className="mt-5">
          <ButtonLink href={action.href} emphasis="primary">
            {action.kind === "intervention" ? "Open this support" : "Open this lesson"}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

function SecondaryAction({ action }: { action: PriorityAction }) {
  return (
    <Card as="li" className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip label={action.statusLabel} tone="neutral" />
        <MetaItem>{action.effort}</MetaItem>
      </div>
      <h3 className="mt-2 text-base font-semibold text-ink">{action.title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{action.reason}</p>
      <div className="mt-3">
        <ButtonLink href={action.href}>Open</ButtonLink>
      </div>
    </Card>
  );
}
