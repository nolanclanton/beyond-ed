/**
 * What the assistant is allowed to return (vision §8; CLAUDE.md §10.2).
 *
 * Every capability declares one Zod schema, and the JSON Schema sent to Gemini
 * is DERIVED from it. One definition means the shape we ask for and the shape we
 * accept cannot drift apart — and a response that does not parse is refused
 * rather than displayed, so a malformed answer fails safely instead of putting
 * something shapeless in front of a designer (vision §29.11).
 *
 * ---------------------------------------------------------------------------
 * Structure is the safety mechanism, not a convenience
 * ---------------------------------------------------------------------------
 *
 * The assistant never returns markup. It returns fields, and Beyond.Ed renders
 * them with its own components — so there is no path from a generated string to
 * injected HTML, and a proposal looks like the rest of the product rather than
 * like whatever the model felt like emitting.
 *
 * Several schemas encode a product rule rather than merely a shape. An exit
 * ticket's distractors each carry the error family they reveal, because a wrong
 * choice with no error behind it is a mark rather than a diagnosis (ADR 0010).
 * Narrative capabilities carry a `conflicts` list, because a proposal that
 * contradicts the canon must say so rather than quietly overwrite it (vision
 * §24).
 */
import { z } from "zod";

/** Nothing generated is longer than a person will actually read. */
const short = z.string().min(1).max(300);
const line = z.string().min(1).max(800);
const passage = z.string().min(1).max(4000);

/**
 * A contradiction the assistant noticed between what it was asked for and the
 * canon it was given. Surfaced, never acted on.
 */
const Conflict = z.object({
  whatConflicts: line,
  withWhichCanon: line,
  suggestion: line,
});

// ---------------------------------------------------------------------------
// Narrative
// ---------------------------------------------------------------------------

export const BrainstormNarrativeHooks = z.object({
  ideas: z
    .array(
      z.object({
        title: short,
        premise: line,
        /** What makes the mathematics necessary rather than decorative. */
        learningConnection: line,
        narrativePotential: line,
      }),
    )
    .min(3)
    .max(5),
});

export const ContinueNarrative = z.object({
  sceneTitle: short,
  /** How this lesson picks up from the last one. */
  transition: passage,
  whatHappens: passage,
  /** What learning the objective lets the student DO in the story. */
  learningUnlock: line,
  /** Facts a designer should add to narrative state if they accept this. */
  continuityNotes: z.array(line).max(6),
  conflicts: z.array(Conflict).max(5),
});

export const SummarizeNarrativeState = z.object({
  happened: z.array(line).max(12),
  studentsKnow: z.array(line).max(12),
  unresolvedThreads: z.array(line).max(12),
  currentObjective: line,
  /** Places the next lesson could break continuity. Advisory. */
  continuityRisks: z.array(line).max(6),
});

export const CreateCharacterVariations = z.object({
  variations: z
    .array(
      z.object({
        label: short,
        appearance: line,
        expression: line,
        poseOrFraming: line,
        /** A brief a designer could hand to the visual studio unchanged. */
        briefForImage: line,
      }),
    )
    .min(2)
    .max(5),
  conflicts: z.array(Conflict).max(5),
});

// ---------------------------------------------------------------------------
// Instruction
// ---------------------------------------------------------------------------

export const REWRITE_MODES = [
  "clarity",
  "simpler_reading_level",
  "more_concise",
  "stronger_scaffolding",
  "stronger_narrative_integration",
  "alternate_explanation",
] as const;

export type RewriteMode = (typeof REWRITE_MODES)[number];

export const REWRITE_MODE_LABEL: Record<RewriteMode, string> = {
  clarity: "Improve clarity",
  simpler_reading_level: "Simpler reading level",
  more_concise: "More concise",
  stronger_scaffolding: "Stronger scaffolding",
  stronger_narrative_integration: "Stronger narrative integration",
  alternate_explanation: "Alternate explanation",
};

export const RewriteSelectedSection = z.object({
  rewritten: passage,
  /** Stated plainly so a designer can check the change before accepting it. */
  whatChanged: line,
  /** Terms, notation, and claims the rewrite preserved on purpose. */
  keptIntact: z.array(short).max(10),
});

export const GenerateWorkedExample = z.object({
  title: short.optional(),
  problem: line,
  steps: z
    .array(
      z.object({
        /** Plain-text notation. Rendered as text; never as markup. */
        math: short.optional(),
        explanation: line,
      }),
    )
    .min(2)
    .max(10),
  finalAnswer: short,
  commonMisconception: line.optional(),
  teachingNote: line.optional(),
});

export const SUPPORT_LEVELS = ["guided", "partially_guided", "independent"] as const;

export const GenerateGuidedPractice = z.object({
  items: z
    .array(
      z.object({
        prompt: line,
        supportLevel: z.enum(SUPPORT_LEVELS),
        /** The scaffold a student sees when they ask. Empty for independent. */
        hint: line,
        answer: short,
        explanation: line.optional(),
      }),
    )
    .min(1)
    .max(8),
});

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

/**
 * A drafted exit-ticket item.
 *
 * The shape is the alignment rule. Every distractor names the error family it
 * reveals, because that is what the recommendation engine reads (CLAUDE.md §8),
 * and an item whose wrong answers mean nothing produces evidence nobody can act
 * on. `standard` is echoed back so a designer can see at a glance whether the
 * item claims the standard the lesson actually teaches — the server checks it
 * again at acceptance regardless.
 */
export const DraftExitTicket = z.object({
  items: z
    .array(
      z.object({
        stem: line,
        standard: short,
        correctChoice: short,
        distractors: z
          .array(
            z.object({
              text: short,
              /** The error family a student choosing this has made. */
              errorCode: short,
              whyAStudentPicksIt: line,
            }),
          )
          .min(1)
          .max(5),
        rationale: line,
      }),
    )
    .min(1)
    .max(6),
  alignmentNote: line,
});

export const IdentifyMisconceptions = z.object({
  misconceptions: z
    .array(
      z.object({
        misconception: line,
        whyItHappens: line,
        /** What a teacher would actually see a student do. */
        howItShows: line,
        scaffold: line,
      }),
    )
    .min(1)
    .max(8),
});

export const SEVERITIES = ["low", "medium", "high"] as const;

export const CheckLessonAlignment = z.object({
  overallSummary: passage,
  findings: z
    .array(
      z.object({
        severity: z.enum(SEVERITIES),
        category: short,
        /** Which lesson stage the finding is about, when it is about one. */
        sectionId: short.optional(),
        issue: line,
        recommendation: line,
      }),
    )
    .max(20),
});

// ---------------------------------------------------------------------------
// Visual
// ---------------------------------------------------------------------------

/**
 * Visual generation returns an image, not JSON, so it has no output schema. The
 * prompt is assembled server-side from the visual bible and the designer's
 * brief; what comes back is a candidate and nothing else — see
 * `lib/narrative/assets.ts`.
 */
export const GenerateVisualAsset = z.object({
  imageDataUri: z.string().min(1),
  mimeType: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Registry of shapes
// ---------------------------------------------------------------------------

export const OUTPUT_SCHEMAS = {
  brainstorm_narrative_hooks: BrainstormNarrativeHooks,
  continue_narrative: ContinueNarrative,
  rewrite_selected_section: RewriteSelectedSection,
  generate_worked_example: GenerateWorkedExample,
  generate_guided_practice: GenerateGuidedPractice,
  draft_exit_ticket: DraftExitTicket,
  identify_misconceptions: IdentifyMisconceptions,
  check_lesson_alignment: CheckLessonAlignment,
  summarize_narrative_state: SummarizeNarrativeState,
  create_character_variations: CreateCharacterVariations,
  generate_visual_asset: GenerateVisualAsset,
} as const;

export type OutputSchemaName = keyof typeof OUTPUT_SCHEMAS;

/**
 * The JSON Schema for a capability's output, derived from its Zod schema.
 *
 * `$schema` is stripped: it is metadata about the dialect and the API has no
 * use for it. Everything else — required fields, enums, array bounds, and
 * `additionalProperties: false` — is exactly what the validator will enforce
 * when the answer comes back.
 */
export function jsonSchemaFor(name: OutputSchemaName): Record<string, unknown> {
  const schema = z.toJSONSchema(OUTPUT_SCHEMAS[name], { io: "output" }) as Record<
    string,
    unknown
  >;
  delete schema["$schema"];
  return schema;
}

export type ProposalFor<N extends OutputSchemaName> = z.infer<(typeof OUTPUT_SCHEMAS)[N]>;

/**
 * Parses and validates a response body.
 *
 * Returns a discriminated result rather than throwing, because "the model
 * returned something we cannot use" is a normal outcome the interface has a
 * sentence for, not an exception (vision §28).
 */
export function validateOutput(
  name: OutputSchemaName,
  raw: string,
): { ok: true; value: unknown } | { ok: false; message: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      message:
        "The design assistant returned something Beyond.Ed could not read. Nothing was changed — try again.",
    };
  }
  const result = OUTPUT_SCHEMAS[name].safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      message:
        "The design assistant returned a result in the wrong shape, so it was discarded. Nothing was changed — try again.",
    };
  }
  return { ok: true, value: result.data };
}
