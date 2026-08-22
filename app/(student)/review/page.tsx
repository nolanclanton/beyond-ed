import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import {
  Banner,
  ButtonLink,
  Card,
  CardHeader,
  Empty,
  FactList,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { supportIsRunnable } from "@/lib/db/demo-items";
import { interventionsForStudent } from "@/lib/intervention/lifecycle";
import { INTERVENTION_STATUS_PRESENTATION } from "@/lib/intervention/status";
import { entryById, MINUTES_CAVEAT } from "@/lib/intervention/library";
import { evidenceByIds } from "@/lib/evidence/ledger";

export const metadata: Metadata = {
  title: "Review · Beyond.Ed",
  description: "Required support, keep-fresh review, and where you return to.",
};

/**
 * Review (blueprint §4).
 *
 * Required interventions, completed support, and — always — the destination
 * the student returns to. Supportive language only: no risk labels, no
 * rankings, no deficit framing (CLAUDE.md §13).
 */
export default async function ReviewPage() {
  const student = await requireUser();
  const plans = interventionsForStudent(student.id);
  const open = plans.filter(
    (p) => p.status !== "closed" && p.status !== "returned_to_pathway",
  );
  const done = plans.filter(
    (p) => p.status === "closed" || p.status === "returned_to_pathway",
  );

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Review</h1>
        <p className="mt-2 max-w-2xl text-base text-ink-muted">
          Short, targeted work your teacher picked for you — and the exact place
          you go back to when it is done.
        </p>
      </header>

      <section aria-labelledby="open" className="mt-8">
        <SectionHeading id="open" hint="Each one is a bounded skill, not a repeat of the whole lesson.">
          Assigned to you
        </SectionHeading>
        {open.length === 0 ? (
          <Empty>
            Nothing is assigned right now. That is a good sign, not an empty page.
          </Empty>
        ) : (
          <ul className="flex flex-col gap-4">
            {open.map((plan) => {
              const presentation = INTERVENTION_STATUS_PRESENTATION[plan.status];
              const entry = entryById(plan.interventionLessonId);
              const triggers = evidenceByIds(plan.triggerEvidenceIds);
              const runnable = plan.targetStandard
                ? supportIsRunnable(plan.targetStandard)
                : false;
              return (
                <Card as="li" key={plan.id}>
                  <CardHeader
                    title={entry?.target ?? plan.interventionLessonId}
                    hint={`${plan.interventionLessonId} · about ${plan.estimatedMinutes} minutes`}
                    action={<StatusChip label={presentation.label} tone={presentation.tone} />}
                  />
                  <div className="p-5">
                    <p className="text-sm text-ink">{presentation.studentMeaning}</p>

                    <div className="mt-4 rounded-lg bg-surface-sunken px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        Why you have this
                      </p>
                      <p className="mt-1 text-sm text-ink">{plan.triggerSummary}</p>
                      {triggers.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                          {triggers.map((t) => (
                            <li key={t.id}>
                              {t.lessonCode} &middot; {t.skill} &middot;{" "}
                              {t.correct ? "correct" : "missed"}
                              {t.errorCode ? ` (${t.errorCode.replace(/-/g, " ")})` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <FactList
                        items={[
                          { label: "Skill", value: plan.targetStandard ?? plan.targetSkill },
                          {
                            label: "You go back to",
                            value: `${plan.returnLessonCode}, stage ${plan.returnStage}`,
                          },
                          {
                            label: "What you have to show",
                            value: `${plan.readinessMinPercent}% on a short check, plus ${plan.transferItemsRequired} item that uses the skill in your current work`,
                          },
                          { label: "Expected", value: plan.dueExpectation },
                        ]}
                      />
                    </div>

                    <p className="mt-3 text-xs text-ink-muted">{MINUTES_CAVEAT}</p>

                    <div className="mt-5">
                      {plan.status === "escalated" ? (
                        <Banner title="Your teacher is picking this up with you." tone="notice">
                          Two rounds on this skill did not get there, so it is a
                          conversation now rather than another try on your own.
                        </Banner>
                      ) : runnable ? (
                        <ButtonLink href={`/review/${plan.id}`} emphasis="primary">
                          {plan.status === "assigned" ? "Start this support" : "Continue"}
                        </ButtonLink>
                      ) : (
                        <Banner title="This support has no authored items yet." tone="notice">
                          The plan, the return rule, and the return destination are
                          real. The lesson content and its readiness check have not
                          been written, so there is nothing to complete here yet.
                        </Banner>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="done" className="mt-10">
        <SectionHeading id="done" hint="Kept so you can see what worked.">
          Finished support
        </SectionHeading>
        {done.length === 0 ? (
          <Empty>Nothing finished yet.</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {done.map((plan) => {
              const presentation = INTERVENTION_STATUS_PRESENTATION[plan.status];
              return (
                <Card as="li" key={plan.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip label={presentation.label} tone={presentation.tone} />
                    <span className="font-mono text-xs text-ink-muted">
                      {plan.interventionLessonId}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    {plan.targetStandard ?? plan.targetSkill}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{presentation.studentMeaning}</p>
                  {plan.readinessPercent !== null ? (
                    <p className="mt-2 text-xs text-ink-muted">
                      Readiness check {plan.readinessPercent}% &middot; transfer{" "}
                      {plan.transferPassed ? "passed" : "not passed"} &middot; returned to{" "}
                      {plan.returnLessonCode}
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="keep-fresh" className="mt-10">
        <SectionHeading
          id="keep-fresh"
          hint="Retrieval practice built into each lesson, chosen by rule from what you have already learned."
        >
          Keep-fresh review
        </SectionHeading>
        <Banner title="Memory work lives inside your lessons." tone="notice">
          Your keep-fresh items appear as the Spiral Review at stage 2 of each
          lesson. There is no separate queue to work through — bringing earlier
          learning back is part of the lesson, not an extra task.
        </Banner>
      </section>
    </div>
  );
}
