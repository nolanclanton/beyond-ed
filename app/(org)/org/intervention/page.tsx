import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  PreviewAction,
  ScrollX,
  SectionHeading,
} from "@/lib/design/primitives";
import {
  SUPPORTS,
  SUPPORT_MINUTES,
  supportCategories,
  supportCountBySubject,
} from "@/lib/intervention/bank";
import { INTERVENTION_STATUSES, INTERVENTION_STATUS_PRESENTATION } from "@/lib/intervention/status";
import { INTERVENTION_TRANSITIONS } from "@/lib/intervention/transitions";
import {
  ANTI_LOOP_MAX_CYCLES,
  DEFAULT_RETURN_RULE,
  EXIT_BANDS,
  MIN_GROUP_SIZE,
  RULE_VERSIONS,
} from "@/lib/rules/versions";

export const metadata: Metadata = {
  title: "Intervention system · Beyond.Ed",
  description: "Triggers, severity bands, approved content, exit rules, and outcomes.",
};

/**
 * Intervention configuration (blueprint §6).
 *
 * Every rule the engine uses is shown here with its version. Changing one means
 * adding a version, never editing one in place — historical calculations must
 * keep resolving to the version in force at the time (CLAUDE.md §7).
 */
export default async function OrgInterventionPage() {
  await requireUser();
  const d = db();
  const bySubject = supportCountBySubject();
  const categories = supportCategories();
  const plans = d.interventions;

  const recurrence = new Map<string, number>();
  for (const p of plans) {
    recurrence.set(p.targetSkill, (recurrence.get(p.targetSkill) ?? 0) + 1);
  }
  const recurring = [...recurrence.entries()].filter(([, n]) => n > 1);

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Intervention system</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Triggers, severity bands, approved content, exit rules, effectiveness,
          recurrence, and privacy-protective equity monitoring.
        </p>
      </header>

      <div className="mt-5">
        <Banner title="Rules are versioned, and every calculation stores the version it used." tone="info">
          Recomputing with the stored version reproduces the stored output exactly.
          Changing a rule adds a version; it never edits one in place, because a
          historical result must keep resolving to the rule in force at the time.
        </Banner>
      </div>

      <section aria-labelledby="rules" className="mt-8">
        <SectionHeading id="rules" hint="Currently in force.">
          Rule versions
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <tbody className="divide-y divide-line">
                {Object.entries(RULE_VERSIONS).map(([key, version]) => (
                  <tr key={key}>
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                      {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </th>
                    <td className="px-5 py-2.5 font-mono text-xs text-ink-muted">{version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="bands" className="mt-10">
        <SectionHeading id="bands" hint={`Rule ${RULE_VERSIONS.exitBands}. Rules, not judgment calls.`}>
          Exit Ticket decision bands
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Score</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Outcome</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">What it means</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {EXIT_BANDS.map((b) => (
                  <tr key={b.id}>
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                      {b.label}
                    </th>
                    <td className="px-5 py-2.5 font-mono text-xs text-ink-muted">
                      {b.outcome.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-2.5 text-xs text-ink-muted">{b.teacherMeaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
          <p className="border-t border-line px-5 py-3 text-xs text-ink-muted">
            Anti-loop rule: after {ANTI_LOOP_MAX_CYCLES} unsuccessful cycles on the
            same skill, the case routes to teacher review rather than a third retry.
          </p>
        </Card>
      </section>

      <section aria-labelledby="return" className="mt-10">
        <SectionHeading id="return" hint={`Rule ${DEFAULT_RETURN_RULE.version}.`}>
          Default return rule
        </SectionHeading>
        <Card className="p-5">
          <p className="text-base font-semibold text-ink">{DEFAULT_RETURN_RULE.label}</p>
          <p className="mt-1.5 text-sm text-ink-muted">{DEFAULT_RETURN_RULE.description}</p>
          <div className="mt-4">
            <PreviewAction
              label="Configure a different return rule"
              detail="Not built. A different rule must be versioned, applied only to plans created after it, and leave historical calculations resolving to the rule in force at the time. Until that is real, this control does nothing."
            />
          </div>
        </Card>
      </section>

      <section aria-labelledby="lifecycle" className="mt-10">
        <SectionHeading
          id="lifecycle"
          hint="Implemented as an explicit transition table. Illegal transitions raise; status is never set by direct assignment."
        >
          Intervention lifecycle
        </SectionHeading>
        <Card>
          <ScrollX>
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">State</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Meaning to the student</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Legal next states</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {INTERVENTION_STATUSES.map((s) => (
                  <tr key={s}>
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                      {INTERVENTION_STATUS_PRESENTATION[s].label}
                    </th>
                    <td className="px-5 py-2.5 text-xs text-ink-muted">
                      {INTERVENTION_STATUS_PRESENTATION[s].studentMeaning}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-xs text-ink-muted">
                      {INTERVENTION_TRANSITIONS[s].join(", ") || "terminal"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="library" className="mt-10">
        <SectionHeading
          id="library"
          hint={`${SUPPORTS.length} supports, ${SUPPORT_MINUTES} minutes each. Reusable across courses — the 40-day reserve is capacity, not content, which is why a course cannot spend it.`}
        >
          The support bank
        </SectionHeading>
        <Card>
          <CardHeader
            title="What the bank holds"
            hint={bySubject.map((s) => `${s.subject} ${s.supports}`).join(" · ")}
          />
          <ScrollX>
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Subject</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Category</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Supports</th>
                  <th scope="col" className="px-5 py-3 font-semibold text-ink">Basic skills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {categories.map((group) => (
                  <tr key={`${group.subject}-${group.category}`}>
                    <th scope="row" className="px-5 py-2.5 text-left font-medium text-ink">
                      {group.subject}
                    </th>
                    <td className="px-5 py-2.5 text-xs text-ink">{group.category}</td>
                    <td className="px-5 py-2.5 text-ink-muted">{group.supports.length}</td>
                    <td className="px-5 py-2.5 text-xs text-ink-muted">
                      {group.supports.map((s) => s.skill).join(" · ")}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-line-strong font-semibold">
                  <th scope="row" className="px-5 py-2.5 text-left text-ink">
                    Total
                  </th>
                  <td className="px-5 py-2.5" />
                  <td className="px-5 py-2.5 text-ink">{SUPPORTS.length}</td>
                  <td className="px-5 py-2.5 text-xs text-ink-muted">
                    Each names its own diagnostic trigger and exit criterion.
                  </td>
                </tr>
              </tbody>
            </table>
          </ScrollX>
        </Card>
      </section>

      <section aria-labelledby="equity" className="mt-10">
        <SectionHeading
          id="equity"
          hint={`Group sizes below ${MIN_GROUP_SIZE} are suppressed rather than reported.`}
        >
          Recurrence and equity monitoring
        </SectionHeading>
        <Card className="p-5">
          {recurring.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No skill has produced more than one support plan yet.
            </p>
          ) : (
            <ul className="space-y-1.5 text-sm text-ink">
              {recurring.map(([skill, n]) => (
                <li key={skill}>
                  <span className="font-mono text-xs">{skill}</span> &mdash; {n} plans
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-ink-muted">
            Equity monitoring by demographic group is deliberately not shown: this
            organization is below the minimum group size, and a filtered aggregate
            at this scale would identify individuals.
          </p>
        </Card>
      </section>
    </div>
  );
}
