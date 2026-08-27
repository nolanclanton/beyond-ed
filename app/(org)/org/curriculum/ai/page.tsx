import type { Metadata } from "next";

import { FORBIDDEN_CAPABILITIES } from "@/lib/ai/capabilities";
import { AI_CONFIG, FEATURES, isGeminiConfigured } from "@/lib/ai/config";
import { capabilityCatalog } from "@/lib/ai/gateway";
import { usageByCapability, usageByUser } from "@/lib/ai/generations";
import { canAdministerCurriculum } from "@/lib/auth/scope";
import { requireUser } from "@/lib/auth/session";
import {
  Banner,
  ButtonLink,
  Card,
  CardHeader,
  Empty,
  FactList,
  MetricTile,
  ScrollX,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

import { CapabilityToggle } from "./capability-forms";

export const metadata: Metadata = {
  title: "Design assistance · Beyond.Ed",
  description:
    "What the curriculum design assistant may do, what it may never do, and how much it is being used.",
};

/**
 * The AI configuration page (vision §20; CLAUDE.md §10.2).
 *
 * ---------------------------------------------------------------------------
 * Why the dangerous list has no switches
 * ---------------------------------------------------------------------------
 *
 * The second table on this page lists actions the assistant will never perform.
 * They are not toggles set to off. There is no registry entry, no context
 * builder, no output schema, and no write path for any of them, so there is
 * nothing a switch could turn on — and a switch that LOOKED like it might is
 * worse than no switch at all, because it invites someone to try.
 *
 * Making one of them real would mean writing the code, which is a §15
 * escalation. The page says so rather than implying it is a setting.
 */
export default async function AiConfigurationPage() {
  const actor = await requireUser();

  if (!canAdministerCurriculum(actor)) {
    return (
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Design assistance</h1>
        <div className="mt-6">
          <Banner title="This page is for a curriculum administrator" tone="neutral">
            <p>
              Managing which assistance capabilities exist is a separate
              authorization from authoring with them. An organization
              administrator grants it.
            </p>
            <p className="mt-2">
              <ButtonLink href="/org/curriculum/build">Back to the studio</ButtonLink>
            </p>
          </Banner>
        </div>
      </div>
    );
  }

  const capabilities = capabilityCatalog(actor.orgId);
  const usage = usageByCapability(actor.orgId);
  const byUser = usageByUser(actor.orgId);
  const totals = usage.reduce(
    (acc, row) => ({
      requests: acc.requests + row.requests,
      accepted: acc.accepted + row.accepted,
      inputTokens: acc.inputTokens + row.inputTokens,
      outputTokens: acc.outputTokens + row.outputTokens,
    }),
    { requests: 0, accepted: 0, inputTokens: 0, outputTokens: 0 },
  );

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Design assistance</h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          What the curriculum design assistant may do, what it will never do, and
          how much of what it proposes people actually keep.
        </p>
      </header>

      <section aria-labelledby="state" className="mt-8">
        <SectionHeading id="state" hint="Set by environment variable, changed by a deploy.">
          Current state
        </SectionHeading>
        <Card>
          <div className="p-5">
            <FactList
              columns={2}
              items={[
                {
                  label: "Curriculum Design Studio",
                  value: FEATURES.curriculumStudio ? "On" : "Off",
                },
                {
                  label: "Gemini credential",
                  value: isGeminiConfigured()
                    ? "Configured on the server"
                    : "Not configured — authoring works, assistance does not",
                },
                {
                  label: "Text assistance",
                  value: FEATURES.assistant ? "On" : "Off",
                },
                {
                  label: "Visual generation",
                  value: FEATURES.visualGeneration
                    ? "On"
                    : "Off — costs more and needs a visual bible to be worth anything",
                },
                { label: "Text model", value: AI_CONFIG.textModel },
                { label: "Image model", value: AI_CONFIG.imageModel },
                {
                  label: "Request ceiling",
                  value: `${AI_CONFIG.limits.requestsPerWindow} per person per ${Math.round(
                    AI_CONFIG.limits.windowMs / 60_000,
                  )} minutes`,
                },
                {
                  label: "Timeout",
                  value: `${Math.round(AI_CONFIG.limits.timeoutMs / 1000)} seconds`,
                },
              ]}
            />
          </div>
        </Card>
        <div className="mt-3">
          <Banner title="The studio does not depend on this" tone="info">
            Every part of authoring — lessons, narratives, the bank, assets,
            review, publication — works with all of the above switched off.
            Assistance is an accelerator, never a dependency.
          </Banner>
        </div>
      </section>

      <section aria-labelledby="available" className="mt-9">
        <SectionHeading
          id="available"
          hint="Each is a bounded, human-initiated operation that returns a proposal and writes nothing. Turning one off removes it from every author's panel in your organization."
        >
          What it can do
        </SectionHeading>
        <Card>
          <ul className="divide-y divide-line">
            {capabilities.map((c, index) => {
              const deploymentBlocked =
                !FEATURES.assistant ||
                (c.modality === "image" && !FEATURES.visualGeneration);
              return (
                <li key={c.name} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-[18rem] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-ink">{c.label}</p>
                        <StatusChip
                          label={c.enabled ? "On" : "Off"}
                          tone={c.enabled ? "positive" : "neutral"}
                        />
                        {c.modality === "image" ? (
                          <StatusChip label="Image" tone="info" />
                        ) : null}
                        <StatusChip label="Human approval required" tone="info" />
                      </div>
                      <p className="mt-1 max-w-2xl text-sm text-ink-muted">{c.summary}</p>
                      <p className="mt-1 font-mono text-xs text-ink-muted">{c.name}</p>

                      {c.enabled && deploymentBlocked ? (
                        <p className="mt-2 text-sm text-recall">
                          Allowed by your organization, but unavailable in this
                          deployment
                          {c.modality === "image" && !FEATURES.visualGeneration
                            ? " because visual generation is switched off."
                            : " because design assistance is switched off."}
                        </p>
                      ) : null}

                      {c.decided ? (
                        <p className="mt-2 text-xs text-ink-muted">
                          Decided by {c.changedByName ?? "a colleague"}
                          {c.reason ? `: ${c.reason}` : "."}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-ink-muted">
                          Following the shipped default.
                        </p>
                      )}

                      <details className="mt-2">
                        <summary
                          className={`cursor-pointer text-xs text-ink-muted ${FOCUS_RING}`}
                        >
                          What it may see
                        </summary>
                        <ul className="mt-1 list-inside list-disc text-xs text-ink-muted">
                          {c.allowedContext.map((k) => (
                            <li key={k}>{k.replace(/_/g, " ")}</li>
                          ))}
                        </ul>
                      </details>
                    </div>

                    <div className="min-w-[12rem]">
                      <CapabilityToggle
                        capability={c.name}
                        label={c.label}
                        enabled={c.enabled}
                        decided={c.decided}
                        seq={index}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <p className="mt-3 max-w-3xl text-sm text-ink-muted">
          No capability sees a student record, an enrollment, a grade, a mastery
          estimate, a piece of evidence, or an intervention. There is no context
          builder for any of them, so no capability can ask for one.
        </p>
      </section>

      <section aria-labelledby="never" className="mt-9">
        <SectionHeading
          id="never"
          hint="Not switches set to off. There is no code path for any of these."
        >
          What it cannot do
        </SectionHeading>
        <Card>
          <ul className="divide-y divide-line">
            {FORBIDDEN_CAPABILITIES.map((f) => (
              <li key={f.name} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-3">
                <div className="min-w-[14rem]">
                  <p className="font-mono text-sm text-ink">{f.name}</p>
                  <StatusChip label="Not available" tone="neutral" />
                </div>
                <p className="max-w-2xl flex-1 text-sm text-ink-muted">{f.why}</p>
              </li>
            ))}
          </ul>
        </Card>
        <div className="mt-3">
          <Banner title="Structurally unavailable, not disabled" tone="notice">
            None of these has a registry entry, a context builder, an output
            schema, or a write path. There is nothing here to switch on. Making
            one real would require writing it, which is a decision for a person,
            recorded as one.
          </Banner>
        </div>
      </section>

      <section aria-labelledby="usage" className="mt-9">
        <SectionHeading
          id="usage"
          hint="A capability with many requests and few acceptances is one that is not working."
        >
          Usage
        </SectionHeading>

        {totals.requests === 0 ? (
          <Empty>Nobody has used design assistance yet.</Empty>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile value={`${totals.requests}`} label="Requests" caption="All time" />
              <MetricTile
                value={`${totals.accepted}`}
                label="Accepted"
                caption={`${Math.round((totals.accepted / totals.requests) * 100)}% of requests`}
                tone="positive"
              />
              <MetricTile
                value={totals.inputTokens.toLocaleString()}
                label="Input tokens"
                caption="As reported by Gemini"
              />
              <MetricTile
                value={totals.outputTokens.toLocaleString()}
                label="Output tokens"
                caption="As reported by Gemini"
              />
            </div>

            <div className="mt-4">
              <Card>
                <CardHeader title="By capability" />
                <ScrollX>
                  <table className="w-full min-w-[40rem] border-collapse text-sm">
                    <caption className="sr-only">
                      Design-assistance usage by capability.
                    </caption>
                    <thead>
                      <tr className="border-b border-line text-left">
                        <Th>Capability</Th>
                        <Th>Requests</Th>
                        <Th>Accepted</Th>
                        <Th>Rejected</Th>
                        <Th>Failed</Th>
                        <Th>Tokens out</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.map((row) => (
                        <tr key={row.capability} className="border-b border-line">
                          <Td>{row.capability.replace(/_/g, " ")}</Td>
                          <Td>{row.requests}</Td>
                          <Td>{row.accepted}</Td>
                          <Td>{row.rejected}</Td>
                          <Td>{row.failed}</Td>
                          <Td>{row.outputTokens.toLocaleString()}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollX>
              </Card>
            </div>

            <div className="mt-4">
              <Card>
                <CardHeader
                  title="By person"
                  hint="For accountability, not for ranking anyone."
                />
                <ul className="divide-y divide-line">
                  {byUser.map((row) => (
                    <li
                      key={row.userId}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                    >
                      <p className="text-sm text-ink">{row.name}</p>
                      <p className="text-sm text-ink-muted">
                        {row.requests} {row.requests === 1 ? "request" : "requests"},{" "}
                        {row.accepted} accepted
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="how" className="mt-9">
        <SectionHeading id="how" hint="The shape of every request, without exception.">
          How a request works
        </SectionHeading>
        <Card>
          <ol className="divide-y divide-line">
            {[
              "A person clicks one named control beside the thing they are editing.",
              "The server checks the capability is in the registry. A name that is not is refused before any record is read.",
              "The server checks the person holds curriculum authoring, and any grant the capability requires.",
              "The server assembles only the context the capability declares — curriculum records, never a student.",
              "One call is made. No tools, no agent, no environment, no background execution, no conversation to continue.",
              "The answer is validated against the capability's schema. One that does not parse is discarded.",
              "A proposal is shown. Nothing has changed.",
              "The person accepts, edits and accepts, regenerates, or rejects.",
              "Only accepting writes anything, through the same validated, audited path a hand-typed edit uses.",
              "The generation record says what was asked and what became of it.",
            ].map((step, index) => (
              <li key={index} className="flex gap-3 px-5 py-3">
                <span className="text-sm font-semibold text-primary">{index + 1}.</span>
                <span className="text-sm text-ink">{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top text-sm text-ink">{children}</td>;
}
