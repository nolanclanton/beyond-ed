"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import {
  acceptExitTicketItemAction,
  acceptGuidedPracticeAction,
  acceptNarrativeBeatAction,
  acceptRewriteAction,
  acceptWorkedExampleAction,
  dismissProposalAction,
} from "@/lib/actions/ai-assistance";
import { ActionForm } from "@/lib/design/action-form";
import { Banner, Button, Card, CardHeader, StatusChip } from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";

/**
 * The design assistance panel (vision §12; CLAUDE.md §10.2).
 *
 * ---------------------------------------------------------------------------
 * Why this is not a chat window
 * ---------------------------------------------------------------------------
 *
 * The controls are named actions that sit beside the thing being edited, and
 * what they offer changes with what is selected. There is no message history,
 * no open-ended box, and no thread: one click is one bounded request, and the
 * request ends when the proposal arrives.
 *
 * This component imports nothing from `/lib/ai`. It cannot: it is a Client
 * Component, and everything the assistant knows — which capabilities exist,
 * what they may see, what they return — is server-side. What arrives here is a
 * proposal already validated against its schema, and what leaves is a capability
 * NAME the server checks again.
 *
 * Nothing here writes. Accepting submits one of the ordinary authoring server
 * actions, which validate the content from the form and write it the same way a
 * hand-typed edit is written.
 */

export type CapabilityOption = {
  name: string;
  label: string;
  summary: string;
  /** Advisory capabilities produce findings, not content, and commit nothing. */
  advisory: boolean;
};

export type AssistTarget = {
  courseVersionId?: string | null;
  lessonCode?: string | null;
  section?: string | null;
  narrativeId?: string | null;
  chapterId?: string | null;
  characterId?: string | null;
  /** For a rewrite: the block the selection came from. */
  blockId?: string | null;
  blockKind?: "text" | "callout" | "heading" | null;
  blockTitle?: string | null;
  blockTone?: "note" | "important" | "example" | "memory" | null;
  selection?: string | null;
  /** The standard an accepted exit-ticket item must claim. */
  standard?: string | null;
};

type Settings = Record<string, string | number | boolean>;

type Proposal = {
  generationId: string;
  capability: string;
  model: string;
  content: unknown;
  image: { dataUri: string; mimeType: string } | null;
  contextKeys: string[];
  canRegenerate: boolean;
};

type Outcome =
  | { ok: true; proposal: Proposal }
  | { ok: false; message: string; workPreserved: true };

export function AssistancePanel({
  heading,
  hint,
  capabilities,
  target,
  unavailableReason,
  seq,
}: {
  heading: string;
  hint: string;
  capabilities: CapabilityOption[];
  target: AssistTarget;
  /** Set when the assistant is off or unconfigured. Controls are not offered. */
  unavailableReason: string | null;
  /** Makes the idempotency keys on the accept forms unique to this panel. */
  seq: number;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [instruction, setInstruction] = useState("");
  const [attempt, setAttempt] = useState(0);

  const active = capabilities.find((c) => c.name === open) ?? null;

  async function run(capability: string): Promise<void> {
    setPending(true);
    setOutcome(null);
    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capability,
          instructions: instruction,
          courseVersionId: target.courseVersionId ?? null,
          lessonCode: target.lessonCode ?? null,
          section: target.section ?? null,
          selection: target.selection ?? null,
          narrativeId: target.narrativeId ?? null,
          characterId: target.characterId ?? null,
          settings,
        }),
      });
      const body = (await response.json()) as Outcome;
      setOutcome(body);
      setAttempt((n) => n + 1);
    } catch {
      // A network failure is not a lesson failure, and the sentence says so.
      setOutcome({
        ok: false,
        message:
          "Beyond.Ed could not reach design assistance. Your work has not been changed.",
        workPreserved: true,
      });
    } finally {
      setPending(false);
    }
  }

  if (unavailableReason) {
    return (
      <Card>
        <CardHeader title={heading} hint={hint} />
        <div className="p-5">
          <Banner title="Design assistance is unavailable" tone="neutral">
            <p>{unavailableReason}</p>
            <p className="mt-1">
              Everything on this page works without it. Nothing about authoring
              depends on the assistant.
            </p>
          </Banner>
        </div>
      </Card>
    );
  }

  if (capabilities.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title={heading}
        hint={hint}
        action={<StatusChip label="Gemini · proposals only" tone="info" />}
      />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap gap-2">
          {capabilities.map((c) => {
            const isOpen = open === c.name;
            return (
              <button
                key={c.name}
                type="button"
                aria-expanded={isOpen}
                onClick={() => {
                  setOpen(isOpen ? null : c.name);
                  setOutcome(null);
                  setSettings({});
                  setInstruction("");
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  isOpen
                    ? "border-primary bg-primary-surface text-primary"
                    : "border-line bg-surface text-ink hover:bg-surface-sunken"
                } ${FOCUS_RING}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {active ? (
          <div className="rounded-lg border border-line bg-surface-sunken p-4">
            <p className="text-sm text-ink-muted">{active.summary}</p>

            <CapabilitySettings
              capability={active.name}
              settings={settings}
              onChange={setSettings}
            />

            <label className="mt-3 block">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Your instruction (optional)
              </span>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Anything specific you want. The lesson, its standards, and its prerequisites are sent for you."
                className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
              />
            </label>

            <div className="mt-3 flex items-center gap-3">
              <Button
                type="button"
                emphasis="secondary"
                disabled={pending}
                onClick={() => void run(active.name)}
              >
                {pending ? "Asking…" : outcome ? "Ask again" : active.label}
              </Button>
              <p className="text-xs text-ink-muted" aria-live="polite">
                {pending
                  ? "One request. Nothing changes until you accept something."
                  : "Nothing is written until you accept."}
              </p>
            </div>
          </div>
        ) : null}

        {outcome && !outcome.ok ? (
          <Banner title={outcome.message} tone="urgent" role="alert">
            <p>Your work has not been changed.</p>
          </Banner>
        ) : null}

        {outcome && outcome.ok ? (
          <ProposalCard
            key={`${outcome.proposal.generationId}-${attempt}`}
            proposal={outcome.proposal}
            target={target}
            advisory={active?.advisory ?? false}
            seq={seq}
            onRegenerate={
              outcome.proposal.canRegenerate && active
                ? () => void run(active.name)
                : null
            }
            onCleared={() => setOutcome(null)}
          />
        ) : null}
      </div>
    </Card>
  );
}

/** A named setting with a closed list of values. */
function Choice({
  label,
  name,
  options,
  settings,
  set,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  settings: Settings;
  set: (key: string, value: string | number | boolean) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      <select
        value={String(settings[name] ?? "")}
        onChange={(e) => set(name, e.target.value)}
        className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
      >
        <option value="">Not specified</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  name,
  settings,
  set,
}: {
  label: string;
  name: string;
  settings: Settings;
  set: (key: string, value: string | number | boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={Boolean(settings[name])}
        onChange={(e) => set(name, e.target.checked)}
        className={`h-4 w-4 rounded border-line-strong ${FOCUS_RING}`}
      />
      {label}
    </label>
  );
}

/**
 * The named controls a capability offers.
 *
 * A closed set per capability, matching what the server will accept. A control
 * that produced a setting the gateway ignores would be a dead control
 * (CLAUDE.md §12), so there are none.
 */
function CapabilitySettings({
  capability,
  settings,
  onChange,
}: {
  capability: string;
  settings: Settings;
  onChange: (next: Settings) => void;
}) {
  const set = (key: string, value: string | number | boolean): void =>
    onChange({ ...settings, [key]: value });

  switch (capability) {
    case "generate_worked_example":
      return (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Choice
            label="Difficulty"
            name="difficulty"
            options={[
              { value: "introductory", label: "Introductory" },
              { value: "same", label: "Same as the lesson's examples" },
              { value: "harder", label: "Harder" },
              { value: "much_harder", label: "Noticeably harder" },
            ]}
            settings={settings}
            set={set}
          />
          <div className="flex flex-col justify-end gap-2">
            <Toggle label="Use negative numbers" name="useNegativeNumbers" settings={settings} set={set} />
            <Toggle label="More scaffolding" name="moreScaffolding" settings={settings} set={set} />
          </div>
        </div>
      );

    case "generate_guided_practice":
      return (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Choice
            label="Number of items"
            name="itemCount"
            options={[3, 4, 5, 6, 8].map((n) => ({
              value: String(n),
              label: `${n} items`,
            }))}
            settings={settings}
            set={set}
          />
          <Choice
            label="Overall level"
            name="progression"
            options={[
              { value: "introductory", label: "Introductory" },
              { value: "mixed", label: "Mixed" },
              { value: "challenging", label: "Challenging" },
            ]}
            settings={settings}
            set={set}
          />
          <Choice
            label="Narrative integration"
            name="narrativeIntegration"
            options={[
              { value: "low", label: "Low — plain mathematics" },
              { value: "medium", label: "Medium — light framing" },
              { value: "high", label: "High — inside the story" },
            ]}
            settings={settings}
            set={set}
          />
          <div className="flex flex-col justify-end gap-2">
            <Toggle label="Include word problems" name="wordProblems" settings={settings} set={set} />
            <Toggle
              label="May use a skill this lesson has not taught"
              name="mayIntroduceNewSkill"
              settings={settings}
              set={set}
            />
          </div>
        </div>
      );

    case "rewrite_selected_section":
      return (
        <div className="mt-3">
          <Choice
            label="Mode"
            name="rewriteMode"
            options={[
              { value: "clarity", label: "Improve clarity" },
              { value: "simpler_reading_level", label: "Simpler reading level" },
              { value: "more_concise", label: "More concise" },
              { value: "stronger_scaffolding", label: "Stronger scaffolding" },
              {
                value: "stronger_narrative_integration",
                label: "Stronger narrative integration",
              },
              { value: "alternate_explanation", label: "Alternate explanation" },
            ]}
            settings={settings}
            set={set}
          />
        </div>
      );

    case "draft_exit_ticket":
      return (
        <div className="mt-3">
          <Choice
            label="Number of items"
            name="itemCount"
            options={[2, 3, 4, 5].map((n) => ({
              value: String(n),
              label: `${n} items`,
            }))}
            settings={settings}
            set={set}
          />
        </div>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// The proposal
// ---------------------------------------------------------------------------

/**
 * What Gemini proposed, and the four things a designer may do about it.
 *
 * The card is visually distinct from the rest of the studio on purpose: a
 * dashed edge and a standing line saying nothing has changed. A designer should
 * never have to wonder whether they are reading their lesson or a suggestion
 * about it (vision §25).
 */
function ProposalCard({
  proposal,
  target,
  advisory,
  seq,
  onRegenerate,
  onCleared,
}: {
  proposal: Proposal;
  target: AssistTarget;
  advisory: boolean;
  seq: number;
  onRegenerate: (() => void) | null;
  onCleared: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [decided, setDecided] = useState(false);
  const key = `${proposal.generationId}:${seq}`;

  return (
    <section
      aria-label="Proposal from the design assistant"
      className="rounded-xl border-2 border-dashed border-primary-line bg-primary-surface/40 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusChip label="Proposed — not saved" tone="info" />
          <span className="text-xs text-ink-muted">{proposal.model}</span>
        </div>
        <details className="text-xs text-ink-muted">
          <summary className={`cursor-pointer ${FOCUS_RING}`}>
            What was sent
          </summary>
          <ul className="mt-1 list-inside list-disc">
            {proposal.contextKeys.map((k) => (
              <li key={k}>{k.replace(/_/g, " ")}</li>
            ))}
          </ul>
          <p className="mt-1 max-w-prose">
            Curriculum only. No student record, grade, mastery estimate, or piece
            of evidence is ever sent.
          </p>
        </details>
      </div>

      <div className="mt-3">
        <ProposalBody proposal={proposal} />
      </div>

      {decided ? null : (
        <div className="mt-4 border-t border-primary-line pt-3">
          {advisory ? (
            <>
              <p className="mb-2 text-sm text-ink-muted">
                This is analysis, not content. Nothing here can be saved into the
                lesson — act on it yourself, or leave it.
              </p>
              <DismissForm
                generationId={proposal.generationId}
                outcome="acknowledged"
                label="Mark as read"
                idempotencyKey={`${key}:ack`}
                onDone={() => {
                  setDecided(true);
                  onCleared();
                }}
              />
            </>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  emphasis="secondary"
                  onClick={() => setEditing((v) => !v)}
                  aria-expanded={editing}
                >
                  {editing ? "Stop editing" : "Edit before accepting"}
                </Button>
                {onRegenerate ? (
                  <Button type="button" emphasis="quiet" onClick={onRegenerate}>
                    Regenerate
                  </Button>
                ) : null}
              </div>
              <AcceptForm
                proposal={proposal}
                target={target}
                editing={editing}
                idempotencyKey={`${key}:accept`}
                onDone={() => setDecided(true)}
              />
              <div className="mt-3">
                <DismissForm
                  generationId={proposal.generationId}
                  outcome="rejected"
                  label="Reject"
                  idempotencyKey={`${key}:reject`}
                  onDone={() => {
                    setDecided(true);
                    onCleared();
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function DismissForm({
  generationId,
  outcome,
  label,
  idempotencyKey,
  onDone,
}: {
  generationId: string;
  outcome: "rejected" | "acknowledged";
  label: string;
  idempotencyKey: string;
  onDone: () => void;
}) {
  return (
    <ActionForm
      action={async (formData) => {
        const result = await dismissProposalAction(formData);
        if (result.ok) onDone();
        return result;
      }}
      idempotencyKey={idempotencyKey}
      successTone="info"
    >
      {(pending) => (
        <>
          <input type="hidden" name="generationId" value={generationId} />
          <input type="hidden" name="outcome" value={outcome} />
          <input
            type="hidden"
            name="reason"
            value={
              outcome === "rejected"
                ? "Designer rejected the proposal."
                : "Designer read the advisory result."
            }
          />
          <Button type="submit" emphasis="quiet" disabled={pending}>
            {pending ? "Recording…" : label}
          </Button>
        </>
      )}
    </ActionForm>
  );
}

/** A read-only field, or a textarea when the designer chose to edit it. */
function Field({
  label,
  name,
  value,
  editing,
  rows = 3,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  editing: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      {hint ? <span className="block text-xs text-ink-muted">{hint}</span> : null}
      {editing ? (
        <textarea
          name={name}
          defaultValue={value}
          rows={rows}
          className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm text-ink ${FOCUS_RING}`}
        />
      ) : (
        <>
          <input type="hidden" name={name} value={value} />
          <pre className="mt-1 whitespace-pre-wrap rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink">
            {value}
          </pre>
        </>
      )}
    </label>
  );
}

/**
 * The accept form for one capability.
 *
 * Each capability commits to a different place, so each has its own form and
 * its own server action. What is submitted is what gets written — the server
 * does not keep the proposal — which is why editing before accepting is safe.
 */
function AcceptForm({
  proposal,
  target,
  editing,
  idempotencyKey,
  onDone,
}: {
  proposal: Proposal;
  target: AssistTarget;
  editing: boolean;
  idempotencyKey: string;
  onDone: () => void;
}) {
  const content = proposal.content as Record<string, unknown>;

  const common = (
    <>
      <input type="hidden" name="generationId" value={proposal.generationId} />
      <input type="hidden" name="edited" value={editing ? "true" : "false"} />
    </>
  );

  switch (proposal.capability) {
    case "generate_worked_example": {
      const steps = (content.steps as { math?: string; explanation: string }[]) ?? [];
      const asLines = [
        `${String(content.problem ?? "")} :: The problem, as the student meets it.`,
        ...steps.map(
          (s) =>
            `${s.math ? `${s.math} — ` : ""}${s.explanation.split(".")[0]} :: ${s.explanation}`,
        ),
        `Answer: ${String(content.finalAnswer ?? "")} :: ${
          content.commonMisconception
            ? `Watch for: ${String(content.commonMisconception)}`
            : "The result, stated plainly."
        }`,
      ].join("\n");

      return (
        <ActionForm
          action={async (formData) => {
            const result = await acceptWorkedExampleAction(formData);
            if (result.ok) onDone();
            return result;
          }}
          idempotencyKey={idempotencyKey}
        >
          {(pending) => (
            <>
              {common}
              <input type="hidden" name="versionId" value={target.courseVersionId ?? ""} />
              <input type="hidden" name="lessonCode" value={target.lessonCode ?? ""} />
              <Field
                label="Steps to add to the worked model"
                name="steps"
                value={asLines}
                editing={editing}
                rows={Math.min(14, steps.length + 4)}
                hint="One per line, as `step :: the reasoning behind it`."
              />
              {content.teachingNote ? (
                <p className="text-sm text-ink-muted">
                  Teaching note, for you rather than the lesson:{" "}
                  {String(content.teachingNote)}
                </p>
              ) : null}
              <ReasonAndSubmit label={pending ? "Saving…" : "Accept into the worked model"} />
            </>
          )}
        </ActionForm>
      );
    }

    case "generate_guided_practice": {
      const items =
        (content.items as {
          prompt: string;
          hint: string;
          answer: string;
          supportLevel: string;
        }[]) ?? [];
      const asLines = items
        .map((i) => `${i.prompt} :: ${i.hint} :: ${i.answer}`)
        .join("\n");
      return (
        <ActionForm
          action={async (formData) => {
            const result = await acceptGuidedPracticeAction(formData);
            if (result.ok) onDone();
            return result;
          }}
          idempotencyKey={idempotencyKey}
        >
          {(pending) => (
            <>
              {common}
              <input type="hidden" name="versionId" value={target.courseVersionId ?? ""} />
              <input type="hidden" name="lessonCode" value={target.lessonCode ?? ""} />
              <Field
                label="Practice items"
                name="items"
                value={asLines}
                editing={editing}
                rows={Math.min(14, items.length + 3)}
                hint="One per line, as `prompt :: hint :: answer`. Support fades down the list."
              />
              <ReasonAndSubmit label={pending ? "Saving…" : "Accept into guided practice"} />
            </>
          )}
        </ActionForm>
      );
    }

    case "rewrite_selected_section": {
      return (
        <ActionForm
          action={async (formData) => {
            const result = await acceptRewriteAction(formData);
            if (result.ok) onDone();
            return result;
          }}
          idempotencyKey={idempotencyKey}
        >
          {(pending) => (
            <>
              {common}
              <input type="hidden" name="versionId" value={target.courseVersionId ?? ""} />
              <input type="hidden" name="lessonCode" value={target.lessonCode ?? ""} />
              <input type="hidden" name="blockId" value={target.blockId ?? ""} />
              <input type="hidden" name="section" value={target.section ?? ""} />
              <input type="hidden" name="kind" value={target.blockKind ?? "text"} />
              <input type="hidden" name="title" value={target.blockTitle ?? ""} />
              <input type="hidden" name="tone" value={target.blockTone ?? "note"} />
              <Field
                label="The rewritten passage"
                name="text"
                value={String(content.rewritten ?? "")}
                editing={editing}
                rows={8}
              />
              <p className="text-sm text-ink-muted">
                What changed: {String(content.whatChanged ?? "—")}
              </p>
              {Array.isArray(content.keptIntact) && content.keptIntact.length > 0 ? (
                <p className="text-sm text-ink-muted">
                  Kept unchanged: {(content.keptIntact as string[]).join(", ")}
                </p>
              ) : null}
              <ReasonAndSubmit label={pending ? "Replacing…" : "Accept and replace the passage"} />
            </>
          )}
        </ActionForm>
      );
    }

    case "draft_exit_ticket": {
      const items =
        (content.items as {
          stem: string;
          standard: string;
          correctChoice: string;
          distractors: { text: string; errorCode: string; whyAStudentPicksIt: string }[];
          rationale: string;
        }[]) ?? [];
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            Accept one item at a time. Each is checked against the standards this
            lesson claims, exactly as a hand-written item is.
          </p>
          {items.map((item, index) => (
            <ActionForm
              key={index}
              action={async (formData) => acceptExitTicketItemAction(formData)}
              idempotencyKey={`${idempotencyKey}:item${index}`}
            >
              {(pending) => (
                <div className="rounded-lg border border-line bg-surface p-3">
                  {common}
                  <input type="hidden" name="versionId" value={target.courseVersionId ?? ""} />
                  <input type="hidden" name="lessonCode" value={target.lessonCode ?? ""} />
                  <input
                    type="hidden"
                    name="standard"
                    value={target.standard ?? item.standard}
                  />
                  <Field label="Question" name="stem" value={item.stem} editing={editing} rows={2} />
                  <div className="mt-2">
                    <Field
                      label="Correct answer"
                      name="correct"
                      value={item.correctChoice}
                      editing={editing}
                      rows={1}
                    />
                  </div>
                  <div className="mt-2">
                    <Field
                      label="Wrong answers"
                      name="distractors"
                      value={item.distractors
                        .map((d) => `${d.text} :: ${d.errorCode}`)
                        .join("\n")}
                      editing={editing}
                      rows={item.distractors.length + 1}
                      hint="One per line, as `answer :: the error family it reveals`."
                    />
                  </div>
                  <div className="mt-2">
                    <Field
                      label="Explanation, shown after answering"
                      name="rationale"
                      value={item.rationale}
                      editing={editing}
                      rows={2}
                    />
                  </div>
                  <ul className="mt-2 list-inside list-disc text-xs text-ink-muted">
                    {item.distractors.map((d, i) => (
                      <li key={i}>
                        {d.errorCode}: {d.whyAStudentPicksIt}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <ReasonAndSubmit label={pending ? "Saving…" : "Accept this item"} />
                  </div>
                </div>
              )}
            </ActionForm>
          ))}
          {content.alignmentNote ? (
            <p className="text-sm text-ink-muted">{String(content.alignmentNote)}</p>
          ) : null}
        </div>
      );
    }

    case "continue_narrative":
    case "brainstorm_narrative_hooks": {
      if (!target.narrativeId || !target.chapterId) {
        return (
          <Banner title="Nowhere to save this yet" tone="neutral">
            Open this lesson&rsquo;s narrative and give it a chapter first. Then a
            proposed scene has a place to go.
          </Banner>
        );
      }
      const isHooks = proposal.capability === "brainstorm_narrative_hooks";
      const ideas = isHooks
        ? ((content.ideas as {
            title: string;
            premise: string;
            learningConnection: string;
          }[]) ?? [])
        : [];

      return (
        <div className="flex flex-col gap-4">
          {isHooks ? (
            <p className="text-sm text-ink-muted">
              Options, not a recommendation. Save whichever one you want as this
              lesson&rsquo;s beat.
            </p>
          ) : null}
          {(isHooks ? ideas : [null]).map((idea, index) => (
            <ActionForm
              key={index}
              action={async (formData) => {
                const result = await acceptNarrativeBeatAction(formData);
                if (result.ok) onDone();
                return result;
              }}
              idempotencyKey={`${idempotencyKey}:beat${index}`}
            >
              {(pending) => (
                <div className="rounded-lg border border-line bg-surface p-3">
                  {common}
                  <input type="hidden" name="narrativeId" value={target.narrativeId ?? ""} />
                  <input type="hidden" name="chapterId" value={target.chapterId ?? ""} />
                  <input type="hidden" name="lessonCode" value={target.lessonCode ?? ""} />
                  <input type="hidden" name="academicObjective" value="" />
                  {idea ? (
                    <p className="mb-2 text-sm font-semibold text-ink">{idea.title}</p>
                  ) : null}
                  <Field
                    label="What happens in the story"
                    name="narrativeEvent"
                    value={
                      idea
                        ? idea.premise
                        : `${String(content.sceneTitle ?? "")}\n\n${String(
                            content.transition ?? "",
                          )}\n\n${String(content.whatHappens ?? "")}`
                    }
                    editing={editing}
                    rows={6}
                  />
                  <div className="mt-2">
                    <Field
                      label="What the learning lets the student do"
                      name="learningUnlock"
                      value={
                        idea
                          ? idea.learningConnection
                          : String(content.learningUnlock ?? "")
                      }
                      editing={editing}
                      rows={2}
                    />
                  </div>
                  <div className="mt-3">
                    <ReasonAndSubmit
                      label={pending ? "Saving…" : "Save as this lesson's beat"}
                    />
                  </div>
                </div>
              )}
            </ActionForm>
          ))}
          <Conflicts content={content} />
          {Array.isArray(content.continuityNotes) &&
          content.continuityNotes.length > 0 ? (
            <Banner title="If you accept this, the narrative state needs updating" tone="notice">
              <ul className="list-inside list-disc">
                {(content.continuityNotes as string[]).map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
              <p className="mt-1">
                Saving a beat does not change narrative state. That is a separate
                edit, and it is yours.
              </p>
            </Banner>
          ) : null}
        </div>
      );
    }

    default:
      return (
        <Banner title="Read it, then act on it yourself" tone="neutral">
          This result has no place to be saved into. Nothing was changed.
        </Banner>
      );
  }
}

function ReasonAndSubmit({ label }: { label: string }) {
  return (
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <label className="min-w-[16rem] flex-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Reason, recorded in the history
        </span>
        <input
          name="reason"
          required
          minLength={4}
          maxLength={500}
          defaultValue="Accepted an assisted draft after review."
          className={`mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink ${FOCUS_RING}`}
        />
      </label>
      <Button type="submit" emphasis="primary">
        {label}
      </Button>
    </div>
  );
}

/**
 * Conflicts the assistant found with the canon.
 *
 * Shown prominently and never acted on. A suggestion that contradicts the
 * narrative bible is a question for the designer, not a licence to change the
 * bible (vision §24).
 */
function Conflicts({ content }: { content: Record<string, unknown> }) {
  const conflicts =
    (content.conflicts as
      | { whatConflicts: string; withWhichCanon: string; suggestion: string }[]
      | undefined) ?? [];
  if (conflicts.length === 0) return null;
  return (
    <Banner title="This conflicts with your narrative canon" tone="notice">
      <ul className="mt-1 flex flex-col gap-2">
        {conflicts.map((c, i) => (
          <li key={i}>
            <p className="font-semibold">{c.whatConflicts}</p>
            <p>Conflicts with: {c.withWhichCanon}</p>
            <p>Suggested: {c.suggestion}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2">
        Nothing in your narrative was changed. Decide which one is right.
      </p>
    </Banner>
  );
}

/** Renders a validated proposal as fields. Never as markup. */
function ProposalBody({ proposal }: { proposal: Proposal }) {
  if (proposal.image) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={proposal.image.dataUri}
        alt="Candidate image from the design assistant. Not part of any lesson."
        className="max-h-96 w-full rounded-lg border border-line object-contain"
      />
    );
  }

  const content = proposal.content as Record<string, unknown>;

  switch (proposal.capability) {
    case "brainstorm_narrative_hooks": {
      const ideas =
        (content.ideas as {
          title: string;
          premise: string;
          learningConnection: string;
          narrativePotential: string;
        }[]) ?? [];
      return (
        <ol className="flex flex-col gap-3">
          {ideas.map((idea, i) => (
            <li key={i} className="rounded-lg border border-line bg-surface p-3">
              <p className="text-sm font-semibold text-ink">{idea.title}</p>
              <p className="mt-1 text-sm text-ink">{idea.premise}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Why the mathematics is needed: {idea.learningConnection}
              </p>
              <p className="mt-0.5 text-sm text-ink-muted">
                Where it could go: {idea.narrativePotential}
              </p>
            </li>
          ))}
        </ol>
      );
    }

    case "check_lesson_alignment": {
      const findings =
        (content.findings as {
          severity: "low" | "medium" | "high";
          category: string;
          sectionId?: string;
          issue: string;
          recommendation: string;
        }[]) ?? [];
      return (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink">{String(content.overallSummary ?? "")}</p>
          {findings.length === 0 ? (
            <p className="text-sm text-ink-muted">No findings.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {findings.map((f, i) => (
                <li key={i} className="rounded-lg border border-line bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip
                      label={
                        f.severity === "high"
                          ? "High"
                          : f.severity === "medium"
                            ? "Medium"
                            : "Low"
                      }
                      tone={
                        f.severity === "high"
                          ? "attention"
                          : f.severity === "medium"
                            ? "info"
                            : "neutral"
                      }
                    />
                    <span className="text-sm font-semibold text-ink">{f.category}</span>
                    {f.sectionId ? (
                      <span className="text-xs text-ink-muted">
                        {f.sectionId.replace(/_/g, " ")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-ink">{f.issue}</p>
                  <p className="mt-1 text-sm text-ink-muted">{f.recommendation}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    case "identify_misconceptions": {
      const items =
        (content.misconceptions as {
          misconception: string;
          whyItHappens: string;
          howItShows: string;
          scaffold: string;
        }[]) ?? [];
      return (
        <ul className="flex flex-col gap-2">
          {items.map((m, i) => (
            <li key={i} className="rounded-lg border border-line bg-surface p-3">
              <p className="text-sm font-semibold text-ink">{m.misconception}</p>
              <p className="mt-1 text-sm text-ink-muted">Why: {m.whyItHappens}</p>
              <p className="mt-0.5 text-sm text-ink-muted">You would see: {m.howItShows}</p>
              <p className="mt-0.5 text-sm text-ink">Scaffold: {m.scaffold}</p>
            </li>
          ))}
        </ul>
      );
    }

    case "summarize_narrative_state": {
      const list = (label: string, values: unknown): ReactNode => {
        const items = Array.isArray(values) ? (values as string[]) : [];
        if (items.length === 0) return null;
        return (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {label}
            </p>
            <ul className="mt-0.5 list-inside list-disc text-sm text-ink">
              {items.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        );
      };
      return (
        <div className="flex flex-col gap-3">
          {list("What has happened", content.happened)}
          {list("What students know", content.studentsKnow)}
          {list("Unresolved", content.unresolvedThreads)}
          <p className="text-sm text-ink">
            Current objective: {String(content.currentObjective ?? "—")}
          </p>
          {list("Continuity risks", content.continuityRisks)}
        </div>
      );
    }

    case "create_character_variations": {
      const variations =
        (content.variations as {
          label: string;
          appearance: string;
          expression: string;
          poseOrFraming: string;
          briefForImage: string;
        }[]) ?? [];
      return (
        <ul className="flex flex-col gap-2">
          {variations.map((v, i) => (
            <li key={i} className="rounded-lg border border-line bg-surface p-3">
              <p className="text-sm font-semibold text-ink">{v.label}</p>
              <p className="mt-1 text-sm text-ink">{v.appearance}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{v.expression}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{v.poseOrFraming}</p>
              <p className="mt-1 text-sm text-ink">Image brief: {v.briefForImage}</p>
            </li>
          ))}
        </ul>
      );
    }

    case "continue_narrative": {
      return (
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-sm font-semibold text-ink">
            {String(content.sceneTitle ?? "")}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
            {String(content.transition ?? "")}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
            {String(content.whatHappens ?? "")}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            The learning lets the student: {String(content.learningUnlock ?? "")}
          </p>
        </div>
      );
    }

    case "generate_worked_example": {
      const steps = (content.steps as { math?: string; explanation: string }[]) ?? [];
      return (
        <div className="rounded-lg border border-line bg-surface p-3">
          {content.title ? (
            <p className="text-sm font-semibold text-ink">{String(content.title)}</p>
          ) : null}
          <p className="mt-1 text-sm text-ink">{String(content.problem ?? "")}</p>
          <ol className="mt-2 flex flex-col gap-1.5">
            {steps.map((s, i) => (
              <li key={i} className="text-sm text-ink">
                <span className="font-semibold">{i + 1}.</span>{" "}
                {s.math ? <span className="font-mono">{s.math}</span> : null}
                {s.math ? " — " : null}
                <span className="text-ink-muted">{s.explanation}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-sm font-semibold text-ink">
            Answer: {String(content.finalAnswer ?? "")}
          </p>
          {content.commonMisconception ? (
            <p className="mt-1 text-sm text-ink-muted">
              Common misconception: {String(content.commonMisconception)}
            </p>
          ) : null}
        </div>
      );
    }

    case "generate_guided_practice": {
      const items =
        (content.items as {
          prompt: string;
          supportLevel: string;
          hint: string;
          answer: string;
        }[]) ?? [];
      return (
        <ol className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink">{i + 1}.</span>
                <StatusChip
                  label={item.supportLevel.replace(/_/g, " ")}
                  tone={item.supportLevel === "independent" ? "positive" : "info"}
                />
              </div>
              <p className="mt-1 text-sm text-ink">{item.prompt}</p>
              {item.hint ? (
                <p className="mt-1 text-sm text-ink-muted">Hint: {item.hint}</p>
              ) : null}
              <p className="mt-1 text-sm text-ink-muted">Answer: {item.answer}</p>
            </li>
          ))}
        </ol>
      );
    }

    case "rewrite_selected_section": {
      return (
        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="whitespace-pre-wrap text-sm text-ink">
            {String(content.rewritten ?? "")}
          </p>
        </div>
      );
    }

    case "draft_exit_ticket": {
      const items =
        (content.items as {
          stem: string;
          standard: string;
          correctChoice: string;
          distractors: { text: string; errorCode: string }[];
        }[]) ?? [];
      return (
        <ol className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={i} className="rounded-lg border border-line bg-surface p-3">
              <p className="text-sm text-ink">
                <span className="font-semibold">{i + 1}.</span> {item.stem}
              </p>
              <p className="mt-1 text-sm text-positive">✓ {item.correctChoice}</p>
              {item.distractors.map((d, j) => (
                <p key={j} className="text-sm text-ink-muted">
                  ✗ {d.text} — reveals {d.errorCode}
                </p>
              ))}
            </li>
          ))}
        </ol>
      );
    }

    default:
      return (
        <pre className="whitespace-pre-wrap rounded-lg border border-line bg-surface p-3 text-sm text-ink">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
  }
}
