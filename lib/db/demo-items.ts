/**
 * ============================================================================
 * DEMO ASSESSMENT CONTENT — NOT AUTHORED CURRICULUM
 * ============================================================================
 *
 * The blueprint supplies course budgets, unit names, lesson identifiers,
 * primary standards assignments, assessment record ids, and linked intervention
 * lessons. It does NOT supply assessment ITEMS. CLAUDE.md §14 forbids inventing
 * curriculum data, so the items below are marked as what they are: demonstration
 * content written to exercise the evidence, mastery, grade, and recommendation
 * paths end to end.
 *
 * They are aligned to real standard codes taken from the blueprint's alignment
 * matrix, but no curriculum author has reviewed or adopted them. Every surface
 * that renders one says so. A lesson with no bank here shows that its items have
 * not been authored and disables its Exit Ticket rather than faking a score
 * (CLAUDE.md §12 — no dead controls).
 *
 * Error codes come from the blueprint's own error families: mathematics §9, and
 * the "Typical trigger" column of the Appendix E starter inventory for English,
 * science, and social science.
 */

/**
 * Re-exported from the record shapes so the demo bank and authored items can
 * never drift apart on what a purpose is.
 */
export type { ItemPurpose } from "./types";
import type { ItemPurpose } from "./types";

export type DemoChoice = {
  id: string;
  text: string;
  /** The error family this distractor reveals. Null on the correct choice. */
  errorCode: string | null;
};

export type DemoItem = {
  id: string;
  lessonCode: string;
  /** Bare primary standard code from the alignment matrix. */
  standard: string;
  /** The reusable skill this item measures. Equal to the standard here. */
  skill: string;
  purpose: ItemPurpose;
  stem: string;
  choices: DemoChoice[];
  correctChoiceId: string;
  /** Shown after completion — explanations appear after, never during. */
  rationale: string;
};

const item = (
  id: string,
  lessonCode: string,
  standard: string,
  purpose: ItemPurpose,
  stem: string,
  choices: [string, string | null][],
  correct: number,
  rationale: string,
): DemoItem => ({
  id,
  lessonCode,
  standard,
  skill: standard,
  purpose,
  stem,
  choices: choices.map(([text, errorCode], i) => ({
    id: `${id}-${"abcd"[i]}`,
    text,
    errorCode: i === correct ? null : errorCode,
  })),
  correctChoiceId: `${id}-${"abcd"[correct]}`,
  rationale,
});

// ---------------------------------------------------------------------------
// Mathematics 6 · Unit 1 · M6-U1-L2 · 6.RP.2 — unit rate
// ---------------------------------------------------------------------------
const M6_U1_L2: DemoItem[] = [
  item("I-M6RP2-01", "M6-U1-L2", "6.RP.2", "exit_ticket",
    "A granola recipe uses 3 cups of oats for every 2 batches. What is the unit rate in cups per batch?",
    [["1.5 cups per batch", null],
     ["0.67 cups per batch", "inverse-operation"],
     ["5 cups per batch", "fraction-or-ratio"],
     ["6 cups per batch", "calculation"]], 0,
    "Cups per batch means cups divided by batches: 3 ÷ 2 = 1.5. Dividing the other way (2 ÷ 3 ≈ 0.67) answers batches per cup instead."),
  item("I-M6RP2-02", "M6-U1-L2", "6.RP.2", "exit_ticket",
    "A car travels 150 miles using 5 gallons of fuel. Which statement reports the unit rate correctly?",
    [["30 miles per gallon", null],
     ["5 miles per gallon", "unit-and-scale"],
     ["30 gallons per mile", "unit-and-scale"],
     ["155 miles per gallon", "calculation"]], 0,
    "150 miles ÷ 5 gallons = 30 miles per gallon. The unit that follows 'per' is the one you divide by."),
  item("I-M6RP2-03", "M6-U1-L2", "6.RP.2", "exit_ticket",
    "Which sentence describes a multiplicative comparison rather than an additive one?",
    [["Class A has 3 times as many students as class B.", null],
     ["Class A has 4 more students than class B.", "fraction-or-ratio"],
     ["Class A grew by 5 students this month.", "fraction-or-ratio"],
     ["Class A has 12 students and class B has 8.", "representation"]], 0,
    "'Times as many' compares by multiplying. 'More than' and 'grew by' compare by adding, which is a different relationship."),
  item("I-M6RP2-04", "M6-U1-L2", "6.RP.2", "exit_ticket",
    "Store X sells 12 pens for $4.80. Store Y sells 8 pens for $3.60. Which store is cheaper per pen, and by how much?",
    [["Store X, by $0.05 per pen", null],
     ["Store Y, by $0.05 per pen", "inverse-operation"],
     ["Store X, by $1.20 per pen", "unit-and-scale"],
     ["Neither — the price per pen is the same", "calculation"]], 0,
    "Store X: $4.80 ÷ 12 = $0.40 per pen. Store Y: $3.60 ÷ 8 = $0.45 per pen. $0.45 − $0.40 = $0.05."),
  item("I-M6RP2-05", "M6-U1-L2", "6.RP.2", "readiness_check",
    "A printer prints 24 pages in 3 minutes. What is the unit rate?",
    [["8 pages per minute", null],
     ["0.125 minutes per page stated as pages per minute", "inverse-operation"],
     ["21 pages per minute", "calculation"],
     ["72 pages per minute", "calculation"]], 0,
    "24 ÷ 3 = 8 pages per minute."),
  item("I-M6RP2-06", "M6-U1-L2", "6.RP.2", "readiness_check",
    "Which of these is a rate?",
    [["$7.50 per hour", null],
     ["7 students", "representation"],
     ["A ratio of 3 to 4 with no units", "representation"],
     ["15 total miles", "representation"]], 0,
    "A rate compares two quantities with different units. '$7.50 per hour' compares dollars to hours."),
  item("I-M6RP2-07", "M6-U1-L2", "6.RP.2", "readiness_check",
    "You know a recipe needs 1.5 cups per batch. How many cups for 6 batches?",
    [["9 cups", null],
     ["4 cups", "inverse-operation"],
     ["7.5 cups", "calculation"],
     ["4.5 cups", "calculation"]], 0,
    "1.5 cups per batch × 6 batches = 9 cups. The unit rate multiplies up."),
  item("I-M6RP2-08", "M6-U1-L2", "6.RP.2", "transfer_check",
    "A school bus route is 27 miles and takes 45 minutes. A parent claims the bus averages 'about a mile a minute.' Use a unit rate to evaluate the claim.",
    [["The claim is wrong; the bus averages 0.6 miles per minute", null],
     ["The claim is right; 27 and 45 are close enough", "no-verification"],
     ["The claim is wrong; the bus averages 1.67 miles per minute", "inverse-operation"],
     ["There is not enough information to decide", "representation"]], 0,
    "27 miles ÷ 45 minutes = 0.6 miles per minute, well under 1. Checking a claim against the unit rate is the transfer move."),
];

// ---------------------------------------------------------------------------
// English 6 · Unit 1 · E6-U1-L2 · RL.6.2 — theme and central idea development
// ---------------------------------------------------------------------------
const E6_U1_L2: DemoItem[] = [
  item("I-E6RL2-01", "E6-U1-L2", "RL.6.2", "exit_ticket",
    "A story opens with a narrator hiding a broken vase, and ends with her telling her brother the truth and feeling lighter. Which statement names the THEME rather than the topic?",
    [["Telling the truth costs something in the moment but relieves a heavier weight.", null],
     ["The story is about honesty.", "topic-not-development"],
     ["A girl breaks a vase.", "topic-not-development"],
     ["The narrator has a brother.", "evidence-without-support"]], 0,
    "A topic is a word ('honesty'). A theme is a claim the whole story supports — what the text says about that topic."),
  item("I-E6RL2-02", "E6-U1-L2", "RL.6.2", "exit_ticket",
    "Which piece of evidence best shows the theme DEVELOPING across the story rather than just appearing once?",
    [["The narrator hides the vase in chapter 1, lies about it in chapter 3, and confesses in chapter 6.", null],
     ["The narrator says 'I felt terrible.'", "evidence-without-support"],
     ["The vase is described as blue and tall.", "topic-not-development"],
     ["The brother appears in every chapter.", "topic-not-development"]], 0,
    "Development means the idea changes or deepens over the course of the text. A tracked sequence shows that; a single line does not."),
  item("I-E6RL2-03", "E6-U1-L2", "RL.6.2", "exit_ticket",
    "A summary of this story should:",
    [["Report the main events and the theme, without the writer's opinion.", null],
     ["Explain why the reader liked the ending.", "evidence-without-support"],
     ["List every event in order, including small details.", "topic-not-development"],
     ["Quote the narrator's best three lines.", "quotation-without-commentary"]], 0,
    "A summary is objective: main events plus the central idea, without personal judgment and without retelling everything."),
  item("I-E6RL2-04", "E6-U1-L2", "RL.6.2", "exit_ticket",
    "Which sentence pairs evidence with reasoning?",
    [["The narrator 'set the pieces on the table' before speaking, showing she chose to be seen with the truth.", null],
     ["The narrator set the pieces on the table.", "quotation-without-commentary"],
     ["I think she was very brave.", "evidence-without-support"],
     ["'Set the pieces on the table.'", "quotation-without-commentary"]], 0,
    "Evidence is the quoted detail; reasoning is the sentence explaining what it shows. Both are needed."),
  item("I-E6RL2-05", "E6-U1-L2", "RL.6.2", "readiness_check",
    "Topic or theme? 'Courage'",
    [["Topic", null], ["Theme", "topic-not-development"],
     ["Neither", "topic-not-development"], ["Both", "topic-not-development"]], 0,
    "One word naming a subject is a topic. A theme is a full statement about it."),
  item("I-E6RL2-06", "E6-U1-L2", "RL.6.2", "readiness_check",
    "Which is a theme statement?",
    [["Friendship can survive disagreement when both people keep listening.", null],
     ["Friendship.", "topic-not-development"],
     ["The two friends argue.", "topic-not-development"],
     ["Chapter 4 is about friends.", "topic-not-development"]], 0,
    "A theme statement makes a claim the text supports."),
  item("I-E6RL2-07", "E6-U1-L2", "RL.6.2", "readiness_check",
    "To show a central idea developing, a reader should track:",
    [["The same idea at three points in the text and what changes between them", null],
     ["The longest paragraph", "topic-not-development"],
     ["The first sentence only", "topic-not-development"],
     ["How the reader felt", "evidence-without-support"]], 0,
    "Development is visible in change over the course of a text."),
  item("I-E6RL2-08", "E6-U1-L2", "RL.6.2", "transfer_check",
    "In the unit's current text, a character refuses help in chapter 2 and accepts it in chapter 9. Which response states the theme and supports it?",
    [["Accepting help is not the same as giving up — the character's refusal costs her time she cannot get back, and her later acceptance is what moves her forward.", null],
     ["The character learns about help.", "topic-not-development"],
     ["'I don't need anyone,' she said.", "quotation-without-commentary"],
     ["Chapter 9 is the best chapter.", "evidence-without-support"]], 0,
    "The transfer move is stating the theme as a claim and then connecting two tracked moments to it."),
];

// ---------------------------------------------------------------------------
// Integrated Science 6 · Unit 1 · S6-U1-L2 · MS-ETS1-2
// ---------------------------------------------------------------------------
const S6_U1_L2: DemoItem[] = [
  item("I-S6E12-01", "S6-U1-L2", "MS-ETS1-2", "exit_ticket",
    "Two cooler designs are tested. Design A keeps ice 6 hours; Design B keeps ice 9 hours but costs three times as much. The criteria are 'holds ice at least 5 hours' and 'costs under $20.' Design A costs $12; Design B costs $36. Which design meets the criteria?",
    [["Design A only", null],
     ["Design B only", "criteria-ignored"],
     ["Both designs", "criteria-ignored"],
     ["Neither design", "criteria-ignored"]], 0,
    "A systematic evaluation checks EVERY criterion. Design B wins on time but fails the cost constraint, so it does not meet the criteria."),
  item("I-S6E12-02", "S6-U1-L2", "MS-ETS1-2", "exit_ticket",
    "A team compares three designs but changes the amount of ice in each test. What is the problem?",
    [["The variable they are measuring is not isolated, so the comparison is not fair.", null],
     ["They should have tested four designs.", "criteria-ignored"],
     ["Ice amount does not matter for a cooler test.", "uncontrolled-variable"],
     ["They needed a longer test.", "uncontrolled-variable"]], 0,
    "A fair comparison holds everything constant except the design being tested."),
  item("I-S6E12-03", "S6-U1-L2", "MS-ETS1-2", "exit_ticket",
    "Which is a CONSTRAINT rather than a criterion?",
    [["The design must cost under $20.", null],
     ["The design should keep ice as long as possible.", "criteria-ignored"],
     ["The design should be easy to carry.", "criteria-ignored"],
     ["The design should look good.", "criteria-ignored"]], 0,
    "Criteria describe what success looks like. Constraints are the limits the solution must stay inside."),
  item("I-S6E12-04", "S6-U1-L2", "MS-ETS1-2", "exit_ticket",
    "A comparison table lists 'Design A: good' and 'Design B: better.' How should it be improved?",
    [["Replace the judgments with measured values and units.", null],
     ["Add a third design.", "criteria-ignored"],
     ["Use colour coding instead.", "missing-unit-or-precision"],
     ["Nothing — the ranking is clear.", "no-verification"]], 0,
    "Systematic evaluation needs measurements, not impressions. 'Good' cannot be checked by anyone else."),
  item("I-S6E12-05", "S6-U1-L2", "MS-ETS1-2", "readiness_check",
    "Which pair is a criterion and a constraint?",
    [["'Holds 2 litres' (criterion) and 'fits in a 30 cm box' (constraint)", null],
     ["'Works well' and 'is nice'", "criteria-ignored"],
     ["'Cheap' and 'inexpensive'", "criteria-ignored"],
     ["'Blue' and 'blue'", "criteria-ignored"]], 0,
    "A criterion states the goal; a constraint states the limit."),
  item("I-S6E12-06", "S6-U1-L2", "MS-ETS1-2", "readiness_check",
    "In a fair test of two insulation materials, which must stay the same?",
    [["Starting temperature, container size, and room conditions", null],
     ["The insulation material", "uncontrolled-variable"],
     ["Nothing needs to stay the same", "uncontrolled-variable"],
     ["The person doing the test only", "uncontrolled-variable"]], 0,
    "Everything except the tested variable is held constant."),
  item("I-S6E12-07", "S6-U1-L2", "MS-ETS1-2", "readiness_check",
    "A result reads '14.' What is missing?",
    [["The unit", null],
     ["The colour", "missing-unit-or-precision"],
     ["The date", "missing-unit-or-precision"],
     ["Nothing", "missing-unit-or-precision"]], 0,
    "A measurement without a unit cannot be compared to a criterion."),
  item("I-S6E12-08", "S6-U1-L2", "MS-ETS1-2", "transfer_check",
    "For the unit's current phenomenon, two filter designs are proposed. Criteria: removes at least 80% of sediment, and processes 1 litre in under 3 minutes. Design 1: 92% removal, 4 minutes. Design 2: 84% removal, 2 minutes. Which meets the criteria, and how do you know?",
    [["Design 2 — it is the only one that satisfies both stated criteria.", null],
     ["Design 1 — it removes more sediment.", "criteria-ignored"],
     ["Both — they are both close.", "no-verification"],
     ["Design 1 — speed is less important.", "criteria-ignored"]], 0,
    "Applying the same evaluation to a new phenomenon is the transfer move: check every criterion, not the most impressive number."),
];

// ---------------------------------------------------------------------------
// Grade 6 Ancient World · Unit 1 · H6-U1-L2 · HSS-6.1.1
// ---------------------------------------------------------------------------
const H6_U1_L2: DemoItem[] = [
  item("I-H6HS11-01", "H6-U1-L2", "HSS-6.1.1", "exit_ticket",
    "Which statement explains WHY early hunter-gatherer communities moved with the seasons, rather than just describing that they did?",
    [["Food sources shifted location through the year, so staying in one place meant going without.", null],
     ["They moved several times a year.", "no-temporal-relationship"],
     ["They lived a long time ago.", "no-temporal-relationship"],
     ["Archaeologists found their camps in different places.", "evidence-without-support"]], 0,
    "Explaining a pattern means naming the condition that produced it, not restating the pattern."),
  item("I-H6HS11-02", "H6-U1-L2", "HSS-6.1.1", "exit_ticket",
    "A student writes: 'Farming started because people invented tools.' What is weak about this causal claim?",
    [["It names one cause for a change that had several interacting conditions.", null],
     ["It is too long.", "no-temporal-relationship"],
     ["Tools were never invented.", "evidence-without-support"],
     ["It does not include a date.", "no-temporal-relationship"]], 0,
    "Layered causation distinguishes conditions, triggers, and long-term causes. A single cause flattens the explanation."),
  item("I-H6HS11-03", "H6-U1-L2", "HSS-6.1.1", "exit_ticket",
    "Which is the best evidence that a settlement was permanent rather than seasonal?",
    [["Storage pits, heavy grinding stones, and rebuilt house foundations at one site", null],
     ["A single arrowhead", "evidence-without-support"],
     ["A story told about the site much later", "ignores-provenance"],
     ["The site is on a map", "map-misread"]], 0,
    "Permanence shows up in things too heavy or too invested to move, and in repeated rebuilding."),
  item("I-H6HS11-04", "H6-U1-L2", "HSS-6.1.1", "exit_ticket",
    "Place in order from earliest to latest: (1) walled towns, (2) seasonal hunting camps, (3) first cultivated fields.",
    [["2, 3, 1", null],
     ["1, 2, 3", "no-temporal-relationship"],
     ["3, 2, 1", "no-temporal-relationship"],
     ["2, 1, 3", "no-temporal-relationship"]], 0,
    "Cultivation follows foraging, and walls follow enough surplus and population to be worth defending."),
  item("I-H6HS11-05", "H6-U1-L2", "HSS-6.1.1", "readiness_check",
    "Which sentence shows a temporal relationship rather than a list?",
    [["After surplus grain could be stored, some people stopped farming full time.", null],
     ["There was grain, storage, and specialists.", "no-temporal-relationship"],
     ["Grain. Storage. Specialists.", "no-temporal-relationship"],
     ["Specialists existed.", "no-temporal-relationship"]], 0,
    "'After ... then' establishes sequence and dependency; a list does not."),
  item("I-H6HS11-06", "H6-U1-L2", "HSS-6.1.1", "readiness_check",
    "A cause, a condition, and a trigger are:",
    [["Different layers of an explanation", null],
     ["Three words for the same thing", "single-cause"],
     ["Only used in science", "single-cause"],
     ["Ranked by importance only", "single-cause"]], 0,
    "Conditions make an event possible; triggers set it off; causes connect them."),
  item("I-H6HS11-07", "H6-U1-L2", "HSS-6.1.1", "readiness_check",
    "Which question would help you judge whether a claim about early agriculture is supported?",
    [["What physical evidence was found, and where?", null],
     ["Does the claim sound reasonable?", "evidence-without-support"],
     ["Is the writer famous?", "ignores-provenance"],
     ["Is the claim short?", "evidence-without-support"]], 0,
    "Support is judged by evidence and its provenance, not by plausibility or authority."),
  item("I-H6HS11-08", "H6-U1-L2", "HSS-6.1.1", "transfer_check",
    "Using the unit's current source set on river valley settlement, which explanation is layered rather than single-cause?",
    [["Predictable flooding made surplus possible; surplus made specialists possible; specialists made record-keeping worth inventing.", null],
     ["Rivers caused civilization.", "single-cause"],
     ["Writing was invented in river valleys.", "no-temporal-relationship"],
     ["People liked living near water.", "evidence-without-support"]], 0,
    "Applying layered causation to a new source set is the transfer move."),
];

// ---------------------------------------------------------------------------
// Integrated Math 1 · Unit 2 · IM1-U2-L2 · F-IF.1 — function definition
// ---------------------------------------------------------------------------
const IM1_U2_L2: DemoItem[] = [
  item("I-IM1FIF1-01", "IM1-U2-L2", "F-IF.1", "exit_ticket",
    "Which relation is a function?",
    [["{(1, 4), (2, 4), (3, 9)}", null],
     ["{(1, 4), (1, 5), (2, 6)}", "variable-interpretation"],
     ["A circle of radius 3 centred at the origin", "representation"],
     ["{(0, 0), (0, 1), (0, 2)}", "variable-interpretation"]], 0,
    "A function assigns exactly one output to each input. Repeated OUTPUTS are fine; repeated inputs with different outputs are not."),
  item("I-IM1FIF1-02", "IM1-U2-L2", "F-IF.1", "exit_ticket",
    "If f(x) = 3x − 5, what does f(2) mean?",
    [["The output when the input is 2, which is 1", null],
     ["f multiplied by 2", "variable-interpretation"],
     ["The input when the output is 2", "inverse-operation"],
     ["The slope at x = 2", "representation"]], 0,
    "f(2) is function notation for the output at input 2: 3(2) − 5 = 1. It is not multiplication."),
  item("I-IM1FIF1-03", "IM1-U2-L2", "F-IF.1", "exit_ticket",
    "A table shows hours worked and pay earned. Pay depends on hours. Which is the domain?",
    [["The set of hours worked", null],
     ["The set of pay amounts", "inverse-operation"],
     ["Both sets together", "representation"],
     ["Neither — a table has no domain", "representation"]], 0,
    "The domain is the set of inputs. Pay depends on hours, so hours is the input."),
  item("I-IM1FIF1-04", "IM1-U2-L2", "F-IF.1", "exit_ticket",
    "A graph passes through (−2, 3) and (−2, −1). What does this tell you?",
    [["It is not a function, because one input has two outputs.", null],
     ["It is a function with a negative domain.", "variable-interpretation"],
     ["It is a function that decreases.", "representation"],
     ["There is not enough information.", "no-verification"]], 0,
    "This is the vertical line test stated in terms of the definition: one input cannot have two outputs."),
  item("I-IM1FIF1-05", "IM1-U2-L2", "F-IF.1", "readiness_check",
    "Is {(5, 1), (6, 1), (7, 1)} a function?",
    [["Yes", null], ["No, the outputs repeat", "variable-interpretation"],
     ["No, the inputs increase", "representation"], ["Only if graphed", "representation"]], 0,
    "Every input has exactly one output. Repeated outputs are allowed."),
  item("I-IM1FIF1-06", "IM1-U2-L2", "F-IF.1", "readiness_check",
    "If g(t) = t² + 1, what is g(−3)?",
    [["10", null], ["−8", "sign"], ["−10", "sign"], ["7", "calculation"]], 0,
    "(−3)² = 9, then 9 + 1 = 10. Squaring a negative gives a positive."),
  item("I-IM1FIF1-07", "IM1-U2-L2", "F-IF.1", "readiness_check",
    "In f(x) = 2x, the letter x is:",
    [["The input variable", null], ["A fixed number", "variable-interpretation"],
     ["The name of the function", "variable-interpretation"], ["The output", "inverse-operation"]], 0,
    "x names the input; f names the function; f(x) names the output."),
  item("I-IM1FIF1-08", "IM1-U2-L2", "F-IF.1", "transfer_check",
    "A phone plan charges $20 plus $0.10 per gigabyte, modelled as C(g) = 20 + 0.1g. A classmate writes C(35) = 55. Evaluate the claim in context.",
    [["The claim is wrong; C(35) = 23.50, meaning 35 GB costs $23.50.", null],
     ["The claim is right; 20 + 35 = 55.", "variable-interpretation"],
     ["The claim is wrong; C(35) = 2,000.", "unit-and-scale"],
     ["There is not enough information.", "no-verification"]], 0,
    "C(35) = 20 + 0.1(35) = 23.50. Reading function notation in a real context, and checking it, is the transfer move."),
];

// ---------------------------------------------------------------------------
// English 9 · Unit 1 · E9-U1-L2 · RL.9-10.2 — theme development and summary
// ---------------------------------------------------------------------------
const E9_U1_L2: DemoItem[] = [
  item("I-E9RL2-01", "E9-U1-L2", "RL.9-10.2", "exit_ticket",
    "Which statement is a theme rather than a summary?",
    [["Loyalty to a group can require betraying an individual within it.", null],
     ["The narrator chooses her crew over her brother in the final chapter.", "topic-not-development"],
     ["The story is about loyalty.", "topic-not-development"],
     ["There are seven chapters.", "topic-not-development"]], 0,
    "A theme is a claim about human experience the whole text supports. Summary reports what happens; topic names a subject."),
  item("I-E9RL2-02", "E9-U1-L2", "RL.9-10.2", "exit_ticket",
    "To show how a theme EMERGES and is SHAPED, a response should:",
    [["Trace the idea at several points and explain what changes it.", null],
     ["State the theme and quote the last line.", "quotation-without-commentary"],
     ["Summarise every chapter.", "topic-not-development"],
     ["Describe the reader's reaction.", "evidence-without-support"]], 0,
    "'Emerges and is shaped' is a development claim: it requires tracking, not a single citation."),
  item("I-E9RL2-03", "E9-U1-L2", "RL.9-10.2", "exit_ticket",
    "Which sentence integrates a quotation correctly?",
    [["When the narrator calls the harbour 'a mouth that had already swallowed her father,' the setting becomes a threat rather than a home.", null],
     ["'A mouth that had already swallowed her father.' This shows the theme.", "quotation-without-commentary"],
     ["The narrator describes the harbour.", "evidence-without-support"],
     ["The harbour is 'a mouth.'", "quotation-without-commentary"]], 0,
    "An integrated quotation sits inside your own sentence and is followed by reasoning that names what it shows."),
  item("I-E9RL2-04", "E9-U1-L2", "RL.9-10.2", "exit_ticket",
    "An objective summary of a literary text should exclude:",
    [["The writer's evaluation of the characters' choices", null],
     ["The central conflict", "topic-not-development"],
     ["The resolution", "topic-not-development"],
     ["The theme", "topic-not-development"]], 0,
    "Objective means without personal judgment. Conflict, resolution, and theme all belong in it."),
  item("I-E9RL2-05", "E9-U1-L2", "RL.9-10.2", "readiness_check",
    "Theme or summary? 'The crew abandons the ship at dawn.'",
    [["Summary", null], ["Theme", "topic-not-development"],
     ["Both", "topic-not-development"], ["Neither", "topic-not-development"]], 0,
    "It reports an event, so it is summary."),
  item("I-E9RL2-06", "E9-U1-L2", "RL.9-10.2", "readiness_check",
    "Which shows a theme being SHAPED by a specific detail?",
    [["The narrator's repeated refusal to name her father marks how far the silence has spread.", null],
     ["The theme is silence.", "topic-not-development"],
     ["Silence appears in chapter 3.", "topic-not-development"],
     ["Silence is important.", "evidence-without-support"]], 0,
    "Naming the detail and the effect together shows shaping."),
  item("I-E9RL2-07", "E9-U1-L2", "RL.9-10.2", "readiness_check",
    "After a quotation, the next sentence should usually:",
    [["Explain what the quotation shows about your claim", null],
     ["Add a second quotation", "quotation-without-commentary"],
     ["Restate the quotation", "quotation-without-commentary"],
     ["Change topic", "evidence-without-support"]], 0,
    "Commentary is what turns a quotation into evidence."),
  item("I-E9RL2-08", "E9-U1-L2", "RL.9-10.2", "transfer_check",
    "In the unit's current text, write the strongest theme claim supported by two tracked moments.",
    [["Inherited debt is not only financial — the narrator's refusal to sell the boat in chapter 2 and her decision to burn the ledger in chapter 11 both show her paying for a choice she never made.", null],
     ["The theme is family.", "topic-not-development"],
     ["'She burned the ledger.'", "quotation-without-commentary"],
     ["The narrator changes a lot.", "evidence-without-support"]], 0,
    "The transfer move is a theme claim plus two tracked moments in the CURRENT text, with reasoning that connects them."),
];


// ---------------------------------------------------------------------------
// Retrieval-practice bank for the preceding lessons in each demo pathway.
// These give Spiral Review something real to select from — the selection rules
// draw on skills the student already has evidence for, which are the L1 lessons
// behind their current position.
// ---------------------------------------------------------------------------
const SPIRAL_BANK: DemoItem[] = [
  item("I-M6RP1-01", "M6-U1-L1", "6.RP.1", "spiral_review",
    "Which sentence describes the ratio of 3 red tiles to 5 blue tiles correctly?",
    [["For every 3 red tiles there are 5 blue tiles.", null],
     ["There are 3 more red tiles than blue tiles.", "fraction-or-ratio"],
     ["Red tiles are 3 out of 5 of all tiles.", "fraction-or-ratio"],
     ["There are 8 red tiles.", "calculation"]], 0,
    "A ratio compares two quantities. 3 to 5 means 3 red for every 5 blue — 3 out of 8 tiles are red."),
  item("I-M6RP1-02", "M6-U1-L1", "6.RP.1", "spiral_review",
    "A bag has 4 green and 6 yellow marbles. What is the ratio of green to ALL marbles?",
    [["4 to 10", null],
     ["4 to 6", "fraction-or-ratio"],
     ["6 to 10", "inverse-operation"],
     ["10 to 4", "inverse-operation"]], 0,
    "'To all' means the total: 4 + 6 = 10, so 4 to 10."),
  item("I-M6RP3B-01", "M6-U1-L1", "6.RP.3.b", "spiral_review",
    "12 pencils cost $3.00. At the same rate, what do 20 pencils cost?",
    [["$5.00", null], ["$3.60", "calculation"], ["$8.00", "unit-and-scale"], ["$0.25", "representation"]], 0,
    "$3.00 ÷ 12 = $0.25 each; $0.25 × 20 = $5.00."),

  item("I-E6RL1-01", "E6-U1-L1", "RL.6.1", "spiral_review",
    "Which response cites textual evidence to support an inference?",
    [["She is nervous — she 'checked the lock twice' before sitting down.", null],
     ["She is nervous.", "evidence-without-support"],
     ["'Checked the lock twice.'", "quotation-without-commentary"],
     ["I would be nervous too.", "evidence-without-support"]], 0,
    "An inference plus the detail it rests on. Either half alone is incomplete."),
  item("I-E6RL1-02", "E6-U1-L1", "RL.6.1", "spiral_review",
    "An inference is:",
    [["A conclusion drawn from evidence in the text plus reasoning.", null],
     ["A guess about what happens next.", "ungrounded-inference"],
     ["A direct quotation.", "quotation-without-commentary"],
     ["The reader's opinion.", "evidence-without-support"]], 0,
    "Inference is grounded. A guess is not."),

  item("I-S6E11-01", "S6-U1-L1", "MS-ETS1-1", "spiral_review",
    "Which is the best-stated design problem?",
    [["Keep 2 L of water below 10 °C for 6 hours using materials under $20.", null],
     ["Make a really good cooler.", "criteria-ignored"],
     ["Build something with foam.", "criteria-ignored"],
     ["Test how cold water gets.", "criteria-ignored"]], 0,
    "A well-defined problem names the goal with measurable criteria and the constraints."),
  item("I-S6E11-02", "S6-U1-L1", "MS-ETS1-1", "spiral_review",
    "Which of these is a constraint on a design?",
    [["The materials must cost less than $20.", null],
     ["The design should work well.", "criteria-ignored"],
     ["The design should be tested.", "criteria-ignored"],
     ["The design should be interesting.", "criteria-ignored"]], 0,
    "A constraint is a limit the solution must stay inside."),

  item("I-H6HS1-01", "H6-U1-L1", "HSS-6.1", "spiral_review",
    "Which change most directly allowed permanent settlements?",
    [["Reliable food production and storage", null],
     ["The invention of writing", "no-temporal-relationship"],
     ["The building of walls", "no-temporal-relationship"],
     ["Long-distance trade", "no-temporal-relationship"]], 0,
    "Storage and reliable food come first; walls, writing, and trade follow from surplus."),
  item("I-H6HS1-02", "H6-U1-L1", "HSS-6.1", "spiral_review",
    "Which evidence best supports a claim about early diets?",
    [["Animal bones and seed remains found in hearths", null],
     ["A modern painting of a hunt", "ignores-provenance"],
     ["A legend recorded 3,000 years later", "ignores-provenance"],
     ["A map of the region today", "map-misread"]], 0,
    "Physical remains from the site itself are the strongest and most direct evidence."),

  item("I-IM1ASSE1A-01", "IM1-U1-L1", "A-SSE.1.a", "spiral_review",
    "In the expression 5(x + 3), what does the 5 represent?",
    [["A factor applied to the whole quantity (x + 3)", null],
     ["A term added to x + 3", "distribution-and-like-terms"],
     ["The value of x", "variable-interpretation"],
     ["A constant with no effect", "variable-interpretation"]], 0,
    "5 multiplies the entire grouped quantity, which is why distributing gives 5x + 15."),
  item("I-IM1NQ2-01", "IM1-U1-L1", "N-Q.2", "spiral_review",
    "A model reports a speed as '65'. What must be added for the quantity to be meaningful?",
    [["A unit, such as miles per hour", null],
     ["A larger sample", "no-verification"],
     ["A graph", "representation"],
     ["Nothing — 65 is clear", "unit-and-scale"]], 0,
    "Defining appropriate quantities means naming the unit, not just the number."),

  item("I-E9RL1-01", "E9-U1-L1", "RL.9-10.1", "spiral_review",
    "Which response cites the STRONGEST evidence for the inference that the narrator distrusts her uncle?",
    [["She 'counted the money twice' after he left the room.", null],
     ["She does not like him.", "evidence-without-support"],
     ["Her uncle visits often.", "evidence-without-support"],
     ["'He left the room.'", "quotation-without-commentary"]], 0,
    "The strongest evidence is the specific action that only distrust explains."),
];


// Transfer items and top-ups for the retrieval bank, so a support plan
// targeting any of these standards has a runnable readiness check and a
// grade-level transfer item.
const SPIRAL_BANK_EXTRA: DemoItem[] = [
  item("I-M6RP3B-02", "M6-U1-L1", "6.RP.3.b", "spiral_review",
    "A machine fills 45 bottles in 9 minutes. How many in 15 minutes at the same rate?",
    [["75", null], ["51", "calculation"], ["135", "unit-and-scale"], ["27", "inverse-operation"]], 0,
    "45 ÷ 9 = 5 bottles per minute; 5 × 15 = 75."),
  item("I-M6RP1-T1", "M6-U1-L1", "6.RP.1", "transfer_check",
    "In the recipe you are working with in class, the ratio of flour to sugar is 5 to 2. A classmate says that means there are 5 more cups of flour than sugar. Evaluate the claim.",
    [["Wrong — 5 to 2 is a multiplicative comparison, so there are 2.5 cups of flour per cup of sugar.", null],
     ["Right — 5 minus 2 is 3, close enough.", "fraction-or-ratio"],
     ["Wrong — there are 7 cups of flour.", "calculation"],
     ["Cannot tell without the batch size.", "no-verification"]], 0,
    "Applying ratio language to the current task, and correcting an additive reading, is the transfer move."),
  item("I-M6RP3B-T1", "M6-U1-L1", "6.RP.3.b", "transfer_check",
    "Using the rate table from your current lesson, 8 units cost $10. What do 20 units cost?",
    [["$25", null], ["$22", "calculation"], ["$16", "unit-and-scale"], ["$12.50", "inverse-operation"]], 0,
    "$10 ÷ 8 = $1.25 each; $1.25 × 20 = $25."),

  item("I-E6RL1-03", "E6-U1-L1", "RL.6.1", "spiral_review",
    "Which detail best supports the inference that a character is hiding something?",
    [["She 'answered before the question was finished.'", null],
     ["She is quiet.", "evidence-without-support"],
     ["She has a younger brother.", "evidence-without-support"],
     ["The room was cold.", "evidence-without-support"]], 0,
    "The specific behaviour is what the inference rests on."),
  item("I-E6RL1-T1", "E6-U1-L1", "RL.6.1", "transfer_check",
    "In the text you are reading now, make one inference and cite the detail that supports it.",
    [["The narrator does not trust the letter, because she 'read it twice and then folded it away.'", null],
     ["The narrator is sad.", "evidence-without-support"],
     ["'She folded it away.'", "quotation-without-commentary"],
     ["Letters are important in this book.", "evidence-without-support"]], 0,
    "Inference plus the citation from the CURRENT text is the transfer move."),

  item("I-S6E11-T1", "S6-U1-L1", "MS-ETS1-1", "transfer_check",
    "Restate the design problem in your current investigation with criteria and constraints.",
    [["Remove at least 80% of sediment from 1 L of water in under 3 minutes, using only approved classroom materials.", null],
     ["Build a good filter.", "criteria-ignored"],
     ["Test filters until one works.", "criteria-ignored"],
     ["Filter the water quickly.", "criteria-ignored"]], 0,
    "A well-defined problem for the CURRENT phenomenon, with measurable criteria and a stated constraint."),

  item("I-H6HS1-T1", "H6-U1-L1", "HSS-6.1", "transfer_check",
    "For the source set in your current unit, which explanation is best supported?",
    [["Storage pits and heavy tools at the site indicate year-round occupation, which the seasonal-camp reading cannot account for.", null],
     ["The site was permanent because it is old.", "evidence-without-support"],
     ["The site was seasonal because people moved a lot.", "single-cause"],
     ["There is no way to tell from remains.", "no-verification"]], 0,
    "Using the current source set, with evidence weighed against an alternative reading, is the transfer move."),

  item("I-IM1ASSE1A-02", "IM1-U1-L1", "A-SSE.1.a", "spiral_review",
    "In 3x + 7, which part is the coefficient?",
    [["3", null], ["x", "variable-interpretation"], ["7", "variable-interpretation"], ["3x", "representation"]], 0,
    "The coefficient is the factor multiplying the variable."),
  item("I-IM1ASSE1A-T1", "IM1-U1-L1", "A-SSE.1.a", "transfer_check",
    "A cost model is C = 15n + 200. Interpret the 15 in context.",
    [["The cost added for each additional unit.", null],
     ["The fixed setup cost.", "variable-interpretation"],
     ["The total cost.", "variable-interpretation"],
     ["The number of units.", "variable-interpretation"]], 0,
    "Interpreting a coefficient in a real context is the transfer move."),

  item("I-IM1NQ2-02", "IM1-U1-L1", "N-Q.2", "spiral_review",
    "Which quantity is defined well enough to model with?",
    [["Fuel used, in litres per 100 km", null],
     ["Fuel", "unit-and-scale"],
     ["A lot of fuel", "unit-and-scale"],
     ["Fuel, roughly", "unit-and-scale"]], 0,
    "A modelling quantity needs a name AND a unit."),
  item("I-IM1NQ2-T1", "IM1-U1-L1", "N-Q.2", "transfer_check",
    "For the model you are building in class, define the quantity you will report and its unit.",
    [["Water saved per household per week, in litres.", null],
     ["Water saved.", "unit-and-scale"],
     ["Savings.", "unit-and-scale"],
     ["A percentage.", "representation"]], 0,
    "Defining an appropriate quantity for the CURRENT model is the transfer move."),

  item("I-E9RL1-02", "E9-U1-L1", "RL.9-10.1", "spiral_review",
    "Which response cites evidence AND explains the inference?",
    [["He is bracing for bad news — he 'stood while everyone else sat.'", null],
     ["He stood up.", "evidence-without-support"],
     ["'Stood while everyone else sat.'", "quotation-without-commentary"],
     ["He seems tense.", "evidence-without-support"]], 0,
    "Both halves: the cited detail and the reasoning."),
  item("I-E9RL1-T1", "E9-U1-L1", "RL.9-10.1", "transfer_check",
    "In the text you are reading now, cite the strongest evidence for one inference about the narrator.",
    [["She has already decided to leave — she 'wrote the address on her hand' before the argument began.", null],
     ["She is upset.", "evidence-without-support"],
     ["'Before the argument began.'", "quotation-without-commentary"],
     ["The narrator is complicated.", "evidence-without-support"]], 0,
    "Strongest evidence plus reasoning, in the CURRENT text."),
];


// ---------------------------------------------------------------------------
// Per-subject retrieval bank.
//
// Spiral Review draws only from the lesson's own subject, and the selector takes
// at most one item per skill. That means a subject needs recall items across
// SEVERAL distinct standards before it can offer the 5-7 items the blueprint
// asks for — one standard with three items still yields one question.
//
// These cover the standards a grade-6 or grade-9 demo student has either been
// assessed on or is about to meet, drawn from the alignment matrix for their
// course. Social science is deepest because it was thinnest.
// ---------------------------------------------------------------------------

// --- Social science · Grade 6 Ancient World --------------------------------
const H6_RECALL: DemoItem[] = [
  item("I-H6CST1-01", "H6-U0-L1", "HSS-AS.6-8.CST.1", "spiral_review",
    "A timeline shows farming villages at 9000 BCE and the first cities at 4000 BCE. What does the gap tell you?",
    [["Villages came first, and cities took thousands of years to follow from them.", null],
     ["The two happened at about the same time.", "no-temporal-relationship"],
     ["Cities caused farming villages.", "no-temporal-relationship"],
     ["The dates are too old to compare.", "no-temporal-relationship"]], 0,
    "Reading a timeline means reading the distance between events, not only their order."),
  item("I-H6CST1-02", "H6-U0-L1", "HSS-AS.6-8.CST.1", "spiral_review",
    "Which is the earliest date?",
    [["3500 BCE", null], ["1200 BCE", "no-temporal-relationship"],
     ["500 BCE", "no-temporal-relationship"], ["100 CE", "no-temporal-relationship"]], 0,
    "BCE years count backwards: a larger BCE number is further in the past."),
  item("I-H6613-01", "H6-U1-L1", "HSS-6.1.3", "spiral_review",
    "Which change in the physical environment most directly enabled the domestication of plants?",
    [["A warmer, more stable climate that made growing seasons predictable", null],
     ["The invention of writing", "no-temporal-relationship"],
     ["The building of city walls", "no-temporal-relationship"],
     ["Long-distance trade routes", "no-temporal-relationship"]], 0,
    "Domestication depended on a climate that made planting worth the risk. Writing, walls, and trade all follow surplus."),
  item("I-H6613-02", "H6-U1-L1", "HSS-6.1.3", "spiral_review",
    "Early peoples changed their shelter and clothing when they settled. Why?",
    [["Staying in one place made heavier, more permanent materials worth using.", null],
     ["They ran out of animal hides.", "evidence-without-support"],
     ["Clothing styles simply changed over time.", "evidence-without-support"],
     ["Warmer climates removed the need for shelter.", "single-cause"]], 0,
    "Permanence changes what is practical: weight stops mattering once you are not carrying it."),
  item("I-H6REP1-01", "H6-U1-L1", "HSS-AS.6-8.REP.1", "spiral_review",
    "Which question can actually be answered by historical study?",
    [["What evidence shows how people at this site got their food?", null],
     ["Were these people happy?", "evidence-without-support"],
     ["Who was the best leader in history?", "evidence-without-support"],
     ["What would have happened if farming never began?", "evidence-without-support"]], 0,
    "A historical question points at evidence that could exist. The others ask for opinion or for a past that left no record."),
  item("I-H6REP4-01", "H6-U1-L1", "HSS-AS.6-8.REP.4", "spiral_review",
    "Which source is most credible for how a settlement was built?",
    [["An archaeological report on the excavated foundations", null],
     ["A novel set in that period", "ignores-provenance"],
     ["A legend written 2,000 years later", "ignores-provenance"],
     ["A modern painting of the settlement", "ignores-provenance"]], 0,
    "Credibility comes from proximity to the evidence. Distance in time and purpose both weaken a source."),
  item("I-H6WHST1-01", "H6-U1-L1", "WHST.6-8.1", "spiral_review",
    "A historical argument needs which three parts?",
    [["A claim, evidence from sources, and reasoning connecting them", null],
     ["A claim, a date, and a map", "evidence-without-support"],
     ["An opinion, a quotation, and a conclusion", "evidence-without-support"],
     ["A summary, a timeline, and a picture", "evidence-without-support"]], 0,
    "Evidence without reasoning is a list. Reasoning without evidence is an opinion."),
  item("I-H6RH1-01", "H6-U1-L3", "RH.6-8.1", "spiral_review",
    "A source says grain was stored 'in pits sealed with clay.' Which claim does that detail directly support?",
    [["The community planned for months when food was not being harvested.", null],
     ["The community was wealthy.", "ungrounded-inference"],
     ["The community traded with distant regions.", "ungrounded-inference"],
     ["Clay was their most common material.", "ungrounded-inference"]], 0,
    "Cite the detail that carries the claim. Sealed storage is about keeping food over time, not about wealth or trade."),
  item("I-H6612-01", "H6-U1-L3", "HSS-6.1.2", "spiral_review",
    "What most distinguishes a hunter-gatherer band from an agricultural village?",
    [["Whether the group stays in one place across the seasons", null],
     ["Whether the group uses tools", "single-cause"],
     ["Whether the group has leaders", "single-cause"],
     ["Whether the group makes art", "single-cause"]], 0,
    "Both made tools, had leadership, and made art. Settlement is the difference that reorganises everything else."),
];

// --- Mathematics · Mathematics 6 -------------------------------------------
const M6_RECALL: DemoItem[] = [
  item("I-M6RP3A-01", "M6-U1-L3", "6.RP.3.a", "spiral_review",
    "A ratio table shows 2 pens for $3. Which row continues the same ratio?",
    [["6 pens for $9", null], ["6 pens for $7", "fraction-or-ratio"],
     ["4 pens for $9", "fraction-or-ratio"], ["6 pens for $3", "calculation"]], 0,
    "Both quantities scale by the same factor. 2 and 3 each tripled."),
  item("I-M6NS1-01", "M6-U2-L1", "6.NS.1", "spiral_review",
    "How many 1/4-cup scoops are in 3 cups?",
    [["12", null], ["3/4", "inverse-operation"], ["7", "calculation"], ["3/4 of a scoop", "inverse-operation"]], 0,
    "Dividing by a fraction asks how many of it fit: 3 ÷ 1/4 = 12."),
  item("I-M6NS4-01", "M6-U2-L1", "6.NS.4", "spiral_review",
    "What is the greatest common factor of 18 and 24?",
    [["6", null], ["3", "calculation"], ["12", "calculation"], ["72", "inverse-operation"]], 0,
    "Factors of 18: 1, 2, 3, 6, 9, 18. Of 24: 1, 2, 3, 4, 6, 8, 12, 24. The largest shared factor is 6."),
  item("I-M6NS8-01", "M6-U2-L1", "6.NS.8", "spiral_review",
    "Two points sit at (3, 5) and (3, −2). How far apart are they?",
    [["7 units", null], ["3 units", "representation"], ["1 unit", "calculation"], ["10 units", "calculation"]], 0,
    "They share an x-coordinate, so the distance is the change in y: 5 − (−2) = 7."),
];

// --- English · English 6 ----------------------------------------------------
const E6_RECALL: DemoItem[] = [
  item("I-E6RL3-01", "E6-U1-L3", "RL.6.3", "spiral_review",
    "Which detail best shows a character responding to a change?",
    [["She stopped taking the long way home after the argument.", null],
     ["She walks home from school.", "evidence-without-support"],
     ["She is in sixth grade.", "evidence-without-support"],
     ["Her house is near the park.", "evidence-without-support"]], 0,
    "Response to change shows in what a character does differently, not in background facts."),
  item("I-E6RL4-01", "E6-U2-L1", "RL.6.4", "spiral_review",
    "The narrator calls the hallway 'a throat.' What does the word choice do?",
    [["It makes the hallway feel like something that could swallow her.", null],
     ["It tells us the hallway is narrow.", "topic-not-development"],
     ["It describes the hallway's colour.", "topic-not-development"],
     ["It shows the author knows anatomy.", "evidence-without-support"]], 0,
    "Figurative word choice carries feeling, not just description. 'Throat' brings threat with it."),
  item("I-E6RL5-01", "E6-U2-L2", "RL.6.5", "spiral_review",
    "Why might an author end a chapter mid-conversation?",
    [["To hold the tension so the reader carries it into the next chapter", null],
     ["Because the chapter reached its page limit", "evidence-without-support"],
     ["To show the conversation was unimportant", "ungrounded-inference"],
     ["To save space", "evidence-without-support"]], 0,
    "Structure is a choice. Where a section breaks shapes what the reader feels next."),
  item("I-E6RL9-01", "E6-U2-L2", "RL.6.9", "spiral_review",
    "Two myths from different cultures both explain a flood. What makes a comparison useful?",
    [["Looking at what each culture's version emphasises and what that reveals", null],
     ["Deciding which story is older", "evidence-without-support"],
     ["Counting how many characters each has", "topic-not-development"],
     ["Choosing the better-written one", "evidence-without-support"]], 0,
    "Comparing texts is for what the differences show, not for ranking them."),
  item("I-E6RL7-01", "E6-U2-L1", "RL.6.7", "spiral_review",
    "A film version cuts a character's inner thoughts. What is the effect?",
    [["The audience must infer her feelings from action instead of being told.", null],
     ["The story becomes shorter.", "topic-not-development"],
     ["The character becomes less important.", "ungrounded-inference"],
     ["Nothing changes.", "ungrounded-inference"]], 0,
    "Comparing media means asking what each form can and cannot show."),
];

// --- Science · Integrated Science 6 ----------------------------------------
const S6_RECALL: DemoItem[] = [
  item("I-S6E14-01", "S6-U1-L1", "MS-ETS1-4", "spiral_review",
    "A first prototype fails. What is the right next step?",
    [["Change one thing, test again, and record what changed.", null],
     ["Start over with a completely new design.", "uncontrolled-variable"],
     ["Change several things at once to save time.", "uncontrolled-variable"],
     ["Conclude the design cannot work.", "no-verification"]], 0,
    "Iteration only teaches you something if you can tell which change caused the result."),
  item("I-S6E13-01", "S6-U1-L3", "MS-ETS1-3", "spiral_review",
    "Two designs are tested. What is the best use of the results?",
    [["Combine the strongest feature of each into a new design.", null],
     ["Pick the winner and stop.", "criteria-ignored"],
     ["Average the two scores.", "criteria-ignored"],
     ["Retest the loser until it wins.", "no-verification"]], 0,
    "Comparing designs is for finding what works, not only for ranking."),
  item("I-S6RST1-01", "S6-U1-L2", "RST.6-8.1", "spiral_review",
    "A procedure says 'add the acid to the water, never the reverse.' What kind of statement is this?",
    [["A safety condition that changes the outcome if ignored", null],
     ["A suggestion for convenience", "missing-unit-or-precision"],
     ["A description of what will happen", "missing-unit-or-precision"],
     ["An optional step", "missing-unit-or-precision"]], 0,
    "Technical reading means noticing which steps are conditions and which are description."),
  item("I-S6LS11-01", "S6-U2-L1", "MS-LS1-1", "spiral_review",
    "What evidence supports the claim that all living things are made of cells?",
    [["Every organism examined under magnification shows cellular structure.", null],
     ["Living things grow.", "evidence-not-connected"],
     ["Living things need food.", "evidence-not-connected"],
     ["Cells are in textbooks.", "ignores-provenance"]], 0,
    "The claim is about structure, so the evidence has to be about observed structure."),
  item("I-S6RST2-01", "S6-U2-L1", "RST.6-8.2", "spiral_review",
    "A paragraph describes a process in five steps. What is the best summary?",
    [["The process in order, without the examples used to illustrate it", null],
     ["The first and last steps only", "evidence-not-connected"],
     ["Every sentence shortened", "evidence-not-connected"],
     ["The most interesting step", "evidence-not-connected"]], 0,
    "A summary keeps the central idea and its structure, and drops the illustration."),
  item("I-S6WHST1-01", "S6-U1-L3", "WHST.6-8.1", "spiral_review",
    "A scientific argument needs evidence AND what else?",
    [["Reasoning that explains why the evidence supports the claim", null],
     ["A second opinion", "evidence-not-connected"],
     ["More data", "evidence-not-connected"],
     ["A diagram", "evidence-not-connected"]], 0,
    "Listing data is not arguing. The reasoning is what links data to claim."),
];

// --- Mathematics · Integrated Math 1 ---------------------------------------
const IM1_RECALL: DemoItem[] = [
  item("I-IM1NQ1-01", "IM1-U1-L3", "N-Q.1", "spiral_review",
    "A graph's vertical axis is labelled only '0, 10, 20'. What is missing?",
    [["The quantity and its unit", null], ["More gridlines", "representation"],
     ["A title", "representation"], ["Nothing", "unit-and-scale"]], 0,
    "Axes carry quantities, not just numbers. Without a unit the scale means nothing."),
  item("I-IM1FIF6-01", "IM1-U2-L1", "F-IF.6", "spiral_review",
    "A function goes from (2, 7) to (6, 19). What is its average rate of change?",
    [["3", null], ["12", "calculation"], ["4", "inverse-operation"], ["26", "calculation"]], 0,
    "(19 − 7) ÷ (6 − 2) = 12 ÷ 4 = 3."),
  item("I-IM1FIF9-01", "IM1-U2-L1", "F-IF.9", "spiral_review",
    "Function A is a table rising by 5 each step. Function B is y = 3x + 10. Which grows faster?",
    [["A, because 5 per step is greater than 3 per step", null],
     ["B, because it has a larger constant", "variable-interpretation"],
     ["They grow the same", "calculation"],
     ["It cannot be compared across forms", "representation"]], 0,
    "Comparing across representations means comparing the same feature — here, rate of change."),
  item("I-IM1FBF3-01", "IM1-U2-L1", "F-BF.3", "spiral_review",
    "How does the graph of f(x) + 4 differ from f(x)?",
    [["It shifts up 4 units", null], ["It shifts right 4 units", "representation"],
     ["It becomes 4 times steeper", "representation"], ["It shifts down 4 units", "sign"]], 0,
    "Adding outside the function moves the output, which is vertical."),
];

// --- English · English 9 ----------------------------------------------------
const E9_RECALL: DemoItem[] = [
  item("I-E9RL3-01", "E9-U1-L3", "RL.9-10.3", "spiral_review",
    "Which shows a complex character rather than a flat one?",
    [["She defends the person she has spent the whole book resenting.", null],
     ["She is brave in every scene.", "topic-not-development"],
     ["She is described as tall and quiet.", "evidence-without-support"],
     ["She appears in most chapters.", "evidence-without-support"]], 0,
    "Complexity shows in conflicting motivations, not in how often a character appears."),
  item("I-E9RL4-01", "E9-U2-L1", "RL.9-10.4", "spiral_review",
    "A speaker repeats 'we were told' four times. What is the effect?",
    [["It builds pressure and hints that what they were told was false.", null],
     ["It shows the speaker forgot what they said.", "ungrounded-inference"],
     ["It fills space in the paragraph.", "evidence-without-support"],
     ["It makes the passage longer.", "evidence-without-support"]], 0,
    "Repetition is a choice. Ask what accumulates across the repetitions."),
  item("I-E9RL7-01", "E9-U2-L1", "RL.9-10.7", "spiral_review",
    "A stage version moves a scene from a kitchen to a courtroom. What should analysis focus on?",
    [["What the new setting emphasises that the original did not", null],
     ["Whether the change is faithful to the book", "evidence-without-support"],
     ["Which version is better", "evidence-without-support"],
     ["How long each version runs", "evidence-without-support"]], 0,
    "Comparing treatments means asking what each choice foregrounds."),
];


// --- Remaining demo pathways: grade 8 and grade 9 --------------------------
// Without these, several demo students' Spiral Review is correctly scoped and
// empty, which reads as broken rather than as scoped.
const GRADE8_RECALL: DemoItem[] = [
  item("I-M8EE1-01", "M8-U1-L1", "8.EE.1", "spiral_review",
    "Simplify 3² × 3⁴.",
    [["3⁶", null], ["3⁸", "calculation"], ["9⁶", "representation"], ["6⁶", "calculation"]], 0,
    "Multiplying powers with the same base adds the exponents; the base does not change."),
  item("I-M8EE4-01", "M8-U1-L1", "8.EE.4", "spiral_review",
    "Write 0.00042 in scientific notation.",
    [["4.2 × 10⁻⁴", null], ["4.2 × 10⁴", "sign"],
     ["42 × 10⁻⁵", "representation"], ["4.2 × 10⁻³", "calculation"]], 0,
    "The coefficient sits between 1 and 10, and a number smaller than 1 takes a negative exponent."),
  item("I-M8EE2-01", "M8-U1-L2", "8.EE.2", "spiral_review",
    "Solve x² = 49.",
    [["x = 7 or x = −7", null], ["x = 7", "sign"],
     ["x = 24.5", "inverse-operation"], ["x = 2401", "inverse-operation"]], 0,
    "A square root equation has two solutions unless the context rules one out."),
  item("I-E8RL1-01", "E8-U1-L1", "RL.8.1", "spiral_review",
    "Which response cites the strongest evidence for an inference?",
    [["He had already packed — his bag was by the door before she asked.", null],
     ["He wanted to leave.", "evidence-without-support"],
     ["'His bag was by the door.'", "quotation-without-commentary"],
     ["He seems like the type to leave.", "ungrounded-inference"]], 0,
    "Strongest evidence is the detail that only the inference explains, stated with reasoning."),
  item("I-E8RL2-01", "E8-U1-L2", "RL.8.2", "spiral_review",
    "Which statement is a theme rather than a summary?",
    [["Trust, once broken, is rebuilt by actions rather than explanations.", null],
     ["He apologises in chapter nine.", "topic-not-development"],
     ["The story is about trust.", "topic-not-development"],
     ["There are two narrators.", "topic-not-development"]], 0,
    "A theme claims something about the topic that the whole text supports."),
];

const GRADE9_RECALL: DemoItem[] = [
  item("I-E9RL9-01", "E9-U2-L2", "RL.9-10.9", "spiral_review",
    "An author reworks a well-known myth. What should analysis focus on?",
    [["What the author changed, and what that change argues", null],
     ["Whether the retelling is accurate", "evidence-without-support"],
     ["Which version is older", "evidence-without-support"],
     ["How closely the plots match", "topic-not-development"]], 0,
    "Transformation is the point: the departures carry the author's argument."),
  item("I-LERST1-01", "LE-U1-L1", "RST.9-10.1", "spiral_review",
    "A text states that a population 'declined sharply after the predator was reintroduced.' What does this directly support?",
    [["A relationship between predator presence and prey numbers", null],
     ["That the predator is dangerous to humans", "ungrounded-inference"],
     ["That the ecosystem is now healthy", "ungrounded-inference"],
     ["That reintroduction was a mistake", "ungrounded-inference"]], 0,
    "Cite what the text supports, not what it suggests. A correlation in time is not a verdict."),
  item("I-LEWHST1-01", "LE-U1-L2", "WHST.9-10.1", "spiral_review",
    "A scientific argument is strongest when it also does what?",
    [["Addresses the most credible alternative explanation", null],
     ["Includes more data", "evidence-not-connected"],
     ["Uses more technical vocabulary", "evidence-not-connected"],
     ["States the claim more forcefully", "evidence-not-connected"]], 0,
    "An argument that never meets the counter-explanation has not been tested."),
  item("I-LERST2-01", "LE-U2-L1", "RST.9-10.2", "spiral_review",
    "What belongs in a summary of an experimental result?",
    [["The question, what was measured, and what the measurement showed", null],
     ["The researchers' names and institution", "evidence-not-connected"],
     ["Every measurement recorded", "evidence-not-connected"],
     ["Why the result matters to you", "evidence-without-support"]], 0,
    "A summary keeps the central finding and how it was reached."),
  item("I-H9CST3-01", "H9-U1-L1", "HSS-AS.9-12.CST.3", "spiral_review",
    "Two regions industrialised fifty years apart. What does that difference let you analyse?",
    [["How conditions in each period shaped the way industrialisation happened", null],
     ["Which region is more advanced", "evidence-without-support"],
     ["That one region copied the other", "single-cause"],
     ["Nothing — the gap is too small", "no-temporal-relationship"]], 0,
    "Chronological reasoning compares circumstances, not rankings."),
  item("I-H9REP2-01", "H9-U1-L1", "HSS-AS.9-12.REP.2", "spiral_review",
    "A dataset on migration comes from a government census. What should you note about it?",
    [["Who was counted, who was missed, and why the count was taken", null],
     ["That government data is always reliable", "ignores-provenance"],
     ["That census data is always incomplete", "ignores-provenance"],
     ["The total figure only", "ignores-provenance"]], 0,
    "Provenance applies to quantitative sources too: a census is a decision about whom to count."),
  item("I-H9RH1-01", "H9-U1-L1", "RH.9-10.1", "spiral_review",
    "A source describes a port as 'the busiest on the coast.' To use this as evidence you should first ask:",
    [["Who wrote it, when, and compared with what", null],
     ["Whether the port still exists", "evidence-without-support"],
     ["How large the coast is", "evidence-without-support"],
     ["Whether it sounds plausible", "evidence-without-support"]], 0,
    "A superlative is a claim. Sourcing it means asking who is making the comparison and against what."),
  item("I-H9GEO1-01", "H9-U1-L1", "GEO-LOCAL.1", "spiral_review",
    "A map uses a scale of 1:50,000. What does that tell you?",
    [["One unit on the map equals 50,000 of the same unit on the ground", null],
     ["The map covers 50,000 square kilometres", "map-misread"],
     ["The map has 50,000 features", "map-misread"],
     ["The map is 50,000 times more accurate", "map-misread"]], 0,
    "Scale is a ratio between map distance and ground distance, nothing else."),
];

const ALL_ITEMS: DemoItem[] = [
  ...SPIRAL_BANK,
  ...SPIRAL_BANK_EXTRA,
  ...H6_RECALL,
  ...M6_RECALL,
  ...E6_RECALL,
  ...S6_RECALL,
  ...IM1_RECALL,
  ...E9_RECALL,
  ...GRADE8_RECALL,
  ...GRADE9_RECALL,
  ...M6_U1_L2,
  ...E6_U1_L2,
  ...S6_U1_L2,
  ...H6_U1_L2,
  ...IM1_U2_L2,
  ...E9_U1_L2,
];

const byLesson = new Map<string, DemoItem[]>();
for (const i of ALL_ITEMS) {
  byLesson.set(i.lessonCode, [...(byLesson.get(i.lessonCode) ?? []), i]);
}

const byId = new Map(ALL_ITEMS.map((i) => [i.id, i]));

/** Lesson codes that have a demo item bank. Everything else says so plainly. */
export const AUTHORED_LESSON_CODES: readonly string[] = [...byLesson.keys()];

export function itemsFor(lessonCode: string, purpose?: ItemPurpose): DemoItem[] {
  const items = byLesson.get(lessonCode) ?? [];
  return purpose ? items.filter((i) => i.purpose === purpose) : items;
}

export function itemById(id: string): DemoItem | undefined {
  return byId.get(id);
}

export function itemsForStandard(standard: string): DemoItem[] {
  return ALL_ITEMS.filter((i) => i.standard === standard);
}

/**
 * The readiness check for a support plan targeting `standard`.
 * Retrieval items count as readiness items: both measure the intervention
 * skill independently, which is what the return rule asks for.
 */
export function readinessItemsFor(standard: string): DemoItem[] {
  return ALL_ITEMS.filter(
    (i) =>
      i.standard === standard &&
      (i.purpose === "readiness_check" || i.purpose === "spiral_review"),
  );
}

/** The grade-level transfer item connected to the blocked standard. */
export function transferItemFor(standard: string): DemoItem | undefined {
  return ALL_ITEMS.find(
    (i) => i.standard === standard && i.purpose === "transfer_check",
  );
}

/** True when a support plan on this standard can actually be run and scored. */
export function supportIsRunnable(standard: string): boolean {
  return readinessItemsFor(standard).length >= 2 && transferItemFor(standard) !== undefined;
}

export function hasAuthoredItems(lessonCode: string): boolean {
  return byLesson.has(lessonCode);
}

/** True only when the lesson has a scoreable Exit Ticket. */
export function hasExitTicket(lessonCode: string): boolean {
  return itemsFor(lessonCode, "exit_ticket").length > 0;
}

export { ALL_ITEMS };
