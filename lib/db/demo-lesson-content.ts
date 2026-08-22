/**
 * ============================================================================
 * DEMO INSTRUCTIONAL CONTENT — NOT AUTHORED CURRICULUM
 * ============================================================================
 *
 * The blueprint specifies the ten-stage lesson structure and what each stage is
 * for. It does not supply instructional text. CLAUDE.md §14 forbids inventing
 * curriculum, so this file is marked as demonstration content and every surface
 * that renders it says so.
 *
 * Only the six lessons with an authored item bank have content here. Every
 * other lesson renders its curriculum record — sequence, standards, assessment
 * evidence, linked intervention — and states plainly that its instruction has
 * not been authored.
 */

export type LessonContent = {
  /** Stage 3 — introduction and relevance. */
  relevance: string;
  /** Stage 4 — goal and success criteria. */
  goal: string;
  successCriteria: string[];
  /** Stage 5 — accessible instruction. */
  instruction: string[];
  vocabulary: { term: string; meaning: string }[];
  /** Stage 6 — worked model, exposing the reasoning rather than the answer. */
  workedModel: { step: string; reasoning: string }[];
  /** Stage 7 — guided practice with fading support. */
  guidedPractice: { prompt: string; hint: string; answer: string }[];
  /** Stage 8 — independent application. */
  independentTask: string;
  /** Stage 1 — the notes or workbook record, printable from every lesson. */
  notesOutline: string[];
};

const CONTENT: Record<string, LessonContent> = {
  "M6-U1-L2": {
    relevance:
      "Two stores sell the same pens at different pack sizes and prices. Neither price tag answers the question you actually have, which is what one pen costs. A unit rate is the move that makes different-sized offers comparable.",
    goal: "Find and use a unit rate to compare two quantities measured in different units.",
    successCriteria: [
      "I can say which quantity to divide by, and why the words 'per' or 'each' tell me.",
      "I can state a unit rate with both of its units attached.",
      "I can use a unit rate to compare two options and say by how much.",
      "I can tell a multiplicative comparison from an additive one.",
    ],
    instruction: [
      "A ratio compares two quantities. A rate is a ratio where the two quantities have different units — miles and gallons, dollars and pens, cups and batches.",
      "A unit rate is a rate written 'per one' of the second quantity. To get it, divide the first quantity by the second. The unit that follows the word 'per' is always the one you divide by.",
      "Getting the division backwards does not give a wrong number — it gives the answer to a different question. 3 cups ÷ 2 batches is cups per batch. 2 ÷ 3 is batches per cup. Both are real; only one answers what was asked.",
    ],
    vocabulary: [
      { term: "Rate", meaning: "A comparison of two quantities with different units." },
      { term: "Unit rate", meaning: "A rate stated per one unit of the second quantity." },
      {
        term: "Multiplicative comparison",
        meaning: "A comparison using 'times as many', not 'more than'.",
      },
    ],
    workedModel: [
      {
        step: "A car travels 150 miles on 5 gallons. Find miles per gallon.",
        reasoning: "The phrase 'miles per gallon' names the units in order: miles first, gallons second.",
      },
      {
        step: "Divide 150 by 5.",
        reasoning: "'Per gallon' means per ONE gallon, so divide by the number of gallons.",
      },
      {
        step: "150 ÷ 5 = 30, so 30 miles per gallon.",
        reasoning:
          "Check it against the situation: 30 miles for one gallon, so 5 gallons should give 150. It does.",
      },
    ],
    guidedPractice: [
      {
        prompt: "A printer prints 24 pages in 3 minutes. Pages per minute?",
        hint: "'Per minute' — so divide by the minutes.",
        answer: "24 ÷ 3 = 8 pages per minute.",
      },
      {
        prompt: "A 12-pack of juice costs $4.80. Cost per bottle?",
        hint: "The unit after 'per' is bottles.",
        answer: "$4.80 ÷ 12 = $0.40 per bottle.",
      },
      {
        prompt: "Store Y sells 8 pens for $3.60. Which is cheaper, Store Y or the $0.40 pens?",
        hint: "Get Store Y to a per-pen price first, then compare.",
        answer: "$3.60 ÷ 8 = $0.45 per pen, so the $0.40 pens are cheaper by $0.05 each.",
      },
    ],
    independentTask:
      "Find two real package sizes for the same product. Compute the unit rate for each, state both with units, say which is the better value, and say by how much per unit.",
    notesOutline: [
      "Definition: rate vs unit rate",
      "The 'per' rule: the unit after 'per' is the one you divide by",
      "Worked example: 150 miles ÷ 5 gallons = 30 miles per gallon",
      "My two practice problems and the check I used",
      "One comparison I made and by how much",
    ],
  },

  "E6-U1-L2": {
    relevance:
      "Two readers can finish the same story and disagree about what it was about. The disagreement is usually about the difference between a topic and a theme — and between naming an idea and showing where the text builds it.",
    goal: "Determine a theme or central idea and show how it develops over the course of the text.",
    successCriteria: [
      "I can state a theme as a full claim, not a one-word topic.",
      "I can point to at least two moments where the idea appears and say what changed between them.",
      "I can write an objective summary with no opinion in it.",
      "I can pair a quotation with reasoning that says what it shows.",
    ],
    instruction: [
      "A topic is a subject: honesty, courage, belonging. A theme is what the text says about that subject, written as a full sentence someone could agree or disagree with.",
      "Development is the part people skip. A theme that appears once is a moment; a theme that is developed changes, deepens, or costs the character something across the text.",
      "An objective summary reports the main events and the central idea without telling the reader what to feel about them.",
    ],
    vocabulary: [
      { term: "Topic", meaning: "The subject a text is about, usually one word." },
      { term: "Theme", meaning: "A claim about the topic that the whole text supports." },
      { term: "Development", meaning: "How an idea changes or deepens across a text." },
      { term: "Objective summary", meaning: "A retelling with no personal judgment in it." },
    ],
    workedModel: [
      {
        step: "Topic: telling the truth.",
        reasoning: "One word. Not yet a theme — nothing is claimed about it.",
      },
      {
        step: "Draft theme: 'Telling the truth is hard.'",
        reasoning: "Closer, but nobody would disagree. A theme should carry the text's specific angle.",
      },
      {
        step: "Theme: 'Telling the truth costs something in the moment but relieves a heavier weight.'",
        reasoning:
          "Now it is arguable and it matches the arc: the narrator loses something by confessing and gains relief.",
      },
      {
        step: "Development: hides the vase (ch. 1), lies about it (ch. 3), confesses (ch. 6).",
        reasoning:
          "Three tracked moments. The weight grows across them, which is what 'develops' means.",
      },
    ],
    guidedPractice: [
      {
        prompt: "Topic or theme? 'Courage.'",
        hint: "Could someone disagree with it?",
        answer: "Topic. Nothing is claimed.",
      },
      {
        prompt: "Turn 'friendship' into a theme claim.",
        hint: "Say what the text shows about friendship.",
        answer:
          "For example: 'Friendship survives disagreement only when both people keep listening.'",
      },
      {
        prompt: "Add reasoning: The narrator 'set the pieces on the table.'",
        hint: "What does that action show about her choice?",
        answer:
          "…showing she chose to be seen with the truth rather than explain it away.",
      },
    ],
    independentTask:
      "Write a theme claim for the current text and support it with two tracked moments and reasoning for each. One paragraph.",
    notesOutline: [
      "Topic vs theme, in my own words",
      "My theme claim for the current text",
      "Moment 1 (chapter and quotation) + what it shows",
      "Moment 2 (chapter and quotation) + what changed",
      "One sentence of objective summary",
    ],
  },

  "S6-U1-L2": {
    relevance:
      "Two cooler designs both 'work'. One holds ice longer; the other costs a third as much. Deciding between them is not a matter of opinion — it is a systematic comparison against criteria and constraints that were agreed before the test.",
    goal: "Evaluate competing design solutions systematically against criteria and constraints.",
    successCriteria: [
      "I can tell a criterion from a constraint.",
      "I can check every criterion, not just the most impressive number.",
      "I can say why a comparison is or is not a fair test.",
      "I can replace a judgment word with a measured value and a unit.",
    ],
    instruction: [
      "A criterion says what success looks like. A constraint says what the solution must stay inside — cost, size, time, materials, safety.",
      "A systematic evaluation checks each design against each criterion and each constraint, in a table, with measurements. A design that wins on one criterion and fails a constraint has not met the criteria.",
      "A comparison is only fair if everything except the design being tested is held constant.",
    ],
    vocabulary: [
      { term: "Criterion", meaning: "A stated measure of success." },
      { term: "Constraint", meaning: "A limit the solution must stay inside." },
      { term: "Fair test", meaning: "A comparison where only the tested variable changes." },
    ],
    workedModel: [
      {
        step: "Criteria: holds ice at least 5 hours. Constraint: costs under $20.",
        reasoning: "Written down first, before any results, so they cannot be adjusted to fit a favourite.",
      },
      {
        step: "Design A: 6 hours, $12. Design B: 9 hours, $36.",
        reasoning: "Measured values with units, not 'good' and 'better'.",
      },
      {
        step: "A meets both. B fails the cost constraint.",
        reasoning:
          "B is the better cooler and still not the answer to the question that was asked.",
      },
    ],
    guidedPractice: [
      {
        prompt: "Is 'must fit in a 30 cm box' a criterion or a constraint?",
        hint: "Does it describe success, or a limit?",
        answer: "A constraint.",
      },
      {
        prompt: "A team changes the ice amount between tests. Fair test?",
        hint: "What else changed besides the design?",
        answer: "No — more than one variable changed, so the comparison proves nothing.",
      },
      {
        prompt: "Improve this row: 'Design C: pretty good.'",
        hint: "What would someone else need in order to check it?",
        answer: "A measured value with a unit, e.g. 'Design C: 7.5 hours, $18'.",
      },
    ],
    independentTask:
      "Build a comparison table for two designs in the current phenomenon. Columns: each criterion, each constraint, measured value with unit, meets/does not meet. State your choice and the criterion that decided it.",
    notesOutline: [
      "Criteria and constraints for this phenomenon (written before testing)",
      "My comparison table",
      "Which variables I held constant",
      "My decision and the criterion that decided it",
    ],
  },

  "H6-U1-L2": {
    relevance:
      "'Farming started because people invented tools' is the kind of sentence that sounds like history and explains nothing. Real historical explanation separates the conditions that made a change possible from the event that set it off.",
    goal: "Explain a historical change with layered causation and evidence, in correct sequence.",
    successCriteria: [
      "I can put events in order and say what depends on what.",
      "I can name a condition, a trigger, and a cause separately.",
      "I can support a claim with physical or documentary evidence.",
      "I can say why one cause is not enough.",
    ],
    instruction: [
      "Chronology is not just order — it is dependency. 'After surplus grain could be stored, some people stopped farming full time' says which came first AND why the second needed the first.",
      "Conditions make a change possible. Triggers set it off. Causes connect them. Collapsing all three into one sentence is what makes an explanation thin.",
      "Evidence for early history is mostly physical: what was found, where, and how much of it. Weight and repetition matter — storage pits and rebuilt foundations say 'permanent' in a way one arrowhead does not.",
    ],
    vocabulary: [
      { term: "Condition", meaning: "A long-running situation that makes an event possible." },
      { term: "Trigger", meaning: "The immediate event that sets a change in motion." },
      { term: "Corroboration", meaning: "Checking a claim against a second, independent source." },
    ],
    workedModel: [
      {
        step: "Claim: river valleys produced the first cities.",
        reasoning: "A single-cause claim. It names a place, not a mechanism.",
      },
      {
        step: "Condition: predictable flooding renewed the soil each year.",
        reasoning: "This is what made surplus possible — a long-running situation, not an event.",
      },
      {
        step: "Consequence: surplus supported people who did not farm.",
        reasoning: "Specialists become possible only after food is reliably in excess.",
      },
      {
        step: "Consequence: record-keeping became worth inventing.",
        reasoning:
          "Now the explanation is layered — each step depends on the one before it, in order.",
      },
    ],
    guidedPractice: [
      {
        prompt: "Rewrite as a temporal relationship: 'There was grain, storage, and specialists.'",
        hint: "Use 'after' or 'once'.",
        answer: "'Once grain could be stored, specialists became possible.'",
      },
      {
        prompt: "Which is better evidence of permanent settlement: one arrowhead, or heavy grinding stones and rebuilt foundations?",
        hint: "Which is harder to carry away?",
        answer: "The grinding stones and foundations — weight and rebuilding imply staying.",
      },
      {
        prompt: "Name one condition behind the shift to agriculture.",
        hint: "Something long-running, not an event.",
        answer:
          "For example: a warming, more stable climate that made reliable growing seasons possible.",
      },
    ],
    independentTask:
      "Write a layered explanation of one change in the current unit's source set: one condition, one trigger, one consequence, each supported by evidence from a named source.",
    notesOutline: [
      "Timeline of the change I am explaining",
      "Condition / trigger / consequence, separated",
      "The evidence behind each, with its source",
      "One counter-explanation and why I did not choose it",
    ],
  },

  "IM1-U2-L2": {
    relevance:
      "A phone plan is $20 plus $0.10 per gigabyte. Written as C(g) = 20 + 0.1g, the whole plan fits in one line — and reading that line correctly is the difference between a $23.50 bill and a $55 surprise.",
    goal: "Use function notation, and use the definition of a function to decide whether a relation is one.",
    successCriteria: [
      "I can say what makes a relation a function, in terms of inputs and outputs.",
      "I can read f(2) as 'the output when the input is 2', not as multiplication.",
      "I can identify the domain and range in a real context.",
      "I can evaluate a function in context and check the result against the situation.",
    ],
    instruction: [
      "A function assigns exactly ONE output to each input. Repeated outputs are fine — {(1,4), (2,4)} is a function. Repeated inputs with different outputs are not — {(1,4), (1,5)} is not.",
      "f(x) is a name for an output, not a product. The f is the function's name, the x is the input, and f(x) is what comes out.",
      "In context, the domain is the set of inputs — the thing that causes — and the range is the set of outputs.",
    ],
    vocabulary: [
      { term: "Function", meaning: "A rule assigning exactly one output to each input." },
      { term: "Domain", meaning: "The set of allowed inputs." },
      { term: "Range", meaning: "The set of resulting outputs." },
    ],
    workedModel: [
      {
        step: "f(x) = 3x − 5. Find f(2).",
        reasoning: "f(2) asks for the output when the input is 2. It is not f times 2.",
      },
      {
        step: "Substitute: 3(2) − 5.",
        reasoning: "Replace every x with the input.",
      },
      {
        step: "6 − 5 = 1, so f(2) = 1.",
        reasoning:
          "Write it as a pair if it helps: (2, 1). Input 2, output 1.",
      },
    ],
    guidedPractice: [
      {
        prompt: "Is {(5,1), (6,1), (7,1)} a function?",
        hint: "Look at the inputs, not the outputs.",
        answer: "Yes. Each input appears once; repeated outputs are allowed.",
      },
      {
        prompt: "g(t) = t² + 1. Find g(−3).",
        hint: "Square first, and remember what squaring a negative does.",
        answer: "(−3)² = 9, then 9 + 1 = 10.",
      },
      {
        prompt: "A graph contains (−2, 3) and (−2, −1). Function?",
        hint: "One input, two outputs.",
        answer: "No — that is the vertical line test, stated as the definition.",
      },
    ],
    independentTask:
      "Model a real cost with a linear function, state its domain in context, evaluate it at two inputs, and check both results against the situation you modelled.",
    notesOutline: [
      "The definition of a function, in my own words",
      "Function notation: what f, x, and f(x) each name",
      "My worked evaluation, with the substitution shown",
      "My real-context model, its domain, and my check",
    ],
  },

  "E9-U1-L2": {
    relevance:
      "The most common note on a first literary analysis is 'quotation dropped'. The quotation is there; the sentence that says what it shows is not. That sentence is where the analysis actually lives.",
    goal: "Determine a theme, analyse how it emerges and is shaped, and integrate evidence with commentary.",
    successCriteria: [
      "I can state a theme as an arguable claim, distinct from summary.",
      "I can trace how the theme is shaped across at least two moments.",
      "I can embed a quotation inside my own sentence.",
      "I can follow every quotation with reasoning that names what it shows.",
    ],
    instruction: [
      "'Emerges and is shaped' is a development claim. It asks how the idea got there and what pressed on it — not where it is stated.",
      "An integrated quotation sits inside your sentence, with your own words carrying the grammar. A dropped quotation stands alone as its own sentence and leaves the reader to do your work.",
      "Commentary is the sentence after the quotation. It names what the detail shows about the claim. Without it, evidence is decoration.",
    ],
    vocabulary: [
      { term: "Theme", meaning: "An arguable claim about human experience the text supports." },
      { term: "Integrated quotation", meaning: "A quotation embedded inside your own sentence." },
      { term: "Commentary", meaning: "Reasoning that names what the evidence shows." },
    ],
    workedModel: [
      {
        step: "Dropped: 'A mouth that had already swallowed her father.' This shows the theme.",
        reasoning: "The quotation stands alone and the commentary says nothing specific.",
      },
      {
        step: "Integrated: When the narrator calls the harbour 'a mouth that had already swallowed her father'…",
        reasoning: "Your sentence carries the grammar; the quotation is inside it.",
      },
      {
        step: "…the setting stops being a home and becomes a threat that has already taken something.",
        reasoning:
          "Commentary names what the detail shows about the claim, and connects it back to the theme.",
      },
    ],
    guidedPractice: [
      {
        prompt: "Theme or summary? 'The crew abandons the ship at dawn.'",
        hint: "Does it report an event or make a claim?",
        answer: "Summary.",
      },
      {
        prompt: "Integrate: she said 'I don't need anyone.'",
        hint: "Start with your own clause.",
        answer:
          "When she insists she does not 'need anyone,' the refusal reads as fear rather than independence.",
      },
      {
        prompt: "Add commentary: the narrator refuses to name her father.",
        hint: "What does the refusal show about the theme?",
        answer: "…marking how far the family's silence has spread into her own account.",
      },
    ],
    independentTask:
      "Write one analytical paragraph: theme claim, two tracked moments with integrated quotations, and commentary after each.",
    notesOutline: [
      "My theme claim for the current text",
      "Moment 1: integrated quotation + commentary",
      "Moment 2: integrated quotation + commentary",
      "What changed between them",
    ],
  },
};

export function lessonContent(lessonCode: string): LessonContent | undefined {
  return CONTENT[lessonCode];
}

export function hasAuthoredContent(lessonCode: string): boolean {
  return lessonCode in CONTENT;
}
