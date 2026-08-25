/**
 * ============================================================================
 * DEMO LESSON SEQUENCES — NOT AUTHORED CURRICULUM
 * ============================================================================
 *
 * Narrative multi-phase sequences: a run of short phases inside one storyline,
 * used to show what a themed unit looks like in the lesson player.
 *
 * These are demonstration content (ADR 0005). Their PHASES are written here;
 * the STANDARDS each phase connects to are real codes from the Math 1 standards
 * crosswalk, so the connection back to the pathway is genuine even though the
 * storyline is not adopted curriculum.
 *
 * An example sequence does not affect pathway progression: completing one
 * writes no evidence, no grade, and moves no lesson state. Every surface that
 * shows one says so.
 */

export type SequencePhase = {
  id: string;
  title: string;
  /** The one thing this phase asks the student to do. */
  objective: string;
  /** The narrative beat, in the student's second person. */
  brief: string;
  /** Real standard codes from the Math 1 standards crosswalk. */
  standards: string[];
  /** The pathway lesson whose content this phase draws on. */
  linkedLessonCode: string;
  minutes: number;
};

export type SequenceMission = {
  id: string;
  title: string;
  premise: string;
  phases: SequencePhase[];
};

export type LessonSequence = {
  id: string;
  name: string;
  subtitle: string;
  courseTitle: string;
  premise: string;
  /** What a reviewer should notice about the design. */
  designNote: string;
  missions: SequenceMission[];
};

const OPERATION_FIREWALL: LessonSequence = {
  id: "operation-firewall",
  name: "Operation Firewall",
  subtitle: "Equation security and error analysis",
  courseTitle: "Math 1",
  premise:
    "A routing system called Nexus-9 is rejecting valid credentials and accepting invalid ones. Somewhere in its verification chain, an equation is being solved wrongly. You are the analyst assigned to find the fault, trace it, and prove the repair holds.",
  designNote:
    "Every phase is error analysis: the student is given work that is already done and asked to decide whether it is sound. That is a different demand from solving, and it is the demand that transfers.",
  missions: [
    {
      id: "intercept",
      title: "Mission 1 — Intercept",
      premise:
        "Three verification steps failed overnight. Each one contains exactly one bad move.",
      phases: [
        {
          id: "fw-1",
          title: "Read the log",
          objective: "Identify which line of a worked solution introduces the error.",
          brief:
            "The log shows four lines of algebra. Three are sound. Mark the line where the reasoning breaks, not the line where the answer first looks wrong — they are rarely the same line.",
          standards: ["A-REI.1"],
          linkedLessonCode: "MATH-1-L022",
          minutes: 12,
        },
        {
          id: "fw-2",
          title: "Name the move",
          objective: "Name the property that was violated, not just the arithmetic slip.",
          brief:
            "Saying '3 should have been 5' closes one ticket. Saying 'the operation was applied to one side only' closes every ticket of that kind.",
          standards: ["A-REI.1"],
          linkedLessonCode: "MATH-1-L022",
          minutes: 12,
        },
        {
          id: "fw-3",
          title: "Repair and verify",
          objective: "Correct the solution and check it against the original equation.",
          brief:
            "A repair that is not checked is a guess. Substitute back into the equation as it was first written, not as you rewrote it.",
          standards: ["A-REI.1", "A-REI.3"],
          linkedLessonCode: "MATH-1-L035",
          minutes: 15,
        },
        {
          id: "fw-4",
          title: "Two credentials, one rule",
          objective: "Solve a linear equation with the variable on both sides.",
          brief:
            "Nexus-9 compares two credential strings. They are equal only for one value. Find it, and say what it means that there is exactly one.",
          standards: ["A-REI.3"],
          linkedLessonCode: "MATH-1-L035",
          minutes: 15,
        },
        {
          id: "fw-5",
          title: "The impossible credential",
          objective: "Recognise an equation with no solution and say why.",
          brief:
            "One string never validates. Show that the equation reduces to a false statement, and explain what that tells you about the system rather than about your algebra.",
          standards: ["A-REI.1", "A-REI.3"],
          linkedLessonCode: "MATH-1-L035",
          minutes: 15,
        },
      ],
    },
    {
      id: "trace",
      title: "Mission 2 — Trace",
      premise:
        "The fault is upstream. You have to rebuild the chain from a constraint, not from an equation you were handed.",
      phases: [
        {
          id: "fw-6",
          title: "Write the constraint",
          objective: "Create an equation from a described condition.",
          brief:
            "The specification is in words: 'the total packet size must equal the header plus four times the payload block.' Turn it into an equation and name what each letter stands for.",
          standards: ["A-CED.1"],
          linkedLessonCode: "MATH-1-L018",
          minutes: 15,
        },
        {
          id: "fw-7",
          title: "Rearrange for the unknown",
          objective: "Solve a literal equation for a named variable.",
          brief:
            "You need payload size, but the formula is written for total size. Rearrange it, and keep the units attached the whole way.",
          standards: ["A-CED.4"],
          linkedLessonCode: "MATH-1-L018",
          minutes: 15,
        },
        {
          id: "fw-8",
          title: "Bound the range",
          objective: "Write and solve a one-variable inequality in context.",
          brief:
            "Anything above the threshold is dropped. Write the inequality, solve it, and say which values are actually allowed given that packets come in whole blocks.",
          standards: ["A-REI.3.1"],
          linkedLessonCode: "MATH-1-L018",
          minutes: 15,
        },
        {
          id: "fw-9",
          title: "Two conditions at once",
          objective: "Interpret the solution of a system as a shared condition.",
          brief:
            "Two routes must agree. The point where they agree is the solution of the system — say what that point means in the situation, not just what its coordinates are.",
          standards: ["A-REI.6"],
          linkedLessonCode: "MATH-1-L035",
          minutes: 18,
        },
        {
          id: "fw-10",
          title: "Audit the audit",
          objective: "Evaluate someone else's justification, step by step.",
          brief:
            "Another analyst filed a repair with reasoning attached. Decide whether each justification actually supports its step, and rewrite the ones that do not.",
          standards: ["A-REI.1"],
          linkedLessonCode: "MATH-1-L022",
          minutes: 18,
        },
      ],
    },
    {
      id: "harden",
      title: "Mission 3 — Harden",
      premise:
        "The fix works. Now prove it will keep working, and hand it over so someone else can trust it.",
      phases: [
        {
          id: "fw-11",
          title: "Justify every step",
          objective: "Produce a solution where each line names the property used.",
          brief:
            "Write the solution as a sequence of claims. Each line gets the reason it is allowed. This is what makes a repair reviewable by someone who was not there.",
          standards: ["A-REI.1"],
          linkedLessonCode: "MATH-1-L022",
          minutes: 18,
        },
        {
          id: "fw-12",
          title: "The extraneous credential",
          objective: "Identify a solution that satisfies a rewritten equation but not the original.",
          brief:
            "One candidate passes the final check and fails the first. Explain how a legal-looking step introduced a value the original never allowed.",
          standards: ["A-REI.1"],
          linkedLessonCode: "MATH-1-L022",
          minutes: 18,
        },
        {
          id: "fw-13",
          title: "Model the load",
          objective: "Represent constraints on two quantities graphically.",
          brief:
            "Bandwidth and latency trade against each other. Graph the region that satisfies both constraints and describe what a point inside it means operationally.",
          standards: ["A-REI.12"],
          linkedLessonCode: "MATH-1-L035",
          minutes: 20,
        },
        {
          id: "fw-14",
          title: "Explain it to operations",
          objective: "Communicate a solution to a non-specialist without losing precision.",
          brief:
            "Write the handover. Say what was wrong, what you changed, and how anyone can verify it — in language an operations lead will act on.",
          standards: ["A-CED.1"],
          linkedLessonCode: "MATH-1-L018",
          minutes: 20,
        },
        {
          id: "fw-15",
          title: "Transfer: a new system",
          objective: "Apply the same error-analysis routine to an unfamiliar context.",
          brief:
            "A billing system, not a router. Same routine: find the faulty line, name the move, repair, verify, justify.",
          standards: ["A-REI.1", "A-REI.3"],
          linkedLessonCode: "MATH-1-L035",
          minutes: 22,
        },
        {
          id: "fw-16",
          title: "Debrief",
          objective: "Name the error families you can now recognise on sight.",
          brief:
            "List the faults you met and what gave each one away. This list is the thing you keep — the storyline is not.",
          standards: ["A-REI.1"],
          linkedLessonCode: "MATH-1-L022",
          minutes: 12,
        },
      ],
    },
  ],
};

const CITY_TRANSIT: LessonSequence = {
  id: "city-transit",
  name: "City Transit",
  subtitle: "Linear functions",
  courseTitle: "Math 1",
  premise:
    "A city is rebuilding a rail network that was closed for a decade. Ridership, cost, travel time, and fare revenue all move together, and the planning board needs models it can argue with.",
  designNote:
    "Every phase changes representation — table to rate, rate to graph, graph to equation, equation back to the situation. The point is that these are one object seen four ways, not four topics.",
  missions: [
    {
      id: "survey",
      title: "Mission 1 — Survey the line",
      premise: "Before anything is rebuilt, the board needs to know what the data says.",
      phases: [
        {
          id: "ct-1",
          title: "Rate from a table",
          objective: "Compute a rate of change from a table of values.",
          brief:
            "Ridership counts at five stations. Find the change per station and say whether it is constant — and what it would mean for the model if it were not.",
          standards: ["F-IF.6"],
          linkedLessonCode: "MATH-1-L049",
          minutes: 15,
        },
        {
          id: "ct-2",
          title: "Slope from two points",
          objective: "Compute slope and attach its units.",
          brief:
            "Two stations, two ridership figures. The number you get is meaningless until you say 'riders per station' — write it that way.",
          standards: ["F-IF.6"],
          linkedLessonCode: "MATH-1-L049",
          minutes: 15,
        },
        {
          id: "ct-3",
          title: "Graph the line",
          objective: "Graph a linear function and label both axes with quantities and units.",
          brief:
            "Plot the ridership model. An unlabelled axis is an unusable graph — the board cannot argue with a picture that does not say what it shows.",
          standards: ["F-IF.7.a"],
          linkedLessonCode: "MATH-1-L046",
          minutes: 18,
        },
        {
          id: "ct-4",
          title: "Read the intercept",
          objective: "Interpret the y-intercept in the situation, not just on the axis.",
          brief:
            "The model predicts a value at station zero. Say what that number means for a rail line, and whether it is a real quantity or an artefact of the model.",
          standards: ["F-IF.4"],
          linkedLessonCode: "MATH-1-L046",
          minutes: 15,
        },
      ],
    },
    {
      id: "model",
      title: "Mission 2 — Build the model",
      premise: "The board wants a formula it can put in a report.",
      phases: [
        {
          id: "ct-5",
          title: "Write the equation",
          objective: "Write a linear function from a rate and a starting value.",
          brief:
            "Turn the rate and the intercept into a function. Name the input and the output, and say what domain actually makes sense for a rail line.",
          standards: ["F-BF.1.b", "F-IF.1"],
          linkedLessonCode: "MATH-1-L046",
          minutes: 18,
        },
        {
          id: "ct-6",
          title: "Domain in context",
          objective: "State a domain that the situation allows.",
          brief:
            "Negative stations do not exist and neither do 4.5 of them. Say what the domain is and why the mathematics alone will not tell you.",
          standards: ["F-IF.5"],
          linkedLessonCode: "MATH-1-L051",
          minutes: 15,
        },
        {
          id: "ct-7",
          title: "Compare two routes",
          objective: "Compare two linear models presented in different forms.",
          brief:
            "Route A comes as a table, Route B as an equation. Compare their rates without converting one into the other's form first — then check yourself by converting.",
          standards: ["F-IF.9"],
          linkedLessonCode: "MATH-1-L049",
          minutes: 20,
        },
        {
          id: "ct-8",
          title: "Where the routes meet",
          objective: "Find and interpret the point where two models agree.",
          brief:
            "At some ridership level the two routes cost the same. Find it, and tell the board what decision that point actually informs.",
          standards: ["A-REI.11"],
          linkedLessonCode: "MATH-1-L022",
          minutes: 20,
        },
      ],
    },
    {
      id: "argue",
      title: "Mission 3 — Argue for it",
      premise: "A model nobody can question is a model nobody should trust.",
      phases: [
        {
          id: "ct-9",
          title: "Stress the model",
          objective: "Identify where a linear model stops being reasonable.",
          brief:
            "Extend the ridership line far enough and it predicts more riders than the city has people. Say where it breaks and what that means about using it.",
          standards: ["F-IF.4"],
          linkedLessonCode: "MATH-1-L046",
          minutes: 18,
        },
        {
          id: "ct-10",
          title: "Transfer: the fare model",
          objective: "Build and interpret a linear model for an unfamiliar quantity.",
          brief:
            "Fare revenue, not ridership. Same routine: rate, intercept, equation, domain, and one sentence saying what the model is good for.",
          standards: ["F-BF.1.b", "F-IF.5"],
          linkedLessonCode: "MATH-1-L051",
          minutes: 22,
        },
        {
          id: "ct-11",
          title: "Present to the board",
          objective: "Defend a model against a specific objection.",
          brief:
            "A board member says the rate is wrong because one station is an outlier. Answer with the data, not with the model.",
          standards: ["F-IF.9"],
          linkedLessonCode: "MATH-1-L049",
          minutes: 20,
        },
      ],
    },
  ],
};

const SEQUENCES: LessonSequence[] = [OPERATION_FIREWALL, CITY_TRANSIT];

export function allSequences(): LessonSequence[] {
  return SEQUENCES;
}

export function sequenceById(id: string): LessonSequence | undefined {
  return SEQUENCES.find((s) => s.id === id);
}

export function phaseCount(sequence: LessonSequence): number {
  return sequence.missions.reduce((n, m) => n + m.phases.length, 0);
}

export function sequenceMinutes(sequence: LessonSequence): number {
  return sequence.missions.reduce(
    (n, m) => n + m.phases.reduce((k, p) => k + p.minutes, 0),
    0,
  );
}
