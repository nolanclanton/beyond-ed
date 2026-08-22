**PLATFORM CONCEPT & PRODUCT BLUEPRINT**

**Beyond.Ed**

A grades 6--12 learning platform for coherent core pathways,\
evidence-based intervention, and accountable human decisions

**175 available workdays \| 135 normal pathway days \| 40
intervention-capacity days**

*Description of the learner experience, role-based portals, four-subject
curriculum system, intervention engine, data architecture, and launch
requirements*

**August 2026**

# Executive overview

Beyond.Ed is a unified grades 6--12 learning and academic-operations
platform designed around one promise: every student remains connected to
a rigorous course pathway while receiving precise, timely support when
evidence shows a barrier. The initial core catalog spans mathematics,
English language arts, science, and social science. Students, teachers,
site leaders, and organization-level administrators see different
workspaces, but each workspace reads from the same curriculum,
enrollment, evidence, mastery, intervention, and audit records.

+-----------------------+-----------------------+-----------------------+
| **175**               | **135**               | **40**                |
|                       |                       |                       |
| **TOTAL AVAILABLE     | **NORMAL PATHWAY      | **                    |
| WORKDAYS**            | DAYS**                | INTERVENTION-CAPACITY |
|                       |                       | DAYS**                |
+=======================+=======================+=======================+
+-----------------------+-----------------------+-----------------------+

Every full-year course protects 135 days for normal pathway lessons and
reserves 40 days as intervention capacity. The reserve is not a parallel
remedial track and is not automatically assigned to every student. It is
structured time for targeted mini-lessons, readiness and transfer
checks, teacher conferences, recovery, cumulative review, and---when
intervention is unnecessary---extension or acceleration. This prevents
support from becoming an unplanned interruption that quietly consumes
the core curriculum.

  -----------------------------------------------------------------------
  **CORE PROMISE** Detect the smallest blocking skill, show the evidence,
  assign the shortest appropriate support, verify transfer, and return
  the student to the exact pathway location.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 1. Product vision and design principles

Beyond.Ed should feel calm, clear, and purposeful rather than crowded or
punitive. Blue and green provide the dominant visual language; yellow,
orange, and red are reserved for memory cues, encouragement, and
genuinely urgent states. The design uses supportive language and
specific next actions instead of exposing raw risk labels to students.

-   **One source of truth.** All authorized portals use the same
    underlying records and status models.

-   **Course pathway first.** Intervention repairs a bounded barrier and
    returns the learner to the exact central course sequence.

-   **Evidence before intervention.** Every recommendation points to an
    item, rubric dimension, error pattern, missing prerequisite, or
    teacher observation.

-   **Fast teacher action.** A teacher can understand, preview, assign,
    and monitor a support in a few clicks.

-   **Student clarity.** Every student view answers: What am I doing
    now? Why am I doing it? What must I show next?

-   **Mastery and grades remain distinct.** Grades summarize official
    performance; mastery estimates readiness and directs review.

-   **Human-controlled recommendations.** Transparent rules may detect
    and recommend, but consequential assignments, overrides, grades, and
    publication actions remain attributable to an authorized person.

-   **Functional honesty.** Controls that cannot safely complete an
    action are hidden or explicitly labeled as previews.

-   **Discipline-authentic learning.** Mathematics uses modeling,
    English uses text and composition, science uses phenomena and
    investigation, and social science uses inquiry and source analysis.

-   **Accessible by design.** Keyboard access, visible focus, non-color
    status labels, captions, transcripts, readable contrast, and
    responsive layouts are baseline requirements.

# 2. The 175-day learning model

## Annual capacity contract

The schedule is governed by three hard constraints: the available
student work calendar totals 175 days; normal pathway unit budgets total
exactly 135 days; and intervention capacity totals exactly 40 days.
Curriculum editing and calendar tools should validate these totals
before publication and clearly identify any over-allocation.

  ------------------------------------------------------------------------------------
  **Planning   **Pathway   **Intervention   **Total**   **Primary planning use**
  cycle**      days**      days**                       
  ------------ ----------- ---------------- ----------- ------------------------------
  1            14          4                18          Launch, baseline evidence, and
                                                        early routines

  2            13          4                17          Initial prerequisite repair
                                                        and pathway return

  3            14          4                18          Core instruction with targeted
                                                        review

  4            13          4                17          First cumulative transfer
                                                        window

  5            14          4                18          Midyear readiness and recovery

  6            13          4                17          New-semester pathway launch

  7            14          4                18          Targeted repair before major
                                                        dependencies

  8            13          4                17          Cumulative practice and
                                                        performance evidence
  ------------------------------------------------------------------------------------

  ------------------------------------------------------------------------------------
  **Planning   **Pathway   **Intervention   **Total**   **Primary planning use**
  cycle**      days**      days**                       
  ------------ ----------- ---------------- ----------- ------------------------------
  9            14          4                18          Late-year recovery or
                                                        acceleration

  10           13          4                17          Mastery demonstration,
                                                        transfer, and closure

  TOTAL        135         40               175         Validated annual capacity
  ------------------------------------------------------------------------------------

Operating interpretation: ten flexible learning cycles each reserve four
intervention-capacity days. Five cycles contain 14 normal pathway days
and five contain 13, creating an exact 135 + 40 = 175 model without
depending on a particular district calendar. Local calendars map the
cycles to actual dates and nonstudent days.

## How intervention-capacity days work

-   **Student-specific, not universal.** A student completes only the
    support justified by evidence. Different students may receive
    different lessons or use the time for transfer, extension, or
    conferencing.

-   **Protected outside core unit budgets.** Course authors cannot
    consume the 40-day reserve by silently expanding normal lesson
    counts.

-   **Flexible within the day.** A capacity day may contain a short
    10--25 minute intervention, a readiness check, and a return to
    grade-level work rather than a full day of remediation.

-   **Visible workload.** Teachers see active plans, estimated minutes,
    due expectations, and collisions across subjects before assigning
    more work.

-   **No automatic backfill.** Unused capacity may become extension,
    acceleration, cumulative practice, or project work; it does not
    automatically create extra required assignments.

-   **Publication guardrail.** Every course, unit, and site calendar
    exposes pathway-day and intervention-day totals so leaders can
    verify the annual promise.

# 3. Unified platform architecture

Every portal is a role-specific window into one connected model. The
core hierarchy is Organization → Site → User → Role; Student → Grade
placement → Roster section → Teacher assignment → Course enrollment;
Subject → Program pathway → Course → Course version → Unit →
Instructional section → Lesson → Stage; and Standard → Practice or
rubric dimension → Skill → Prerequisite → Assessment item. Evidence
flows forward into mastery and intervention, while curriculum versions
preserve the context in which past work occurred.

  ------------------------------------------------------------------------
  **Shared       **What it owns**              **What it powers**
  record**                                     
  -------------- ----------------------------- ---------------------------
  Curriculum     Grade bands, ordered courses, Student lesson player;
  Pathway        units, instructional          teacher curriculum view;
                 sections, lessons, stages,    pacing and publication
                 standards, prerequisites,     
                 assessments, resources, and   
                 versions                      

  Student Skill  Readiness status, confidence, Progress views;
  Profile        recency, error patterns,      recommendation ranking;
                 dependencies, and review      upcoming-dependency alerts
                 priority                      

  Evidence       Immutable attempts,           Grades; mastery updates;
  Ledger         responses, rubric dimensions, integrity review;
                 hints, meaningful time,       intervention triggers
                 observations, and proctored   
                 evidence                      

  Intervention   Trigger evidence, target      Student Review; teacher
  Plan           skill, teacher decision,      monitoring; site and
                 assigned support, checks,     organization outcomes
                 outcome, and return           
                 destination                   
  ------------------------------------------------------------------------

## Canonical status models

-   **Lesson:** Locked, Available, In progress, Submitted, Passed,
    Review scheduled, Completed.

-   **Intervention:** Recommended, Teacher reviewed, Assigned, In
    progress, Readiness check, Passed, Returned to pathway, Escalated,
    Closed.

-   **Enrollment:** Pending, Active, Transferred, Withdrawn, Archived.

-   **Curriculum:** Draft, In review, Approved, Published, Retired.

-   **Administrative action:** Prepared, Confirmed, Completed, Failed,
    and Reversed when technically safe.

Interfaces read these states directly. A portal must not invent
completion, mastery, or enrollment status from page visits, percentages,
or stale local state.

## Course, class, and section semantics

-   **Course.** A standards-aligned curriculum definition with a 135-day
    pathway budget, grade band, credit settings, prerequisite rules, and
    one or more approved versions.

-   **Class or roster section.** A scheduled offering of a course with
    assigned students, teacher ownership, meeting pattern, calendar,
    grading configuration, and site context.

-   **Instructional section.** A coherent part of a unit---such as
    inquiry launch, knowledge building, guided application, independent
    performance, or transfer---that groups lessons without changing the
    roster.

-   **Pathway.** An approved sequence of courses and branch points
    across grades 6--12, with placement rules and return destinations
    after intervention.

-   **Intervention lesson.** A reusable 10--25 minute skill lesson
    mapped to many course standards and assigned through evidence-backed
    rules rather than embedded as a second course.

# 4. Student experience

## Student navigation

-   **Today.** A daily decision page with no more than three prioritized
    actions, the exact resume location, due evidence, teacher messages,
    and actionable alerts.

-   **Learn.** Subject → course → unit → lesson → stage navigation with
    a persistent subject switcher and predictable breadcrumbs.

-   **Progress.** Separate pathway, skill, evidence, pace, and
    review-history views so students can understand both completion and
    readiness.

-   **Grades.** Official course and category results, missing-work
    indicators, calculation explanations, and links to the contributing
    evidence.

-   **Review.** Required interventions, recommended retrieval practice,
    keep-fresh work, completed support, and the destination to which the
    student will return.

-   **Support.** Lesson-filtered notes, vocabulary, worked examples,
    videos, accessibility tools, teacher-provided resources, and ways to
    request human help.

## Core lesson structure

Across all four core subjects, the lesson player uses one dependable
stage pattern while allowing discipline-specific evidence. Mathematics
emphasizes reasoning and modeling; English emphasizes close reading,
composition, discussion, and language; science emphasizes phenomena,
models, investigations, and explanation; and social science emphasizes
inquiry, chronology, geography, sources, claims, and civic or economic
reasoning. Standards, evidence requirements, and prerequisite
relationships remain explicit and versioned.

1.  **Required notes or workbook evidence.** A downloadable or printable
    record is available from every lesson.

2.  **Individualized Spiral Review.** Five to seven items are selected
    by transparent curriculum rules from weak skills, upcoming
    prerequisites, and cumulative skills; explanations appear after
    completion.

3.  **Introduction and relevance.** The lesson names the problem,
    purpose, and connection to the unit narrative.

4.  **Goal and success criteria.** Students know what they will learn
    and what acceptable evidence looks like.

5.  **Accessible instruction.** Direct instruction includes readable
    text, media alternatives, captions, and transcripts.

6.  **Worked model.** An example or model analysis exposes the
    reasoning, not only the answer.

7.  **Guided practice.** Hints and feedback fade as independence grows.

8.  **Independent application.** Students complete a task aligned to the
    governing skill and standard.

9.  **Exit Ticket.** A short measure determines the next step.

10. **Next-step decision.** Complete, spaced review, targeted
    intervention, supported retry, or teacher check.

## Exit Ticket decision bands

-   **Below 50%.** Do not advance; provide immediate feedback, one
    supported retry, and a teacher-visible recommendation.

-   **50--69%.** Allow provisional advancement, add the missed skill to
    individualized review, and alert the teacher when the pattern
    repeats.

-   **70--84%.** Advance and schedule normal spaced review.

-   **85% or higher.** Advance with lower review priority unless the
    skill is a prerequisite for an upcoming lesson.

  -----------------------------------------------------------------------
  **ANTI-LOOP RULE** A student is not trapped in repeated retries. After
  two unsuccessful cycles on the same skill, the case moves to teacher
  review for a different method, diagnostic, conference, or specialist
  support.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 5. Teacher experience

## Teacher home and caseload

The teacher home is a triage workspace rather than a miniature report
dashboard. It surfaces new high-priority gaps, repeated failed retries,
missing evidence, stalled interventions, upcoming prerequisite risks,
and students one short check away from returning to the pathway. Saved
views and filters help teachers act by subject, grade band, roster
section, course, unit, pace, mastery risk, active minutes, grade,
evidence state, and intervention status.

-   **Action queue.** Review recommendation, quick assign, request
    evidence, schedule check, open student, or dismiss with a reason.

-   **Student 360.** Overview, Pathway, Skills, Evidence, Interventions,
    Grades, and Activity share one student context.

-   **Intervention Center.** Needs Review, Find Support, Quick Assign,
    Active Plans, and Outcomes organize the complete support workflow.

-   **Curriculum.** Teachers preview the subject pathway, course
    version, unit, instructional section, student lesson, standards,
    prerequisites, assessments, resources, and expected evidence.

-   **Reports.** Pace, performance, mastery, engagement, intervention
    load, missing evidence, and integrity review remain separate
    measures.

## Intervention Center interaction model

Each recommendation shows the student, subject, bounded skill, severity,
confidence, triggering evidence, current lesson, upcoming dependency,
estimated time, and suggested return rule. Results are ranked by
dependency strength, evidence match, workload, prior completion, prior
outcome, and approved local resources. A teacher may assign the
recommendation, choose another support, combine it with an existing
plan, dismiss it with a reason, or escalate it.

-   **Quick Assign required fields.** Student or group, skill,
    intervention, reason, due expectation, completion rule, transfer
    check, and return destination.

-   **Preview before confirm.** Teachers see the student view and
    workload impact before the assignment is created.

-   **Duplicate protection.** Assignment creation is idempotent and
    suppresses duplicate or near-duplicate supports unless new evidence
    justifies reassignment.

-   **Outcome over completion.** Success reporting centers on
    readiness-check pass, transfer-check pass, pathway performance after
    return, and time to resolution.

# 6. Site and organization administration

## Site administrator

The site workspace combines operational health and academic support
without replacing teacher instructional judgment. It covers grades 6--12
enrollment, staffing, four-subject course availability, roster sections,
unassigned students, placement gaps, teacher loads, active
interventions, overdue reviews, escalations, return rates, integration
failures, and data-quality warnings. Site leaders can coordinate
follow-up and may assign an approved intervention when a teacher queue
item remains unresolved, with a recorded reason and audit event.

## Organization or district administrator

The organization-level workspace supports cross-site health, outcomes,
curriculum governance, intervention configuration, permissions, and
audit. Drill-down preserves context from organization → site → course →
standard → skill → evidence. Cross-site comparisons show context and
sample-size limits rather than creating a public leaderboard. Curriculum
editing is a separate authorization from ordinary administrative access.

-   **People and placement.** Role-scoped student and staff records,
    transfers, course placement, teacher ownership, and capacity checks.

-   **Academic outcomes.** Completion, official grades, proctored
    performance, mastery, pace, engagement, growth, and intervention
    outcomes remain distinct.

-   **Curriculum and skill graph.** Versioned grades 6--12 pathways for
    mathematics, English, science, and social science; standards,
    practices, rubric dimensions, prerequisites, resources, assessments,
    intervention links, review, approval, publication, and retirement.

-   **Intervention system.** Configurable triggers, severity bands,
    approved content, exit rules, effectiveness, recurrence, time to
    resolution, and privacy-protective equity monitoring.

-   **Permissions and audit.** Data-layer enforcement, least privilege,
    export controls, role history, and attributable changes.

# 7. Individualized review and intervention engine

## Evidence and mastery

Evidence records identify the student, enrollment, curriculum version,
lesson, standard, skill, item or rubric dimension, correctness,
response, error code, attempt, hints, meaningful time, support used, and
evidence source. Teacher observations and proctored results can add
context without overwriting the original attempt. Mastery combines
recent accuracy, evidence variety, independence, difficulty, recency,
and transfer performance; confidence is stored and shown separately so
insufficient evidence is never disguised as a precise score.

## Recommendation triggers

-   **Immediate review.** A required prerequisite is below readiness,
    two recent misses share an error pattern, or the same Exit Ticket is
    failed twice.

-   **Targeted review.** A developing skill is required soon or a rubric
    dimension repeatedly limits performance.

-   **Spaced review.** A previously demonstrated skill is becoming stale
    or supports an upcoming dependency.

-   **Teacher review.** Evidence conflicts, completion is unusually
    rapid, pathway and proctored results diverge sharply, or
    interventions repeatedly fail.

-   **No automatic intervention.** One isolated miss does not overrule
    otherwise strong, varied evidence.

## Intervention lifecycle

1.  **Detect.** New evidence updates the skill profile.

2.  **Recommend.** The system identifies a bounded skill and explains
    the trigger.

3.  **Review.** The teacher accepts, modifies, combines, dismisses, or
    escalates.

4.  **Assign.** The student receives one clear task and a visible return
    destination.

5.  **Learn.** A short intervention teaches one essential move through a
    model and guided practice.

6.  **Verify.** A readiness check measures the intervention skill.

7.  **Transfer.** One item applies the skill in the current grade-level
    context.

8.  **Return.** The student resumes the exact central-pathway location.

9.  **Monitor.** Later pathway evidence shows whether the learning held.

10. **Escalate.** Repeated failure prompts teacher conference, alternate
    method, diagnostic, or specialist support.

## Intervention lesson design and return rule

A typical intervention takes approximately 10--25 minutes and targets
one non-negotiable objective. It activates prior understanding, teaches
one essential move explicitly, models the reasoning, provides one or two
guided examples with fading support, checks readiness independently, and
ends with a grade-level transfer item. The default return rule is at
least 80% on the short readiness check plus one successful transfer item
connected to the blocked standard. Authorized curriculum leaders may
configure a different rule when the subject or evidence type requires
it.

# 8. Grades 6--12 curriculum system

Beyond.Ed treats the course pathway and the intervention library as
connected but different systems. A course standard identifies the
grade-level destination; a prerequisite graph identifies important prior
pathway knowledge; a practice or rubric dimension identifies how
students demonstrate the learning; and a reusable intervention skill
identifies the smallest lesson that can repair a blocking gap. Stable
identifiers keep standards, units, skills, evidence, and return
destinations intact when readings, phenomena, examples, or media are
revised.

  ---------------------------------------------------------------------------
  **Subject**   **Grades 6--8      **Grades 9--12 central  **Branch or local
                pathway**          pathway**               option**
  ------------- ------------------ ----------------------- ------------------
  Mathematics   Mathematics 6 → 7  Integrated Math 1 → 2 → Precalculus,
                → 8                3                       Statistics, or
                                                           Quantitative
                                                           Reasoning

  English       English 6 → 7 → 8  English 9 → 10 → 11 →   Course sequence
                                   12                      remains
                                                           comprehensive;
                                                           electives may
                                                           supplement it

  Science       Integrated Science Living Earth →          Environmental
                6 → 7 → 8          Chemistry in the Earth  Science or locally
                                   System → Physics of the approved advanced
                                   Universe                science

  Social        Ancient World →    Grade 9 local bridge →  Grade 9 is
  science       Medieval/Early     Modern World → U.S.     configurable;
                Modern World →     Continuity and Change → grade 12 combines
                U.S. Growth and    Government/Economics    government and
                Conflict                                   economics
  ---------------------------------------------------------------------------

Placement is policy-driven rather than inferred from age alone.
Authorized staff select the approved course and roster section;
prerequisite evidence informs support and readiness but does not
silently move a student to a lower course. Each full-year course
validates 135 pathway days and 40 intervention-capacity days.

## Subject-specific instructional sections

  ------------------------------------------------------------------------
  **Subject**   **Default sequence inside a unit**
  ------------- ----------------------------------------------------------
  Mathematics   Launch and representations → concept development → worked
                reasoning → guided practice → independent modeling → exit
                and transfer

  English       Context and vocabulary → first read → close read →
                discussion → craft/language study → composition →
                performance and reflection

  Science       Phenomenon and question → initial model → investigation →
                data analysis → explanation or design → revision →
                transfer

  Social        Inquiry question → context/timeline/map → source
  science       investigation → sourcing and corroboration →
                claim/discussion → civic or economic application
  ------------------------------------------------------------------------

# 9. Mathematics pathway

The supplied mathematics model remains the most developed seed. Its
Integrated Mathematics 1--3 library contains 187 standards or
substandards, 88 reusable intervention lessons, 799 ranked
standard-to-skill links, and 305 core standard dependencies. Beyond.Ed
extends that same record pattern to middle-grade mathematics and grade
12 branch courses while preserving the detailed Integrated Mathematics
budgets in the catalog appendix.

-   **Middle grades.** Mathematics 6--8 develops ratios and proportional
    reasoning, rational-number fluency, expressions and equations,
    functions, geometry, statistics, and modeling as a connected
    progression.

-   **Integrated high school.** Integrated Mathematics 1--3 interleaves
    algebra, functions, geometry, statistics, probability, and
    mathematical modeling rather than treating them as isolated tracks.

-   **Grade 12 branches.** Precalculus, Statistics, and Quantitative
    Reasoning are separate approved course pathways selected by
    placement and graduation plans.

-   **Evidence.** Responses store representations, steps, calculations,
    graphs, units, written reasoning, error codes, independence, and
    transfer performance.

## Mathematics intervention families

-   **Arithmetic --- 11 lessons.** Integer, fraction, decimal, percent,
    ratio, unit rate, exponent, radical, and precision foundations.

-   **Pre-Algebra --- 14 lessons.** Variables, expressions, equality,
    equations, inequalities, coordinates, proportional reasoning,
    graphs, and formulas.

-   **Algebra and Functions --- 26 lessons.** Linear and nonlinear
    representations, systems, sequences, transformations, polynomials,
    rational and radical functions, inverses, logarithms, and modeling.

-   **Geometry --- 20 lessons.** Measurement, transformations,
    congruence, similarity, coordinate geometry, proof, circles,
    trigonometry, and spatial reasoning.

-   **Statistics and Probability --- 12 lessons.** Displays, center and
    spread, bivariate data, probability, simulation, inference
    foundations, and report critique.

-   **Mathematical Modeling --- 5 lessons.** Units, variables,
    assumptions, constraints, validation, graph design, and
    interpretation.

A quick mathematics diagnostic uses one prerequisite item, one
target-skill item, and one transfer item in the current course context.
Common error families include calculation, sign, fraction or ratio,
inverse operation, distribution and like terms, equality and
equivalence, representation, unit and scale, variable interpretation,
and failure to interpret or verify a procedure.

# 10. English language arts pathway

English 6--12 is a seven-course comprehensive pathway. The supplied
California standards organize the discipline around Reading Literature,
Reading Informational Text, Writing, Speaking and Listening, and
Language, with additional literacy strands for history/social studies,
science, and technical subjects. Beyond.Ed stores those strands
separately for reporting but recombines them inside coherent text sets,
discussions, research, and compositions.

-   **Reading pathway.** Evidence, inference, central idea or theme,
    development, structure, point of view, rhetoric, source integration,
    and increasing text complexity progress across the grade bands.

-   **Writing pathway.** Argument, informative/explanatory, and
    narrative writing share production, revision, research, evidence
    use, audience, and publication routines.

-   **Language pathway.** Conventions, sentence structure, knowledge of
    language, vocabulary acquisition, morphology, and nuance are tracked
    as reusable skills that recur at increasing sophistication.

-   **Speaking and listening pathway.** Preparation, collaboration,
    evaluation of claims and media, presentation, response, and
    discussion moves generate observable evidence rather than attendance
    credit.

-   **Evidence model.** Selected responses, annotations, discussion
    observations, oral presentations, and compositions connect to exact
    standards and rubric dimensions; a single essay score never hides
    the dimension that needs support.

## English intervention and return

A reading diagnostic uses a short passage, one evidence-selection task,
and one constructed response. A writing diagnostic uses a focused
revision or sentence-combining task rather than requiring a full essay.
The intervention shows a model, names the move, uses highlighting,
sorting, annotating, revising, rehearsing, or sentence combining, and
then requires transfer into the current grade-level text or composition.
Foundational decoding or fluency support may supplement access when
needed, but it does not replace grade-level reading, writing, and
discussion.

# 11. Science pathway

The science catalog uses an integrated grades 6--8 sequence followed by
the high-school three-course model: Living Earth, Chemistry in the Earth
System, and Physics of the Universe. A grade 12 Environmental Science
course provides an optional applied branch. Course authors bundle
performance expectations into phenomena-centered units and preserve all
three dimensions of science learning: disciplinary core ideas, science
and engineering practices, and crosscutting concepts.

-   **Performance pathway.** Students ask questions, develop and use
    models, plan or interpret investigations, analyze data, use
    mathematics and computational thinking, construct explanations,
    design solutions, argue from evidence, and communicate information.

-   **Concept pathway.** Physical, life, Earth and space, and
    engineering ideas are linked across years through systems, cause and
    effect, scale, energy and matter, structure and function, stability
    and change, and patterns.

-   **Evidence model.** The ledger stores models, procedure fidelity,
    measurements, data tables, calculations, graph choices,
    claim-evidence-reasoning dimensions, design constraints, revisions,
    and transfer to a new phenomenon.

-   **Safety and material controls.** Investigations carry
    teacher-visible material lists, safety notes, alternatives,
    accessibility accommodations, and required confirmations; the
    platform does not imply that a physical procedure occurred merely
    because a page was completed.

## Science intervention and return

Science intervention repairs the reasoning or practice that blocks a
performance expectation: reading a graph, controlling variables,
connecting evidence to a claim, interpreting scale, revising a model,
balancing matter or energy, following a procedure, or distinguishing
observation from inference. A transfer check uses the same practice with
a new dataset, model, phenomenon, or design constraint rather than
repeating the original item.

# 12. Social science pathway

The social science catalog follows grade-specific historical and civic
content while building a cumulative inquiry pathway. Grades 6--8 move
from ancient civilizations to medieval and early modern world history
and then United States growth and conflict. High school includes a
locally configurable grade 9 bridge, grade 10 modern world history,
grade 11 United States continuity and change, and a grade 12 course that
combines American government and economics.

-   **Content pathway.** Chronology, geography, institutions, belief
    systems, economies, technology, conflict, migration, rights, and
    civic participation are organized into inquiry-driven units with
    stable standards mappings.

-   **Historical reasoning.** Sourcing, contextualization, chronology,
    causation, comparison, continuity and change, corroboration, and
    claim construction are reusable skills across all courses.

-   **Civic and economic reasoning.** Students interpret institutions,
    public policy, rights and responsibilities, incentives, markets,
    tradeoffs, fiscal and monetary ideas, data, and competing proposals.

-   **Evidence model.** The ledger distinguishes primary and secondary
    sources, provenance, perspective, reliability, map and timeline use,
    quantitative evidence, claims, counterclaims, citations, discussion,
    and disciplinary writing.

-   **Grade 9 configuration.** Because local course expectations vary,
    the grade 9 World Geography and Contemporary Issues bridge is
    optional and versioned by organization; it does not replace the
    required grade 10--12 sequence.

## Social science intervention and return

Social science intervention focuses on the smallest blocked inquiry
move: placing events in sequence, reading a map, identifying provenance,
distinguishing evidence from assertion, contextualizing a source,
corroborating accounts, interpreting a chart, explaining causation, or
organizing a claim. Transfer requires the same move with a different
source set or public issue in the student's current unit.

# 13. Cross-subject intervention library

Each intervention has a stable lesson ID, subject, skill family,
prerequisite skill, grade-band range, estimated minutes, model, guided
practice, independent readiness check, transfer check, accessibility
assets, version, and approved return rule. The same lesson may connect
to many course standards, but its target remains singular and
observable. New-subject counts below are initial build targets;
curriculum review determines the final inventory and standards-link
counts.

  ---------------------------------------------------------------------------------
  **Subject**   **Intervention     **Lessons**   **Representative targets**
                family**                         
  ------------- ------------------ ------------- ----------------------------------
  Mathematics   Arithmetic         11            Number operations, ratio, rate,
                                                 percent, precision

  Mathematics   Pre-Algebra        14            Variables, equations, coordinates,
                                                 proportional reasoning

  Mathematics   Algebra and        26            Representations, systems,
                Functions                        polynomials, functions, modeling

  Mathematics   Geometry           20            Measurement, transformations,
                                                 proof, circles, trigonometry

  Mathematics   Statistics and     12            Displays, variability,
                Probability                      probability, inference

  Mathematics   Mathematical       5             Units, assumptions, constraints,
                Modeling                         validation

  English       Reading evidence   12            Evidence, inference, theme,
                and meaning                      central idea, summary

  English       Structure, craft,  8             Structure, point of view, word
                and rhetoric                     choice, rhetoric

  English       Vocabulary and     10            Context, morphology, syntax,
                language                         nuance, conventions

  English       Argument and       12            Claims, reasons, evidence,
                explanation                      organization, elaboration

  English       Narrative craft    6             Sequence, perspective, detail,
                                                 pacing, reflection

  English       Research and       8             Questioning, credibility,
                source use                       synthesis, citation

  English       Sentence           10            Boundaries, clauses, cohesion,
                construction and                 editing
                revision                         

  English       Speaking and       6             Preparation, discussion,
                listening                        presentation, response

  Science       Measurement and    8             Units, precision, safety,
                procedure                        multistep procedures

  Science       Data and           10            Tables, graphs, trends,
                representation                   uncertainty, calculation

  Science       Models and systems 10            Components, boundaries,
                                                 interactions, revision

  Science       Cause and          8             Variables, mechanism, correlation,
                mechanism                        causal claims

  Science       Investigation and  8             Questions, controls, constraints,
                design                           fair tests

  Science       Claim, evidence,   8             Claims, relevant evidence,
                and reasoning                    scientific reasoning

  Science       Disciplinary       8             Technical reading, vocabulary,
                literacy                         diagrams, explanation

  Social        Chronology and     8             Sequence, periodization, cause,
  science       causation                        consequence

  Social        Geographic and     8             Maps, scale, region, movement,
  science       spatial reasoning                human-environment links

  Social        Source analysis    10            Provenance, context, perspective,
  science                                        reliability

  Social        Corroboration and  10            Cross-source evidence, claim,
  science       argument                         counterclaim

  Social        Civics and         8             Institutions, rights, incentives,
  science       economics                        tradeoffs, policy

  Social        Quantitative and   8             Charts, timelines, demographic and
  science       visual evidence                  economic data

  Social        Discussion and     8             Seminar moves, explanation,
  science       disciplinary                     citation, revision
                writing                          
  ---------------------------------------------------------------------------------

  -----------------------------------------------------------------------
  **INITIAL LIBRARY TARGET** The combined seed is 280 intervention
  lessons: 88 mathematics lessons retained from the supplied model, plus
  proposed targets of 72 English, 60 science, and 60 social science
  lessons. Counts are governed content targets, not a requirement to
  assign more support.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# 14. Shared controls, reliability, and data protection

## Interaction rules

-   **One primary action.** Each page or panel makes the safest next
    action visually dominant.

-   **Context-preserving navigation.** Breadcrumbs and drawers keep the
    selected student, lesson, skill, and return location intact.

-   **Confirm consequential changes.** Assignments, grades, enrollment,
    transfers, role changes, publication, and bulk actions require
    review and confirmation.

-   **Durable result states.** Successful writes show the saved outcome;
    failures explain what was preserved and the safe next step.

-   **Meaningful activity.** Active-learning time responds to
    substantive interaction, not page-open time; idle tracking pauses
    after five minutes and may shorten within a repeated inactive
    pattern.

-   **Mobile priorities.** Responsive views emphasize Today, lesson
    stages, evidence capture, teacher triage, and quick return to the
    pathway.

## Reliability requirements

-   **Server-authoritative state.** Completion, mastery, grades,
    enrollment, intervention, and permissions are not trusted to the
    browser alone.

-   **Idempotent writes and transactions.** Retries cannot create
    duplicate assignments, enrollments, submissions, transfers, or
    grades; multi-record changes complete atomically.

-   **Versioned rules.** Curriculum, grading, mastery, recommendation,
    and intervention rules preserve the inputs and version used for
    every calculation.

-   **Durable jobs and visible failures.** Background work uses queues,
    retry limits, and operational status.

-   **Automated tests.** Permissions, gates, grades, mastery updates,
    status transitions, calendar totals, publication, and transfer
    continuity receive explicit coverage.

## Privacy, access, and human accountability

Role-based access and row-level security are enforced at organization,
site, teacher, student, course, roster-section, and
curriculum-authorization scope. Students see their own records; teachers
see assigned students and authorized courses; site leaders see their
site; and organization leaders see authorized aggregate and record-level
data. Sensitive exports, corrections, role changes, grade changes,
assignments, overrides, and publication actions are purpose-bound and
logged.

Beyond.Ed does not include an AI tutor, student chatbot, teacher
assistant, administrator assistant, or generative decision-maker.
Individualized review and recommendations use transparent, versioned
curriculum rules and stored evidence. Teachers and authorized staff
remain responsible for instruction, assignment, intervention, grading,
placement, and publication decisions.

# 15. Beta scope and phased development

## Functional beta

-   **Identity and records.** Real authentication, role scope, row-level
    security, and persistent student, staff, site, course, and
    enrollment data.

-   **Curriculum and lesson player.** Versioned grades 6--12
    mathematics, English, science, and social science pathways; courses,
    units, instructional sections, lessons, stages, standards,
    practices, rubric dimensions, prerequisites, notes evidence, Spiral
    Review, instruction, practice, Exit Ticket, feedback, and gates.

-   **Learning records.** Evidence ledger, official gradebook, skill
    profile, confidence, configurable review rules, and audit history.

-   **Teacher workflow.** Action queue, Student 360, support search,
    preview, assignment, monitoring, readiness check, transfer check,
    return, and outcome.

-   **Administration.** Enrollment, teacher assignment, data-quality
    monitoring, site management, outcomes, curriculum authorization,
    intervention configuration, and permissions.

-   **Operational quality.** Reliable save states, validation, errors,
    backups, logs, duplicate protection, tests, and no dead controls.

## Later phases

Later phases can add phone-based evidence capture, live
SIS/LMS/SSO/calendar/messaging integrations, native mobile applications,
a family portal, richer curriculum authoring, interactive simulations,
lab and project evidence tools, multilingual accessibility resources,
and improved offline access. Until each capability is real, safe, and
testable, the interface must not imply that it is active.

# 16. Practical acceptance criteria

-   A teacher can move from a student error to an evidence-backed
    intervention assignment in under one minute.

-   A student can identify the day's required work and resume the exact
    activity in one action.

-   Every grades 6--12 course in mathematics, English, science, and
    social science validates 135 normal pathway days and 40
    intervention-capacity days against a 175-day total.

-   Every intervention identifies its trigger evidence, target skill,
    readiness rule, transfer check, and return destination.

-   Math recommendations distinguish standards, prerequisite pathway
    standards, foundational skills, and error types.

-   English recommendations distinguish rubric dimensions, reading
    skills, language skills, and writing moves.

-   Science recommendations distinguish disciplinary ideas, science and
    engineering practices, crosscutting concepts, data skills, and
    explanation or design evidence.

-   Social science recommendations distinguish content standards,
    historical reasoning, source analysis, geographic reasoning, civic
    or economic reasoning, and disciplinary literacy.

-   A roster section references one approved course version and calendar
    without changing the reusable instructional sections inside its
    units.

-   A transfer between sites preserves pathway state, evidence, mastery,
    grades, interventions, and audit continuity without duplicate
    enrollment.

-   A published curriculum edit cannot alter prior assignment evidence
    or the rule version used for a historical calculation.

-   A double submission cannot create duplicate work, assignments, or
    grades.

-   Every teacher override, grade change, administrative change, export,
    or curriculum publication is attributable in the audit log.

-   Users cannot access records outside their role and organizational
    scope.

-   Site and organization leaders can measure successful return and
    transfer---not completion alone---while protecting small-group
    privacy.

-   No student, teacher, or administrator surface exposes an AI tutor,
    chatbot, copilot, or conversational assistant.

  -----------------------------------------------------------------------
  **DEFINITION OF SUCCESS** Beyond.Ed succeeds when support is precise
  enough to preserve rigor, simple enough for teachers to act on, clear
  enough for students to understand, and reliable enough for leaders to
  trust.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

# Appendix A. Illustrative 135-day mathematics core budgets

The catalog retains the supplied Integrated Mathematics 1--3 strategy,
adapts those courses to 135 normal-pathway days, and extends the same
unit-budget model to grades 6--8 and grade 12 branches. The separate
40-day intervention reserve remains intact. Budgets are capacity targets
mapped to local calendars, not rigid date locks.

## Mathematics 6

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Mathematics 6  0          Launch, habits, and diagnostic            3

  Mathematics 6  1          Ratios, rates, and multiplicative         18
                            comparison                                

  Mathematics 6  2          Fraction and decimal operations           18

  Mathematics 6  3          Expressions, equations, and inequalities  19

  Mathematics 6  4          Proportional reasoning and percent        18

  Mathematics 6  5          Geometry, area, surface area, and volume  19

  Mathematics 6  6          Statistical distributions and variability 18

  Mathematics 6  7          Integrated modeling and mastery           22

  Mathematics 6             COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## Mathematics 7

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Mathematics 7  0          Launch, habits, and diagnostic            3

  Mathematics 7  1          Proportional relationships and scale      19

  Mathematics 7  2          Rational-number operations                18

  Mathematics 7  3          Expressions, equations, and inequalities  19

  Mathematics 7  4          Percent, probability, and sampling        18

  Mathematics 7  5          Geometry and measurement                  19

  Mathematics 7  6          Data inference and comparison             18

  Mathematics 7  7          Integrated modeling and mastery           21

  Mathematics 7             COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## Mathematics 8

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Mathematics 8  0          Launch, habits, and diagnostic            3

  Mathematics 8  1          Exponents, radicals, and scientific       18
                            notation                                  

  Mathematics 8  2          Linear equations and systems              18

  Mathematics 8  3          Functions and representations             20

  Mathematics 8  4          Transformations, congruence, and          18
                            similarity                                

  Mathematics 8  5          Pythagorean relationships and measurement 20

  Mathematics 8  6          Bivariate data and association            18

  Mathematics 8  7          Integrated modeling and high-school       20
                            readiness                                 

  Mathematics 8             COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## Integrated Math 1

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Integrated     0          Course launch and diagnostic              1
  Math 1                                                              

  Integrated     1          Quantities and algebra foundations        12
  Math 1                                                              

  Integrated     2          Linear relationships and function         15
  Math 1                    language                                  

  Integrated     3          Linear equations, inequalities, and       15
  Math 1                    systems                                   

  Integrated     4          Exponential models and sequences          13
  Math 1                                                              

  Integrated     5          Transformations, congruence, and          17
  Math 1                    constructions                             

  Integrated     6          Coordinate geometry and proof             13
  Math 1                                                              

  Integrated     7          Data distributions                        14
  Math 1                                                              

  Integrated     8          Bivariate data and linear modeling        20
  Math 1                                                              

  Integrated     9          Integrated modeling and mastery           15
  Math 1                                                              

  Integrated                COURSE TOTAL                              135
  Math 1                                                              
  -------------------------------------------------------------------------------

## Integrated Math 2

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Integrated     0          Course launch and diagnostic              1
  Math 2                                                              

  Integrated     1          Real, rational, and complex numbers       13
  Math 2                                                              

  Integrated     2          Quadratic expressions and polynomial      17
  Math 2                    structure                                 

  Integrated     3          Quadratic equations, functions, and       25
  Math 2                    models                                    

  Integrated     4          Geometric proof and similarity            18
  Math 2                                                              

  Integrated     5          Right-triangle trigonometry and circles   17
  Math 2                                                              

  Integrated     6          Coordinate geometry, conics, and          17
  Math 2                    measurement                               

  Integrated     7          Conditional probability and decision      17
  Math 2                    making                                    

  Integrated     8          Integrated modeling and mastery           10
  Math 2                                                              

  Integrated                COURSE TOTAL                              135
  Math 2                                                              
  -------------------------------------------------------------------------------

## Integrated Math 3

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Integrated     0          Course launch and diagnostic              1
  Math 3                                                              

  Integrated     1          Polynomial structure, operations, and     17
  Math 3                    identities                                

  Integrated     2          Zeros, factors, and complex solutions     16
  Math 3                                                              

  Integrated     3          Rational and radical functions and        22
  Math 3                    equations                                 

  Integrated     4          Exponential, logarithmic, and inverse     14
  Math 3                    models                                    

  Integrated     5          Unit-circle and periodic trigonometry     18
  Math 3                                                              

  Integrated     6          General triangles, conics, and geometric  18
  Math 3                    modeling                                  

  Integrated     7          Statistical inference and decisions       19
  Math 3                                                              

  Integrated     8          Integrated modeling and mastery           10
  Math 3                                                              

  Integrated                COURSE TOTAL                              135
  Math 3                                                              
  -------------------------------------------------------------------------------

## Precalculus

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Precalculus    0          Launch and readiness diagnostic           3

  Precalculus    1          Advanced function families                18

  Precalculus    2          Polynomial and rational behavior          19

  Precalculus    3          Exponential and logarithmic models        19

  Precalculus    4          Trigonometric functions and identities    18

  Precalculus    5          Analytic trigonometry and vectors         20

  Precalculus    6          Sequences, series, and limits foundations 18

  Precalculus    7          Modeling and cumulative mastery           20

  Precalculus               COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## Statistics

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Statistics     0          Launch and data-literacy diagnostic       3

  Statistics     1          Study design and data collection          19

  Statistics     2          One-variable distributions                18

  Statistics     3          Relationships in two-variable data        19

  Statistics     4          Probability and simulation                18

  Statistics     5          Sampling distributions and estimation     20

  Statistics     6          Inference and decision making             18

  Statistics     7          Investigation, communication, and mastery 20

  Statistics                COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## Quantitative Reasoning

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Quantitative   0          Launch and readiness diagnostic           3
  Reasoning                                                           

  Quantitative   1          Quantities, units, and estimation         18
  Reasoning                                                           

  Quantitative   2          Personal and public finance               18
  Reasoning                                                           

  Quantitative   3          Rates, growth, and exponential change     19
  Reasoning                                                           

  Quantitative   4          Data, risk, and statistical claims        19
  Reasoning                                                           

  Quantitative   5          Networks, optimization, and decisions     20
  Reasoning                                                           

  Quantitative   6          Civic, scientific, and workplace models   18
  Reasoning                                                           

  Quantitative   7          Capstone modeling and mastery             20
  Reasoning                                                           

  Quantitative              COURSE TOTAL                              135
  Reasoning                                                           
  -------------------------------------------------------------------------------

Mathematical Practices are embedded throughout units rather than
isolated as a separate block. Grade 12 branches are locally authorized
options; no branch is assigned automatically from a skill score.

# Appendix B. Illustrative 135-day English core budgets

Every English course integrates literature, informational text, writing,
speaking and listening, language, research, and vocabulary. Unit themes
are illustrative and may be replaced while standards, rubric dimensions,
prerequisite links, and day totals remain versioned.

## English 6

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  English 6      0          Launch, reading identity, and diagnostic  3

  English 6      1          Identity, perspective, and evidence       19

  English 6      2          Myth, narrative pattern, and theme        18

  English 6      3          Informational systems and central ideas   19

  English 6      4          Argument, reasons, and relevant evidence  19

  English 6      5          Research inquiry and source credibility   19

  English 6      6          Narrative craft and language choices      18

  English 6      7          Portfolio, presentation, and mastery      20

  English 6                 COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## English 7

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  English 7      0          Launch, discussion norms, and diagnostic  3

  English 7      1          Character, conflict, and development      18

  English 7      2          Ideas, interactions, and informational    19
                            structure                                 

  English 7      3          Perspective, media, and author purpose    19

  English 7      4          Argument and counterclaim foundations     19

  English 7      5          Research, synthesis, and citation         18

  English 7      6          Narrative voice, pacing, and revision     19

  English 7      7          Portfolio, presentation, and mastery      20

  English 7                 COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## English 8

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  English 8      0          Launch, independence, and diagnostic      3

  English 8      1          Strongest evidence, inference, and theme  19

  English 8      2          Structure, point of view, and dramatic    18
                            irony                                     

  English 8      3          Central ideas across media and accounts   19

  English 8      4          Argument, counterclaim, and source        19
                            evaluation                                

  English 8      5          Inquiry, synthesis, and explanatory       19
                            writing                                   

  English 8      6          Narrative technique and language control  18

  English 8      7          High-school readiness portfolio           20

  English 8                 COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## English 9

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  English 9      0          Launch, close-reading routines, and       3
                            diagnostic                                

  English 9      1          Complex character, conflict, and theme    19

  English 9      2          Rhetoric, purpose, and informational      19
                            analysis                                  

  English 9      3          World literature and cultural perspective 18

  English 9      4          Argument, evidence, and counterclaims     19

  English 9      5          Research questions and source synthesis   19

  English 9      6          Narrative and explanatory craft           18

  English 9      7          Portfolio, seminar, and mastery           20

  English 9                 COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## English 10

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  English 10     0          Launch, evidence calibration, and         3
                            diagnostic                                

  English 10     1          Theme development and structural choices  18

  English 10     2          Ideas, rhetoric, and public information   19

  English 10     3          World voices across genres and media      19

  English 10     4          Sustained argument and counterclaim       19

  English 10     5          Research synthesis and explanatory        18
                            writing                                   

  English 10     6          Style, syntax, and purposeful revision    19

  English 10     7          Portfolio, presentation, and mastery      20

  English 10                COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## English 11

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  English 11     0          Launch, source use, and diagnostic        3

  English 11     1          American voices, ideas, and multiple      19
                            themes                                    

  English 11     2          Foundational documents and rhetoric       18

  English 11     3          Information, argument, and public         19
                            discourse                                 

  English 11     4          Research, credibility, and synthesis      19

  English 11     5          Argument for a defined audience           19

  English 11     6          Narrative, reflection, and style          18

  English 11     7          Portfolio, presentation, and mastery      20

  English 11                COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## English 12

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  English 12     0          Launch, independence, and diagnostic      3

  English 12     1          Complex texts, ambiguity, and             18
                            interpretation                            

  English 12     2          Rhetoric, institutions, and public        19
                            argument                                  

  English 12     3          Global and contemporary voices            19

  English 12     4          Research problem and sustained inquiry    18

  English 12     5          Evidence-based argument and publication   19

  English 12     6          College, career, and civic communication  19

  English 12     7          Capstone portfolio and presentation       20

  English 12                COURSE TOTAL                              135
  -------------------------------------------------------------------------------

# Appendix C. Illustrative 135-day science core budgets

Science units are organized around phenomena and performance evidence.
Science and engineering practices, disciplinary core ideas, crosscutting
concepts, and literacy connections are embedded across the unit rather
than scheduled as isolated topics.

## Integrated Science 6

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Integrated     0          Launch, safety, and evidence diagnostic   3
  Science 6                                                           

  Integrated     1          Systems, scale, and scientific modeling   18
  Science 6                                                           

  Integrated     2          Cells, organisms, and interacting body    19
  Science 6                 systems                                   

  Integrated     3          Reproduction, growth, and inheritance     19
  Science 6                                                           

  Integrated     4          Water cycling, weather, and climate       18
  Science 6                                                           

  Integrated     5          Resources, human impacts, and sustainable 19
  Science 6                 systems                                   

  Integrated     6          Thermal energy and engineered solutions   19
  Science 6                                                           

  Integrated     7          Integrated investigation and mastery      20
  Science 6                                                           

  Integrated                COURSE TOTAL                              135
  Science 6                                                           
  -------------------------------------------------------------------------------

## Integrated Science 7

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Integrated     0          Launch, measurement, and diagnostic       3
  Science 7                                                           

  Integrated     1          Matter, particles, and chemical reactions 19
  Science 7                                                           

  Integrated     2          Energy and matter in organisms            18
  Science 7                                                           

  Integrated     3          Ecosystem interactions and population     19
  Science 7                 change                                    

  Integrated     4          Geologic processes and Earth history      19
  Science 7                                                           

  Integrated     5          Natural resources, hazards, risk, and     18
  Science 7                 design                                    

  Integrated     6          Engineering criteria, resource systems,   19
  Science 7                 and solutions                             

  Integrated     7          Integrated investigation and mastery      20
  Science 7                                                           

  Integrated                COURSE TOTAL                              135
  Science 7                                                           
  -------------------------------------------------------------------------------

## Integrated Science 8

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Integrated     0          Launch, models, and diagnostic            3
  Science 8                                                           

  Integrated     1          Forces, motion, and interactions          19
  Science 8                                                           

  Integrated     2          Energy transfer and transformation        18
  Science 8                                                           

  Integrated     3          Waves, information, and technology        19
  Science 8                                                           

  Integrated     4          Heredity, natural selection, and change   19
  Science 8                                                           

  Integrated     5          Earth, solar systems, and the universe    19
  Science 8                                                           

  Integrated     6          Human impacts and engineering decisions   18
  Science 8                                                           

  Integrated     7          High-school readiness investigation       20
  Science 8                                                           

  Integrated                COURSE TOTAL                              135
  Science 8                                                           
  -------------------------------------------------------------------------------

## Living Earth

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Living Earth   0          Launch, laboratory practice, and          3
                            diagnostic                                

  Living Earth   1          Ecosystem interactions and energy         19

  Living Earth   2          Cycles of matter and Earth systems        18

  Living Earth   3          Cells, structure, and function            19

  Living Earth   4          Genetics, inheritance, and information    19

  Living Earth   5          Evolution, biodiversity, and evidence     19

  Living Earth   6          Human activity, climate, and ecosystems   18

  Living Earth   7          Living Earth performance capstone         20

  Living Earth              COURSE TOTAL                              135
  -------------------------------------------------------------------------------

## Chemistry in the Earth System

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Chemistry in   0          Launch, measurement, and diagnostic       3
  the Earth                                                           
  System                                                              

  Chemistry in   1          Atomic structure and properties of matter 19
  the Earth                                                           
  System                                                              

  Chemistry in   2          Bonding, structure, and material          18
  the Earth                 properties                                
  System                                                              

  Chemistry in   3          Chemical reactions and conservation       19
  the Earth                                                           
  System                                                              

  Chemistry in   4          Energy in chemical and Earth systems      19
  the Earth                                                           
  System                                                              

  Chemistry in   5          Rates, equilibrium, and dynamic systems   18
  the Earth                                                           
  System                                                              

  Chemistry in   6          Resources, atmosphere, and human impacts  19
  the Earth                                                           
  System                                                              

  Chemistry in   7          Chemistry performance capstone            20
  the Earth                                                           
  System                                                              

  Chemistry in              COURSE TOTAL                              135
  the Earth                                                           
  System                                                              
  -------------------------------------------------------------------------------

## Physics of the Universe

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Physics of the 0          Launch, mathematical models, and          3
  Universe                  diagnostic                                

  Physics of the 1          Forces, motion, momentum, and collisions  19
  Universe                                                            

  Physics of the 2          Forces at a distance, fields, and orbits  18
  Universe                                                            

  Physics of the 3          Energy conversion, electricity, and       19
  Universe                  magnetism                                 

  Physics of the 4          Nuclear processes and Earth history       19
  Universe                                                            

  Physics of the 5          Waves, electromagnetic radiation, and     19
  Universe                  information                               

  Physics of the 6          Stars, cosmology, and universe evolution  18
  Universe                                                            

  Physics of the 7          Physics performance capstone              20
  Universe                                                            

  Physics of the            COURSE TOTAL                              135
  Universe                                                            
  -------------------------------------------------------------------------------

## Environmental Science

  --------------------------------------------------------------------------------
  **Course**      **Unit**   **Core unit**                             **Pathway
                                                                       days**
  --------------- ---------- ----------------------------------------- -----------
  Environmental   0          Launch, systems thinking, and diagnostic  3
  Science                                                              

  Environmental   1          Earth systems and biogeochemical cycles   18
  Science                                                              

  Environmental   2          Biodiversity, populations, and resilience 19
  Science                                                              

  Environmental   3          Water, food, energy, and resource systems 19
  Science                                                              

  Environmental   4          Climate evidence, models, and impacts     18
  Science                                                              

  Environmental   5          Pollution, health, and environmental      19
  Science                    justice                                   

  Environmental   6          Policy, engineering, and tradeoffs        19
  Science                                                              

  Environmental   7          Community investigation and capstone      20
  Science                                                              

  Environmental              COURSE TOTAL                              135
  Science                                                              
  --------------------------------------------------------------------------------

# Appendix D. Illustrative 135-day social science core budgets

These budgets pair grade-specific historical, civic, geographic, and
economic content with recurring disciplinary inquiry. Local curriculum
review selects source sets and case studies while preserving standards
coverage, evidence expectations, and the separate intervention reserve.

## Grade 6 Ancient World

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Grade 6        0          Historical inquiry, geography, and        3
  Ancient World             diagnostic                                

  Grade 6        1          Early humans, agriculture, and first      18
  Ancient World             communities                               

  Grade 6        2          Mesopotamia, Egypt, and river             19
  Ancient World             civilizations                             

  Grade 6        3          Ancient Israel, Persia, and regional      18
  Ancient World             exchange                                  

  Grade 6        4          Ancient India and South Asian traditions  18
  Ancient World                                                       

  Grade 6        5          Ancient China and East Asian traditions   18
  Ancient World                                                       

  Grade 6        6          Greece, citizenship, and cultural legacy  19
  Ancient World                                                       

  Grade 6        7          Rome, republic, empire, and legacy        22
  Ancient World                                                       

  Grade 6                   COURSE TOTAL                              135
  Ancient World                                                       
  -------------------------------------------------------------------------------

## Grade 7 Medieval/Early Modern World

  ---------------------------------------------------------------------------------
  **Course**       **Unit**   **Core unit**                             **Pathway
                                                                        days**
  ---------------- ---------- ----------------------------------------- -----------
  Grade 7          0          Historical inquiry and course launch      3
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7          1          The world in 300 CE                       13
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7          2          Rome and Christendom, 300--1200           14
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7          3          Southwestern Asia and the world of Islam  14
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7          4          South Asia, 300--1200                     13
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7          5          East Asia, 300--1300                      13
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7          6          The Americas, 300--1490                   13
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7          7          West Africa, 900--1400                    14
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7          8          Sites of encounter, 1150--1490            13
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7          9          Global convergence, 1450--1750            13
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7          10         Inquiry synthesis and mastery             12
  Medieval/Early                                                        
  Modern World                                                          

  Grade 7                     COURSE TOTAL                              135
  Medieval/Early                                                        
  Modern World                                                          
  ---------------------------------------------------------------------------------

## Grade 8 U.S. Growth and Conflict

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Grade 8 U.S.   0          Historical inquiry and diagnostic         3
  Growth and                                                          
  Conflict                                                            

  Grade 8 U.S.   1          Indigenous societies, encounter, and      16
  Growth and                colonies                                  
  Conflict                                                            

  Grade 8 U.S.   2          Revolution and founding ideas             16
  Growth and                                                          
  Conflict                                                            

  Grade 8 U.S.   3          Constitution, institutions, and the early 16
  Growth and                republic                                  
  Conflict                                                            

  Grade 8 U.S.   4          Expansion, migration, and forced removal  16
  Growth and                                                          
  Conflict                                                            

  Grade 8 U.S.   5          Reform, abolition, and sectional conflict 16
  Growth and                                                          
  Conflict                                                            

  Grade 8 U.S.   6          Civil War and emancipation                16
  Growth and                                                          
  Conflict                                                            

  Grade 8 U.S.   7          Reconstruction, industrialization, and    16
  Growth and                the West                                  
  Conflict                                                            

  Grade 8 U.S.   8          Civic inquiry, memory, and mastery        20
  Growth and                                                          
  Conflict                                                            

  Grade 8 U.S.              COURSE TOTAL                              135
  Growth and                                                          
  Conflict                                                            
  -------------------------------------------------------------------------------

## Grade 9 World Geography and Contemporary Issues

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Grade 9 World  0          Geographic inquiry and diagnostic         3
  Geography and                                                       
  Contemporary                                                        
  Issues                                                              

  Grade 9 World  1          Place, region, scale, and spatial data    18
  Geography and                                                       
  Contemporary                                                        
  Issues                                                              

  Grade 9 World  2          Population, migration, and cultural       19
  Geography and             landscapes                                
  Contemporary                                                        
  Issues                                                              

  Grade 9 World  3          Political geography, borders, and         19
  Geography and             institutions                              
  Contemporary                                                        
  Issues                                                              

  Grade 9 World  4          Resources, development, and economic      18
  Geography and             networks                                  
  Contemporary                                                        
  Issues                                                              

  Grade 9 World  5          Urbanization, environment, and climate    19
  Geography and                                                       
  Contemporary                                                        
  Issues                                                              

  Grade 9 World  6          Media literacy and contemporary global    19
  Geography and             issues                                    
  Contemporary                                                        
  Issues                                                              

  Grade 9 World  7          Local-to-global inquiry capstone          20
  Geography and                                                       
  Contemporary                                                        
  Issues                                                              

  Grade 9 World             COURSE TOTAL                              135
  Geography and                                                       
  Contemporary                                                        
  Issues                                                              
  -------------------------------------------------------------------------------

## Grade 10 Modern World

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Grade 10       0          Historical inquiry and diagnostic         3
  Modern World                                                        

  Grade 10       1          Democratic ideas and revolutions          19
  Modern World                                                        

  Grade 10       2          Industrialization and social change       18
  Modern World                                                        

  Grade 10       3          Imperialism and global resistance         19
  Modern World                                                        

  Grade 10       4          World War I and its aftermath             19
  Modern World                                                        

  Grade 10       5          Totalitarianism, genocide, and World War  19
  Modern World              II                                        

  Grade 10       6          Cold War, decolonization, and human       18
  Modern World              rights                                    

  Grade 10       7          Globalization and contemporary            20
  Modern World              connections                               

  Grade 10                  COURSE TOTAL                              135
  Modern World                                                        
  -------------------------------------------------------------------------------

## Grade 11 U.S. Continuity and Change

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Grade 11 U.S.  0          Historical inquiry and diagnostic         3
  Continuity and                                                      
  Change                                                              

  Grade 11 U.S.  1          Foundations and industrial transformation 19
  Continuity and                                                      
  Change                                                              

  Grade 11 U.S.  2          Progressivism, reform, and U.S. expansion 18
  Continuity and                                                      
  Change                                                              

  Grade 11 U.S.  3          World War I, the 1920s, and the           19
  Continuity and            Depression                                
  Change                                                              

  Grade 11 U.S.  4          World War II and the changing United      19
  Continuity and            States                                    
  Change                                                              

  Grade 11 U.S.  5          Cold War, prosperity, and conflict        18
  Continuity and                                                      
  Change                                                              

  Grade 11 U.S.  6          Civil rights, social movements, and       19
  Continuity and            political change                          
  Change                                                              

  Grade 11 U.S.  7          Contemporary United States inquiry        20
  Continuity and                                                      
  Change                                                              

  Grade 11 U.S.             COURSE TOTAL                              135
  Continuity and                                                      
  Change                                                              
  -------------------------------------------------------------------------------

## Grade 12 Government and Economics

  -------------------------------------------------------------------------------
  **Course**     **Unit**   **Core unit**                             **Pathway
                                                                      days**
  -------------- ---------- ----------------------------------------- -----------
  Grade 12       0          Civic and economic reasoning diagnostic   3
  Government and                                                      
  Economics                                                           

  Grade 12       G1         Constitutional principles and federalism  16
  Government and                                                      
  Economics                                                           

  Grade 12       G2         Institutions, elections, and              16
  Government and            participation                             
  Economics                                                           

  Grade 12       G3         Civil liberties, civil rights, and courts 16
  Government and                                                      
  Economics                                                           

  Grade 12       G4         Public policy and comparative government  16
  Government and                                                      
  Economics                                                           

  Grade 12       E1         Choice, incentives, markets, and          17
  Government and            institutions                              
  Economics                                                           

  Grade 12       E2         Firms, labor, competition, and regulation 17
  Government and                                                      
  Economics                                                           

  Grade 12       E3         Macroeconomics, fiscal policy, and        17
  Government and            monetary policy                           
  Economics                                                           

  Grade 12       E4         Global economics, personal finance, and   17
  Government and            policy                                    
  Economics                                                           

  Grade 12                  COURSE TOTAL                              135
  Government and                                                      
  Economics                                                           
  -------------------------------------------------------------------------------

# Appendix E. Starter intervention lesson inventory

The following named lessons demonstrate the minimum metadata expected
from each subject library. They are representative seeds, not the
complete 280-lesson inventory.

## Mathematics starter lessons

  ------------------------------------------------------------------------
  **Lesson   **Target**         **Typical trigger**   **Transfer
  ID**                                                evidence**
  ---------- ------------------ --------------------- --------------------
  M-AR-01    Fraction magnitude Inverts or operates   Estimate and solve
             before operations  without estimating    in the current
                                                      course context

  M-AR-07    Ratio, rate, and   Confuses additive and Choose and justify a
             unit rate          multiplicative        rate in a new
                                comparison            problem

  M-PA-05    Equality as        Performs an operation Solve and verify a
             balance            on one side only      current-course
                                                      equation

  M-AF-08    Connect table,     Treats                Translate a new
             graph, and         representations as    relationship across
             equation           unrelated             forms

  M-GE-11    Similarity and     Uses additive change  Apply scale to a new
             scale factor       for similar figures   geometric model

  M-SP-06    Center, spread,    Compares centers      Defend a conclusion
             and comparison     without variability   from a new dataset
  ------------------------------------------------------------------------

## English starter lessons

  -----------------------------------------------------------------------------
  **Lesson   **Target**              **Typical trigger**   **Transfer
  ID**                                                     evidence**
  ---------- ----------------------- --------------------- --------------------
  E-RD-01    Choose the strongest    Response states an    Select and explain
             textual evidence        idea without support  evidence in the
                                                           current text

  E-RD-03    Inference from detail   Inference is          Infer from a new
             plus reasoning          plausible but         passage and cite the
                                     ungrounded            clue

  E-RD-06    Trace central idea or   Names a topic but not Trace development
             theme development       development           across a new section

  E-WR-02    Build a                 Evidence does not     Revise one paragraph
             claim-reason-evidence   support the reason    in the current task
             chain                                         

  E-WR-05    Integrate and explain   Drops quotations      Embed and analyze
             quotations              without commentary    evidence from the
                                                           current source

  E-LG-04    Repair fragments and    Sentence boundaries   Edit two sentences
             run-ons                 obscure meaning       in the student draft

  E-RS-02    Evaluate source         Uses a source without Compare two sources
             credibility             author or evidence    for the current
                                     checks                inquiry

  E-SL-01    Enter a discussion with Comment is            Make and respond to
             evidence                unsupported or        an evidence-based
                                     disconnected          point
  -----------------------------------------------------------------------------

## Science starter lessons

  ------------------------------------------------------------------------
  **Lesson   **Target**         **Typical trigger**   **Transfer
  ID**                                                evidence**
  ---------- ------------------ --------------------- --------------------
  S-ME-01    Measure with unit  Value lacks unit or   Record a new
             and precision      appropriate precision measurement
                                                      correctly

  S-DA-02    Choose and read a  Axes or scale are     Interpret a new
             graph              misread               dataset and justify
                                                      the graph

  S-MO-03    Define a system    Model omits key       Revise a model for a
             and its boundaries components or         new phenomenon
                                interactions          

  S-CA-02    Distinguish        Claims cause from     Evaluate a new
             correlation from   co-occurrence alone   causal claim
             mechanism                                

  S-IN-04    Identify variables Investigation cannot  Repair a new
             and controls       isolate the factor    investigation plan

  S-ER-01    Connect claim,     Evidence is listed    Explain a new result
             evidence, and      but not connected     with scientific
             reasoning                                reasoning

  S-SC-04    Track energy or    Treats energy or      Trace a new system
             matter through a   matter as             model
             system             disappearing          

  S-LT-02    Read a technical   Misses sequence,      Follow and explain a
             procedure          exception, or         new procedure
                                condition             excerpt
  ------------------------------------------------------------------------

## Social science starter lessons

  ------------------------------------------------------------------------
  **Lesson   **Target**         **Typical trigger**   **Transfer
  ID**                                                evidence**
  ---------- ------------------ --------------------- --------------------
  H-CH-01    Sequence and       Events are listed     Build a new timeline
             periodize events   without temporal      and justify
                                relationship          boundaries

  H-CA-02    Separate cause,    Names one event as    Explain a new event
             condition, and     the complete cause    with layered
             trigger                                  causation

  H-GE-03    Read scale,        Map evidence is       Use a new map to
             region, and        described             support a claim
             movement on maps   inaccurately          

  H-SR-01    Source a document  Ignores author,       Source a new
                                purpose, time, or     document before
                                audience              interpreting it

  H-SR-04    Contextualize a    Reads the source      Add relevant context
             source             outside its           to a new source
                                historical setting    

  H-CO-02    Corroborate across Treats one account as Reconcile agreement
             accounts           complete              and conflict in a
                                                      new pair

  H-CV-03    Analyze            Confuses roles,       Apply the structure
             institutions and   levels, or authority  to a new policy
             civic power                              scenario

  H-EC-02    Identify           Describes a choice    Evaluate a new
             incentives and     without opportunity   economic or policy
             tradeoffs          cost                  decision
  ------------------------------------------------------------------------

## Standards basis and governance note

English pathway design is grounded in the supplied California Common
Core State Standards for English Language Arts and Literacy in
History/Social Studies, Science, and Technical Subjects. Science
sequencing follows California's preferred integrated model for grades
6--8 and the high-school three-course model described in the California
Science Framework. Social science sequencing follows the California
History--Social Science Framework and grade-level content standards. All
course budgets, unit groupings, lesson inventories, source sets, and
local grade 9 or grade 12 options remain illustrative product
requirements until reviewed and adopted by the authorized curriculum
owner.

https://www.cde.ca.gov/ci/pl/ngssstandards.asp

https://www.cde.ca.gov/ci/sc/cf/cascienceframework2016.asp

https://www.cde.ca.gov/ci/hs/cf/

https://www2.cde.ca.gov/cacs/ela

https://www2.cde.ca.gov/cacs/history

# Appendix F. California standards-to-lesson alignment matrix

This appendix converts each 135-day course budget into identified
multi-day lessons. Every applicable California standard is assigned once
as primary coverage to a unit and lesson, linked to a named intervention
lesson from the separate 40-day reserve, and paired with required
assessment evidence. Standards may be reinforced in other lessons, but
the primary assignment is the coverage-control record used for
publishing and audit.

  -----------------------------------------------------------------------
  **Alignment legend.** CA marks a California addition; \* marks a
  starred mathematics modeling standard or an NGSS engineering-integrated
  performance expectation; + marks advanced mathematics; LOCAL marks a
  locally authorized extension. A lesson is a coherent multi-day
  instructional sequence, so each standard has one specific lesson
  identifier even when the lesson spans several workdays. Intervention
  lessons are activated only when evidence triggers them; activation is
  capped by the 40 available intervention days.
  -----------------------------------------------------------------------

  -----------------------------------------------------------------------

Grade 9 social science note: California specifies grades 9-12 analysis
skills but no required grade 9 content course. The World Geography and
Contemporary Issues pathway therefore maps the California analysis and
literacy standards and labels its geography content outcomes as local
extensions. Grade 12 mathematics branches are also local course choices;
Precalculus uses applicable (+) standards, Statistics uses California
Statistics and Probability/AP Probability and Statistics standards, and
Quantitative Reasoning uses starred modeling standards plus labeled
local outcomes.

## Mathematics 6

135 core lesson days \| 40 intervention-capacity days \| 50 primary
standards assignments \| 0 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, habits, and diagnostic - 3 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  M6-U0-L1\   Launch, habits,    Readiness/prerequisite   A-M6-U0-L1:        I-M6-U0-L1 (1-2
  Days 1 (1)  and diagnostic:    evidence; no new primary diagnostic probe + flex days):
              develop concepts   standard.                exit ticket        representation
              and                                                            and prerequisite
              representations.                                               reset

  M6-U0-L2\   Launch, habits,    Readiness/prerequisite   A-M6-U0-L2:        I-M6-U0-L2 (1-2
  Days 2 (1)  and diagnostic:    evidence; no new primary worked-reasoning   flex days):
              connect methods,   standard.                and representation worked-example
              reasoning, and                              check              error analysis
              applications.                                                  

  M6-U0-L3\   Launch, habits,    Readiness/prerequisite   A-M6-U0-L3: common I-M6-U0-L3 (1-2
  Days 3 (1)  and diagnostic:    evidence; no new primary assessment +       flex days):
              model, transfer,   standard.                modeling task      transfer
              and demonstrate                                                rehearsal with
              mastery.                                                       faded prompts
  -------------------------------------------------------------------------------------------

### Unit 1. Ratios, rates, and multiplicative comparison - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M6-U1-L1\   Ratios, rates, and 6.RP.1, 6.RP.3.b  A-M6-U1-L1:        I-M6-U1-L1 (1-2
  Days 4-8    multiplicative                       diagnostic probe + flex days):
  (5)         comparison:                          exit ticket        representation
              develop concepts                                        and prerequisite
              and                                                     reset
              representations.                                        

  M6-U1-L2\   Ratios, rates, and 6.RP.2            A-M6-U1-L2:        I-M6-U1-L2 (1-2
  Days 9-15   multiplicative                       worked-reasoning   flex days):
  (7)         comparison:                          and representation worked-example
              connect methods,                     check              error analysis
              reasoning, and                                          
              applications.                                           

  M6-U1-L3\   Ratios, rates, and 6.RP.3.a          A-M6-U1-L3: common I-M6-U1-L3 (1-2
  Days 16-21  multiplicative                       assessment +       flex days):
  (6)         comparison: model,                   modeling task      transfer
              transfer, and                                           rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 2. Fraction and decimal operations - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M6-U2-L1\   Fraction and       6.NS.1, 6.NS.4,   A-M6-U2-L1:        I-M6-U2-L1 (1-2
  Days 22-26  decimal            6.NS.6.b,         diagnostic probe + flex days):
  (5)         operations:        6.NS.7.b, 6.NS.8  exit ticket        representation
              develop concepts                                        and prerequisite
              and                                                     reset
              representations.                                        

  M6-U2-L2\   Fraction and       6.NS.2, 6.NS.5,   A-M6-U2-L2:        I-M6-U2-L2 (1-2
  Days 27-33  decimal            6.NS.6.c,         worked-reasoning   flex days):
  (7)         operations:        6.NS.7.c          and representation worked-example
              connect methods,                     check              error analysis
              reasoning, and                                          
              applications.                                           

  M6-U2-L3\   Fraction and       6.NS.3, 6.NS.6.a, A-M6-U2-L3: common I-M6-U2-L3 (1-2
  Days 34-39  decimal            6.NS.7.a,         assessment +       flex days):
  (6)         operations: model, 6.NS.7.d          modeling task      transfer
              transfer, and                                           rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 3. Expressions, equations, and inequalities - 19 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M6-U3-L1\   Expressions,       6.EE.1, 6.EE.2.c, A-M6-U3-L1:        I-M6-U3-L1 (1-2
  Days 40-44  equations, and     6.EE.5, 6.EE.8    diagnostic probe + flex days):
  (5)         inequalities:                        exit ticket        representation
              develop concepts                                        and prerequisite
              and                                                     reset
              representations.                                        

  M6-U3-L2\   Expressions,       6.EE.2.a, 6.EE.3, A-M6-U3-L2:        I-M6-U3-L2 (1-2
  Days 45-52  equations, and     6.EE.6, 6.EE.9    worked-reasoning   flex days):
  (8)         inequalities:                        and representation worked-example
              connect methods,                     check              error analysis
              reasoning, and                                          
              applications.                                           

  M6-U3-L3\   Expressions,       6.EE.2.b, 6.EE.4, A-M6-U3-L3: common I-M6-U3-L3 (1-2
  Days 53-58  equations, and     6.EE.7            assessment +       flex days):
  (6)         inequalities:                        modeling task      transfer
              model, transfer,                                        rehearsal with
              and demonstrate                                         faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 4. Proportional reasoning and percent - 18 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  M6-U4-L1\   Proportional       6.RP.3.c                 A-M6-U4-L1:        I-M6-U4-L1 (1-2
  Days 59-63  reasoning and                               diagnostic probe + flex days):
  (5)         percent: develop                            exit ticket        representation
              concepts and                                                   and prerequisite
              representations.                                               reset

  M6-U4-L2\   Proportional       6.RP.3.d                 A-M6-U4-L2:        I-M6-U4-L2 (1-2
  Days 64-70  reasoning and                               worked-reasoning   flex days):
  (7)         percent: connect                            and representation worked-example
              methods,                                    check              error analysis
              reasoning, and                                                 
              applications.                                                  

  M6-U4-L3\   Proportional       Readiness/prerequisite   A-M6-U4-L3: common I-M6-U4-L3 (1-2
  Days 71-76  reasoning and      evidence; no new primary assessment +       flex days):
  (6)         percent: model,    standard.                modeling task      transfer
              transfer, and                                                  rehearsal with
              demonstrate                                                    faded prompts
              mastery.                                                       
  -------------------------------------------------------------------------------------------

### Unit 5. Geometry, area, surface area, and volume - 19 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M6-U5-L1\   Geometry, area,    6.G.1, 6.G.4      A-M6-U5-L1:        I-M6-U5-L1 (1-2
  Days 77-81  surface area, and                    diagnostic probe + flex days):
  (5)         volume: develop                      exit ticket        representation
              concepts and                                            and prerequisite
              representations.                                        reset

  M6-U5-L2\   Geometry, area,    6.G.2             A-M6-U5-L2:        I-M6-U5-L2 (1-2
  Days 82-89  surface area, and                    worked-reasoning   flex days):
  (8)         volume: connect                      and representation worked-example
              methods,                             check              error analysis
              reasoning, and                                          
              applications.                                           

  M6-U5-L3\   Geometry, area,    6.G.3             A-M6-U5-L3: common I-M6-U5-L3 (1-2
  Days 90-95  surface area, and                    assessment +       flex days):
  (6)         volume: model,                       modeling task      transfer
              transfer, and                                           rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 6. Statistical distributions and variability - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M6-U6-L1\   Statistical        6.SP.1, 6.SP.4,   A-M6-U6-L1:        I-M6-U6-L1 (1-2
  Days 96-100 distributions and  6.SP.5.c          diagnostic probe + flex days):
  (5)         variability:                         exit ticket        representation
              develop concepts                                        and prerequisite
              and                                                     reset
              representations.                                        

  M6-U6-L2\   Statistical        6.SP.2, 6.SP.5.a, A-M6-U6-L2:        I-M6-U6-L2 (1-2
  Days        distributions and  6.SP.5.d          worked-reasoning   flex days):
  101-107 (7) variability:                         and representation worked-example
              connect methods,                     check              error analysis
              reasoning, and                                          
              applications.                                           

  M6-U6-L3\   Statistical        6.SP.3, 6.SP.5.b  A-M6-U6-L3: common I-M6-U6-L3 (1-2
  Days        distributions and                    assessment +       flex days):
  108-113 (6) variability:                         modeling task      transfer
              model, transfer,                                        rehearsal with
              and demonstrate                                         faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 7. Integrated modeling and mastery - 22 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M6-U7-L1\   Integrated         MP.1, MP.4, MP.7  A-M6-U7-L1:        I-M6-U7-L1 (1-2
  Days        modeling and                         diagnostic probe + flex days):
  114-119 (6) mastery: develop                     exit ticket        representation
              concepts and                                            and prerequisite
              representations.                                        reset

  M6-U7-L2\   Integrated         MP.2, MP.5, MP.8  A-M6-U7-L2:        I-M6-U7-L2 (1-2
  Days        modeling and                         worked-reasoning   flex days):
  120-128 (9) mastery: connect                     and representation worked-example
              methods,                             check              error analysis
              reasoning, and                                          
              applications.                                           

  M6-U7-L3\   Integrated         MP.3, MP.6        A-M6-U7-L3: common I-M6-U7-L3 (1-2
  Days        modeling and                         assessment +       flex days):
  129-135 (7) mastery: model,                      modeling task      transfer
              transfer, and                                           rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 50 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Mathematics 7

135 core lesson days \| 40 intervention-capacity days \| 45 primary
standards assignments \| 0 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, habits, and diagnostic - 3 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  M7-U0-L1\   Launch, habits,    Readiness/prerequisite   A-M7-U0-L1:        I-M7-U0-L1 (1-2
  Days 1 (1)  and diagnostic:    evidence; no new primary diagnostic probe + flex days):
              develop concepts   standard.                exit ticket        representation
              and                                                            and prerequisite
              representations.                                               reset

  M7-U0-L2\   Launch, habits,    Readiness/prerequisite   A-M7-U0-L2:        I-M7-U0-L2 (1-2
  Days 2 (1)  and diagnostic:    evidence; no new primary worked-reasoning   flex days):
              connect methods,   standard.                and representation worked-example
              reasoning, and                              check              error analysis
              applications.                                                  

  M7-U0-L3\   Launch, habits,    Readiness/prerequisite   A-M7-U0-L3: common I-M7-U0-L3 (1-2
  Days 3 (1)  and diagnostic:    evidence; no new primary assessment +       flex days):
              model, transfer,   standard.                modeling task      transfer
              and demonstrate                                                rehearsal with
              mastery.                                                       faded prompts
  -------------------------------------------------------------------------------------------

### Unit 1. Proportional relationships and scale - 19 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M7-U1-L1\   Proportional       7.RP.1, 7.RP.2.c  A-M7-U1-L1:        I-M7-U1-L1 (1-2
  Days 4-8    relationships and                    diagnostic probe + flex days):
  (5)         scale: develop                       exit ticket        representation
              concepts and                                            and prerequisite
              representations.                                        reset

  M7-U1-L2\   Proportional       7.RP.2.a,         A-M7-U1-L2:        I-M7-U1-L2 (1-2
  Days 9-16   relationships and  7.RP.2.d          worked-reasoning   flex days):
  (8)         scale: connect                       and representation worked-example
              methods,                             check              error analysis
              reasoning, and                                          
              applications.                                           

  M7-U1-L3\   Proportional       7.RP.2.b, 7.RP.3  A-M7-U1-L3: common I-M7-U1-L3 (1-2
  Days 17-22  relationships and                    assessment +       flex days):
  (6)         scale: model,                        modeling task      transfer
              transfer, and                                           rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 2. Rational-number operations - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M7-U2-L1\   Rational-number    7.NS.1.a,         A-M7-U2-L1:        I-M7-U2-L1 (1-2
  Days 23-27  operations:        7.NS.1.d,         diagnostic probe + flex days):
  (5)         develop concepts   7.NS.2.c          exit ticket        representation
              and                                                     and prerequisite
              representations.                                        reset

  M7-U2-L2\   Rational-number    7.NS.1.b,         A-M7-U2-L2:        I-M7-U2-L2 (1-2
  Days 28-34  operations:        7.NS.2.a,         worked-reasoning   flex days):
  (7)         connect methods,   7.NS.2.d          and representation worked-example
              reasoning, and                       check              error analysis
              applications.                                           

  M7-U2-L3\   Rational-number    7.NS.1.c,         A-M7-U2-L3: common I-M7-U2-L3 (1-2
  Days 35-40  operations: model, 7.NS.2.b, 7.NS.3  assessment +       flex days):
  (6)         transfer, and                        modeling task      transfer
              demonstrate                                             rehearsal with
              mastery.                                                faded prompts
  ------------------------------------------------------------------------------------

### Unit 3. Expressions, equations, and inequalities - 19 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M7-U3-L1\   Expressions,       7.EE.1, 7.EE.4.a  A-M7-U3-L1:        I-M7-U3-L1 (1-2
  Days 41-45  equations, and                       diagnostic probe + flex days):
  (5)         inequalities:                        exit ticket        representation
              develop concepts                                        and prerequisite
              and                                                     reset
              representations.                                        

  M7-U3-L2\   Expressions,       7.EE.2, 7.EE.4.b  A-M7-U3-L2:        I-M7-U3-L2 (1-2
  Days 46-53  equations, and                       worked-reasoning   flex days):
  (8)         inequalities:                        and representation worked-example
              connect methods,                     check              error analysis
              reasoning, and                                          
              applications.                                           

  M7-U3-L3\   Expressions,       7.EE.3            A-M7-U3-L3: common I-M7-U3-L3 (1-2
  Days 54-59  equations, and                       assessment +       flex days):
  (6)         inequalities:                        modeling task      transfer
              model, transfer,                                        rehearsal with
              and demonstrate                                         faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 4. Percent, probability, and sampling - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M7-U4-L1\   Percent,           7.SP.5, 7.SP.7.b, A-M7-U4-L1:        I-M7-U4-L1 (1-2
  Days 60-64  probability, and   7.SP.8.c          diagnostic probe + flex days):
  (5)         sampling: develop                    exit ticket        representation
              concepts and                                            and prerequisite
              representations.                                        reset

  M7-U4-L2\   Percent,           7.SP.6, 7.SP.8.a  A-M7-U4-L2:        I-M7-U4-L2 (1-2
  Days 65-71  probability, and                     worked-reasoning   flex days):
  (7)         sampling: connect                    and representation worked-example
              methods,                             check              error analysis
              reasoning, and                                          
              applications.                                           

  M7-U4-L3\   Percent,           7.SP.7.a,         A-M7-U4-L3: common I-M7-U4-L3 (1-2
  Days 72-77  probability, and   7.SP.8.b          assessment +       flex days):
  (6)         sampling: model,                     modeling task      transfer
              transfer, and                                           rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 5. Geometry and measurement - 19 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M7-U5-L1\   Geometry and       7.G.1, 7.G.4      A-M7-U5-L1:        I-M7-U5-L1 (1-2
  Days 78-82  measurement:                         diagnostic probe + flex days):
  (5)         develop concepts                     exit ticket        representation
              and                                                     and prerequisite
              representations.                                        reset

  M7-U5-L2\   Geometry and       7.G.2, 7.G.5      A-M7-U5-L2:        I-M7-U5-L2 (1-2
  Days 83-90  measurement:                         worked-reasoning   flex days):
  (8)         connect methods,                     and representation worked-example
              reasoning, and                       check              error analysis
              applications.                                           

  M7-U5-L3\   Geometry and       7.G.3, 7.G.6      A-M7-U5-L3: common I-M7-U5-L3 (1-2
  Days 91-96  measurement:                         assessment +       flex days):
  (6)         model, transfer,                     modeling task      transfer
              and demonstrate                                         rehearsal with
              mastery.                                                faded prompts
  ------------------------------------------------------------------------------------

### Unit 6. Data inference and comparison - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M7-U6-L1\   Data inference and 7.SP.1, 7.SP.4    A-M7-U6-L1:        I-M7-U6-L1 (1-2
  Days 97-101 comparison:                          diagnostic probe + flex days):
  (5)         develop concepts                     exit ticket        representation
              and                                                     and prerequisite
              representations.                                        reset

  M7-U6-L2\   Data inference and 7.SP.2            A-M7-U6-L2:        I-M7-U6-L2 (1-2
  Days        comparison:                          worked-reasoning   flex days):
  102-108 (7) connect methods,                     and representation worked-example
              reasoning, and                       check              error analysis
              applications.                                           

  M7-U6-L3\   Data inference and 7.SP.3            A-M7-U6-L3: common I-M7-U6-L3 (1-2
  Days        comparison: model,                   assessment +       flex days):
  109-114 (6) transfer, and                        modeling task      transfer
              demonstrate                                             rehearsal with
              mastery.                                                faded prompts
  ------------------------------------------------------------------------------------

### Unit 7. Integrated modeling and mastery - 21 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M7-U7-L1\   Integrated         MP.1, MP.4, MP.7  A-M7-U7-L1:        I-M7-U7-L1 (1-2
  Days        modeling and                         diagnostic probe + flex days):
  115-119 (5) mastery: develop                     exit ticket        representation
              concepts and                                            and prerequisite
              representations.                                        reset

  M7-U7-L2\   Integrated         MP.2, MP.5, MP.8  A-M7-U7-L2:        I-M7-U7-L2 (1-2
  Days        modeling and                         worked-reasoning   flex days):
  120-129     mastery: connect                     and representation worked-example
  (10)        methods,                             check              error analysis
              reasoning, and                                          
              applications.                                           

  M7-U7-L3\   Integrated         MP.3, MP.6        A-M7-U7-L3: common I-M7-U7-L3 (1-2
  Days        modeling and                         assessment +       flex days):
  130-135 (6) mastery: model,                      modeling task      transfer
              transfer, and                                           rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 45 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Mathematics 8

135 core lesson days \| 40 intervention-capacity days \| 41 primary
standards assignments \| 0 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, habits, and diagnostic - 3 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  M8-U0-L1\   Launch, habits,    Readiness/prerequisite   A-M8-U0-L1:        I-M8-U0-L1 (1-2
  Days 1 (1)  and diagnostic:    evidence; no new primary diagnostic probe + flex days):
              develop concepts   standard.                exit ticket        representation
              and                                                            and prerequisite
              representations.                                               reset

  M8-U0-L2\   Launch, habits,    Readiness/prerequisite   A-M8-U0-L2:        I-M8-U0-L2 (1-2
  Days 2 (1)  and diagnostic:    evidence; no new primary worked-reasoning   flex days):
              connect methods,   standard.                and representation worked-example
              reasoning, and                              check              error analysis
              applications.                                                  

  M8-U0-L3\   Launch, habits,    Readiness/prerequisite   A-M8-U0-L3: common I-M8-U0-L3 (1-2
  Days 3 (1)  and diagnostic:    evidence; no new primary assessment +       flex days):
              model, transfer,   standard.                modeling task      transfer
              and demonstrate                                                rehearsal with
              mastery.                                                       faded prompts
  -------------------------------------------------------------------------------------------

### Unit 1. Exponents, radicals, and scientific notation - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M8-U1-L1\   Exponents,         8.EE.1, 8.EE.4    A-M8-U1-L1:        I-M8-U1-L1 (1-2
  Days 4-8    radicals, and                        diagnostic probe + flex days):
  (5)         scientific                           exit ticket        representation
              notation: develop                                       and prerequisite
              concepts and                                            reset
              representations.                                        

  M8-U1-L2\   Exponents,         8.EE.2, 8.NS.1    A-M8-U1-L2:        I-M8-U1-L2 (1-2
  Days 9-15   radicals, and                        worked-reasoning   flex days):
  (7)         scientific                           and representation worked-example
              notation: connect                    check              error analysis
              methods,                                                
              reasoning, and                                          
              applications.                                           

  M8-U1-L3\   Exponents,         8.EE.3, 8.NS.2    A-M8-U1-L3: common I-M8-U1-L3 (1-2
  Days 16-21  radicals, and                        assessment +       flex days):
  (6)         scientific                           modeling task      transfer
              notation: model,                                        rehearsal with
              transfer, and                                           faded prompts
              demonstrate                                             
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 2. Linear equations and systems - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M8-U2-L1\   Linear equations   8.EE.5, 8.EE.7.b, A-M8-U2-L1:        I-M8-U2-L1 (1-2
  Days 22-26  and systems:       8.EE.8.c          diagnostic probe + flex days):
  (5)         develop concepts                     exit ticket        representation
              and                                                     and prerequisite
              representations.                                        reset

  M8-U2-L2\   Linear equations   8.EE.6, 8.EE.8.a  A-M8-U2-L2:        I-M8-U2-L2 (1-2
  Days 27-33  and systems:                         worked-reasoning   flex days):
  (7)         connect methods,                     and representation worked-example
              reasoning, and                       check              error analysis
              applications.                                           

  M8-U2-L3\   Linear equations   8.EE.7.a,         A-M8-U2-L3: common I-M8-U2-L3 (1-2
  Days 34-39  and systems:       8.EE.8.b          assessment +       flex days):
  (6)         model, transfer,                     modeling task      transfer
              and demonstrate                                         rehearsal with
              mastery.                                                faded prompts
  ------------------------------------------------------------------------------------

### Unit 3. Functions and representations - 20 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M8-U3-L1\   Functions and      8.F.1, 8.F.4      A-M8-U3-L1:        I-M8-U3-L1 (1-2
  Days 40-44  representations:                     diagnostic probe + flex days):
  (5)         develop concepts                     exit ticket        representation
              and                                                     and prerequisite
              representations.                                        reset

  M8-U3-L2\   Functions and      8.F.2, 8.F.5      A-M8-U3-L2:        I-M8-U3-L2 (1-2
  Days 45-53  representations:                     worked-reasoning   flex days):
  (9)         connect methods,                     and representation worked-example
              reasoning, and                       check              error analysis
              applications.                                           

  M8-U3-L3\   Functions and      8.F.3             A-M8-U3-L3: common I-M8-U3-L3 (1-2
  Days 54-59  representations:                     assessment +       flex days):
  (6)         model, transfer,                     modeling task      transfer
              and demonstrate                                         rehearsal with
              mastery.                                                faded prompts
  ------------------------------------------------------------------------------------

### Unit 4. Transformations, congruence, and similarity - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M8-U4-L1\   Transformations,   8.G.1.a, 8.G.2,   A-M8-U4-L1:        I-M8-U4-L1 (1-2
  Days 60-64  congruence, and    8.G.5             diagnostic probe + flex days):
  (5)         similarity:                          exit ticket        representation
              develop concepts                                        and prerequisite
              and                                                     reset
              representations.                                        

  M8-U4-L2\   Transformations,   8.G.1.b, 8.G.3    A-M8-U4-L2:        I-M8-U4-L2 (1-2
  Days 65-71  congruence, and                      worked-reasoning   flex days):
  (7)         similarity:                          and representation worked-example
              connect methods,                     check              error analysis
              reasoning, and                                          
              applications.                                           

  M8-U4-L3\   Transformations,   8.G.1.c, 8.G.4    A-M8-U4-L3: common I-M8-U4-L3 (1-2
  Days 72-77  congruence, and                      assessment +       flex days):
  (6)         similarity: model,                   modeling task      transfer
              transfer, and                                           rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 5. Pythagorean relationships and measurement - 20 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M8-U5-L1\   Pythagorean        8.G.6, 8.G.9      A-M8-U5-L1:        I-M8-U5-L1 (1-2
  Days 78-82  relationships and                    diagnostic probe + flex days):
  (5)         measurement:                         exit ticket        representation
              develop concepts                                        and prerequisite
              and                                                     reset
              representations.                                        

  M8-U5-L2\   Pythagorean        8.G.7             A-M8-U5-L2:        I-M8-U5-L2 (1-2
  Days 83-91  relationships and                    worked-reasoning   flex days):
  (9)         measurement:                         and representation worked-example
              connect methods,                     check              error analysis
              reasoning, and                                          
              applications.                                           

  M8-U5-L3\   Pythagorean        8.G.8             A-M8-U5-L3: common I-M8-U5-L3 (1-2
  Days 92-97  relationships and                    assessment +       flex days):
  (6)         measurement:                         modeling task      transfer
              model, transfer,                                        rehearsal with
              and demonstrate                                         faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 6. Bivariate data and association - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M8-U6-L1\   Bivariate data and 8.SP.1, 8.SP.4    A-M8-U6-L1:        I-M8-U6-L1 (1-2
  Days 98-102 association:                         diagnostic probe + flex days):
  (5)         develop concepts                     exit ticket        representation
              and                                                     and prerequisite
              representations.                                        reset

  M8-U6-L2\   Bivariate data and 8.SP.2            A-M8-U6-L2:        I-M8-U6-L2 (1-2
  Days        association:                         worked-reasoning   flex days):
  103-109 (7) connect methods,                     and representation worked-example
              reasoning, and                       check              error analysis
              applications.                                           

  M8-U6-L3\   Bivariate data and 8.SP.3            A-M8-U6-L3: common I-M8-U6-L3 (1-2
  Days        association:                         assessment +       flex days):
  110-115 (6) model, transfer,                     modeling task      transfer
              and demonstrate                                         rehearsal with
              mastery.                                                faded prompts
  ------------------------------------------------------------------------------------

### Unit 7. Integrated modeling and high-school readiness - 20 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  M8-U7-L1\   Integrated         MP.1, MP.4, MP.7  A-M8-U7-L1:        I-M8-U7-L1 (1-2
  Days        modeling and                         diagnostic probe + flex days):
  116-120 (5) high-school                          exit ticket        representation
              readiness: develop                                      and prerequisite
              concepts and                                            reset
              representations.                                        

  M8-U7-L2\   Integrated         MP.2, MP.5, MP.8  A-M8-U7-L2:        I-M8-U7-L2 (1-2
  Days        modeling and                         worked-reasoning   flex days):
  121-129 (9) high-school                          and representation worked-example
              readiness: connect                   check              error analysis
              methods,                                                
              reasoning, and                                          
              applications.                                           

  M8-U7-L3\   Integrated         MP.3, MP.6        A-M8-U7-L3: common I-M8-U7-L3 (1-2
  Days        modeling and                         assessment +       flex days):
  130-135 (6) high-school                          modeling task      transfer
              readiness: model,                                       rehearsal with
              transfer, and                                           faded prompts
              demonstrate                                             
              mastery.                                                
  ------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 41 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Integrated Math 1

135 core lesson days \| 40 intervention-capacity days \| 67 primary
standards assignments \| 2 CA-tagged \| 35 starred/modeling \| 0
advanced (+) \| 0 local extensions

### Unit 0. Course launch and diagnostic - 1 core days

  ----------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary standards**    **Assessment   **Intervention
  core days**  sequence**                                  evidence**     lesson**
  ------------ ------------------ ------------------------ -------------- ----------------
  IM1-U0-L1\   Course launch and  Readiness/prerequisite   A-IM1-U0-L1:   I-IM1-U0-L1 (1-2
  Days 1 (1)   diagnostic:        evidence; no new primary diagnostic     flex days):
               develop concepts   standard.                probe + exit   representation
               and                                         ticket         and prerequisite
               representations.                                           reset

  ----------------------------------------------------------------------------------------

### Unit 1. Quantities and algebra foundations - 12 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM1-U1-L1\   Quantities and     A-SSE.1.a \[\*\], A-IM1-U1-L1:       I-IM1-U1-L1 (1-2
  Days 2-4 (3) algebra            N-Q.2 \[\*\]      diagnostic probe + flex days):
               foundations:                         exit ticket        representation
               develop concepts                                        and prerequisite
               and                                                     reset
               representations.                                        

  IM1-U1-L2\   Quantities and     A-SSE.1.b \[\*\], A-IM1-U1-L2:       I-IM1-U1-L2 (1-2
  Days 5-9 (5) algebra            N-Q.3 \[\*\]      worked-reasoning   flex days):
               foundations:                         and representation worked-example
               connect methods,                     check              error analysis
               reasoning, and                                          
               applications.                                           

  IM1-U1-L3\   Quantities and     N-Q.1 \[\*\]      A-IM1-U1-L3:       I-IM1-U1-L3 (1-2
  Days 10-13   algebra                              common             flex days):
  (4)          foundations:                         assessment +       transfer
               model, transfer,                     modeling task      rehearsal with
               and demonstrate                                         faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 2. Linear relationships and function language - 15 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM1-U2-L1\   Linear             F-BF.1.a \[\*\],  A-IM1-U2-L1:       I-IM1-U2-L1 (1-2
  Days 14-17   relationships and  F-BF.3, F-IF.3,   diagnostic probe + flex days):
  (4)          function language: F-IF.6 \[\*\],    exit ticket        representation
               develop concepts   F-IF.9                               and prerequisite
               and                                                     reset
               representations.                                        

  IM1-U2-L2\   Linear             F-BF.1.b \[\*\],  A-IM1-U2-L2:       I-IM1-U2-L2 (1-2
  Days 18-23   relationships and  F-IF.1, F-IF.4    worked-reasoning   flex days):
  (6)          function language: \[\*\], F-IF.7.a  and representation worked-example
               connect methods,   \[\*\]            check              error analysis
               reasoning, and                                          
               applications.                                           

  IM1-U2-L3\   Linear             F-BF.2 \[\*\],    A-IM1-U2-L3:       I-IM1-U2-L3 (1-2
  Days 24-28   relationships and  F-IF.2, F-IF.5    common             flex days):
  (5)          function language: \[\*\], F-IF.7.e  assessment +       transfer
               model, transfer,   \[\*\]            modeling task      rehearsal with
               and demonstrate                                         faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 3. Linear equations, inequalities, and systems - 15 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM1-U3-L1\   Linear equations,  A-CED.1           A-IM1-U3-L1:       I-IM1-U3-L1 (1-2
  Days 29-32   inequalities, and  \[CA,\*\],        diagnostic probe + flex days):
  (4)          systems: develop   A-CED.4 \[\*\],   exit ticket        representation
               concepts and       A-REI.3.1 \[CA\],                    and prerequisite
               representations.   A-REI.10                             reset

  IM1-U3-L2\   Linear equations,  A-CED.2 \[\*\],   A-IM1-U3-L2:       I-IM1-U3-L2 (1-2
  Days 33-38   inequalities, and  A-REI.1, A-REI.5, worked-reasoning   flex days):
  (6)          systems: connect   A-REI.11 \[\*\]   and representation worked-example
               methods,                             check              error analysis
               reasoning, and                                          
               applications.                                           

  IM1-U3-L3\   Linear equations,  A-CED.3 \[\*\],   A-IM1-U3-L3:       I-IM1-U3-L3 (1-2
  Days 39-43   inequalities, and  A-REI.3, A-REI.6, common             flex days):
  (5)          systems: model,    A-REI.12          assessment +       transfer
               transfer, and                        modeling task      rehearsal with
               demonstrate                                             faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 4. Exponential models and sequences - 13 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM1-U4-L1\   Exponential models F-LE.1.a \[\*\],  A-IM1-U4-L1:       I-IM1-U4-L1 (1-2
  Days 44-46   and sequences:     F-LE.2 \[\*\]     diagnostic probe + flex days):
  (3)          develop concepts                     exit ticket        representation
               and                                                     and prerequisite
               representations.                                        reset

  IM1-U4-L2\   Exponential models F-LE.1.b \[\*\],  A-IM1-U4-L2:       I-IM1-U4-L2 (1-2
  Days 47-52   and sequences:     F-LE.3 \[\*\]     worked-reasoning   flex days):
  (6)          connect methods,                     and representation worked-example
               reasoning, and                       check              error analysis
               applications.                                           

  IM1-U4-L3\   Exponential models F-LE.1.c \[\*\],  A-IM1-U4-L3:       I-IM1-U4-L3 (1-2
  Days 53-56   and sequences:     F-LE.5 \[\*\]     common             flex days):
  (4)          model, transfer,                     assessment +       transfer
               and demonstrate                      modeling task      rehearsal with
               mastery.                                                faded prompts
  -------------------------------------------------------------------------------------

### Unit 5. Transformations, congruence, and constructions - 17 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM1-U5-L1\   Transformations,   G-CO.1, G-CO.4,   A-IM1-U5-L1:       I-IM1-U5-L1 (1-2
  Days 57-60   congruence, and    G-CO.7, G-CO.13   diagnostic probe + flex days):
  (4)          constructions:                       exit ticket        representation
               develop concepts                                        and prerequisite
               and                                                     reset
               representations.                                        

  IM1-U5-L2\   Transformations,   G-CO.2, G-CO.5,   A-IM1-U5-L2:       I-IM1-U5-L2 (1-2
  Days 61-68   congruence, and    G-CO.8            worked-reasoning   flex days):
  (8)          constructions:                       and representation worked-example
               connect methods,                     check              error analysis
               reasoning, and                                          
               applications.                                           

  IM1-U5-L3\   Transformations,   G-CO.3, G-CO.6,   A-IM1-U5-L3:       I-IM1-U5-L3 (1-2
  Days 69-73   congruence, and    G-CO.12           common             flex days):
  (5)          constructions:                       assessment +       transfer
               model, transfer,                     modeling task      rehearsal with
               and demonstrate                                         faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 6. Coordinate geometry and proof - 13 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM1-U6-L1\   Coordinate         G-GPE.4           A-IM1-U6-L1:       I-IM1-U6-L1 (1-2
  Days 74-76   geometry and                         diagnostic probe + flex days):
  (3)          proof: develop                       exit ticket        representation
               concepts and                                            and prerequisite
               representations.                                        reset

  IM1-U6-L2\   Coordinate         G-GPE.5           A-IM1-U6-L2:       I-IM1-U6-L2 (1-2
  Days 77-82   geometry and                         worked-reasoning   flex days):
  (6)          proof: connect                       and representation worked-example
               methods,                             check              error analysis
               reasoning, and                                          
               applications.                                           

  IM1-U6-L3\   Coordinate         G-GPE.7 \[\*\]    A-IM1-U6-L3:       I-IM1-U6-L3 (1-2
  Days 83-86   geometry and                         common             flex days):
  (4)          proof: model,                        assessment +       transfer
               transfer, and                        modeling task      rehearsal with
               demonstrate                                             faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 7. Data distributions - 14 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM1-U7-L1\   Data               S-ID.1 \[\*\]     A-IM1-U7-L1:       I-IM1-U7-L1 (1-2
  Days 87-89   distributions:                       diagnostic probe + flex days):
  (3)          develop concepts                     exit ticket        representation
               and                                                     and prerequisite
               representations.                                        reset

  IM1-U7-L2\   Data               S-ID.2 \[\*\]     A-IM1-U7-L2:       I-IM1-U7-L2 (1-2
  Days 90-96   distributions:                       worked-reasoning   flex days):
  (7)          connect methods,                     and representation worked-example
               reasoning, and                       check              error analysis
               applications.                                           

  IM1-U7-L3\   Data               S-ID.3 \[\*\]     A-IM1-U7-L3:       I-IM1-U7-L3 (1-2
  Days 97-100  distributions:                       common             flex days):
  (4)          model, transfer,                     assessment +       transfer
               and demonstrate                      modeling task      rehearsal with
               mastery.                                                faded prompts
  -------------------------------------------------------------------------------------

### Unit 8. Bivariate data and linear modeling - 20 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM1-U8-L1\   Bivariate data and S-ID.5 \[\*\],    A-IM1-U8-L1:       I-IM1-U8-L1 (1-2
  Days 101-105 linear modeling:   S-ID.6.c \[\*\],  diagnostic probe + flex days):
  (5)          develop concepts   S-ID.9 \[\*\]     exit ticket        representation
               and                                                     and prerequisite
               representations.                                        reset

  IM1-U8-L2\   Bivariate data and S-ID.6.a \[\*\],  A-IM1-U8-L2:       I-IM1-U8-L2 (1-2
  Days 106-114 linear modeling:   S-ID.7 \[\*\]     worked-reasoning   flex days):
  (9)          connect methods,                     and representation worked-example
               reasoning, and                       check              error analysis
               applications.                                           

  IM1-U8-L3\   Bivariate data and S-ID.6.b \[\*\],  A-IM1-U8-L3:       I-IM1-U8-L3 (1-2
  Days 115-120 linear modeling:   S-ID.8 \[\*\]     common             flex days):
  (6)          model, transfer,                     assessment +       transfer
               and demonstrate                      modeling task      rehearsal with
               mastery.                                                faded prompts
  -------------------------------------------------------------------------------------

### Unit 9. Integrated modeling and mastery - 15 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM1-U9-L1\   Integrated         MP.1, MP.4, MP.7  A-IM1-U9-L1:       I-IM1-U9-L1 (1-2
  Days 121-124 modeling and                         diagnostic probe + flex days):
  (4)          mastery: develop                     exit ticket        representation
               concepts and                                            and prerequisite
               representations.                                        reset

  IM1-U9-L2\   Integrated         MP.2, MP.5, MP.8  A-IM1-U9-L2:       I-IM1-U9-L2 (1-2
  Days 125-130 modeling and                         worked-reasoning   flex days):
  (6)          mastery: connect                     and representation worked-example
               methods,                             check              error analysis
               reasoning, and                                          
               applications.                                           

  IM1-U9-L3\   Integrated         MP.3, MP.6        A-IM1-U9-L3:       I-IM1-U9-L3 (1-2
  Days 131-135 modeling and                         common             flex days):
  (5)          mastery: model,                      assessment +       transfer
               transfer, and                        modeling task      rehearsal with
               demonstrate                                             faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

Course control check: 28 identified lesson sequences cover core workdays
1-135; all 67 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Integrated Math 2

135 core lesson days \| 40 intervention-capacity days \| 81 primary
standards assignments \| 6 CA-tagged \| 30 starred/modeling \| 7
advanced (+) \| 0 local extensions

### Unit 0. Course launch and diagnostic - 1 core days

  ----------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary standards**    **Assessment   **Intervention
  core days**  sequence**                                  evidence**     lesson**
  ------------ ------------------ ------------------------ -------------- ----------------
  IM2-U0-L1\   Course launch and  Readiness/prerequisite   A-IM2-U0-L1:   I-IM2-U0-L1 (1-2
  Days 1 (1)   diagnostic:        evidence; no new primary diagnostic     flex days):
               develop concepts   standard.                probe + exit   representation
               and                                         ticket         and prerequisite
               representations.                                           reset

  ----------------------------------------------------------------------------------------

### Unit 1. Real, rational, and complex numbers - 13 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM2-U1-L1\   Real, rational,    N-CN.1, N-CN.8    A-IM2-U1-L1:       I-IM2-U1-L1 (1-2
  Days 2-4 (3) and complex        \[+\], N-RN.2     diagnostic probe + flex days):
               numbers: develop                     exit ticket        representation
               concepts and                                            and prerequisite
               representations.                                        reset

  IM2-U1-L2\   Real, rational,    N-CN.2, N-CN.9    A-IM2-U1-L2:       I-IM2-U1-L2 (1-2
  Days 5-10    and complex        \[+\], N-RN.3     worked-reasoning   flex days):
  (6)          numbers: connect                     and representation worked-example
               methods,                             check              error analysis
               reasoning, and                                          
               applications.                                           

  IM2-U1-L3\   Real, rational,    N-CN.7, N-RN.1    A-IM2-U1-L3:       I-IM2-U1-L3 (1-2
  Days 11-14   and complex                          common             flex days):
  (4)          numbers: model,                      assessment +       transfer
               transfer, and                        modeling task      rehearsal with
               demonstrate                                             faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 2. Quadratic expressions and polynomial structure - 17 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM2-U2-L1\   Quadratic          A-APR.1, A-SSE.2, A-IM2-U2-L1:       I-IM2-U2-L1 (1-2
  Days 15-18   expressions and    A-SSE.3.c \[\*\]  diagnostic probe + flex days):
  (4)          polynomial                           exit ticket        representation
               structure: develop                                      and prerequisite
               concepts and                                            reset
               representations.                                        

  IM2-U2-L2\   Quadratic          A-SSE.1.a \[\*\], A-IM2-U2-L2:       I-IM2-U2-L2 (1-2
  Days 19-26   expressions and    A-SSE.3.a \[\*\]  worked-reasoning   flex days):
  (8)          polynomial                           and representation worked-example
               structure: connect                   check              error analysis
               methods,                                                
               reasoning, and                                          
               applications.                                           

  IM2-U2-L3\   Quadratic          A-SSE.1.b \[\*\], A-IM2-U2-L3:       I-IM2-U2-L3 (1-2
  Days 27-31   expressions and    A-SSE.3.b \[\*\]  common             flex days):
  (5)          polynomial                           assessment +       transfer
               structure: model,                    modeling task      rehearsal with
               transfer, and                                           faded prompts
               demonstrate                                             
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 3. Quadratic equations, functions, and models - 25 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM2-U3-L1\   Quadratic          A-CED.1           A-IM2-U3-L1:       I-IM2-U3-L1 (1-2
  Days 32-38   equations,         \[CA,\*\],        diagnostic probe + flex days):
  (7)          functions, and     A-REI.4.a,        exit ticket        representation
               models: develop    F-BF.1.a \[\*\],                     and prerequisite
               concepts and       F-BF.4.a, F-IF.6                     reset
               representations.   \[\*\], F-IF.8.a,                    
                                  F-LE.3 \[\*\]                        

  IM2-U3-L2\   Quadratic          A-CED.2 \[\*\],   A-IM2-U3-L2:       I-IM2-U3-L2 (1-2
  Days 39-48   equations,         A-REI.4.b,        worked-reasoning   flex days):
  (10)         functions, and     F-BF.1.b \[\*\],  and representation worked-example
               models: connect    F-IF.4 \[\*\],    check              error analysis
               methods,           F-IF.7.a \[\*\],                     
               reasoning, and     F-IF.8.b, F-LE.6                     
               applications.      \[CA,\*\]                            

  IM2-U3-L3\   Quadratic          A-CED.4 \[\*\],   A-IM2-U3-L3:       I-IM2-U3-L3 (1-2
  Days 49-56   equations,         A-REI.7, F-BF.3,  common             flex days):
  (8)          functions, and     F-IF.5 \[\*\],    assessment +       transfer
               models: model,     F-IF.7.b \[\*\],  modeling task      rehearsal with
               transfer, and      F-IF.9                               faded prompts
               demonstrate                                             
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 4. Geometric proof and similarity - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM2-U4-L1\   Geometric proof    G-CO.9            A-IM2-U4-L1:       I-IM2-U4-L1 (1-2
  Days 57-61   and similarity:                      diagnostic probe + flex days):
  (5)          develop concepts                     exit ticket        representation
               and                                                     and prerequisite
               representations.                                        reset

  IM2-U4-L2\   Geometric proof    G-CO.10           A-IM2-U4-L2:       I-IM2-U4-L2 (1-2
  Days 62-68   and similarity:                      worked-reasoning   flex days):
  (7)          connect methods,                     and representation worked-example
               reasoning, and                       check              error analysis
               applications.                                           

  IM2-U4-L3\   Geometric proof    G-CO.11           A-IM2-U4-L3:       I-IM2-U4-L3 (1-2
  Days 69-74   and similarity:                      common             flex days):
  (6)          model, transfer,                     assessment +       transfer
               and demonstrate                      modeling task      rehearsal with
               mastery.                                                faded prompts
  -------------------------------------------------------------------------------------

### Unit 5. Right-triangle trigonometry and circles - 17 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM2-U5-L1\   Right-triangle     G-C.1, G-C.4      A-IM2-U5-L1:       I-IM2-U5-L1 (1-2
  Days 75-78   trigonometry and   \[+\], G-SRT.1.b, diagnostic probe + flex days):
  (4)          circles: develop   G-SRT.4, G-SRT.7  exit ticket        representation
               concepts and                                            and prerequisite
               representations.                                        reset

  IM2-U5-L2\   Right-triangle     G-C.2, G-C.5      A-IM2-U5-L2:       I-IM2-U5-L2 (1-2
  Days 79-86   trigonometry and   \[CA\], G-SRT.2,  worked-reasoning   flex days):
  (8)          circles: connect   G-SRT.5, G-SRT.8  and representation worked-example
               methods,           \[\*\]            check              error analysis
               reasoning, and                                          
               applications.                                           

  IM2-U5-L3\   Right-triangle     G-C.3, G-SRT.1.a, A-IM2-U5-L3:       I-IM2-U5-L3 (1-2
  Days 87-91   trigonometry and   G-SRT.3, G-SRT.6, common             flex days):
  (5)          circles: model,    G-SRT.8.1 \[CA\]  assessment +       transfer
               transfer, and                        modeling task      rehearsal with
               demonstrate                                             faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 6. Coordinate geometry, conics, and measurement - 17 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM2-U6-L1\   Coordinate         G-GMD.1, G-GMD.6  A-IM2-U6-L1:       I-IM2-U6-L1 (1-2
  Days 92-95   geometry, conics,  \[CA\], G-GPE.4   diagnostic probe + flex days):
  (4)          and measurement:                     exit ticket        representation
               develop concepts                                        and prerequisite
               and                                                     reset
               representations.                                        

  IM2-U6-L2\   Coordinate         G-GMD.3 \[\*\],   A-IM2-U6-L2:       I-IM2-U6-L2 (1-2
  Days 96-103  geometry, conics,  G-GPE.1, G-GPE.6  worked-reasoning   flex days):
  (8)          and measurement:                     and representation worked-example
               connect methods,                     check              error analysis
               reasoning, and                                          
               applications.                                           

  IM2-U6-L3\   Coordinate         G-GMD.5 \[CA\],   A-IM2-U6-L3:       I-IM2-U6-L3 (1-2
  Days 104-108 geometry, conics,  G-GPE.2           common             flex days):
  (5)          and measurement:                     assessment +       transfer
               model, transfer,                     modeling task      rehearsal with
               and demonstrate                                         faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 7. Conditional probability and decision making - 17 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM2-U7-L1\   Conditional        S-CP.1 \[\*\],    A-IM2-U7-L1:       I-IM2-U7-L1 (1-2
  Days 109-112 probability and    S-CP.4 \[\*\],    diagnostic probe + flex days):
  (4)          decision making:   S-CP.7 \[\*\],    exit ticket        representation
               develop concepts   S-MD.6 \[\*,+\]                      and prerequisite
               and                                                     reset
               representations.                                        

  IM2-U7-L2\   Conditional        S-CP.2 \[\*\],    A-IM2-U7-L2:       I-IM2-U7-L2 (1-2
  Days 113-120 probability and    S-CP.5 \[\*\],    worked-reasoning   flex days):
  (8)          decision making:   S-CP.8 \[\*,+\],  and representation worked-example
               connect methods,   S-MD.7 \[\*,+\]   check              error analysis
               reasoning, and                                          
               applications.                                           

  IM2-U7-L3\   Conditional        S-CP.3 \[\*\],    A-IM2-U7-L3:       I-IM2-U7-L3 (1-2
  Days 121-125 probability and    S-CP.6 \[\*\],    common             flex days):
  (5)          decision making:   S-CP.9 \[\*,+\]   assessment +       transfer
               model, transfer,                     modeling task      rehearsal with
               and demonstrate                                         faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 8. Integrated modeling and mastery - 10 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM2-U8-L1\   Integrated         F-TF.8, MP.3,     A-IM2-U8-L1:       I-IM2-U8-L1 (1-2
  Days 126-127 modeling and       MP.6              diagnostic probe + flex days):
  (2)          mastery: develop                     exit ticket        representation
               concepts and                                            and prerequisite
               representations.                                        reset

  IM2-U8-L2\   Integrated         MP.1, MP.4, MP.7  A-IM2-U8-L2:       I-IM2-U8-L2 (1-2
  Days 128-132 modeling and                         worked-reasoning   flex days):
  (5)          mastery: connect                     and representation worked-example
               methods,                             check              error analysis
               reasoning, and                                          
               applications.                                           

  IM2-U8-L3\   Integrated         MP.2, MP.5, MP.8  A-IM2-U8-L3:       I-IM2-U8-L3 (1-2
  Days 133-135 modeling and                         common             flex days):
  (3)          mastery: model,                      assessment +       transfer
               transfer, and                        modeling task      rehearsal with
               demonstrate                                             faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

Course control check: 25 identified lesson sequences cover core workdays
1-135; all 81 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Integrated Math 3

135 core lesson days \| 40 intervention-capacity days \| 63 primary
standards assignments \| 6 CA-tagged \| 32 starred/modeling \| 9
advanced (+) \| 0 local extensions

### Unit 0. Course launch and diagnostic - 1 core days

  ----------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary standards**    **Assessment   **Intervention
  core days**  sequence**                                  evidence**     lesson**
  ------------ ------------------ ------------------------ -------------- ----------------
  IM3-U0-L1\   Course launch and  Readiness/prerequisite   A-IM3-U0-L1:   I-IM3-U0-L1 (1-2
  Days 1 (1)   diagnostic:        evidence; no new primary diagnostic     flex days):
               develop concepts   standard.                probe + exit   representation
               and                                         ticket         and prerequisite
               representations.                                           reset

  ----------------------------------------------------------------------------------------

### Unit 1. Polynomial structure, operations, and identities - 17 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM3-U1-L1\   Polynomial         A-SSE.1.a \[\*\], A-IM3-U1-L1:       I-IM3-U1-L1 (1-2
  Days 2-5 (4) structure,         A-SSE.4 \[\*\]    diagnostic probe + flex days):
               operations, and                      exit ticket        representation
               identities:                                             and prerequisite
               develop concepts                                        reset
               and                                                     
               representations.                                        

  IM3-U1-L2\   Polynomial         A-SSE.1.b \[\*\]  A-IM3-U1-L2:       I-IM3-U1-L2 (1-2
  Days 6-13    structure,                           worked-reasoning   flex days):
  (8)          operations, and                      and representation worked-example
               identities:                          check              error analysis
               connect methods,                                        
               reasoning, and                                          
               applications.                                           

  IM3-U1-L3\   Polynomial         A-SSE.2           A-IM3-U1-L3:       I-IM3-U1-L3 (1-2
  Days 14-18   structure,                           common             flex days):
  (5)          operations, and                      assessment +       transfer
               identities: model,                   modeling task      rehearsal with
               transfer, and                                           faded prompts
               demonstrate                                             
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 2. Zeros, factors, and complex solutions - 16 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM3-U2-L1\   Zeros, factors,    A-APR.1, A-APR.4, A-IM3-U2-L1:       I-IM3-U2-L1 (1-2
  Days 19-22   and complex        N-CN.9 \[+\]      diagnostic probe + flex days):
  (4)          solutions: develop                   exit ticket        representation
               concepts and                                            and prerequisite
               representations.                                        reset

  IM3-U2-L2\   Zeros, factors,    A-APR.2, A-APR.5  A-IM3-U2-L2:       I-IM3-U2-L2 (1-2
  Days 23-29   and complex        \[+\]             worked-reasoning   flex days):
  (7)          solutions: connect                   and representation worked-example
               methods,                             check              error analysis
               reasoning, and                                          
               applications.                                           

  IM3-U2-L3\   Zeros, factors,    A-APR.3, N-CN.8   A-IM3-U2-L3:       I-IM3-U2-L3 (1-2
  Days 30-34   and complex        \[+\]             common             flex days):
  (5)          solutions: model,                    assessment +       transfer
               transfer, and                        modeling task      rehearsal with
               demonstrate                                             faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 3. Rational and radical functions and equations - 22 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM3-U3-L1\   Rational and       A-APR.6, A-CED.2  A-IM3-U3-L1:       I-IM3-U3-L1 (1-2
  Days 35-40   radical functions  \[\*\], A-REI.2,  diagnostic probe + flex days):
  (6)          and equations:     F-IF.5 \[\*\],    exit ticket        representation
               develop concepts   F-IF.7.c \[\*\],                     and prerequisite
               and                F-IF.9                               reset
               representations.                                        

  IM3-U3-L2\   Rational and       A-APR.7 \[+\],    A-IM3-U3-L2:       I-IM3-U3-L2 (1-2
  Days 41-49   radical functions  A-CED.3 \[\*\],   worked-reasoning   flex days):
  (9)          and equations:     A-REI.11 \[\*\],  and representation worked-example
               connect methods,   F-IF.6 \[\*\],    check              error analysis
               reasoning, and     F-IF.7.e \[\*\]                      
               applications.                                           

  IM3-U3-L3\   Rational and       A-CED.1           A-IM3-U3-L3:       I-IM3-U3-L3 (1-2
  Days 50-56   radical functions  \[CA,\*\],        common             flex days):
  (7)          and equations:     A-CED.4 \[\*\],   assessment +       transfer
               model, transfer,   F-IF.4 \[\*\],    modeling task      rehearsal with
               and demonstrate    F-IF.7.b \[\*\],                     faded prompts
               mastery.           F-IF.8                               
  -------------------------------------------------------------------------------------

### Unit 4. Exponential, logarithmic, and inverse models - 14 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM3-U4-L1\   Exponential,       F-BF.1.b \[\*\],  A-IM3-U4-L1:       I-IM3-U4-L1 (1-2
  Days 57-59   logarithmic, and   F-LE.4 \[\*\],    diagnostic probe + flex days):
  (3)          inverse models:    F-LE.4.3          exit ticket        representation
               develop concepts   \[CA,\*\]                            and prerequisite
               and                                                     reset
               representations.                                        

  IM3-U4-L2\   Exponential,       F-BF.3, F-LE.4.1  A-IM3-U4-L2:       I-IM3-U4-L2 (1-2
  Days 60-66   logarithmic, and   \[CA,\*\]         worked-reasoning   flex days):
  (7)          inverse models:                      and representation worked-example
               connect methods,                     check              error analysis
               reasoning, and                                          
               applications.                                           

  IM3-U4-L3\   Exponential,       F-BF.4.a,         A-IM3-U4-L3:       I-IM3-U4-L3 (1-2
  Days 67-70   logarithmic, and   F-LE.4.2          common             flex days):
  (4)          inverse models:    \[CA,\*\]         assessment +       transfer
               model, transfer,                     modeling task      rehearsal with
               and demonstrate                                         faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 5. Unit-circle and periodic trigonometry - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM3-U5-L1\   Unit-circle and    F-TF.1, F-TF.5    A-IM3-U5-L1:       I-IM3-U5-L1 (1-2
  Days 71-75   periodic           \[\*\]            diagnostic probe + flex days):
  (5)          trigonometry:                        exit ticket        representation
               develop concepts                                        and prerequisite
               and                                                     reset
               representations.                                        

  IM3-U5-L2\   Unit-circle and    F-TF.2            A-IM3-U5-L2:       I-IM3-U5-L2 (1-2
  Days 76-82   periodic                             worked-reasoning   flex days):
  (7)          trigonometry:                        and representation worked-example
               connect methods,                     check              error analysis
               reasoning, and                                          
               applications.                                           

  IM3-U5-L3\   Unit-circle and    F-TF.2.1 \[CA\]   A-IM3-U5-L3:       I-IM3-U5-L3 (1-2
  Days 83-88   periodic                             common             flex days):
  (6)          trigonometry:                        assessment +       transfer
               model, transfer,                     modeling task      rehearsal with
               and demonstrate                                         faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 6. General triangles, conics, and geometric modeling - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM3-U6-L1\   General triangles, G-GMD.4, G-MG.2   A-IM3-U6-L1:       I-IM3-U6-L1 (1-2
  Days 89-93   conics, and        \[\*\], G-SRT.10  diagnostic probe + flex days):
  (5)          geometric          \[+\]             exit ticket        representation
               modeling: develop                                       and prerequisite
               concepts and                                            reset
               representations.                                        

  IM3-U6-L2\   General triangles, G-GPE.3.1 \[CA\], A-IM3-U6-L2:       I-IM3-U6-L2 (1-2
  Days 94-100  conics, and        G-MG.3 \[\*\],    worked-reasoning   flex days):
  (7)          geometric          G-SRT.11 \[+\]    and representation worked-example
               modeling: connect                    check              error analysis
               methods,                                                
               reasoning, and                                          
               applications.                                           

  IM3-U6-L3\   General triangles, G-MG.1 \[\*\],    A-IM3-U6-L3:       I-IM3-U6-L3 (1-2
  Days 101-106 conics, and        G-SRT.9 \[+\]     common             flex days):
  (6)          geometric                            assessment +       transfer
               modeling: model,                     modeling task      rehearsal with
               transfer, and                                           faded prompts
               demonstrate                                             
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 7. Statistical inference and decisions - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM3-U7-L1\   Statistical        S-IC.1 \[\*\],    A-IM3-U7-L1:       I-IM3-U7-L1 (1-2
  Days 107-111 inference and      S-IC.4 \[\*\],    diagnostic probe + flex days):
  (5)          decisions: develop S-ID.4 \[\*\]     exit ticket        representation
               concepts and                                            and prerequisite
               representations.                                        reset

  IM3-U7-L2\   Statistical        S-IC.2 \[\*\],    A-IM3-U7-L2:       I-IM3-U7-L2 (1-2
  Days 112-119 inference and      S-IC.5 \[\*\],    worked-reasoning   flex days):
  (8)          decisions: connect S-MD.6 \[\*,+\]   and representation worked-example
               methods,                             check              error analysis
               reasoning, and                                          
               applications.                                           

  IM3-U7-L3\   Statistical        S-IC.3 \[\*\],    A-IM3-U7-L3:       I-IM3-U7-L3 (1-2
  Days 120-125 inference and      S-IC.6 \[\*\],    common             flex days):
  (6)          decisions: model,  S-MD.7 \[\*,+\]   assessment +       transfer
               transfer, and                        modeling task      rehearsal with
               demonstrate                                             faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

### Unit 8. Integrated modeling and mastery - 10 core days

  -------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment       **Intervention
  core days**  sequence**         standards**       evidence**         lesson**
  ------------ ------------------ ----------------- ------------------ ----------------
  IM3-U8-L1\   Integrated         MP.1, MP.4, MP.7  A-IM3-U8-L1:       I-IM3-U8-L1 (1-2
  Days 126-127 modeling and                         diagnostic probe + flex days):
  (2)          mastery: develop                     exit ticket        representation
               concepts and                                            and prerequisite
               representations.                                        reset

  IM3-U8-L2\   Integrated         MP.2, MP.5, MP.8  A-IM3-U8-L2:       I-IM3-U8-L2 (1-2
  Days 128-132 modeling and                         worked-reasoning   flex days):
  (5)          mastery: connect                     and representation worked-example
               methods,                             check              error analysis
               reasoning, and                                          
               applications.                                           

  IM3-U8-L3\   Integrated         MP.3, MP.6        A-IM3-U8-L3:       I-IM3-U8-L3 (1-2
  Days 133-135 modeling and                         common             flex days):
  (3)          mastery: model,                      assessment +       transfer
               transfer, and                        modeling task      rehearsal with
               demonstrate                                             faded prompts
               mastery.                                                
  -------------------------------------------------------------------------------------

Course control check: 25 identified lesson sequences cover core workdays
1-135; all 63 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Precalculus

135 core lesson days \| 40 intervention-capacity days \| 26 primary
standards assignments \| 0 CA-tagged \| 10 starred/modeling \| 18
advanced (+) \| 0 local extensions

### Unit 0. Launch and readiness diagnostic - 3 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  PC-U0-L1\   Launch and         Readiness/prerequisite   A-PC-U0-L1:        I-PC-U0-L1 (1-2
  Days 1 (1)  readiness          evidence; no new primary diagnostic probe + flex days):
              diagnostic:        standard.                exit ticket        representation
              develop concepts                                               and prerequisite
              and                                                            reset
              representations.                                               

  PC-U0-L2\   Launch and         Readiness/prerequisite   A-PC-U0-L2:        I-PC-U0-L2 (1-2
  Days 2 (1)  readiness          evidence; no new primary worked-reasoning   flex days):
              diagnostic:        standard.                and representation worked-example
              connect methods,                            check              error analysis
              reasoning, and                                                 
              applications.                                                  

  PC-U0-L3\   Launch and         Readiness/prerequisite   A-PC-U0-L3: common I-PC-U0-L3 (1-2
  Days 3 (1)  readiness          evidence; no new primary assessment +       flex days):
              diagnostic: model, standard.                modeling task      transfer
              transfer, and                                                  rehearsal with
              demonstrate                                                    faded prompts
              mastery.                                                       
  -------------------------------------------------------------------------------------------

### Unit 1. Advanced function families - 18 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  PC-U1-L1\   Advanced function  Readiness/prerequisite   A-PC-U1-L1:        I-PC-U1-L1 (1-2
  Days 4-8    families: develop  evidence; no new primary diagnostic probe + flex days):
  (5)         concepts and       standard.                exit ticket        representation
              representations.                                               and prerequisite
                                                                             reset

  PC-U1-L2\   Advanced function  Readiness/prerequisite   A-PC-U1-L2:        I-PC-U1-L2 (1-2
  Days 9-15   families: connect  evidence; no new primary worked-reasoning   flex days):
  (7)         methods,           standard.                and representation worked-example
              reasoning, and                              check              error analysis
              applications.                                                  

  PC-U1-L3\   Advanced function  Readiness/prerequisite   A-PC-U1-L3: common I-PC-U1-L3 (1-2
  Days 16-21  families: model,   evidence; no new primary assessment +       flex days):
  (6)         transfer, and      standard.                modeling task      transfer
              demonstrate                                                    rehearsal with
              mastery.                                                       faded prompts
  -------------------------------------------------------------------------------------------

### Unit 2. Polynomial and rational behavior - 19 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  PC-U2-L1\   Polynomial and     A-APR.5 \[+\]            A-PC-U2-L1:        I-PC-U2-L1 (1-2
  Days 22-26  rational behavior:                          diagnostic probe + flex days):
  (5)         develop concepts                            exit ticket        representation
              and                                                            and prerequisite
              representations.                                               reset

  PC-U2-L2\   Polynomial and     A-APR.7 \[+\]            A-PC-U2-L2:        I-PC-U2-L2 (1-2
  Days 27-34  rational behavior:                          worked-reasoning   flex days):
  (8)         connect methods,                            and representation worked-example
              reasoning, and                              check              error analysis
              applications.                                                  

  PC-U2-L3\   Polynomial and     Readiness/prerequisite   A-PC-U2-L3: common I-PC-U2-L3 (1-2
  Days 35-40  rational behavior: evidence; no new primary assessment +       flex days):
  (6)         model, transfer,   standard.                modeling task      transfer
              and demonstrate                                                rehearsal with
              mastery.                                                       faded prompts
  -------------------------------------------------------------------------------------------

### Unit 3. Exponential and logarithmic models - 19 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  PC-U3-L1\   Exponential and    Readiness/prerequisite   A-PC-U3-L1:        I-PC-U3-L1 (1-2
  Days 41-45  logarithmic        evidence; no new primary diagnostic probe + flex days):
  (5)         models: develop    standard.                exit ticket        representation
              concepts and                                                   and prerequisite
              representations.                                               reset

  PC-U3-L2\   Exponential and    Readiness/prerequisite   A-PC-U3-L2:        I-PC-U3-L2 (1-2
  Days 46-53  logarithmic        evidence; no new primary worked-reasoning   flex days):
  (8)         models: connect    standard.                and representation worked-example
              methods,                                    check              error analysis
              reasoning, and                                                 
              applications.                                                  

  PC-U3-L3\   Exponential and    Readiness/prerequisite   A-PC-U3-L3: common I-PC-U3-L3 (1-2
  Days 54-59  logarithmic        evidence; no new primary assessment +       flex days):
  (6)         models: model,     standard.                modeling task      transfer
              transfer, and                                                  rehearsal with
              demonstrate                                                    faded prompts
              mastery.                                                       
  -------------------------------------------------------------------------------------------

### Unit 4. Trigonometric functions and identities - 18 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  PC-U4-L1\   Trigonometric      Readiness/prerequisite   A-PC-U4-L1:        I-PC-U4-L1 (1-2
  Days 60-64  functions and      evidence; no new primary diagnostic probe + flex days):
  (5)         identities:        standard.                exit ticket        representation
              develop concepts                                               and prerequisite
              and                                                            reset
              representations.                                               

  PC-U4-L2\   Trigonometric      Readiness/prerequisite   A-PC-U4-L2:        I-PC-U4-L2 (1-2
  Days 65-71  functions and      evidence; no new primary worked-reasoning   flex days):
  (7)         identities:        standard.                and representation worked-example
              connect methods,                            check              error analysis
              reasoning, and                                                 
              applications.                                                  

  PC-U4-L3\   Trigonometric      Readiness/prerequisite   A-PC-U4-L3: common I-PC-U4-L3 (1-2
  Days 72-77  functions and      evidence; no new primary assessment +       flex days):
  (6)         identities: model, standard.                modeling task      transfer
              transfer, and                                                  rehearsal with
              demonstrate                                                    faded prompts
              mastery.                                                       
  -------------------------------------------------------------------------------------------

### Unit 5. Analytic trigonometry and vectors - 20 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  PC-U5-L1\   Analytic           G-C.4 \[+\],      A-PC-U5-L1:        I-PC-U5-L1 (1-2
  Days 78-82  trigonometry and   G-SRT.11 \[+\]    diagnostic probe + flex days):
  (5)         vectors: develop                     exit ticket        representation
              concepts and                                            and prerequisite
              representations.                                        reset

  PC-U5-L2\   Analytic           G-SRT.9 \[+\]     A-PC-U5-L2:        I-PC-U5-L2 (1-2
  Days 83-91  trigonometry and                     worked-reasoning   flex days):
  (9)         vectors: connect                     and representation worked-example
              methods,                             check              error analysis
              reasoning, and                                          
              applications.                                           

  PC-U5-L3\   Analytic           G-SRT.10 \[+\]    A-PC-U5-L3: common I-PC-U5-L3 (1-2
  Days 92-97  trigonometry and                     assessment +       flex days):
  (6)         vectors: model,                      modeling task      transfer
              transfer, and                                           rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 6. Sequences, series, and limits foundations - 18 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  PC-U6-L1\   Sequences, series, Readiness/prerequisite   A-PC-U6-L1:        I-PC-U6-L1 (1-2
  Days 98-102 and limits         evidence; no new primary diagnostic probe + flex days):
  (5)         foundations:       standard.                exit ticket        representation
              develop concepts                                               and prerequisite
              and                                                            reset
              representations.                                               

  PC-U6-L2\   Sequences, series, Readiness/prerequisite   A-PC-U6-L2:        I-PC-U6-L2 (1-2
  Days        and limits         evidence; no new primary worked-reasoning   flex days):
  103-109 (7) foundations:       standard.                and representation worked-example
              connect methods,                            check              error analysis
              reasoning, and                                                 
              applications.                                                  

  PC-U6-L3\   Sequences, series, Readiness/prerequisite   A-PC-U6-L3: common I-PC-U6-L3 (1-2
  Days        and limits         evidence; no new primary assessment +       flex days):
  110-115 (6) foundations:       standard.                modeling task      transfer
              model, transfer,                                               rehearsal with
              and demonstrate                                                faded prompts
              mastery.                                                       
  -------------------------------------------------------------------------------------------

### Unit 7. Modeling and cumulative mastery - 20 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  PC-U7-L1\   Modeling and       MP.1, MP.4, MP.7, A-PC-U7-L1:        I-PC-U7-L1 (1-2
  Days        cumulative         N-CN.9 \[+\],     diagnostic probe + flex days):
  116-120 (5) mastery: develop   S-MD.1 \[\*,+\],  exit ticket        representation
              concepts and       S-MD.4 \[\*,+\],                     and prerequisite
              representations.   S-MD.6 \[\*,+\]                      reset

  PC-U7-L2\   Modeling and       MP.2, MP.5, MP.8, A-PC-U7-L2:        I-PC-U7-L2 (1-2
  Days        cumulative         S-CP.8 \[\*,+\],  worked-reasoning   flex days):
  121-129 (9) mastery: connect   S-MD.2 \[\*,+\],  and representation worked-example
              methods,           S-MD.5.a          check              error analysis
              reasoning, and     \[\*,+\], S-MD.7                     
              applications.      \[\*,+\]                             

  PC-U7-L3\   Modeling and       MP.3, MP.6,       A-PC-U7-L3: common I-PC-U7-L3 (1-2
  Days        cumulative         N-CN.8 \[+\],     assessment +       flex days):
  130-135 (6) mastery: model,    S-CP.9 \[\*,+\],  modeling task      transfer
              transfer, and      S-MD.3 \[\*,+\],                     rehearsal with
              demonstrate        S-MD.5.b \[\*,+\]                    faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 26 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Statistics

135 core lesson days \| 40 intervention-capacity days \| 61 primary
standards assignments \| 0 CA-tagged \| 34 starred/modeling \| 10
advanced (+) \| 0 local extensions

### Unit 0. Launch and data-literacy diagnostic - 3 core days

  ---------------------------------------------------------------------------------------------
  **Lesson /    **Lesson           **Primary standards**    **Assessment       **Intervention
  core days**   sequence**                                  evidence**         lesson**
  ------------- ------------------ ------------------------ ------------------ ----------------
  STAT-U0-L1\   Launch and         Readiness/prerequisite   A-STAT-U0-L1:      I-STAT-U0-L1
  Days 1 (1)    data-literacy      evidence; no new primary diagnostic probe + (1-2 flex days):
                diagnostic:        standard.                exit ticket        representation
                develop concepts                                               and prerequisite
                and                                                            reset
                representations.                                               

  STAT-U0-L2\   Launch and         Readiness/prerequisite   A-STAT-U0-L2:      I-STAT-U0-L2
  Days 2 (1)    data-literacy      evidence; no new primary worked-reasoning   (1-2 flex days):
                diagnostic:        standard.                and representation worked-example
                connect methods,                            check              error analysis
                reasoning, and                                                 
                applications.                                                  

  STAT-U0-L3\   Launch and         Readiness/prerequisite   A-STAT-U0-L3:      I-STAT-U0-L3
  Days 3 (1)    data-literacy      evidence; no new primary common             (1-2 flex days):
                diagnostic: model, standard.                assessment +       transfer
                transfer, and                               modeling task      rehearsal with
                demonstrate                                                    faded prompts
                mastery.                                                       
  ---------------------------------------------------------------------------------------------

### Unit 1. Study design and data collection - 19 core days

  ---------------------------------------------------------------------------------------------
  **Lesson /    **Lesson           **Primary standards**    **Assessment       **Intervention
  core days**   sequence**                                  evidence**         lesson**
  ------------- ------------------ ------------------------ ------------------ ----------------
  STAT-U1-L1\   Study design and   S-IC.1 \[\*\]            A-STAT-U1-L1:      I-STAT-U1-L1
  Days 4-8 (5)  data collection:                            diagnostic probe + (1-2 flex days):
                develop concepts                            exit ticket        representation
                and                                                            and prerequisite
                representations.                                               reset

  STAT-U1-L2\   Study design and   S-IC.2 \[\*\]            A-STAT-U1-L2:      I-STAT-U1-L2
  Days 9-16 (8) data collection:                            worked-reasoning   (1-2 flex days):
                connect methods,                            and representation worked-example
                reasoning, and                              check              error analysis
                applications.                                                  

  STAT-U1-L3\   Study design and   Readiness/prerequisite   A-STAT-U1-L3:      I-STAT-U1-L3
  Days 17-22    data collection:   evidence; no new primary common             (1-2 flex days):
  (6)           model, transfer,   standard.                assessment +       transfer
                and demonstrate                             modeling task      rehearsal with
                mastery.                                                       faded prompts
  ---------------------------------------------------------------------------------------------

### Unit 2. One-variable distributions - 18 core days

  ------------------------------------------------------------------------------------------
  **Lesson /    **Lesson           **Primary standards** **Assessment       **Intervention
  core days**   sequence**                               evidence**         lesson**
  ------------- ------------------ --------------------- ------------------ ----------------
  STAT-U2-L1\   One-variable       AP-Prob&Stats.10.0,   A-STAT-U2-L1:      I-STAT-U2-L1
  Days 23-27    distributions:     S-ID.1 \[\*\], S-ID.4 diagnostic probe + (1-2 flex days):
  (5)           develop concepts   \[\*\]                exit ticket        representation
                and                                                         and prerequisite
                representations.                                            reset

  STAT-U2-L2\   One-variable       AP-Prob&Stats.11.0,   A-STAT-U2-L2:      I-STAT-U2-L2
  Days 28-34    distributions:     S-ID.2 \[\*\], S-ID.5 worked-reasoning   (1-2 flex days):
  (7)           connect methods,   \[\*\]                and representation worked-example
                reasoning, and                           check              error analysis
                applications.                                               

  STAT-U2-L3\   One-variable       AP-Prob&Stats.14.0,   A-STAT-U2-L3:      I-STAT-U2-L3
  Days 35-40    distributions:     S-ID.3 \[\*\]         common             (1-2 flex days):
  (6)           model, transfer,                         assessment +       transfer
                and demonstrate                          modeling task      rehearsal with
                mastery.                                                    faded prompts
  ------------------------------------------------------------------------------------------

### Unit 3. Relationships in two-variable data - 19 core days

  ------------------------------------------------------------------------------------------
  **Lesson /    **Lesson           **Primary standards** **Assessment       **Intervention
  core days**   sequence**                               evidence**         lesson**
  ------------- ------------------ --------------------- ------------------ ----------------
  STAT-U3-L1\   Relationships in   AP-Prob&Stats.12.0,   A-STAT-U3-L1:      I-STAT-U3-L1
  Days 41-45    two-variable data: S-ID.6.b \[\*\],      diagnostic probe + (1-2 flex days):
  (5)           develop concepts   S-ID.8 \[\*\]         exit ticket        representation
                and                                                         and prerequisite
                representations.                                            reset

  STAT-U3-L2\   Relationships in   AP-Prob&Stats.13.0,   A-STAT-U3-L2:      I-STAT-U3-L2
  Days 46-53    two-variable data: S-ID.6.c \[\*\],      worked-reasoning   (1-2 flex days):
  (8)           connect methods,   S-ID.9 \[\*\]         and representation worked-example
                reasoning, and                           check              error analysis
                applications.                                               

  STAT-U3-L3\   Relationships in   S-ID.6.a \[\*\],      A-STAT-U3-L3:      I-STAT-U3-L3
  Days 54-59    two-variable data: S-ID.7 \[\*\]         common             (1-2 flex days):
  (6)           model, transfer,                         assessment +       transfer
                and demonstrate                          modeling task      rehearsal with
                mastery.                                                    faded prompts
  ------------------------------------------------------------------------------------------

### Unit 4. Probability and simulation - 18 core days

  -----------------------------------------------------------------------------------------
  **Lesson /    **Lesson           **Primary            **Assessment       **Intervention
  core days**   sequence**         standards**          evidence**         lesson**
  ------------- ------------------ -------------------- ------------------ ----------------
  STAT-U4-L1\   Probability and    AP-Prob&Stats.1.0,   A-STAT-U4-L1:      I-STAT-U4-L1
  Days 60-64    simulation:        AP-Prob&Stats.4.0,   diagnostic probe + (1-2 flex days):
  (5)           develop concepts   AP-Prob&Stats.7.0,   exit ticket        representation
                and                S-CP.1 \[\*\],                          and prerequisite
                representations.   S-CP.4 \[\*\],                          reset
                                   S-CP.7 \[\*\],                          
                                   S-MD.1 \[\*,+\],                        
                                   S-MD.4 \[\*,+\]                         

  STAT-U4-L2\   Probability and    AP-Prob&Stats.2.0,   A-STAT-U4-L2:      I-STAT-U4-L2
  Days 65-71    simulation:        AP-Prob&Stats.5.0,   worked-reasoning   (1-2 flex days):
  (7)           connect methods,   AP-Prob&Stats.8.0,   and representation worked-example
                reasoning, and     S-CP.2 \[\*\],       check              error analysis
                applications.      S-CP.5 \[\*\],                          
                                   S-CP.8 \[\*,+\],                        
                                   S-MD.2 \[\*,+\],                        
                                   S-MD.5.a \[\*,+\]                       

  STAT-U4-L3\   Probability and    AP-Prob&Stats.3.0,   A-STAT-U4-L3:      I-STAT-U4-L3
  Days 72-77    simulation: model, AP-Prob&Stats.6.0,   common             (1-2 flex days):
  (6)           transfer, and      AP-Prob&Stats.9.0,   assessment +       transfer
                demonstrate        S-CP.3 \[\*\],       modeling task      rehearsal with
                mastery.           S-CP.6 \[\*\],                          faded prompts
                                   S-CP.9 \[\*,+\],                        
                                   S-MD.3 \[\*,+\],                        
                                   S-MD.5.b \[\*,+\]                       
  -----------------------------------------------------------------------------------------

### Unit 5. Sampling distributions and estimation - 20 core days

  ---------------------------------------------------------------------------------------------
  **Lesson /    **Lesson           **Primary standards**    **Assessment       **Intervention
  core days**   sequence**                                  evidence**         lesson**
  ------------- ------------------ ------------------------ ------------------ ----------------
  STAT-U5-L1\   Sampling           AP-Prob&Stats.15.0       A-STAT-U5-L1:      I-STAT-U5-L1
  Days 78-82    distributions and                           diagnostic probe + (1-2 flex days):
  (5)           estimation:                                 exit ticket        representation
                develop concepts                                               and prerequisite
                and                                                            reset
                representations.                                               

  STAT-U5-L2\   Sampling           AP-Prob&Stats.16.0       A-STAT-U5-L2:      I-STAT-U5-L2
  Days 83-91    distributions and                           worked-reasoning   (1-2 flex days):
  (9)           estimation:                                 and representation worked-example
                connect methods,                            check              error analysis
                reasoning, and                                                 
                applications.                                                  

  STAT-U5-L3\   Sampling           Readiness/prerequisite   A-STAT-U5-L3:      I-STAT-U5-L3
  Days 92-97    distributions and  evidence; no new primary common             (1-2 flex days):
  (6)           estimation: model, standard.                assessment +       transfer
                transfer, and                               modeling task      rehearsal with
                demonstrate                                                    faded prompts
                mastery.                                                       
  ---------------------------------------------------------------------------------------------

### Unit 6. Inference and decision making - 18 core days

  ------------------------------------------------------------------------------------------
  **Lesson /    **Lesson           **Primary standards** **Assessment       **Intervention
  core days**   sequence**                               evidence**         lesson**
  ------------- ------------------ --------------------- ------------------ ----------------
  STAT-U6-L1\   Inference and      AP-Prob&Stats.17.0,   A-STAT-U6-L1:      I-STAT-U6-L1
  Days 98-102   decision making:   S-IC.3 \[\*\], S-IC.6 diagnostic probe + (1-2 flex days):
  (5)           develop concepts   \[\*\]                exit ticket        representation
                and                                                         and prerequisite
                representations.                                            reset

  STAT-U6-L2\   Inference and      AP-Prob&Stats.18.0,   A-STAT-U6-L2:      I-STAT-U6-L2
  Days 103-109  decision making:   S-IC.4 \[\*\], S-MD.6 worked-reasoning   (1-2 flex days):
  (7)           connect methods,   \[\*,+\]              and representation worked-example
                reasoning, and                           check              error analysis
                applications.                                               

  STAT-U6-L3\   Inference and      AP-Prob&Stats.19.0,   A-STAT-U6-L3:      I-STAT-U6-L3
  Days 110-115  decision making:   S-IC.5 \[\*\], S-MD.7 common             (1-2 flex days):
  (6)           model, transfer,   \[\*,+\]              assessment +       transfer
                and demonstrate                          modeling task      rehearsal with
                mastery.                                                    faded prompts
  ------------------------------------------------------------------------------------------

### Unit 7. Investigation, communication, and mastery - 20 core days

  --------------------------------------------------------------------------------------
  **Lesson /    **Lesson           **Primary         **Assessment       **Intervention
  core days**   sequence**         standards**       evidence**         lesson**
  ------------- ------------------ ----------------- ------------------ ----------------
  STAT-U7-L1\   Investigation,     MP.1, MP.4, MP.7  A-STAT-U7-L1:      I-STAT-U7-L1
  Days 116-120  communication, and                   diagnostic probe + (1-2 flex days):
  (5)           mastery: develop                     exit ticket        representation
                concepts and                                            and prerequisite
                representations.                                        reset

  STAT-U7-L2\   Investigation,     MP.2, MP.5, MP.8  A-STAT-U7-L2:      I-STAT-U7-L2
  Days 121-129  communication, and                   worked-reasoning   (1-2 flex days):
  (9)           mastery: connect                     and representation worked-example
                methods,                             check              error analysis
                reasoning, and                                          
                applications.                                           

  STAT-U7-L3\   Investigation,     MP.3, MP.6        A-STAT-U7-L3:      I-STAT-U7-L3
  Days 130-135  communication, and                   common             (1-2 flex days):
  (6)           mastery: model,                      assessment +       transfer
                transfer, and                        modeling task      rehearsal with
                demonstrate                                             faded prompts
                mastery.                                                
  --------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 61 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Quantitative Reasoning

135 core lesson days \| 40 intervention-capacity days \| 98 primary
standards assignments \| 5 CA-tagged \| 76 starred/modeling \| 10
advanced (+) \| 14 local extensions

### Unit 0. Launch and readiness diagnostic - 3 core days

  -------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment       **Intervention
  core days** sequence**                                  evidence**         lesson**
  ----------- ------------------ ------------------------ ------------------ ----------------
  QR-U0-L1\   Launch and         Readiness/prerequisite   A-QR-U0-L1:        I-QR-U0-L1 (1-2
  Days 1 (1)  readiness          evidence; no new primary diagnostic probe + flex days):
              diagnostic:        standard.                exit ticket        representation
              develop concepts                                               and prerequisite
              and                                                            reset
              representations.                                               

  QR-U0-L2\   Launch and         Readiness/prerequisite   A-QR-U0-L2:        I-QR-U0-L2 (1-2
  Days 2 (1)  readiness          evidence; no new primary worked-reasoning   flex days):
              diagnostic:        standard.                and representation worked-example
              connect methods,                            check              error analysis
              reasoning, and                                                 
              applications.                                                  

  QR-U0-L3\   Launch and         Readiness/prerequisite   A-QR-U0-L3: common I-QR-U0-L3 (1-2
  Days 3 (1)  readiness          evidence; no new primary assessment +       flex days):
              diagnostic: model, standard.                modeling task      transfer
              transfer, and                                                  rehearsal with
              demonstrate                                                    faded prompts
              mastery.                                                       
  -------------------------------------------------------------------------------------------

### Unit 1. Quantities, units, and estimation - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  QR-U1-L1\   Quantities, units, N-Q.1 \[\*\]      A-QR-U1-L1:        I-QR-U1-L1 (1-2
  Days 4-8    and estimation:                      diagnostic probe + flex days):
  (5)         develop concepts                     exit ticket        representation
              and                                                     and prerequisite
              representations.                                        reset

  QR-U1-L2\   Quantities, units, N-Q.2 \[\*\]      A-QR-U1-L2:        I-QR-U1-L2 (1-2
  Days 9-15   and estimation:                      worked-reasoning   flex days):
  (7)         connect methods,                     and representation worked-example
              reasoning, and                       check              error analysis
              applications.                                           

  QR-U1-L3\   Quantities, units, N-Q.3 \[\*\]      A-QR-U1-L3: common I-QR-U1-L3 (1-2
  Days 16-21  and estimation:                      assessment +       flex days):
  (6)         model, transfer,                     modeling task      transfer
              and demonstrate                                         rehearsal with
              mastery.                                                faded prompts
  ------------------------------------------------------------------------------------

### Unit 2. Personal and public finance - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  QR-U2-L1\   Personal and       QR-LOCAL.1        A-QR-U2-L1:        I-QR-U2-L1 (1-2
  Days 22-26  public finance:    \[LOCAL\],        diagnostic probe + flex days):
  (5)         develop concepts   QR-LOCAL.4        exit ticket        representation
              and                \[LOCAL\]                            and prerequisite
              representations.                                        reset

  QR-U2-L2\   Personal and       QR-LOCAL.2        A-QR-U2-L2:        I-QR-U2-L2 (1-2
  Days 27-33  public finance:    \[LOCAL\]         worked-reasoning   flex days):
  (7)         connect methods,                     and representation worked-example
              reasoning, and                       check              error analysis
              applications.                                           

  QR-U2-L3\   Personal and       QR-LOCAL.3        A-QR-U2-L3: common I-QR-U2-L3 (1-2
  Days 34-39  public finance:    \[LOCAL\]         assessment +       flex days):
  (6)         model, transfer,                     modeling task      transfer
              and demonstrate                                         rehearsal with
              mastery.                                                faded prompts
  ------------------------------------------------------------------------------------

### Unit 3. Rates, growth, and exponential change - 19 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  QR-U3-L1\   Rates, growth, and F-LE.1.a \[\*\],  A-QR-U3-L1:        I-QR-U3-L1 (1-2
  Days 40-44  exponential        F-LE.2 \[\*\],    diagnostic probe + flex days):
  (5)         change: develop    F-LE.4.1          exit ticket        representation
              concepts and       \[CA,\*\], F-LE.5                    and prerequisite
              representations.   \[\*\]                               reset

  QR-U3-L2\   Rates, growth, and F-LE.1.b \[\*\],  A-QR-U3-L2:        I-QR-U3-L2 (1-2
  Days 45-52  exponential        F-LE.3 \[\*\],    worked-reasoning   flex days):
  (8)         change: connect    F-LE.4.2          and representation worked-example
              methods,           \[CA,\*\], F-LE.6 check              error analysis
              reasoning, and     \[CA,\*\]                            
              applications.                                           

  QR-U3-L3\   Rates, growth, and F-LE.1.c \[\*\],  A-QR-U3-L3: common I-QR-U3-L3 (1-2
  Days 53-58  exponential        F-LE.4 \[\*\],    assessment +       flex days):
  (6)         change: model,     F-LE.4.3          modeling task      transfer
              transfer, and      \[CA,\*\]                            rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 4. Data, risk, and statistical claims - 19 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  QR-U4-L1\   Data, risk, and    S-CP.1 \[\*\],    A-QR-U4-L1:        I-QR-U4-L1 (1-2
  Days 59-63  statistical        S-CP.4 \[\*\],    diagnostic probe + flex days):
  (5)         claims: develop    S-CP.7 \[\*\],    exit ticket        representation
              concepts and       S-IC.1 \[\*\],                       and prerequisite
              representations.   S-IC.4 \[\*\],                       reset
                                 S-ID.1 \[\*\],                       
                                 S-ID.4 \[\*\],                       
                                 S-ID.6.b \[\*\],                     
                                 S-ID.8 \[\*\],                       
                                 S-MD.2 \[\*,+\],                     
                                 S-MD.5.a                             
                                 \[\*,+\], S-MD.7                     
                                 \[\*,+\]                             

  QR-U4-L2\   Data, risk, and    S-CP.2 \[\*\],    A-QR-U4-L2:        I-QR-U4-L2 (1-2
  Days 64-71  statistical        S-CP.5 \[\*\],    worked-reasoning   flex days):
  (8)         claims: connect    S-CP.8 \[\*,+\],  and representation worked-example
              methods,           S-IC.2 \[\*\],    check              error analysis
              reasoning, and     S-IC.5 \[\*\],                       
              applications.      S-ID.2 \[\*\],                       
                                 S-ID.5 \[\*\],                       
                                 S-ID.6.c \[\*\],                     
                                 S-ID.9 \[\*\],                       
                                 S-MD.3 \[\*,+\],                     
                                 S-MD.5.b \[\*,+\]                    

  QR-U4-L3\   Data, risk, and    S-CP.3 \[\*\],    A-QR-U4-L3: common I-QR-U4-L3 (1-2
  Days 72-77  statistical        S-CP.6 \[\*\],    assessment +       flex days):
  (6)         claims: model,     S-CP.9 \[\*,+\],  modeling task      transfer
              transfer, and      S-IC.3 \[\*\],                       rehearsal with
              demonstrate        S-IC.6 \[\*\],                       faded prompts
              mastery.           S-ID.3 \[\*\],                       
                                 S-ID.6.a \[\*\],                     
                                 S-ID.7 \[\*\],                       
                                 S-MD.1 \[\*,+\],                     
                                 S-MD.4 \[\*,+\],                     
                                 S-MD.6 \[\*,+\]                      
  ------------------------------------------------------------------------------------

### Unit 5. Networks, optimization, and decisions - 20 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  QR-U5-L1\   Networks,          G-GMD.3 \[\*\],   A-QR-U5-L1:        I-QR-U5-L1 (1-2
  Days 78-82  optimization, and  G-MG.2 \[\*\],    diagnostic probe + flex days):
  (5)         decisions: develop QR-LOCAL.5        exit ticket        representation
              concepts and       \[LOCAL\],                           and prerequisite
              representations.   QR-LOCAL.8                           reset
                                 \[LOCAL\]                            

  QR-U5-L2\   Networks,          G-GPE.7 \[\*\],   A-QR-U5-L2:        I-QR-U5-L2 (1-2
  Days 83-91  optimization, and  G-MG.3 \[\*\],    worked-reasoning   flex days):
  (9)         decisions: connect QR-LOCAL.6        and representation worked-example
              methods,           \[LOCAL\]         check              error analysis
              reasoning, and                                          
              applications.                                           

  QR-U5-L3\   Networks,          G-MG.1 \[\*\],    A-QR-U5-L3: common I-QR-U5-L3 (1-2
  Days 92-97  optimization, and  G-SRT.8 \[\*\],   assessment +       flex days):
  (6)         decisions: model,  QR-LOCAL.7        modeling task      transfer
              transfer, and      \[LOCAL\]                            rehearsal with
              demonstrate                                             faded prompts
              mastery.                                                
  ------------------------------------------------------------------------------------

### Unit 6. Civic, scientific, and workplace models - 18 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  QR-U6-L1\   Civic, scientific, A-CED.1           A-QR-U6-L1:        I-QR-U6-L1 (1-2
  Days 98-102 and workplace      \[CA,\*\],        diagnostic probe + flex days):
  (5)         models: develop    A-CED.4 \[\*\],   exit ticket        representation
              concepts and       A-SSE.1.b \[\*\],                    and prerequisite
              representations.   A-SSE.3.c \[\*\],                    reset
                                 F-BF.1.b \[\*\],                     
                                 F-IF.5 \[\*\],                       
                                 F-IF.7.b \[\*\],                     
                                 F-TF.5 \[\*\],                       
                                 QR-LOCAL.11                          
                                 \[LOCAL\],                           
                                 QR-LOCAL.14                          
                                 \[LOCAL\]                            

  QR-U6-L2\   Civic, scientific, A-CED.2 \[\*\],   A-QR-U6-L2:        I-QR-U6-L2 (1-2
  Days        and workplace      A-REI.11 \[\*\],  worked-reasoning   flex days):
  103-109 (7) models: connect    A-SSE.3.a \[\*\], and representation worked-example
              methods,           A-SSE.4 \[\*\],   check              error analysis
              reasoning, and     F-BF.2 \[\*\],                       
              applications.      F-IF.6 \[\*\],                       
                                 F-IF.7.c \[\*\],                     
                                 QR-LOCAL.9                           
                                 \[LOCAL\],                           
                                 QR-LOCAL.12                          
                                 \[LOCAL\]                            

  QR-U6-L3\   Civic, scientific, A-CED.3 \[\*\],   A-QR-U6-L3: common I-QR-U6-L3 (1-2
  Days        and workplace      A-SSE.1.a \[\*\], assessment +       flex days):
  110-115 (6) models: model,     A-SSE.3.b \[\*\], modeling task      transfer
              transfer, and      F-BF.1.a \[\*\],                     rehearsal with
              demonstrate        F-IF.4 \[\*\],                       faded prompts
              mastery.           F-IF.7.a \[\*\],                     
                                 F-IF.7.e \[\*\],                     
                                 QR-LOCAL.10                          
                                 \[LOCAL\],                           
                                 QR-LOCAL.13                          
                                 \[LOCAL\]                            
  ------------------------------------------------------------------------------------

### Unit 7. Capstone modeling and mastery - 20 core days

  ------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment       **Intervention
  core days** sequence**         standards**       evidence**         lesson**
  ----------- ------------------ ----------------- ------------------ ----------------
  QR-U7-L1\   Capstone modeling  MP.1, MP.4, MP.7  A-QR-U7-L1:        I-QR-U7-L1 (1-2
  Days        and mastery:                         diagnostic probe + flex days):
  116-120 (5) develop concepts                     exit ticket        representation
              and                                                     and prerequisite
              representations.                                        reset

  QR-U7-L2\   Capstone modeling  MP.2, MP.5, MP.8  A-QR-U7-L2:        I-QR-U7-L2 (1-2
  Days        and mastery:                         worked-reasoning   flex days):
  121-129 (9) connect methods,                     and representation worked-example
              reasoning, and                       check              error analysis
              applications.                                           

  QR-U7-L3\   Capstone modeling  MP.3, MP.6        A-QR-U7-L3: common I-QR-U7-L3 (1-2
  Days        and mastery:                         assessment +       flex days):
  130-135 (6) model, transfer,                     modeling task      transfer
              and demonstrate                                         rehearsal with
              mastery.                                                faded prompts
  ------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 98 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## English 6

135 core lesson days \| 40 intervention-capacity days \| 41 primary
standards assignments \| 6 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, reading identity, and diagnostic - 3 core days

  --------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment    **Intervention
  core days** sequence**                                  evidence**      lesson**
  ----------- ------------------ ------------------------ --------------- --------------------
  E6-U0-L1\   Launch, reading    Readiness/prerequisite   A-E6-U0-L1:     I-E6-U0-L1 (1-2 flex
  Days 1 (1)  identity, and      evidence; no new primary annotation +    days): guided
              diagnostic: read,  standard.                evidence        evidence selection
              annotate, discuss,                          response        and vocabulary
              and build                                                   
              interpretations.                                            

  E6-U0-L2\   Launch, reading    Readiness/prerequisite   A-E6-U0-L2:     I-E6-U0-L2 (1-2 flex
  Days 2 (1)  identity, and      evidence; no new primary rubric-scored   days):
              diagnostic: draft, standard.                draft           sentence/paragraph
              analyze craft, and                          checkpoint      scaffold and model
              strengthen                                                  comparison
              evidence.                                                   

  E6-U0-L3\   Launch, reading    Readiness/prerequisite   A-E6-U0-L3:     I-E6-U0-L3 (1-2 flex
  Days 3 (1)  identity, and      evidence; no new primary publication,    days): revision
              diagnostic:        standard.                seminar, or     conference and oral
              revise, publish,                            portfolio       rehearsal
              present, and                                evidence        
              demonstrate                                                 
              transfer.                                                   
  --------------------------------------------------------------------------------------------

### Unit 1. Identity, perspective, and evidence - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E6-U1-L1\   Identity,          RL.6.1            A-E6-U1-L1:     I-E6-U1-L1 (1-2 flex
  Days 4-8    perspective, and                     annotation +    days): guided
  (5)         evidence: read,                      evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E6-U1-L2\   Identity,          RL.6.2            A-E6-U1-L2:     I-E6-U1-L2 (1-2 flex
  Days 9-16   perspective, and                     rubric-scored   days):
  (8)         evidence: draft,                     draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E6-U1-L3\   Identity,          RL.6.3            A-E6-U1-L3:     I-E6-U1-L3 (1-2 flex
  Days 17-22  perspective, and                     publication,    days): revision
  (6)         evidence: revise,                    seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 2. Myth, narrative pattern, and theme - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E6-U2-L1\   Myth, narrative    RL.6.4 \[CA\],    A-E6-U2-L1:     I-E6-U2-L1 (1-2 flex
  Days 23-27  pattern, and       RL.6.7            annotation +    days): guided
  (5)         theme: read,                         evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E6-U2-L2\   Myth, narrative    RL.6.5, RL.6.9    A-E6-U2-L2:     I-E6-U2-L2 (1-2 flex
  Days 28-34  pattern, and                         rubric-scored   days):
  (7)         theme: draft,                        draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E6-U2-L3\   Myth, narrative    RL.6.6, RL.6.10   A-E6-U2-L3:     I-E6-U2-L3 (1-2 flex
  Days 35-40  pattern, and                         publication,    days): revision
  (6)         theme: revise,                       seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 3. Informational systems and central ideas - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E6-U3-L1\   Informational      RI.6.1, RI.6.4    A-E6-U3-L1:     I-E6-U3-L1 (1-2 flex
  Days 41-45  systems and        \[CA\], RI.6.7,   annotation +    days): guided
  (5)         central ideas:     RI.6.10           evidence        evidence selection
              read, annotate,                      response        and vocabulary
              discuss, and build                                   
              interpretations.                                     

  E6-U3-L2\   Informational      RI.6.2, RI.6.5    A-E6-U3-L2:     I-E6-U3-L2 (1-2 flex
  Days 46-53  systems and        \[CA\], RI.6.8    rubric-scored   days):
  (8)         central ideas:                       draft           sentence/paragraph
              draft, analyze                       checkpoint      scaffold and model
              craft, and                                           comparison
              strengthen                                           
              evidence.                                            

  E6-U3-L3\   Informational      RI.6.3, RI.6.6,   A-E6-U3-L3:     I-E6-U3-L3 (1-2 flex
  Days 54-59  systems and        RI.6.9            publication,    days): revision
  (6)         central ideas:                       seminar, or     conference and oral
              revise, publish,                     portfolio       rehearsal
              present, and                         evidence        
              demonstrate                                          
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 4. Argument, reasons, and relevant evidence - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E6-U4-L1\   Argument, reasons, SL.6.1, W.6.1     A-E6-U4-L1:     I-E6-U4-L1 (1-2 flex
  Days 60-64  and relevant                         annotation +    days): guided
  (5)         evidence: read,                      evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E6-U4-L2\   Argument, reasons, SL.6.2            A-E6-U4-L2:     I-E6-U4-L2 (1-2 flex
  Days 65-72  and relevant                         rubric-scored   days):
  (8)         evidence: draft,                     draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E6-U4-L3\   Argument, reasons, SL.6.3            A-E6-U4-L3:     I-E6-U4-L3 (1-2 flex
  Days 73-78  and relevant                         publication,    days): revision
  (6)         evidence: revise,                    seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 5. Research inquiry and source credibility - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E6-U5-L1\   Research inquiry   W.6.2 \[CA\],     A-E6-U5-L1:     I-E6-U5-L1 (1-2 flex
  Days 79-83  and source         W.6.9             annotation +    days): guided
  (5)         credibility: read,                   evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E6-U5-L2\   Research inquiry   W.6.7             A-E6-U5-L2:     I-E6-U5-L2 (1-2 flex
  Days 84-91  and source                           rubric-scored   days):
  (8)         credibility:                         draft           sentence/paragraph
              draft, analyze                       checkpoint      scaffold and model
              craft, and                                           comparison
              strengthen                                           
              evidence.                                            

  E6-U5-L3\   Research inquiry   W.6.8             A-E6-U5-L3:     I-E6-U5-L3 (1-2 flex
  Days 92-97  and source                           publication,    days): revision
  (6)         credibility:                         seminar, or     conference and oral
              revise, publish,                     portfolio       rehearsal
              present, and                         evidence        
              demonstrate                                          
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 6. Narrative craft and language choices - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E6-U6-L1\   Narrative craft    L.6.1 \[CA\],     A-E6-U6-L1:     I-E6-U6-L1 (1-2 flex
  Days 98-102 and language       L.6.4, W.6.3      annotation +    days): guided
  (5)         choices: read,                       evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E6-U6-L2\   Narrative craft    L.6.2, L.6.5      A-E6-U6-L2:     I-E6-U6-L2 (1-2 flex
  Days        and language                         rubric-scored   days):
  103-109 (7) choices: draft,                      draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E6-U6-L3\   Narrative craft    L.6.3, L.6.6      A-E6-U6-L3:     I-E6-U6-L3 (1-2 flex
  Days        and language                         publication,    days): revision
  110-115 (6) choices: revise,                     seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 7. Portfolio, presentation, and mastery - 20 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E6-U7-L1\   Portfolio,         SL.6.4 \[CA\],    A-E6-U7-L1:     I-E6-U7-L1 (1-2 flex
  Days        presentation, and  W.6.4, W.6.10     annotation +    days): guided
  116-120 (5) mastery: read,                       evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E6-U7-L2\   Portfolio,         SL.6.5, W.6.5     A-E6-U7-L2:     I-E6-U7-L2 (1-2 flex
  Days        presentation, and                    rubric-scored   days):
  121-129 (9) mastery: draft,                      draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E6-U7-L3\   Portfolio,         SL.6.6, W.6.6     A-E6-U7-L3:     I-E6-U7-L3 (1-2 flex
  Days        presentation, and                    publication,    days): revision
  130-135 (6) mastery: revise,                     seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 41 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## English 7

135 core lesson days \| 40 intervention-capacity days \| 41 primary
standards assignments \| 8 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, discussion norms, and diagnostic - 3 core days

  --------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment    **Intervention
  core days** sequence**                                  evidence**      lesson**
  ----------- ------------------ ------------------------ --------------- --------------------
  E7-U0-L1\   Launch, discussion Readiness/prerequisite   A-E7-U0-L1:     I-E7-U0-L1 (1-2 flex
  Days 1 (1)  norms, and         evidence; no new primary annotation +    days): guided
              diagnostic: read,  standard.                evidence        evidence selection
              annotate, discuss,                          response        and vocabulary
              and build                                                   
              interpretations.                                            

  E7-U0-L2\   Launch, discussion Readiness/prerequisite   A-E7-U0-L2:     I-E7-U0-L2 (1-2 flex
  Days 2 (1)  norms, and         evidence; no new primary rubric-scored   days):
              diagnostic: draft, standard.                draft           sentence/paragraph
              analyze craft, and                          checkpoint      scaffold and model
              strengthen                                                  comparison
              evidence.                                                   

  E7-U0-L3\   Launch, discussion Readiness/prerequisite   A-E7-U0-L3:     I-E7-U0-L3 (1-2 flex
  Days 3 (1)  norms, and         evidence; no new primary publication,    days): revision
              diagnostic:        standard.                seminar, or     conference and oral
              revise, publish,                            portfolio       rehearsal
              present, and                                evidence        
              demonstrate                                                 
              transfer.                                                   
  --------------------------------------------------------------------------------------------

### Unit 1. Character, conflict, and development - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E7-U1-L1\   Character,         RL.7.1            A-E7-U1-L1:     I-E7-U1-L1 (1-2 flex
  Days 4-8    conflict, and                        annotation +    days): guided
  (5)         development: read,                   evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E7-U1-L2\   Character,         RL.7.2            A-E7-U1-L2:     I-E7-U1-L2 (1-2 flex
  Days 9-15   conflict, and                        rubric-scored   days):
  (7)         development:                         draft           sentence/paragraph
              draft, analyze                       checkpoint      scaffold and model
              craft, and                                           comparison
              strengthen                                           
              evidence.                                            

  E7-U1-L3\   Character,         RL.7.3            A-E7-U1-L3:     I-E7-U1-L3 (1-2 flex
  Days 16-21  conflict, and                        publication,    days): revision
  (6)         development:                         seminar, or     conference and oral
              revise, publish,                     portfolio       rehearsal
              present, and                         evidence        
              demonstrate                                          
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 2. Ideas, interactions, and informational structure - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E7-U2-L1\   Ideas,             RL.7.4 \[CA\],    A-E7-U2-L1:     I-E7-U2-L1 (1-2 flex
  Days 22-26  interactions, and  RL.7.7            annotation +    days): guided
  (5)         informational                        evidence        evidence selection
              structure: read,                     response        and vocabulary
              annotate, discuss,                                   
              and build                                            
              interpretations.                                     

  E7-U2-L2\   Ideas,             RL.7.5, RL.7.9    A-E7-U2-L2:     I-E7-U2-L2 (1-2 flex
  Days 27-34  interactions, and                    rubric-scored   days):
  (8)         informational                        draft           sentence/paragraph
              structure: draft,                    checkpoint      scaffold and model
              analyze craft, and                                   comparison
              strengthen                                           
              evidence.                                            

  E7-U2-L3\   Ideas,             RL.7.6, RL.7.10   A-E7-U2-L3:     I-E7-U2-L3 (1-2 flex
  Days 35-40  interactions, and                    publication,    days): revision
  (6)         informational                        seminar, or     conference and oral
              structure: revise,                   portfolio       rehearsal
              publish, present,                    evidence        
              and demonstrate                                      
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 3. Perspective, media, and author purpose - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E7-U3-L1\   Perspective,       RI.7.1, RI.7.4    A-E7-U3-L1:     I-E7-U3-L1 (1-2 flex
  Days 41-45  media, and author  \[CA\], RI.7.7,   annotation +    days): guided
  (5)         purpose: read,     RI.7.10           evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E7-U3-L2\   Perspective,       RI.7.2, RI.7.5    A-E7-U3-L2:     I-E7-U3-L2 (1-2 flex
  Days 46-53  media, and author  \[CA\], RI.7.8    rubric-scored   days):
  (8)         purpose: draft,                      draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E7-U3-L3\   Perspective,       RI.7.3, RI.7.6,   A-E7-U3-L3:     I-E7-U3-L3 (1-2 flex
  Days 54-59  media, and author  RI.7.9            publication,    days): revision
  (6)         purpose: revise,                     seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 4. Argument and counterclaim foundations - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E7-U4-L1\   Argument and       SL.7.1, W.7.1     A-E7-U4-L1:     I-E7-U4-L1 (1-2 flex
  Days 60-64  counterclaim       \[CA\]            annotation +    days): guided
  (5)         foundations: read,                   evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E7-U4-L2\   Argument and       SL.7.2            A-E7-U4-L2:     I-E7-U4-L2 (1-2 flex
  Days 65-72  counterclaim                         rubric-scored   days):
  (8)         foundations:                         draft           sentence/paragraph
              draft, analyze                       checkpoint      scaffold and model
              craft, and                                           comparison
              strengthen                                           
              evidence.                                            

  E7-U4-L3\   Argument and       SL.7.3 \[CA\]     A-E7-U4-L3:     I-E7-U4-L3 (1-2 flex
  Days 73-78  counterclaim                         publication,    days): revision
  (6)         foundations:                         seminar, or     conference and oral
              revise, publish,                     portfolio       rehearsal
              present, and                         evidence        
              demonstrate                                          
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 5. Research, synthesis, and citation - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E7-U5-L1\   Research,          W.7.2 \[CA\],     A-E7-U5-L1:     I-E7-U5-L1 (1-2 flex
  Days 79-83  synthesis, and     W.7.9             annotation +    days): guided
  (5)         citation: read,                      evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E7-U5-L2\   Research,          W.7.7             A-E7-U5-L2:     I-E7-U5-L2 (1-2 flex
  Days 84-90  synthesis, and                       rubric-scored   days):
  (7)         citation: draft,                     draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E7-U5-L3\   Research,          W.7.8             A-E7-U5-L3:     I-E7-U5-L3 (1-2 flex
  Days 91-96  synthesis, and                       publication,    days): revision
  (6)         citation: revise,                    seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 6. Narrative voice, pacing, and revision - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E7-U6-L1\   Narrative voice,   L.7.1, L.7.4      A-E7-U6-L1:     I-E7-U6-L1 (1-2 flex
  Days 97-101 pacing, and        \[CA\], W.7.3     annotation +    days): guided
  (5)         revision: read,                      evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E7-U6-L2\   Narrative voice,   L.7.2, L.7.5      A-E7-U6-L2:     I-E7-U6-L2 (1-2 flex
  Days        pacing, and                          rubric-scored   days):
  102-109 (8) revision: draft,                     draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E7-U6-L3\   Narrative voice,   L.7.3, L.7.6      A-E7-U6-L3:     I-E7-U6-L3 (1-2 flex
  Days        pacing, and                          publication,    days): revision
  110-115 (6) revision: revise,                    seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 7. Portfolio, presentation, and mastery - 20 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E7-U7-L1\   Portfolio,         SL.7.4 \[CA\],    A-E7-U7-L1:     I-E7-U7-L1 (1-2 flex
  Days        presentation, and  W.7.4, W.7.10     annotation +    days): guided
  116-120 (5) mastery: read,                       evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E7-U7-L2\   Portfolio,         SL.7.5, W.7.5     A-E7-U7-L2:     I-E7-U7-L2 (1-2 flex
  Days        presentation, and                    rubric-scored   days):
  121-129 (9) mastery: draft,                      draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E7-U7-L3\   Portfolio,         SL.7.6, W.7.6     A-E7-U7-L3:     I-E7-U7-L3 (1-2 flex
  Days        presentation, and                    publication,    days): revision
  130-135 (6) mastery: revise,                     seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 41 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## English 8

135 core lesson days \| 40 intervention-capacity days \| 41 primary
standards assignments \| 6 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, independence, and diagnostic - 3 core days

  --------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment    **Intervention
  core days** sequence**                                  evidence**      lesson**
  ----------- ------------------ ------------------------ --------------- --------------------
  E8-U0-L1\   Launch,            Readiness/prerequisite   A-E8-U0-L1:     I-E8-U0-L1 (1-2 flex
  Days 1 (1)  independence, and  evidence; no new primary annotation +    days): guided
              diagnostic: read,  standard.                evidence        evidence selection
              annotate, discuss,                          response        and vocabulary
              and build                                                   
              interpretations.                                            

  E8-U0-L2\   Launch,            Readiness/prerequisite   A-E8-U0-L2:     I-E8-U0-L2 (1-2 flex
  Days 2 (1)  independence, and  evidence; no new primary rubric-scored   days):
              diagnostic: draft, standard.                draft           sentence/paragraph
              analyze craft, and                          checkpoint      scaffold and model
              strengthen                                                  comparison
              evidence.                                                   

  E8-U0-L3\   Launch,            Readiness/prerequisite   A-E8-U0-L3:     I-E8-U0-L3 (1-2 flex
  Days 3 (1)  independence, and  evidence; no new primary publication,    days): revision
              diagnostic:        standard.                seminar, or     conference and oral
              revise, publish,                            portfolio       rehearsal
              present, and                                evidence        
              demonstrate                                                 
              transfer.                                                   
  --------------------------------------------------------------------------------------------

### Unit 1. Strongest evidence, inference, and theme - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E8-U1-L1\   Strongest          RL.8.1            A-E8-U1-L1:     I-E8-U1-L1 (1-2 flex
  Days 4-8    evidence,                            annotation +    days): guided
  (5)         inference, and                       evidence        evidence selection
              theme: read,                         response        and vocabulary
              annotate, discuss,                                   
              and build                                            
              interpretations.                                     

  E8-U1-L2\   Strongest          RL.8.2            A-E8-U1-L2:     I-E8-U1-L2 (1-2 flex
  Days 9-16   evidence,                            rubric-scored   days):
  (8)         inference, and                       draft           sentence/paragraph
              theme: draft,                        checkpoint      scaffold and model
              analyze craft, and                                   comparison
              strengthen                                           
              evidence.                                            

  E8-U1-L3\   Strongest          RL.8.3            A-E8-U1-L3:     I-E8-U1-L3 (1-2 flex
  Days 17-22  evidence,                            publication,    days): revision
  (6)         inference, and                       seminar, or     conference and oral
              theme: revise,                       portfolio       rehearsal
              publish, present,                    evidence        
              and demonstrate                                      
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 2. Structure, point of view, and dramatic irony - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E8-U2-L1\   Structure, point   RL.8.4 \[CA\],    A-E8-U2-L1:     I-E8-U2-L1 (1-2 flex
  Days 23-27  of view, and       RL.8.7            annotation +    days): guided
  (5)         dramatic irony:                      evidence        evidence selection
              read, annotate,                      response        and vocabulary
              discuss, and build                                   
              interpretations.                                     

  E8-U2-L2\   Structure, point   RL.8.5, RL.8.9    A-E8-U2-L2:     I-E8-U2-L2 (1-2 flex
  Days 28-34  of view, and                         rubric-scored   days):
  (7)         dramatic irony:                      draft           sentence/paragraph
              draft, analyze                       checkpoint      scaffold and model
              craft, and                                           comparison
              strengthen                                           
              evidence.                                            

  E8-U2-L3\   Structure, point   RL.8.6, RL.8.10   A-E8-U2-L3:     I-E8-U2-L3 (1-2 flex
  Days 35-40  of view, and                         publication,    days): revision
  (6)         dramatic irony:                      seminar, or     conference and oral
              revise, publish,                     portfolio       rehearsal
              present, and                         evidence        
              demonstrate                                          
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 3. Central ideas across media and accounts - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E8-U3-L1\   Central ideas      RI.8.1, RI.8.4    A-E8-U3-L1:     I-E8-U3-L1 (1-2 flex
  Days 41-45  across media and   \[CA\], RI.8.7,   annotation +    days): guided
  (5)         accounts: read,    RI.8.10           evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E8-U3-L2\   Central ideas      RI.8.2, RI.8.5    A-E8-U3-L2:     I-E8-U3-L2 (1-2 flex
  Days 46-53  across media and   \[CA\], RI.8.8    rubric-scored   days):
  (8)         accounts: draft,                     draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E8-U3-L3\   Central ideas      RI.8.3, RI.8.6,   A-E8-U3-L3:     I-E8-U3-L3 (1-2 flex
  Days 54-59  across media and   RI.8.9            publication,    days): revision
  (6)         accounts: revise,                    seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 4. Argument, counterclaim, and source evaluation - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E8-U4-L1\   Argument,          SL.8.1, W.8.1     A-E8-U4-L1:     I-E8-U4-L1 (1-2 flex
  Days 60-64  counterclaim, and                    annotation +    days): guided
  (5)         source evaluation:                   evidence        evidence selection
              read, annotate,                      response        and vocabulary
              discuss, and build                                   
              interpretations.                                     

  E8-U4-L2\   Argument,          SL.8.2            A-E8-U4-L2:     I-E8-U4-L2 (1-2 flex
  Days 65-72  counterclaim, and                    rubric-scored   days):
  (8)         source evaluation:                   draft           sentence/paragraph
              draft, analyze                       checkpoint      scaffold and model
              craft, and                                           comparison
              strengthen                                           
              evidence.                                            

  E8-U4-L3\   Argument,          SL.8.3            A-E8-U4-L3:     I-E8-U4-L3 (1-2 flex
  Days 73-78  counterclaim, and                    publication,    days): revision
  (6)         source evaluation:                   seminar, or     conference and oral
              revise, publish,                     portfolio       rehearsal
              present, and                         evidence        
              demonstrate                                          
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 5. Inquiry, synthesis, and explanatory writing - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E8-U5-L1\   Inquiry,           W.8.2 \[CA\],     A-E8-U5-L1:     I-E8-U5-L1 (1-2 flex
  Days 79-83  synthesis, and     W.8.9             annotation +    days): guided
  (5)         explanatory                          evidence        evidence selection
              writing: read,                       response        and vocabulary
              annotate, discuss,                                   
              and build                                            
              interpretations.                                     

  E8-U5-L2\   Inquiry,           W.8.7             A-E8-U5-L2:     I-E8-U5-L2 (1-2 flex
  Days 84-91  synthesis, and                       rubric-scored   days):
  (8)         explanatory                          draft           sentence/paragraph
              writing: draft,                      checkpoint      scaffold and model
              analyze craft, and                                   comparison
              strengthen                                           
              evidence.                                            

  E8-U5-L3\   Inquiry,           W.8.8             A-E8-U5-L3:     I-E8-U5-L3 (1-2 flex
  Days 92-97  synthesis, and                       publication,    days): revision
  (6)         explanatory                          seminar, or     conference and oral
              writing: revise,                     portfolio       rehearsal
              publish, present,                    evidence        
              and demonstrate                                      
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 6. Narrative technique and language control - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E8-U6-L1\   Narrative          L.8.1, L.8.4      A-E8-U6-L1:     I-E8-U6-L1 (1-2 flex
  Days 98-102 technique and      \[CA\], W.8.3     annotation +    days): guided
  (5)         language control:                    evidence        evidence selection
              read, annotate,                      response        and vocabulary
              discuss, and build                                   
              interpretations.                                     

  E8-U6-L2\   Narrative          L.8.2, L.8.5      A-E8-U6-L2:     I-E8-U6-L2 (1-2 flex
  Days        technique and                        rubric-scored   days):
  103-109 (7) language control:                    draft           sentence/paragraph
              draft, analyze                       checkpoint      scaffold and model
              craft, and                                           comparison
              strengthen                                           
              evidence.                                            

  E8-U6-L3\   Narrative          L.8.3, L.8.6      A-E8-U6-L3:     I-E8-U6-L3 (1-2 flex
  Days        technique and                        publication,    days): revision
  110-115 (6) language control:                    seminar, or     conference and oral
              revise, publish,                     portfolio       rehearsal
              present, and                         evidence        
              demonstrate                                          
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 7. High-school readiness portfolio - 20 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E8-U7-L1\   High-school        SL.8.4 \[CA\],    A-E8-U7-L1:     I-E8-U7-L1 (1-2 flex
  Days        readiness          W.8.4, W.8.10     annotation +    days): guided
  116-120 (5) portfolio: read,                     evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E8-U7-L2\   High-school        SL.8.5, W.8.5     A-E8-U7-L2:     I-E8-U7-L2 (1-2 flex
  Days        readiness                            rubric-scored   days):
  121-129 (9) portfolio: draft,                    draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E8-U7-L3\   High-school        SL.8.6, W.8.6     A-E8-U7-L3:     I-E8-U7-L3 (1-2 flex
  Days        readiness                            publication,    days): revision
  130-135 (6) portfolio: revise,                   seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 41 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## English 9

135 core lesson days \| 40 intervention-capacity days \| 41 primary
standards assignments \| 7 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, close-reading routines, and diagnostic - 3 core days

  --------------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary standards**    **Assessment    **Intervention
  core days** sequence**                                  evidence**      lesson**
  ----------- ------------------ ------------------------ --------------- --------------------
  E9-U0-L1\   Launch,            Readiness/prerequisite   A-E9-U0-L1:     I-E9-U0-L1 (1-2 flex
  Days 1 (1)  close-reading      evidence; no new primary annotation +    days): guided
              routines, and      standard.                evidence        evidence selection
              diagnostic: read,                           response        and vocabulary
              annotate, discuss,                                          
              and build                                                   
              interpretations.                                            

  E9-U0-L2\   Launch,            Readiness/prerequisite   A-E9-U0-L2:     I-E9-U0-L2 (1-2 flex
  Days 2 (1)  close-reading      evidence; no new primary rubric-scored   days):
              routines, and      standard.                draft           sentence/paragraph
              diagnostic: draft,                          checkpoint      scaffold and model
              analyze craft, and                                          comparison
              strengthen                                                  
              evidence.                                                   

  E9-U0-L3\   Launch,            Readiness/prerequisite   A-E9-U0-L3:     I-E9-U0-L3 (1-2 flex
  Days 3 (1)  close-reading      evidence; no new primary publication,    days): revision
              routines, and      standard.                seminar, or     conference and oral
              diagnostic:                                 portfolio       rehearsal
              revise, publish,                            evidence        
              present, and                                                
              demonstrate                                                 
              transfer.                                                   
  --------------------------------------------------------------------------------------------

### Unit 1. Complex character, conflict, and theme - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E9-U1-L1\   Complex character, RL.9-10.1         A-E9-U1-L1:     I-E9-U1-L1 (1-2 flex
  Days 4-8    conflict, and                        annotation +    days): guided
  (5)         theme: read,                         evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E9-U1-L2\   Complex character, RL.9-10.2         A-E9-U1-L2:     I-E9-U1-L2 (1-2 flex
  Days 9-16   conflict, and                        rubric-scored   days):
  (8)         theme: draft,                        draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E9-U1-L3\   Complex character, RL.9-10.3         A-E9-U1-L3:     I-E9-U1-L3 (1-2 flex
  Days 17-22  conflict, and                        publication,    days): revision
  (6)         theme: revise,                       seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 2. Rhetoric, purpose, and informational analysis - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E9-U2-L1\   Rhetoric, purpose, RL.9-10.4 \[CA\], A-E9-U2-L1:     I-E9-U2-L1 (1-2 flex
  Days 23-27  and informational  RL.9-10.7         annotation +    days): guided
  (5)         analysis: read,                      evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E9-U2-L2\   Rhetoric, purpose, RL.9-10.5,        A-E9-U2-L2:     I-E9-U2-L2 (1-2 flex
  Days 28-35  and informational  RL.9-10.9         rubric-scored   days):
  (8)         analysis: draft,                     draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E9-U2-L3\   Rhetoric, purpose, RL.9-10.6,        A-E9-U2-L3:     I-E9-U2-L3 (1-2 flex
  Days 36-41  and informational  RL.9-10.10        publication,    days): revision
  (6)         analysis: revise,                    seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 3. World literature and cultural perspective - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E9-U3-L1\   World literature   RI.9-10.1,        A-E9-U3-L1:     I-E9-U3-L1 (1-2 flex
  Days 42-46  and cultural       RI.9-10.4 \[CA\], annotation +    days): guided
  (5)         perspective: read, RI.9-10.7,        evidence        evidence selection
              annotate, discuss, RI.9-10.10        response        and vocabulary
              and build                                            
              interpretations.                                     

  E9-U3-L2\   World literature   RI.9-10.2,        A-E9-U3-L2:     I-E9-U3-L2 (1-2 flex
  Days 47-53  and cultural       RI.9-10.5 \[CA\], rubric-scored   days):
  (7)         perspective:       RI.9-10.8         draft           sentence/paragraph
              draft, analyze                       checkpoint      scaffold and model
              craft, and                                           comparison
              strengthen                                           
              evidence.                                            

  E9-U3-L3\   World literature   RI.9-10.3,        A-E9-U3-L3:     I-E9-U3-L3 (1-2 flex
  Days 54-59  and cultural       RI.9-10.6,        publication,    days): revision
  (6)         perspective:       RI.9-10.9         seminar, or     conference and oral
              revise, publish,                     portfolio       rehearsal
              present, and                         evidence        
              demonstrate                                          
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 4. Argument, evidence, and counterclaims - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E9-U4-L1\   Argument,          SL.9-10.1,        A-E9-U4-L1:     I-E9-U4-L1 (1-2 flex
  Days 60-64  evidence, and      W.9-10.1          annotation +    days): guided
  (5)         counterclaims:                       evidence        evidence selection
              read, annotate,                      response        and vocabulary
              discuss, and build                                   
              interpretations.                                     

  E9-U4-L2\   Argument,          SL.9-10.2         A-E9-U4-L2:     I-E9-U4-L2 (1-2 flex
  Days 65-72  evidence, and                        rubric-scored   days):
  (8)         counterclaims:                       draft           sentence/paragraph
              draft, analyze                       checkpoint      scaffold and model
              craft, and                                           comparison
              strengthen                                           
              evidence.                                            

  E9-U4-L3\   Argument,          SL.9-10.3         A-E9-U4-L3:     I-E9-U4-L3 (1-2 flex
  Days 73-78  evidence, and                        publication,    days): revision
  (6)         counterclaims:                       seminar, or     conference and oral
              revise, publish,                     portfolio       rehearsal
              present, and                         evidence        
              demonstrate                                          
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 5. Research questions and source synthesis - 19 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E9-U5-L1\   Research questions W.9-10.2 \[CA\],  A-E9-U5-L1:     I-E9-U5-L1 (1-2 flex
  Days 79-83  and source         W.9-10.9          annotation +    days): guided
  (5)         synthesis: read,                     evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E9-U5-L2\   Research questions W.9-10.7          A-E9-U5-L2:     I-E9-U5-L2 (1-2 flex
  Days 84-91  and source                           rubric-scored   days):
  (8)         synthesis: draft,                    draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E9-U5-L3\   Research questions W.9-10.8 \[CA\]   A-E9-U5-L3:     I-E9-U5-L3 (1-2 flex
  Days 92-97  and source                           publication,    days): revision
  (6)         synthesis: revise,                   seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 6. Narrative and explanatory craft - 18 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E9-U6-L1\   Narrative and      L.9-10.1,         A-E9-U6-L1:     I-E9-U6-L1 (1-2 flex
  Days 98-102 explanatory craft: L.9-10.4 \[CA\],  annotation +    days): guided
  (5)         read, annotate,    W.9-10.3          evidence        evidence selection
              discuss, and build                   response        and vocabulary
              interpretations.                                     

  E9-U6-L2\   Narrative and      L.9-10.2,         A-E9-U6-L2:     I-E9-U6-L2 (1-2 flex
  Days        explanatory craft: L.9-10.5          rubric-scored   days):
  103-109 (7) draft, analyze                       draft           sentence/paragraph
              craft, and                           checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E9-U6-L3\   Narrative and      L.9-10.3,         A-E9-U6-L3:     I-E9-U6-L3 (1-2 flex
  Days        explanatory craft: L.9-10.6          publication,    days): revision
  110-115 (6) revise, publish,                     seminar, or     conference and oral
              present, and                         portfolio       rehearsal
              demonstrate                          evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

### Unit 7. Portfolio, seminar, and mastery - 20 core days

  -------------------------------------------------------------------------------------
  **Lesson /  **Lesson           **Primary         **Assessment    **Intervention
  core days** sequence**         standards**       evidence**      lesson**
  ----------- ------------------ ----------------- --------------- --------------------
  E9-U7-L1\   Portfolio,         SL.9-10.4 \[CA\], A-E9-U7-L1:     I-E9-U7-L1 (1-2 flex
  Days        seminar, and       W.9-10.4,         annotation +    days): guided
  116-120 (5) mastery: read,     W.9-10.10         evidence        evidence selection
              annotate, discuss,                   response        and vocabulary
              and build                                            
              interpretations.                                     

  E9-U7-L2\   Portfolio,         SL.9-10.5,        A-E9-U7-L2:     I-E9-U7-L2 (1-2 flex
  Days        seminar, and       W.9-10.5          rubric-scored   days):
  121-129 (9) mastery: draft,                      draft           sentence/paragraph
              analyze craft, and                   checkpoint      scaffold and model
              strengthen                                           comparison
              evidence.                                            

  E9-U7-L3\   Portfolio,         SL.9-10.6,        A-E9-U7-L3:     I-E9-U7-L3 (1-2 flex
  Days        seminar, and       W.9-10.6          publication,    days): revision
  130-135 (6) mastery: revise,                     seminar, or     conference and oral
              publish, present,                    portfolio       rehearsal
              and demonstrate                      evidence        
              transfer.                                            
  -------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 41 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## English 10

135 core lesson days \| 40 intervention-capacity days \| 41 primary
standards assignments \| 7 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, evidence calibration, and diagnostic - 3 core days

  ---------------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary standards**    **Assessment    **Intervention
  core days**  sequence**                                  evidence**      lesson**
  ------------ ------------------ ------------------------ --------------- --------------------
  E10-U0-L1\   Launch, evidence   Readiness/prerequisite   A-E10-U0-L1:    I-E10-U0-L1 (1-2
  Days 1 (1)   calibration, and   evidence; no new primary annotation +    flex days): guided
               diagnostic: read,  standard.                evidence        evidence selection
               annotate, discuss,                          response        and vocabulary
               and build                                                   
               interpretations.                                            

  E10-U0-L2\   Launch, evidence   Readiness/prerequisite   A-E10-U0-L2:    I-E10-U0-L2 (1-2
  Days 2 (1)   calibration, and   evidence; no new primary rubric-scored   flex days):
               diagnostic: draft, standard.                draft           sentence/paragraph
               analyze craft, and                          checkpoint      scaffold and model
               strengthen                                                  comparison
               evidence.                                                   

  E10-U0-L3\   Launch, evidence   Readiness/prerequisite   A-E10-U0-L3:    I-E10-U0-L3 (1-2
  Days 3 (1)   calibration, and   evidence; no new primary publication,    flex days): revision
               diagnostic:        standard.                seminar, or     conference and oral
               revise, publish,                            portfolio       rehearsal
               present, and                                evidence        
               demonstrate                                                 
               transfer.                                                   
  ---------------------------------------------------------------------------------------------

### Unit 1. Theme development and structural choices - 18 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E10-U1-L1\   Theme development  RL.9-10.1         A-E10-U1-L1:    I-E10-U1-L1 (1-2
  Days 4-8 (5) and structural                       annotation +    flex days): guided
               choices: read,                       evidence        evidence selection
               annotate, discuss,                   response        and vocabulary
               and build                                            
               interpretations.                                     

  E10-U1-L2\   Theme development  RL.9-10.2         A-E10-U1-L2:    I-E10-U1-L2 (1-2
  Days 9-15    and structural                       rubric-scored   flex days):
  (7)          choices: draft,                      draft           sentence/paragraph
               analyze craft, and                   checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E10-U1-L3\   Theme development  RL.9-10.3         A-E10-U1-L3:    I-E10-U1-L3 (1-2
  Days 16-21   and structural                       publication,    flex days): revision
  (6)          choices: revise,                     seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 2. Ideas, rhetoric, and public information - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E10-U2-L1\   Ideas, rhetoric,   RL.9-10.4 \[CA\], A-E10-U2-L1:    I-E10-U2-L1 (1-2
  Days 22-26   and public         RL.9-10.7         annotation +    flex days): guided
  (5)          information: read,                   evidence        evidence selection
               annotate, discuss,                   response        and vocabulary
               and build                                            
               interpretations.                                     

  E10-U2-L2\   Ideas, rhetoric,   RL.9-10.5,        A-E10-U2-L2:    I-E10-U2-L2 (1-2
  Days 27-34   and public         RL.9-10.9         rubric-scored   flex days):
  (8)          information:                         draft           sentence/paragraph
               draft, analyze                       checkpoint      scaffold and model
               craft, and                                           comparison
               strengthen                                           
               evidence.                                            

  E10-U2-L3\   Ideas, rhetoric,   RL.9-10.6,        A-E10-U2-L3:    I-E10-U2-L3 (1-2
  Days 35-40   and public         RL.9-10.10        publication,    flex days): revision
  (6)          information:                         seminar, or     conference and oral
               revise, publish,                     portfolio       rehearsal
               present, and                         evidence        
               demonstrate                                          
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 3. World voices across genres and media - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E10-U3-L1\   World voices       RI.9-10.1,        A-E10-U3-L1:    I-E10-U3-L1 (1-2
  Days 41-45   across genres and  RI.9-10.4 \[CA\], annotation +    flex days): guided
  (5)          media: read,       RI.9-10.7,        evidence        evidence selection
               annotate, discuss, RI.9-10.10        response        and vocabulary
               and build                                            
               interpretations.                                     

  E10-U3-L2\   World voices       RI.9-10.2,        A-E10-U3-L2:    I-E10-U3-L2 (1-2
  Days 46-53   across genres and  RI.9-10.5 \[CA\], rubric-scored   flex days):
  (8)          media: draft,      RI.9-10.8         draft           sentence/paragraph
               analyze craft, and                   checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E10-U3-L3\   World voices       RI.9-10.3,        A-E10-U3-L3:    I-E10-U3-L3 (1-2
  Days 54-59   across genres and  RI.9-10.6,        publication,    flex days): revision
  (6)          media: revise,     RI.9-10.9         seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 4. Sustained argument and counterclaim - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E10-U4-L1\   Sustained argument SL.9-10.1,        A-E10-U4-L1:    I-E10-U4-L1 (1-2
  Days 60-64   and counterclaim:  W.9-10.1          annotation +    flex days): guided
  (5)          read, annotate,                      evidence        evidence selection
               discuss, and build                   response        and vocabulary
               interpretations.                                     

  E10-U4-L2\   Sustained argument SL.9-10.2         A-E10-U4-L2:    I-E10-U4-L2 (1-2
  Days 65-72   and counterclaim:                    rubric-scored   flex days):
  (8)          draft, analyze                       draft           sentence/paragraph
               craft, and                           checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E10-U4-L3\   Sustained argument SL.9-10.3         A-E10-U4-L3:    I-E10-U4-L3 (1-2
  Days 73-78   and counterclaim:                    publication,    flex days): revision
  (6)          revise, publish,                     seminar, or     conference and oral
               present, and                         portfolio       rehearsal
               demonstrate                          evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 5. Research synthesis and explanatory writing - 18 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E10-U5-L1\   Research synthesis W.9-10.2 \[CA\],  A-E10-U5-L1:    I-E10-U5-L1 (1-2
  Days 79-83   and explanatory    W.9-10.9          annotation +    flex days): guided
  (5)          writing: read,                       evidence        evidence selection
               annotate, discuss,                   response        and vocabulary
               and build                                            
               interpretations.                                     

  E10-U5-L2\   Research synthesis W.9-10.7          A-E10-U5-L2:    I-E10-U5-L2 (1-2
  Days 84-90   and explanatory                      rubric-scored   flex days):
  (7)          writing: draft,                      draft           sentence/paragraph
               analyze craft, and                   checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E10-U5-L3\   Research synthesis W.9-10.8 \[CA\]   A-E10-U5-L3:    I-E10-U5-L3 (1-2
  Days 91-96   and explanatory                      publication,    flex days): revision
  (6)          writing: revise,                     seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 6. Style, syntax, and purposeful revision - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E10-U6-L1\   Style, syntax, and L.9-10.1,         A-E10-U6-L1:    I-E10-U6-L1 (1-2
  Days 97-101  purposeful         L.9-10.4 \[CA\],  annotation +    flex days): guided
  (5)          revision: read,    W.9-10.3          evidence        evidence selection
               annotate, discuss,                   response        and vocabulary
               and build                                            
               interpretations.                                     

  E10-U6-L2\   Style, syntax, and L.9-10.2,         A-E10-U6-L2:    I-E10-U6-L2 (1-2
  Days 102-109 purposeful         L.9-10.5          rubric-scored   flex days):
  (8)          revision: draft,                     draft           sentence/paragraph
               analyze craft, and                   checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E10-U6-L3\   Style, syntax, and L.9-10.3,         A-E10-U6-L3:    I-E10-U6-L3 (1-2
  Days 110-115 purposeful         L.9-10.6          publication,    flex days): revision
  (6)          revision: revise,                    seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 7. Portfolio, presentation, and mastery - 20 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E10-U7-L1\   Portfolio,         SL.9-10.4 \[CA\], A-E10-U7-L1:    I-E10-U7-L1 (1-2
  Days 116-120 presentation, and  W.9-10.4,         annotation +    flex days): guided
  (5)          mastery: read,     W.9-10.10         evidence        evidence selection
               annotate, discuss,                   response        and vocabulary
               and build                                            
               interpretations.                                     

  E10-U7-L2\   Portfolio,         SL.9-10.5,        A-E10-U7-L2:    I-E10-U7-L2 (1-2
  Days 121-129 presentation, and  W.9-10.5          rubric-scored   flex days):
  (9)          mastery: draft,                      draft           sentence/paragraph
               analyze craft, and                   checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E10-U7-L3\   Portfolio,         SL.9-10.6,        A-E10-U7-L3:    I-E10-U7-L3 (1-2
  Days 130-135 presentation, and  W.9-10.6          publication,    flex days): revision
  (6)          mastery: revise,                     seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 41 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## English 11

135 core lesson days \| 40 intervention-capacity days \| 41 primary
standards assignments \| 9 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, source use, and diagnostic - 3 core days

  ---------------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary standards**    **Assessment    **Intervention
  core days**  sequence**                                  evidence**      lesson**
  ------------ ------------------ ------------------------ --------------- --------------------
  E11-U0-L1\   Launch, source     Readiness/prerequisite   A-E11-U0-L1:    I-E11-U0-L1 (1-2
  Days 1 (1)   use, and           evidence; no new primary annotation +    flex days): guided
               diagnostic: read,  standard.                evidence        evidence selection
               annotate, discuss,                          response        and vocabulary
               and build                                                   
               interpretations.                                            

  E11-U0-L2\   Launch, source     Readiness/prerequisite   A-E11-U0-L2:    I-E11-U0-L2 (1-2
  Days 2 (1)   use, and           evidence; no new primary rubric-scored   flex days):
               diagnostic: draft, standard.                draft           sentence/paragraph
               analyze craft, and                          checkpoint      scaffold and model
               strengthen                                                  comparison
               evidence.                                                   

  E11-U0-L3\   Launch, source     Readiness/prerequisite   A-E11-U0-L3:    I-E11-U0-L3 (1-2
  Days 3 (1)   use, and           evidence; no new primary publication,    flex days): revision
               diagnostic:        standard.                seminar, or     conference and oral
               revise, publish,                            portfolio       rehearsal
               present, and                                evidence        
               demonstrate                                                 
               transfer.                                                   
  ---------------------------------------------------------------------------------------------

### Unit 1. American voices, ideas, and multiple themes - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E11-U1-L1\   American voices,   RL.11-12.1        A-E11-U1-L1:    I-E11-U1-L1 (1-2
  Days 4-8 (5) ideas, and                           annotation +    flex days): guided
               multiple themes:                     evidence        evidence selection
               read, annotate,                      response        and vocabulary
               discuss, and build                                   
               interpretations.                                     

  E11-U1-L2\   American voices,   RL.11-12.2        A-E11-U1-L2:    I-E11-U1-L2 (1-2
  Days 9-16    ideas, and                           rubric-scored   flex days):
  (8)          multiple themes:                     draft           sentence/paragraph
               draft, analyze                       checkpoint      scaffold and model
               craft, and                                           comparison
               strengthen                                           
               evidence.                                            

  E11-U1-L3\   American voices,   RL.11-12.3 \[CA\] A-E11-U1-L3:    I-E11-U1-L3 (1-2
  Days 17-22   ideas, and                           publication,    flex days): revision
  (6)          multiple themes:                     seminar, or     conference and oral
               revise, publish,                     portfolio       rehearsal
               present, and                         evidence        
               demonstrate                                          
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 2. Foundational documents and rhetoric - 18 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E11-U2-L1\   Foundational       RL.11-12.4        A-E11-U2-L1:    I-E11-U2-L1 (1-2
  Days 23-27   documents and      \[CA\],           annotation +    flex days): guided
  (5)          rhetoric: read,    RL.11-12.7        evidence        evidence selection
               annotate, discuss,                   response        and vocabulary
               and build                                            
               interpretations.                                     

  E11-U2-L2\   Foundational       RL.11-12.5,       A-E11-U2-L2:    I-E11-U2-L2 (1-2
  Days 28-34   documents and      RL.11-12.9        rubric-scored   flex days):
  (7)          rhetoric: draft,                     draft           sentence/paragraph
               analyze craft, and                   checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E11-U2-L3\   Foundational       RL.11-12.6,       A-E11-U2-L3:    I-E11-U2-L3 (1-2
  Days 35-40   documents and      RL.11-12.10       publication,    flex days): revision
  (6)          rhetoric: revise,                    seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 3. Information, argument, and public discourse - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E11-U3-L1\   Information,       RI.11-12.1,       A-E11-U3-L1:    I-E11-U3-L1 (1-2
  Days 41-45   argument, and      RI.11-12.4        annotation +    flex days): guided
  (5)          public discourse:  \[CA\],           evidence        evidence selection
               read, annotate,    RI.11-12.7,       response        and vocabulary
               discuss, and build RI.11-12.10                       
               interpretations.                                     

  E11-U3-L2\   Information,       RI.11-12.2,       A-E11-U3-L2:    I-E11-U3-L2 (1-2
  Days 46-53   argument, and      RI.11-12.5        rubric-scored   flex days):
  (8)          public discourse:  \[CA\],           draft           sentence/paragraph
               draft, analyze     RI.11-12.8        checkpoint      scaffold and model
               craft, and                                           comparison
               strengthen                                           
               evidence.                                            

  E11-U3-L3\   Information,       RI.11-12.3,       A-E11-U3-L3:    I-E11-U3-L3 (1-2
  Days 54-59   argument, and      RI.11-12.6,       publication,    flex days): revision
  (6)          public discourse:  RI.11-12.9        seminar, or     conference and oral
               revise, publish,                     portfolio       rehearsal
               present, and                         evidence        
               demonstrate                                          
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 4. Research, credibility, and synthesis - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E11-U4-L1\   Research,          SL.11-12.1,       A-E11-U4-L1:    I-E11-U4-L1 (1-2
  Days 60-64   credibility, and   W.11-12.1 \[CA\]  annotation +    flex days): guided
  (5)          synthesis: read,                     evidence        evidence selection
               annotate, discuss,                   response        and vocabulary
               and build                                            
               interpretations.                                     

  E11-U4-L2\   Research,          SL.11-12.2        A-E11-U4-L2:    I-E11-U4-L2 (1-2
  Days 65-72   credibility, and                     rubric-scored   flex days):
  (8)          synthesis: draft,                    draft           sentence/paragraph
               analyze craft, and                   checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E11-U4-L3\   Research,          SL.11-12.3        A-E11-U4-L3:    I-E11-U4-L3 (1-2
  Days 73-78   credibility, and                     publication,    flex days): revision
  (6)          synthesis: revise,                   seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 5. Argument for a defined audience - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E11-U5-L1\   Argument for a     W.11-12.2 \[CA\], A-E11-U5-L1:    I-E11-U5-L1 (1-2
  Days 79-83   defined audience:  W.11-12.9         annotation +    flex days): guided
  (5)          read, annotate,                      evidence        evidence selection
               discuss, and build                   response        and vocabulary
               interpretations.                                     

  E11-U5-L2\   Argument for a     W.11-12.7         A-E11-U5-L2:    I-E11-U5-L2 (1-2
  Days 84-91   defined audience:                    rubric-scored   flex days):
  (8)          draft, analyze                       draft           sentence/paragraph
               craft, and                           checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E11-U5-L3\   Argument for a     W.11-12.8 \[CA\]  A-E11-U5-L3:    I-E11-U5-L3 (1-2
  Days 92-97   defined audience:                    publication,    flex days): revision
  (6)          revise, publish,                     seminar, or     conference and oral
               present, and                         portfolio       rehearsal
               demonstrate                          evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 6. Narrative, reflection, and style - 18 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E11-U6-L1\   Narrative,         L.11-12.1,        A-E11-U6-L1:    I-E11-U6-L1 (1-2
  Days 98-102  reflection, and    L.11-12.4 \[CA\], annotation +    flex days): guided
  (5)          style: read,       W.11-12.3         evidence        evidence selection
               annotate, discuss,                   response        and vocabulary
               and build                                            
               interpretations.                                     

  E11-U6-L2\   Narrative,         L.11-12.2,        A-E11-U6-L2:    I-E11-U6-L2 (1-2
  Days 103-109 reflection, and    L.11-12.5         rubric-scored   flex days):
  (7)          style: draft,                        draft           sentence/paragraph
               analyze craft, and                   checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E11-U6-L3\   Narrative,         L.11-12.3,        A-E11-U6-L3:    I-E11-U6-L3 (1-2
  Days 110-115 reflection, and    L.11-12.6         publication,    flex days): revision
  (6)          style: revise,                       seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 7. Portfolio, presentation, and mastery - 20 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E11-U7-L1\   Portfolio,         SL.11-12.4        A-E11-U7-L1:    I-E11-U7-L1 (1-2
  Days 116-120 presentation, and  \[CA\],           annotation +    flex days): guided
  (5)          mastery: read,     W.11-12.4,        evidence        evidence selection
               annotate, discuss, W.11-12.10        response        and vocabulary
               and build                                            
               interpretations.                                     

  E11-U7-L2\   Portfolio,         SL.11-12.5,       A-E11-U7-L2:    I-E11-U7-L2 (1-2
  Days 121-129 presentation, and  W.11-12.5         rubric-scored   flex days):
  (9)          mastery: draft,                      draft           sentence/paragraph
               analyze craft, and                   checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E11-U7-L3\   Portfolio,         SL.11-12.6,       A-E11-U7-L3:    I-E11-U7-L3 (1-2
  Days 130-135 presentation, and  W.11-12.6         publication,    flex days): revision
  (6)          mastery: revise,                     seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 41 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## English 12

135 core lesson days \| 40 intervention-capacity days \| 41 primary
standards assignments \| 9 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, independence, and diagnostic - 3 core days

  ---------------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary standards**    **Assessment    **Intervention
  core days**  sequence**                                  evidence**      lesson**
  ------------ ------------------ ------------------------ --------------- --------------------
  E12-U0-L1\   Launch,            Readiness/prerequisite   A-E12-U0-L1:    I-E12-U0-L1 (1-2
  Days 1 (1)   independence, and  evidence; no new primary annotation +    flex days): guided
               diagnostic: read,  standard.                evidence        evidence selection
               annotate, discuss,                          response        and vocabulary
               and build                                                   
               interpretations.                                            

  E12-U0-L2\   Launch,            Readiness/prerequisite   A-E12-U0-L2:    I-E12-U0-L2 (1-2
  Days 2 (1)   independence, and  evidence; no new primary rubric-scored   flex days):
               diagnostic: draft, standard.                draft           sentence/paragraph
               analyze craft, and                          checkpoint      scaffold and model
               strengthen                                                  comparison
               evidence.                                                   

  E12-U0-L3\   Launch,            Readiness/prerequisite   A-E12-U0-L3:    I-E12-U0-L3 (1-2
  Days 3 (1)   independence, and  evidence; no new primary publication,    flex days): revision
               diagnostic:        standard.                seminar, or     conference and oral
               revise, publish,                            portfolio       rehearsal
               present, and                                evidence        
               demonstrate                                                 
               transfer.                                                   
  ---------------------------------------------------------------------------------------------

### Unit 1. Complex texts, ambiguity, and interpretation - 18 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E12-U1-L1\   Complex texts,     RL.11-12.1        A-E12-U1-L1:    I-E12-U1-L1 (1-2
  Days 4-8 (5) ambiguity, and                       annotation +    flex days): guided
               interpretation:                      evidence        evidence selection
               read, annotate,                      response        and vocabulary
               discuss, and build                                   
               interpretations.                                     

  E12-U1-L2\   Complex texts,     RL.11-12.2        A-E12-U1-L2:    I-E12-U1-L2 (1-2
  Days 9-15    ambiguity, and                       rubric-scored   flex days):
  (7)          interpretation:                      draft           sentence/paragraph
               draft, analyze                       checkpoint      scaffold and model
               craft, and                                           comparison
               strengthen                                           
               evidence.                                            

  E12-U1-L3\   Complex texts,     RL.11-12.3 \[CA\] A-E12-U1-L3:    I-E12-U1-L3 (1-2
  Days 16-21   ambiguity, and                       publication,    flex days): revision
  (6)          interpretation:                      seminar, or     conference and oral
               revise, publish,                     portfolio       rehearsal
               present, and                         evidence        
               demonstrate                                          
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 2. Rhetoric, institutions, and public argument - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E12-U2-L1\   Rhetoric,          RL.11-12.4        A-E12-U2-L1:    I-E12-U2-L1 (1-2
  Days 22-26   institutions, and  \[CA\],           annotation +    flex days): guided
  (5)          public argument:   RL.11-12.7        evidence        evidence selection
               read, annotate,                      response        and vocabulary
               discuss, and build                                   
               interpretations.                                     

  E12-U2-L2\   Rhetoric,          RL.11-12.5,       A-E12-U2-L2:    I-E12-U2-L2 (1-2
  Days 27-34   institutions, and  RL.11-12.9        rubric-scored   flex days):
  (8)          public argument:                     draft           sentence/paragraph
               draft, analyze                       checkpoint      scaffold and model
               craft, and                                           comparison
               strengthen                                           
               evidence.                                            

  E12-U2-L3\   Rhetoric,          RL.11-12.6,       A-E12-U2-L3:    I-E12-U2-L3 (1-2
  Days 35-40   institutions, and  RL.11-12.10       publication,    flex days): revision
  (6)          public argument:                     seminar, or     conference and oral
               revise, publish,                     portfolio       rehearsal
               present, and                         evidence        
               demonstrate                                          
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 3. Global and contemporary voices - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E12-U3-L1\   Global and         RI.11-12.1,       A-E12-U3-L1:    I-E12-U3-L1 (1-2
  Days 41-45   contemporary       RI.11-12.4        annotation +    flex days): guided
  (5)          voices: read,      \[CA\],           evidence        evidence selection
               annotate, discuss, RI.11-12.7,       response        and vocabulary
               and build          RI.11-12.10                       
               interpretations.                                     

  E12-U3-L2\   Global and         RI.11-12.2,       A-E12-U3-L2:    I-E12-U3-L2 (1-2
  Days 46-53   contemporary       RI.11-12.5        rubric-scored   flex days):
  (8)          voices: draft,     \[CA\],           draft           sentence/paragraph
               analyze craft, and RI.11-12.8        checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E12-U3-L3\   Global and         RI.11-12.3,       A-E12-U3-L3:    I-E12-U3-L3 (1-2
  Days 54-59   contemporary       RI.11-12.6,       publication,    flex days): revision
  (6)          voices: revise,    RI.11-12.9        seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 4. Research problem and sustained inquiry - 18 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E12-U4-L1\   Research problem   SL.11-12.1,       A-E12-U4-L1:    I-E12-U4-L1 (1-2
  Days 60-64   and sustained      W.11-12.1 \[CA\]  annotation +    flex days): guided
  (5)          inquiry: read,                       evidence        evidence selection
               annotate, discuss,                   response        and vocabulary
               and build                                            
               interpretations.                                     

  E12-U4-L2\   Research problem   SL.11-12.2        A-E12-U4-L2:    I-E12-U4-L2 (1-2
  Days 65-71   and sustained                        rubric-scored   flex days):
  (7)          inquiry: draft,                      draft           sentence/paragraph
               analyze craft, and                   checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E12-U4-L3\   Research problem   SL.11-12.3        A-E12-U4-L3:    I-E12-U4-L3 (1-2
  Days 72-77   and sustained                        publication,    flex days): revision
  (6)          inquiry: revise,                     seminar, or     conference and oral
               publish, present,                    portfolio       rehearsal
               and demonstrate                      evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 5. Evidence-based argument and publication - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E12-U5-L1\   Evidence-based     W.11-12.2 \[CA\], A-E12-U5-L1:    I-E12-U5-L1 (1-2
  Days 78-82   argument and       W.11-12.9         annotation +    flex days): guided
  (5)          publication: read,                   evidence        evidence selection
               annotate, discuss,                   response        and vocabulary
               and build                                            
               interpretations.                                     

  E12-U5-L2\   Evidence-based     W.11-12.7         A-E12-U5-L2:    I-E12-U5-L2 (1-2
  Days 83-90   argument and                         rubric-scored   flex days):
  (8)          publication:                         draft           sentence/paragraph
               draft, analyze                       checkpoint      scaffold and model
               craft, and                                           comparison
               strengthen                                           
               evidence.                                            

  E12-U5-L3\   Evidence-based     W.11-12.8 \[CA\]  A-E12-U5-L3:    I-E12-U5-L3 (1-2
  Days 91-96   argument and                         publication,    flex days): revision
  (6)          publication:                         seminar, or     conference and oral
               revise, publish,                     portfolio       rehearsal
               present, and                         evidence        
               demonstrate                                          
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 6. College, career, and civic communication - 19 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E12-U6-L1\   College, career,   L.11-12.1,        A-E12-U6-L1:    I-E12-U6-L1 (1-2
  Days 97-101  and civic          L.11-12.4 \[CA\], annotation +    flex days): guided
  (5)          communication:     W.11-12.3         evidence        evidence selection
               read, annotate,                      response        and vocabulary
               discuss, and build                                   
               interpretations.                                     

  E12-U6-L2\   College, career,   L.11-12.2,        A-E12-U6-L2:    I-E12-U6-L2 (1-2
  Days 102-109 and civic          L.11-12.5         rubric-scored   flex days):
  (8)          communication:                       draft           sentence/paragraph
               draft, analyze                       checkpoint      scaffold and model
               craft, and                                           comparison
               strengthen                                           
               evidence.                                            

  E12-U6-L3\   College, career,   L.11-12.3,        A-E12-U6-L3:    I-E12-U6-L3 (1-2
  Days 110-115 and civic          L.11-12.6         publication,    flex days): revision
  (6)          communication:                       seminar, or     conference and oral
               revise, publish,                     portfolio       rehearsal
               present, and                         evidence        
               demonstrate                                          
               transfer.                                            
  --------------------------------------------------------------------------------------

### Unit 7. Capstone portfolio and presentation - 20 core days

  --------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment    **Intervention
  core days**  sequence**         standards**       evidence**      lesson**
  ------------ ------------------ ----------------- --------------- --------------------
  E12-U7-L1\   Capstone portfolio SL.11-12.4        A-E12-U7-L1:    I-E12-U7-L1 (1-2
  Days 116-120 and presentation:  \[CA\],           annotation +    flex days): guided
  (5)          read, annotate,    W.11-12.4,        evidence        evidence selection
               discuss, and build W.11-12.10        response        and vocabulary
               interpretations.                                     

  E12-U7-L2\   Capstone portfolio SL.11-12.5,       A-E12-U7-L2:    I-E12-U7-L2 (1-2
  Days 121-129 and presentation:  W.11-12.5         rubric-scored   flex days):
  (9)          draft, analyze                       draft           sentence/paragraph
               craft, and                           checkpoint      scaffold and model
               strengthen                                           comparison
               evidence.                                            

  E12-U7-L3\   Capstone portfolio SL.11-12.6,       A-E12-U7-L3:    I-E12-U7-L3 (1-2
  Days 130-135 and presentation:  W.11-12.6         publication,    flex days): revision
  (6)          revise, publish,                     seminar, or     conference and oral
               present, and                         portfolio       rehearsal
               demonstrate                          evidence        
               transfer.                                            
  --------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 41 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Integrated Science 6

135 core lesson days \| 40 intervention-capacity days \| 37 primary
standards assignments \| 3 CA-tagged \| 2 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, safety, and evidence diagnostic - 3 core days

  ------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days** sequence**                                evidence**      
  ----------- ---------------- ------------------------ --------------- --------------------------
  S6-U0-L1\   Launch, safety,  Readiness/prerequisite   A-S6-U0-L1:     I-S6-U0-L1 (1-2 flex
  Days 1 (1)  and evidence     evidence; no new primary initial model + days): phenomenon
              diagnostic:      standard.                prediction      vocabulary and model-part
              launch the                                check           scaffold
              phenomenon and                                            
              construct an                                              
              initial model.                                            

  S6-U0-L2\   Launch, safety,  Readiness/prerequisite   A-S6-U0-L2:     I-S6-U0-L2 (1-2 flex
  Days 2 (1)  and evidence     evidence; no new primary investigation   days):
              diagnostic:      standard.                notebook + data variable/data-reading
              investigate,                              display         mini-investigation
              analyze data,                                             
              and revise                                                
              explanations.                                             

  S6-U0-L3\   Launch, safety,  Readiness/prerequisite   A-S6-U0-L3: CA  I-S6-U0-L3 (1-2 flex
  Days 3 (1)  and evidence     evidence; no new primary NGSS            days):
              diagnostic:      standard.                performance     claim-evidence-reasoning
              design, argue                             evidence task   reconstruction
              from evidence,                                            
              and complete                                              
              performance                                               
              evidence.                                                 
  ------------------------------------------------------------------------------------------------

### Unit 1. Systems, scale, and scientific modeling - 18 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S6-U1-L1\   Systems, scale,  MS-ETS1-1,        A-S6-U1-L1:     I-S6-U1-L1 (1-2 flex
  Days 4-8    and scientific   MS-ETS1-4         initial model + days): phenomenon
  (5)         modeling: launch                   prediction      vocabulary and model-part
              the phenomenon                     check           scaffold
              and construct an                                   
              initial model.                                     

  S6-U1-L2\   Systems, scale,  MS-ETS1-2,        A-S6-U1-L2:     I-S6-U1-L2 (1-2 flex
  Days 9-15   and scientific   RST.6-8.1         investigation   days):
  (7)         modeling:                          notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S6-U1-L3\   Systems, scale,  MS-ETS1-3,        A-S6-U1-L3: CA  I-S6-U1-L3 (1-2 flex
  Days 16-21  and scientific   WHST.6-8.1        NGSS            days):
  (6)         modeling:                          performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 2. Cells, organisms, and interacting body systems - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S6-U2-L1\   Cells,           MS-LS1-1 \[CA\],  A-S6-U2-L1:     I-S6-U2-L1 (1-2 flex
  Days 22-26  organisms, and   MS-LS1-4,         initial model + days): phenomenon
  (5)         interacting body RST.6-8.2         prediction      vocabulary and model-part
              systems: launch                    check           scaffold
              the phenomenon                                     
              and construct an                                   
              initial model.                                     

  S6-U2-L2\   Cells,           MS-LS1-2,         A-S6-U2-L2:     I-S6-U2-L2 (1-2 flex
  Days 27-34  organisms, and   MS-LS1-5,         investigation   days):
  (8)         interacting body WHST.6-8.2        notebook + data variable/data-reading
              systems:                           display         mini-investigation
              investigate,                                       
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S6-U2-L3\   Cells,           MS-LS1-3 \[CA\],  A-S6-U2-L3: CA  I-S6-U2-L3 (1-2 flex
  Days 35-40  organisms, and   MS-LS1-8          NGSS            days):
  (6)         interacting body                   performance     claim-evidence-reasoning
              systems: design,                   evidence task   reconstruction
              argue from                                         
              evidence, and                                      
              complete                                           
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 3. Reproduction, growth, and inheritance - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S6-U3-L1\   Reproduction,    MS-LS3-2          A-S6-U3-L1:     I-S6-U3-L1 (1-2 flex
  Days 41-45  growth, and                        initial model + days): phenomenon
  (5)         inheritance:                       prediction      vocabulary and model-part
              launch the                         check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S6-U3-L2\   Reproduction,    RST.6-8.3         A-S6-U3-L2:     I-S6-U3-L2 (1-2 flex
  Days 46-53  growth, and                        investigation   days):
  (8)         inheritance:                       notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S6-U3-L3\   Reproduction,    WHST.6-8.3        A-S6-U3-L3: CA  I-S6-U3-L3 (1-2 flex
  Days 54-59  growth, and                        NGSS            days):
  (6)         inheritance:                       performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 4. Water cycling, weather, and climate - 18 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S6-U4-L1\   Water cycling,   MS-ESS2-4,        A-S6-U4-L1:     I-S6-U4-L1 (1-2 flex
  Days 60-64  weather, and     RST.6-8.4         initial model + days): phenomenon
  (5)         climate: launch                    prediction      vocabulary and model-part
              the phenomenon                     check           scaffold
              and construct an                                   
              initial model.                                     

  S6-U4-L2\   Water cycling,   MS-ESS2-5,        A-S6-U4-L2:     I-S6-U4-L2 (1-2 flex
  Days 65-71  weather, and     WHST.6-8.4        investigation   days):
  (7)         climate:                           notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S6-U4-L3\   Water cycling,   MS-ESS2-6         A-S6-U4-L3: CA  I-S6-U4-L3 (1-2 flex
  Days 72-77  weather, and                       NGSS            days):
  (6)         climate: design,                   performance     claim-evidence-reasoning
              argue from                         evidence task   reconstruction
              evidence, and                                      
              complete                                           
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 5. Resources, human impacts, and sustainable systems - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S6-U5-L1\   Resources, human MS-ESS3-3 \[\*\]  A-S6-U5-L1:     I-S6-U5-L1 (1-2 flex
  Days 78-82  impacts, and                       initial model + days): phenomenon
  (5)         sustainable                        prediction      vocabulary and model-part
              systems: launch                    check           scaffold
              the phenomenon                                     
              and construct an                                   
              initial model.                                     

  S6-U5-L2\   Resources, human RST.6-8.5         A-S6-U5-L2:     I-S6-U5-L2 (1-2 flex
  Days 83-90  impacts, and                       investigation   days):
  (8)         sustainable                        notebook + data variable/data-reading
              systems:                           display         mini-investigation
              investigate,                                       
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S6-U5-L3\   Resources, human WHST.6-8.5        A-S6-U5-L3: CA  I-S6-U5-L3 (1-2 flex
  Days 91-96  impacts, and                       NGSS            days):
  (6)         sustainable                        performance     claim-evidence-reasoning
              systems: design,                   evidence task   reconstruction
              argue from                                         
              evidence, and                                      
              complete                                           
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 6. Thermal energy and engineered solutions - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S6-U6-L1\   Thermal energy   MS-PS3-3 \[\*\],  A-S6-U6-L1:     I-S6-U6-L1 (1-2 flex
  Days 97-101 and engineered   RST.6-8.7,        initial model + days): phenomenon
  (5)         solutions:       WHST.6-8.7        prediction      vocabulary and model-part
              launch the                         check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S6-U6-L2\   Thermal energy   MS-PS3-4,         A-S6-U6-L2:     I-S6-U6-L2 (1-2 flex
  Days        and engineered   RST.6-8.8,        investigation   days):
  102-109 (8) solutions:       WHST.6-8.8 \[CA\] notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S6-U6-L3\   Thermal energy   RST.6-8.6,        A-S6-U6-L3: CA  I-S6-U6-L3 (1-2 flex
  Days        and engineered   WHST.6-8.6        NGSS            days):
  110-115 (6) solutions:                         performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 7. Integrated investigation and mastery - 20 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S6-U7-L1\   Integrated       RST.6-8.9,        A-S6-U7-L1:     I-S6-U7-L1 (1-2 flex
  Days        investigation    WHST.6-8.10       initial model + days): phenomenon
  116-120 (5) and mastery:                       prediction      vocabulary and model-part
              launch the                         check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S6-U7-L2\   Integrated       RST.6-8.10        A-S6-U7-L2:     I-S6-U7-L2 (1-2 flex
  Days        investigation                      investigation   days):
  121-129 (9) and mastery:                       notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S6-U7-L3\   Integrated       WHST.6-8.9        A-S6-U7-L3: CA  I-S6-U7-L3 (1-2 flex
  Days        investigation                      NGSS            days):
  130-135 (6) and mastery:                       performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 37 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Integrated Science 7

135 core lesson days \| 40 intervention-capacity days \| 42 primary
standards assignments \| 3 CA-tagged \| 2 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, measurement, and diagnostic - 3 core days

  ------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days** sequence**                                evidence**      
  ----------- ---------------- ------------------------ --------------- --------------------------
  S7-U0-L1\   Launch,          Readiness/prerequisite   A-S7-U0-L1:     I-S7-U0-L1 (1-2 flex
  Days 1 (1)  measurement, and evidence; no new primary initial model + days): phenomenon
              diagnostic:      standard.                prediction      vocabulary and model-part
              launch the                                check           scaffold
              phenomenon and                                            
              construct an                                              
              initial model.                                            

  S7-U0-L2\   Launch,          Readiness/prerequisite   A-S7-U0-L2:     I-S7-U0-L2 (1-2 flex
  Days 2 (1)  measurement, and evidence; no new primary investigation   days):
              diagnostic:      standard.                notebook + data variable/data-reading
              investigate,                              display         mini-investigation
              analyze data,                                             
              and revise                                                
              explanations.                                             

  S7-U0-L3\   Launch,          Readiness/prerequisite   A-S7-U0-L3: CA  I-S7-U0-L3 (1-2 flex
  Days 3 (1)  measurement, and evidence; no new primary NGSS            days):
              diagnostic:      standard.                performance     claim-evidence-reasoning
              design, argue                             evidence task   reconstruction
              from evidence,                                            
              and complete                                              
              performance                                               
              evidence.                                                 
  ------------------------------------------------------------------------------------------------

### Unit 1. Matter, particles, and chemical reactions - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S7-U1-L1\   Matter,          MS-PS1-1,         A-S7-U1-L1:     I-S7-U1-L1 (1-2 flex
  Days 4-8    particles, and   MS-PS1-4,         initial model + days): phenomenon
  (5)         chemical         RST.6-8.1         prediction      vocabulary and model-part
              reactions:                         check           scaffold
              launch the                                         
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S7-U1-L2\   Matter,          MS-PS1-2,         A-S7-U1-L2:     I-S7-U1-L2 (1-2 flex
  Days 9-16   particles, and   MS-PS1-5,         investigation   days):
  (8)         chemical         WHST.6-8.1        notebook + data variable/data-reading
              reactions:                         display         mini-investigation
              investigate,                                       
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S7-U1-L3\   Matter,          MS-PS1-3,         A-S7-U1-L3: CA  I-S7-U1-L3 (1-2 flex
  Days 17-22  particles, and   MS-PS1-6          NGSS            days):
  (6)         chemical         \[CA,\*\]         performance     claim-evidence-reasoning
              reactions:                         evidence task   reconstruction
              design, argue                                      
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 2. Energy and matter in organisms - 18 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S7-U2-L1\   Energy and       MS-LS1-6,         A-S7-U2-L1:     I-S7-U2-L1 (1-2 flex
  Days 23-27  matter in        WHST.6-8.2        initial model + days): phenomenon
  (5)         organisms:                         prediction      vocabulary and model-part
              launch the                         check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S7-U2-L2\   Energy and       MS-LS1-7          A-S7-U2-L2:     I-S7-U2-L2 (1-2 flex
  Days 28-34  matter in                          investigation   days):
  (7)         organisms:                         notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S7-U2-L3\   Energy and       RST.6-8.2         A-S7-U2-L3: CA  I-S7-U2-L3 (1-2 flex
  Days 35-40  matter in                          NGSS            days):
  (6)         organisms:                         performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 3. Ecosystem interactions and population change - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S7-U3-L1\   Ecosystem        MS-LS2-1,         A-S7-U3-L1:     I-S7-U3-L1 (1-2 flex
  Days 41-45  interactions and MS-LS2-4,         initial model + days): phenomenon
  (5)         population       WHST.6-8.3        prediction      vocabulary and model-part
              change: launch                     check           scaffold
              the phenomenon                                     
              and construct an                                   
              initial model.                                     

  S7-U3-L2\   Ecosystem        MS-LS2-2,         A-S7-U3-L2:     I-S7-U3-L2 (1-2 flex
  Days 46-53  interactions and MS-LS2-5          investigation   days):
  (8)         population       \[CA,\*\]         notebook + data variable/data-reading
              change:                            display         mini-investigation
              investigate,                                       
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S7-U3-L3\   Ecosystem        MS-LS2-3,         A-S7-U3-L3: CA  I-S7-U3-L3 (1-2 flex
  Days 54-59  interactions and RST.6-8.3         NGSS            days):
  (6)         population                         performance     claim-evidence-reasoning
              change: design,                    evidence task   reconstruction
              argue from                                         
              evidence, and                                      
              complete                                           
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 4. Geologic processes and Earth history - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S7-U4-L1\   Geologic         MS-ESS2-1,        A-S7-U4-L1:     I-S7-U4-L1 (1-2 flex
  Days 60-64  processes and    RST.6-8.4         initial model + days): phenomenon
  (5)         Earth history:                     prediction      vocabulary and model-part
              launch the                         check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S7-U4-L2\   Geologic         MS-ESS2-2,        A-S7-U4-L2:     I-S7-U4-L2 (1-2 flex
  Days 65-72  processes and    WHST.6-8.4        investigation   days):
  (8)         Earth history:                     notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S7-U4-L3\   Geologic         MS-ESS2-3         A-S7-U4-L3: CA  I-S7-U4-L3 (1-2 flex
  Days 73-78  processes and                      NGSS            days):
  (6)         Earth history:                     performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 5. Natural resources, hazards, risk, and design - 18 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S7-U5-L1\   Natural          MS-ESS3-1,        A-S7-U5-L1:     I-S7-U5-L1 (1-2 flex
  Days 79-83  resources,       WHST.6-8.5        initial model + days): phenomenon
  (5)         hazards, risk,                     prediction      vocabulary and model-part
              and design:                        check           scaffold
              launch the                                         
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S7-U5-L2\   Natural          MS-ESS3-2         A-S7-U5-L2:     I-S7-U5-L2 (1-2 flex
  Days 84-90  resources,                         investigation   days):
  (7)         hazards, risk,                     notebook + data variable/data-reading
              and design:                        display         mini-investigation
              investigate,                                       
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S7-U5-L3\   Natural          RST.6-8.5         A-S7-U5-L3: CA  I-S7-U5-L3 (1-2 flex
  Days 91-96  resources,                         NGSS            days):
  (6)         hazards, risk,                     performance     claim-evidence-reasoning
              and design:                        evidence task   reconstruction
              design, argue                                      
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 6. Engineering criteria, resource systems, and solutions - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S7-U6-L1\   Engineering      MS-ETS1-1,        A-S7-U6-L1:     I-S7-U6-L1 (1-2 flex
  Days 97-101 criteria,        MS-ETS1-4,        initial model + days): phenomenon
  (5)         resource         RST.6-8.8,        prediction      vocabulary and model-part
              systems, and     WHST.6-8.8 \[CA\] check           scaffold
              solutions:                                         
              launch the                                         
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S7-U6-L2\   Engineering      MS-ETS1-2,        A-S7-U6-L2:     I-S7-U6-L2 (1-2 flex
  Days        criteria,        RST.6-8.6,        investigation   days):
  102-109 (8) resource         WHST.6-8.6        notebook + data variable/data-reading
              systems, and                       display         mini-investigation
              solutions:                                         
              investigate,                                       
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S7-U6-L3\   Engineering      MS-ETS1-3,        A-S7-U6-L3: CA  I-S7-U6-L3 (1-2 flex
  Days        criteria,        RST.6-8.7,        NGSS            days):
  110-115 (6) resource         WHST.6-8.7        performance     claim-evidence-reasoning
              systems, and                       evidence task   reconstruction
              solutions:                                         
              design, argue                                      
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 7. Integrated investigation and mastery - 20 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S7-U7-L1\   Integrated       RST.6-8.9,        A-S7-U7-L1:     I-S7-U7-L1 (1-2 flex
  Days        investigation    WHST.6-8.10       initial model + days): phenomenon
  116-120 (5) and mastery:                       prediction      vocabulary and model-part
              launch the                         check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S7-U7-L2\   Integrated       RST.6-8.10        A-S7-U7-L2:     I-S7-U7-L2 (1-2 flex
  Days        investigation                      investigation   days):
  121-129 (9) and mastery:                       notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S7-U7-L3\   Integrated       WHST.6-8.9        A-S7-U7-L3: CA  I-S7-U7-L3 (1-2 flex
  Days        investigation                      NGSS            days):
  130-135 (6) and mastery:                       performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 42 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Integrated Science 8

135 core lesson days \| 40 intervention-capacity days \| 46 primary
standards assignments \| 1 CA-tagged \| 1 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, models, and diagnostic - 3 core days

  ------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days** sequence**                                evidence**      
  ----------- ---------------- ------------------------ --------------- --------------------------
  S8-U0-L1\   Launch, models,  Readiness/prerequisite   A-S8-U0-L1:     I-S8-U0-L1 (1-2 flex
  Days 1 (1)  and diagnostic:  evidence; no new primary initial model + days): phenomenon
              launch the       standard.                prediction      vocabulary and model-part
              phenomenon and                            check           scaffold
              construct an                                              
              initial model.                                            

  S8-U0-L2\   Launch, models,  Readiness/prerequisite   A-S8-U0-L2:     I-S8-U0-L2 (1-2 flex
  Days 2 (1)  and diagnostic:  evidence; no new primary investigation   days):
              investigate,     standard.                notebook + data variable/data-reading
              analyze data,                             display         mini-investigation
              and revise                                                
              explanations.                                             

  S8-U0-L3\   Launch, models,  Readiness/prerequisite   A-S8-U0-L3: CA  I-S8-U0-L3 (1-2 flex
  Days 3 (1)  and diagnostic:  evidence; no new primary NGSS            days):
              design, argue    standard.                performance     claim-evidence-reasoning
              from evidence,                            evidence task   reconstruction
              and complete                                              
              performance                                               
              evidence.                                                 
  ------------------------------------------------------------------------------------------------

### Unit 1. Forces, motion, and interactions - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S8-U1-L1\   Forces, motion,  MS-PS2-1 \[\*\],  A-S8-U1-L1:     I-S8-U1-L1 (1-2 flex
  Days 4-8    and              MS-PS2-4,         initial model + days): phenomenon
  (5)         interactions:    WHST.6-8.1        prediction      vocabulary and model-part
              launch the                         check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S8-U1-L2\   Forces, motion,  MS-PS2-2,         A-S8-U1-L2:     I-S8-U1-L2 (1-2 flex
  Days 9-16   and              MS-PS2-5          investigation   days):
  (8)         interactions:                      notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S8-U1-L3\   Forces, motion,  MS-PS2-3,         A-S8-U1-L3: CA  I-S8-U1-L3 (1-2 flex
  Days 17-22  and              RST.6-8.1         NGSS            days):
  (6)         interactions:                      performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 2. Energy transfer and transformation - 18 core days

  ------------------------------------------------------------------------------------------
  **Lesson /  **Lesson          **Primary         **Assessment    **Intervention lesson**
  core days** sequence**        standards**       evidence**      
  ----------- ----------------- ----------------- --------------- --------------------------
  S8-U2-L1\   Energy transfer   MS-PS3-1,         A-S8-U2-L1:     I-S8-U2-L1 (1-2 flex
  Days 23-27  and               WHST.6-8.2        initial model + days): phenomenon
  (5)         transformation:                     prediction      vocabulary and model-part
              launch the                          check           scaffold
              phenomenon and                                      
              construct an                                        
              initial model.                                      

  S8-U2-L2\   Energy transfer   MS-PS3-2          A-S8-U2-L2:     I-S8-U2-L2 (1-2 flex
  Days 28-34  and                                 investigation   days):
  (7)         transformation:                     notebook + data variable/data-reading
              investigate,                        display         mini-investigation
              analyze data, and                                   
              revise                                              
              explanations.                                       

  S8-U2-L3\   Energy transfer   RST.6-8.2         A-S8-U2-L3: CA  I-S8-U2-L3 (1-2 flex
  Days 35-40  and                                 NGSS            days):
  (6)         transformation:                     performance     claim-evidence-reasoning
              design, argue                       evidence task   reconstruction
              from evidence,                                      
              and complete                                        
              performance                                         
              evidence.                                           
  ------------------------------------------------------------------------------------------

### Unit 3. Waves, information, and technology - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S8-U3-L1\   Waves,           MS-PS4-1,         A-S8-U3-L1:     I-S8-U3-L1 (1-2 flex
  Days 41-45  information, and RST.6-8.3         initial model + days): phenomenon
  (5)         technology:                        prediction      vocabulary and model-part
              launch the                         check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S8-U3-L2\   Waves,           MS-PS4-2,         A-S8-U3-L2:     I-S8-U3-L2 (1-2 flex
  Days 46-53  information, and WHST.6-8.3        investigation   days):
  (8)         technology:                        notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S8-U3-L3\   Waves,           MS-PS4-3          A-S8-U3-L3: CA  I-S8-U3-L3 (1-2 flex
  Days 54-59  information, and                   NGSS            days):
  (6)         technology:                        performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 4. Heredity, natural selection, and change - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S8-U4-L1\   Heredity,        MS-LS3-1,         A-S8-U4-L1:     I-S8-U4-L1 (1-2 flex
  Days 60-64  natural          MS-LS4-3,         initial model + days): phenomenon
  (5)         selection, and   MS-LS4-6          prediction      vocabulary and model-part
              change: launch                     check           scaffold
              the phenomenon                                     
              and construct an                                   
              initial model.                                     

  S8-U4-L2\   Heredity,        MS-LS4-1,         A-S8-U4-L2:     I-S8-U4-L2 (1-2 flex
  Days 65-72  natural          MS-LS4-4,         investigation   days):
  (8)         selection, and   RST.6-8.4         notebook + data variable/data-reading
              change:                            display         mini-investigation
              investigate,                                       
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S8-U4-L3\   Heredity,        MS-LS4-2,         A-S8-U4-L3: CA  I-S8-U4-L3 (1-2 flex
  Days 73-78  natural          MS-LS4-5,         NGSS            days):
  (6)         selection, and   WHST.6-8.4        performance     claim-evidence-reasoning
              change: design,                    evidence task   reconstruction
              argue from                                         
              evidence, and                                      
              complete                                           
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 5. Earth, solar systems, and the universe - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S8-U5-L1\   Earth, solar     MS-ESS1-1,        A-S8-U5-L1:     I-S8-U5-L1 (1-2 flex
  Days 79-83  systems, and the MS-ESS1-4         initial model + days): phenomenon
  (5)         universe: launch                   prediction      vocabulary and model-part
              the phenomenon                     check           scaffold
              and construct an                                   
              initial model.                                     

  S8-U5-L2\   Earth, solar     MS-ESS1-2,        A-S8-U5-L2:     I-S8-U5-L2 (1-2 flex
  Days 84-91  systems, and the RST.6-8.5         investigation   days):
  (8)         universe:                          notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S8-U5-L3\   Earth, solar     MS-ESS1-3,        A-S8-U5-L3: CA  I-S8-U5-L3 (1-2 flex
  Days 92-97  systems, and the WHST.6-8.5        NGSS            days):
  (6)         universe:                          performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 6. Human impacts and engineering decisions - 18 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S8-U6-L1\   Human impacts    MS-ESS3-4,        A-S8-U6-L1:     I-S8-U6-L1 (1-2 flex
  Days 98-102 and engineering  MS-ETS1-3,        initial model + days): phenomenon
  (5)         decisions:       RST.6-8.7,        prediction      vocabulary and model-part
              launch the       WHST.6-8.7        check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S8-U6-L2\   Human impacts    MS-ETS1-1,        A-S8-U6-L2:     I-S8-U6-L2 (1-2 flex
  Days        and engineering  MS-ETS1-4,        investigation   days):
  103-109 (7) decisions:       RST.6-8.8,        notebook + data variable/data-reading
              investigate,     WHST.6-8.8 \[CA\] display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S8-U6-L3\   Human impacts    MS-ETS1-2,        A-S8-U6-L3: CA  I-S8-U6-L3 (1-2 flex
  Days        and engineering  RST.6-8.6,        NGSS            days):
  110-115 (6) decisions:       WHST.6-8.6        performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 7. High-school readiness investigation - 20 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  S8-U7-L1\   High-school      RST.6-8.9,        A-S8-U7-L1:     I-S8-U7-L1 (1-2 flex
  Days        readiness        WHST.6-8.10       initial model + days): phenomenon
  116-120 (5) investigation:                     prediction      vocabulary and model-part
              launch the                         check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  S8-U7-L2\   High-school      RST.6-8.10        A-S8-U7-L2:     I-S8-U7-L2 (1-2 flex
  Days        readiness                          investigation   days):
  121-129 (9) investigation:                     notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  S8-U7-L3\   High-school      WHST.6-8.9        A-S8-U7-L3: CA  I-S8-U7-L3 (1-2 flex
  Days        readiness                          NGSS            days):
  130-135 (6) investigation:                     performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 46 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Living Earth

135 core lesson days \| 40 intervention-capacity days \| 56 primary
standards assignments \| 8 CA-tagged \| 2 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, laboratory practice, and diagnostic - 3 core days

  ------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days** sequence**                                evidence**      
  ----------- ---------------- ------------------------ --------------- --------------------------
  LE-U0-L1\   Launch,          Readiness/prerequisite   A-LE-U0-L1:     I-LE-U0-L1 (1-2 flex
  Days 1 (1)  laboratory       evidence; no new primary initial model + days): phenomenon
              practice, and    standard.                prediction      vocabulary and model-part
              diagnostic:                               check           scaffold
              launch the                                                
              phenomenon and                                            
              construct an                                              
              initial model.                                            

  LE-U0-L2\   Launch,          Readiness/prerequisite   A-LE-U0-L2:     I-LE-U0-L2 (1-2 flex
  Days 2 (1)  laboratory       evidence; no new primary investigation   days):
              practice, and    standard.                notebook + data variable/data-reading
              diagnostic:                               display         mini-investigation
              investigate,                                              
              analyze data,                                             
              and revise                                                
              explanations.                                             

  LE-U0-L3\   Launch,          Readiness/prerequisite   A-LE-U0-L3: CA  I-LE-U0-L3 (1-2 flex
  Days 3 (1)  laboratory       evidence; no new primary NGSS            days):
              practice, and    standard.                performance     claim-evidence-reasoning
              diagnostic:                               evidence task   reconstruction
              design, argue                                             
              from evidence,                                            
              and complete                                              
              performance                                               
              evidence.                                                 
  ------------------------------------------------------------------------------------------------

### Unit 1. Ecosystem interactions and energy - 19 core days

  ------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days** sequence**                                evidence**      
  ----------- ---------------- ------------------------ --------------- --------------------------
  LE-U1-L1\   Ecosystem        RST.9-10.1               A-LE-U1-L1:     I-LE-U1-L1 (1-2 flex
  Days 4-8    interactions and                          initial model + days): phenomenon
  (5)         energy: launch                            prediction      vocabulary and model-part
              the phenomenon                            check           scaffold
              and construct an                                          
              initial model.                                            

  LE-U1-L2\   Ecosystem        WHST.9-10.1              A-LE-U1-L2:     I-LE-U1-L2 (1-2 flex
  Days 9-16   interactions and                          investigation   days):
  (8)         energy:                                   notebook + data variable/data-reading
              investigate,                              display         mini-investigation
              analyze data,                                             
              and revise                                                
              explanations.                                             

  LE-U1-L3\   Ecosystem        Readiness/prerequisite   A-LE-U1-L3: CA  I-LE-U1-L3 (1-2 flex
  Days 17-22  interactions and evidence; no new primary NGSS            days):
  (6)         energy: design,  standard.                performance     claim-evidence-reasoning
              argue from                                evidence task   reconstruction
              evidence, and                                             
              complete                                                  
              performance                                               
              evidence.                                                 
  ------------------------------------------------------------------------------------------------

### Unit 2. Cycles of matter and Earth systems - 18 core days

  ------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days** sequence**                                evidence**      
  ----------- ---------------- ------------------------ --------------- --------------------------
  LE-U2-L1\   Cycles of matter RST.9-10.2               A-LE-U2-L1:     I-LE-U2-L1 (1-2 flex
  Days 23-27  and Earth                                 initial model + days): phenomenon
  (5)         systems: launch                           prediction      vocabulary and model-part
              the phenomenon                            check           scaffold
              and construct an                                          
              initial model.                                            

  LE-U2-L2\   Cycles of matter WHST.9-10.2              A-LE-U2-L2:     I-LE-U2-L2 (1-2 flex
  Days 28-34  and Earth                                 investigation   days):
  (7)         systems:                                  notebook + data variable/data-reading
              investigate,                              display         mini-investigation
              analyze data,                                             
              and revise                                                
              explanations.                                             

  LE-U2-L3\   Cycles of matter Readiness/prerequisite   A-LE-U2-L3: CA  I-LE-U2-L3 (1-2 flex
  Days 35-40  and Earth        evidence; no new primary NGSS            days):
  (6)         systems: design, standard.                performance     claim-evidence-reasoning
              argue from                                evidence task   reconstruction
              evidence, and                                             
              complete                                                  
              performance                                               
              evidence.                                                 
  ------------------------------------------------------------------------------------------------

### Unit 3. Cells, structure, and function - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  LE-U3-L1\   Cells,           HS-LS1-1,         A-LE-U3-L1:     I-LE-U3-L1 (1-2 flex
  Days 41-45  structure, and   HS-LS1-4,         initial model + days): phenomenon
  (5)         function: launch HS-LS1-7          prediction      vocabulary and model-part
              the phenomenon                     check           scaffold
              and construct an                                   
              initial model.                                     

  LE-U3-L2\   Cells,           HS-LS1-2,         A-LE-U3-L2:     I-LE-U3-L2 (1-2 flex
  Days 46-53  structure, and   HS-LS1-5 \[CA\],  investigation   days):
  (8)         function:        RST.9-10.3        notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  LE-U3-L3\   Cells,           HS-LS1-3,         A-LE-U3-L3: CA  I-LE-U3-L3 (1-2 flex
  Days 54-59  structure, and   HS-LS1-6,         NGSS            days):
  (6)         function:        WHST.9-10.3       performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 4. Genetics, inheritance, and information - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  LE-U4-L1\   Genetics,        HS-LS3-1 \[CA\],  A-LE-U4-L1:     I-LE-U4-L1 (1-2 flex
  Days 60-64  inheritance, and RST.9-10.4        initial model + days): phenomenon
  (5)         information:                       prediction      vocabulary and model-part
              launch the                         check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  LE-U4-L2\   Genetics,        HS-LS3-2,         A-LE-U4-L2:     I-LE-U4-L2 (1-2 flex
  Days 65-72  inheritance, and WHST.9-10.4       investigation   days):
  (8)         information:                       notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  LE-U4-L3\   Genetics,        HS-LS3-3          A-LE-U4-L3: CA  I-LE-U4-L3 (1-2 flex
  Days 73-78  inheritance, and                   NGSS            days):
  (6)         information:                       performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 5. Evolution, biodiversity, and evidence - 19 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  LE-U5-L1\   Evolution,       HS-ESS1-5,        A-LE-U5-L1:     I-LE-U5-L1 (1-2 flex
  Days 79-83  biodiversity,    HS-LS4-2,         initial model + days): phenomenon
  (5)         and evidence:    HS-LS4-5,         prediction      vocabulary and model-part
              launch the       WHST.9-10.5       check           scaffold
              phenomenon and                                     
              construct an                                       
              initial model.                                     

  LE-U5-L2\   Evolution,       HS-ESS1-6 \[CA\], A-LE-U5-L2:     I-LE-U5-L2 (1-2 flex
  Days 84-91  biodiversity,    HS-LS4-3,         investigation   days):
  (8)         and evidence:    HS-LS4-6 \[CA\]   notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  LE-U5-L3\   Evolution,       HS-LS4-1,         A-LE-U5-L3: CA  I-LE-U5-L3 (1-2 flex
  Days 92-97  biodiversity,    HS-LS4-4,         NGSS            days):
  (6)         and evidence:    RST.9-10.5        performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 6. Human activity, climate, and ecosystems - 18 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  LE-U6-L1\   Human activity,  HS-ESS2-2,        A-LE-U6-L1:     I-LE-U6-L1 (1-2 flex
  Days 98-102 climate, and     HS-ESS3-4         initial model + days): phenomenon
  (5)         ecosystems:      \[CA,\*\],        prediction      vocabulary and model-part
              launch the       HS-LS2-1,         check           scaffold
              phenomenon and   HS-LS2-4,                         
              construct an     HS-LS2-7 \[\*\],                  
              initial model.   RST.9-10.7,                       
                               WHST.9-10.7                       

  LE-U6-L2\   Human activity,  HS-ESS2-6 \[CA\], A-LE-U6-L2:     I-LE-U6-L2 (1-2 flex
  Days        climate, and     HS-ESS3-5,        investigation   days):
  103-109 (7) ecosystems:      HS-LS2-2,         notebook + data variable/data-reading
              investigate,     HS-LS2-5,         display         mini-investigation
              analyze data,    HS-LS2-8 \[CA\],                  
              and revise       RST.9-10.8,                       
              explanations.    WHST.9-10.8                       
                               \[CA\]                            

  LE-U6-L3\   Human activity,  HS-ESS2-7,        A-LE-U6-L3: CA  I-LE-U6-L3 (1-2 flex
  Days        climate, and     HS-ESS3-6,        NGSS            days):
  110-115 (6) ecosystems:      HS-LS2-3,         performance     claim-evidence-reasoning
              design, argue    HS-LS2-6,         evidence task   reconstruction
              from evidence,   RST.9-10.6,                       
              and complete     WHST.9-10.6                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

### Unit 7. Living Earth performance capstone - 20 core days

  -----------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days** sequence**       standards**       evidence**      
  ----------- ---------------- ----------------- --------------- --------------------------
  LE-U7-L1\   Living Earth     HS-ETS1-1,        A-LE-U7-L1:     I-LE-U7-L1 (1-2 flex
  Days        performance      HS-ETS1-4,        initial model + days): phenomenon
  116-120 (5) capstone: launch WHST.9-10.9       prediction      vocabulary and model-part
              the phenomenon                     check           scaffold
              and construct an                                   
              initial model.                                     

  LE-U7-L2\   Living Earth     HS-ETS1-2,        A-LE-U7-L2:     I-LE-U7-L2 (1-2 flex
  Days        performance      RST.9-10.9,       investigation   days):
  121-129 (9) capstone:        WHST.9-10.10      notebook + data variable/data-reading
              investigate,                       display         mini-investigation
              analyze data,                                      
              and revise                                         
              explanations.                                      

  LE-U7-L3\   Living Earth     HS-ETS1-3,        A-LE-U7-L3: CA  I-LE-U7-L3 (1-2 flex
  Days        performance      RST.9-10.10       NGSS            days):
  130-135 (6) capstone:                          performance     claim-evidence-reasoning
              design, argue                      evidence task   reconstruction
              from evidence,                                     
              and complete                                       
              performance                                        
              evidence.                                          
  -----------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 56 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Chemistry in the Earth System

135 core lesson days \| 40 intervention-capacity days \| 43 primary
standards assignments \| 5 CA-tagged \| 2 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, measurement, and diagnostic - 3 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days**   sequence**                                evidence**      
  ------------- ---------------- ------------------------ --------------- --------------------------
  CHEM-U0-L1\   Launch,          Readiness/prerequisite   A-CHEM-U0-L1:   I-CHEM-U0-L1 (1-2 flex
  Days 1 (1)    measurement, and evidence; no new primary initial model + days): phenomenon
                diagnostic:      standard.                prediction      vocabulary and model-part
                launch the                                check           scaffold
                phenomenon and                                            
                construct an                                              
                initial model.                                            

  CHEM-U0-L2\   Launch,          Readiness/prerequisite   A-CHEM-U0-L2:   I-CHEM-U0-L2 (1-2 flex
  Days 2 (1)    measurement, and evidence; no new primary investigation   days):
                diagnostic:      standard.                notebook + data variable/data-reading
                investigate,                              display         mini-investigation
                analyze data,                                             
                and revise                                                
                explanations.                                             

  CHEM-U0-L3\   Launch,          Readiness/prerequisite   A-CHEM-U0-L3:   I-CHEM-U0-L3 (1-2 flex
  Days 3 (1)    measurement, and evidence; no new primary CA NGSS         days):
                diagnostic:      standard.                performance     claim-evidence-reasoning
                design, argue                             evidence task   reconstruction
                from evidence,                                            
                and complete                                              
                performance                                               
                evidence.                                                 
  --------------------------------------------------------------------------------------------------

### Unit 1. Atomic structure and properties of matter - 19 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days**   sequence**                                evidence**      
  ------------- ---------------- ------------------------ --------------- --------------------------
  CHEM-U1-L1\   Atomic structure RST.9-10.1               A-CHEM-U1-L1:   I-CHEM-U1-L1 (1-2 flex
  Days 4-8 (5)  and properties                            initial model + days): phenomenon
                of matter:                                prediction      vocabulary and model-part
                launch the                                check           scaffold
                phenomenon and                                            
                construct an                                              
                initial model.                                            

  CHEM-U1-L2\   Atomic structure WHST.9-10.1              A-CHEM-U1-L2:   I-CHEM-U1-L2 (1-2 flex
  Days 9-16 (8) and properties                            investigation   days):
                of matter:                                notebook + data variable/data-reading
                investigate,                              display         mini-investigation
                analyze data,                                             
                and revise                                                
                explanations.                                             

  CHEM-U1-L3\   Atomic structure Readiness/prerequisite   A-CHEM-U1-L3:   I-CHEM-U1-L3 (1-2 flex
  Days 17-22    and properties   evidence; no new primary CA NGSS         days):
  (6)           of matter:       standard.                performance     claim-evidence-reasoning
                design, argue                             evidence task   reconstruction
                from evidence,                                            
                and complete                                              
                performance                                               
                evidence.                                                 
  --------------------------------------------------------------------------------------------------

### Unit 2. Bonding, structure, and material properties - 18 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days**   sequence**                                evidence**      
  ------------- ---------------- ------------------------ --------------- --------------------------
  CHEM-U2-L1\   Bonding,         RST.9-10.2               A-CHEM-U2-L1:   I-CHEM-U2-L1 (1-2 flex
  Days 23-27    structure, and                            initial model + days): phenomenon
  (5)           material                                  prediction      vocabulary and model-part
                properties:                               check           scaffold
                launch the                                                
                phenomenon and                                            
                construct an                                              
                initial model.                                            

  CHEM-U2-L2\   Bonding,         WHST.9-10.2              A-CHEM-U2-L2:   I-CHEM-U2-L2 (1-2 flex
  Days 28-34    structure, and                            investigation   days):
  (7)           material                                  notebook + data variable/data-reading
                properties:                               display         mini-investigation
                investigate,                                              
                analyze data,                                             
                and revise                                                
                explanations.                                             

  CHEM-U2-L3\   Bonding,         Readiness/prerequisite   A-CHEM-U2-L3:   I-CHEM-U2-L3 (1-2 flex
  Days 35-40    structure, and   evidence; no new primary CA NGSS         days):
  (6)           material         standard.                performance     claim-evidence-reasoning
                properties:                               evidence task   reconstruction
                design, argue                                             
                from evidence,                                            
                and complete                                              
                performance                                               
                evidence.                                                 
  --------------------------------------------------------------------------------------------------

### Unit 3. Chemical reactions and conservation - 19 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days**   sequence**                                evidence**      
  ------------- ---------------- ------------------------ --------------- --------------------------
  CHEM-U3-L1\   Chemical         RST.9-10.3               A-CHEM-U3-L1:   I-CHEM-U3-L1 (1-2 flex
  Days 41-45    reactions and                             initial model + days): phenomenon
  (5)           conservation:                             prediction      vocabulary and model-part
                launch the                                check           scaffold
                phenomenon and                                            
                construct an                                              
                initial model.                                            

  CHEM-U3-L2\   Chemical         WHST.9-10.3              A-CHEM-U3-L2:   I-CHEM-U3-L2 (1-2 flex
  Days 46-53    reactions and                             investigation   days):
  (8)           conservation:                             notebook + data variable/data-reading
                investigate,                              display         mini-investigation
                analyze data,                                             
                and revise                                                
                explanations.                                             

  CHEM-U3-L3\   Chemical         Readiness/prerequisite   A-CHEM-U3-L3:   I-CHEM-U3-L3 (1-2 flex
  Days 54-59    reactions and    evidence; no new primary CA NGSS         days):
  (6)           conservation:    standard.                performance     claim-evidence-reasoning
                design, argue                             evidence task   reconstruction
                from evidence,                                            
                and complete                                              
                performance                                               
                evidence.                                                 
  --------------------------------------------------------------------------------------------------

### Unit 4. Energy in chemical and Earth systems - 19 core days

  -------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**   sequence**       standards**       evidence**      
  ------------- ---------------- ----------------- --------------- --------------------------
  CHEM-U4-L1\   Energy in        HS-ESS2-2,        A-CHEM-U4-L1:   I-CHEM-U4-L1 (1-2 flex
  Days 60-64    chemical and     HS-ESS2-5 \[CA\], initial model + days): phenomenon
  (5)           Earth systems:   HS-PS3-2,         prediction      vocabulary and model-part
                launch the       WHST.9-10.4       check           scaffold
                phenomenon and                                     
                construct an                                       
                initial model.                                     

  CHEM-U4-L2\   Energy in        HS-ESS2-3,        A-CHEM-U4-L2:   I-CHEM-U4-L2 (1-2 flex
  Days 65-72    chemical and     HS-ESS2-6 \[CA\], investigation   days):
  (8)           Earth systems:   HS-PS3-4          notebook + data variable/data-reading
                investigate,                       display         mini-investigation
                analyze data,                                      
                and revise                                         
                explanations.                                      

  CHEM-U4-L3\   Energy in        HS-ESS2-4,        A-CHEM-U4-L3:   I-CHEM-U4-L3 (1-2 flex
  Days 73-78    chemical and     HS-PS3-1,         CA NGSS         days):
  (6)           Earth systems:   RST.9-10.4        performance     claim-evidence-reasoning
                design, argue                      evidence task   reconstruction
                from evidence,                                     
                and complete                                       
                performance                                        
                evidence.                                          
  -------------------------------------------------------------------------------------------

### Unit 5. Rates, equilibrium, and dynamic systems - 18 core days

  -------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**   sequence**       standards**       evidence**      
  ------------- ---------------- ----------------- --------------- --------------------------
  CHEM-U5-L1\   Rates,           HS-PS1-1,         A-CHEM-U5-L1:   I-CHEM-U5-L1 (1-2 flex
  Days 79-83    equilibrium, and HS-PS1-4,         initial model + days): phenomenon
  (5)           dynamic systems: HS-PS1-7,         prediction      vocabulary and model-part
                launch the       WHST.9-10.5       check           scaffold
                phenomenon and                                     
                construct an                                       
                initial model.                                     

  CHEM-U5-L2\   Rates,           HS-PS1-2,         A-CHEM-U5-L2:   I-CHEM-U5-L2 (1-2 flex
  Days 84-90    equilibrium, and HS-PS1-5,         investigation   days):
  (7)           dynamic systems: HS-PS1-8          notebook + data variable/data-reading
                investigate,                       display         mini-investigation
                analyze data,                                      
                and revise                                         
                explanations.                                      

  CHEM-U5-L3\   Rates,           HS-PS1-3,         A-CHEM-U5-L3:   I-CHEM-U5-L3 (1-2 flex
  Days 91-96    equilibrium, and HS-PS1-6          CA NGSS         days):
  (6)           dynamic systems: \[CA,\*\],        performance     claim-evidence-reasoning
                design, argue    RST.9-10.5        evidence task   reconstruction
                from evidence,                                     
                and complete                                       
                performance                                        
                evidence.                                          
  -------------------------------------------------------------------------------------------

### Unit 6. Resources, atmosphere, and human impacts - 19 core days

  -------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**   sequence**       standards**       evidence**      
  ------------- ---------------- ----------------- --------------- --------------------------
  CHEM-U6-L1\   Resources,       HS-ESS3-1,        A-CHEM-U6-L1:   I-CHEM-U6-L1 (1-2 flex
  Days 97-101   atmosphere, and  RST.9-10.6,       initial model + days): phenomenon
  (5)           human impacts:   WHST.9-10.6       prediction      vocabulary and model-part
                launch the                         check           scaffold
                phenomenon and                                     
                construct an                                       
                initial model.                                     

  CHEM-U6-L2\   Resources,       HS-ESS3-4         A-CHEM-U6-L2:   I-CHEM-U6-L2 (1-2 flex
  Days 102-109  atmosphere, and  \[CA,\*\],        investigation   days):
  (8)           human impacts:   RST.9-10.7,       notebook + data variable/data-reading
                investigate,     WHST.9-10.7       display         mini-investigation
                analyze data,                                      
                and revise                                         
                explanations.                                      

  CHEM-U6-L3\   Resources,       HS-ESS3-5,        A-CHEM-U6-L3:   I-CHEM-U6-L3 (1-2 flex
  Days 110-115  atmosphere, and  RST.9-10.8,       CA NGSS         days):
  (6)           human impacts:   WHST.9-10.8       performance     claim-evidence-reasoning
                design, argue    \[CA\]            evidence task   reconstruction
                from evidence,                                     
                and complete                                       
                performance                                        
                evidence.                                          
  -------------------------------------------------------------------------------------------

### Unit 7. Chemistry performance capstone - 20 core days

  -------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**   sequence**       standards**       evidence**      
  ------------- ---------------- ----------------- --------------- --------------------------
  CHEM-U7-L1\   Chemistry        HS-ETS1-1,        A-CHEM-U7-L1:   I-CHEM-U7-L1 (1-2 flex
  Days 116-120  performance      HS-ETS1-4,        initial model + days): phenomenon
  (5)           capstone: launch WHST.9-10.9       prediction      vocabulary and model-part
                the phenomenon                     check           scaffold
                and construct an                                   
                initial model.                                     

  CHEM-U7-L2\   Chemistry        HS-ETS1-2,        A-CHEM-U7-L2:   I-CHEM-U7-L2 (1-2 flex
  Days 121-129  performance      RST.9-10.9,       investigation   days):
  (9)           capstone:        WHST.9-10.10      notebook + data variable/data-reading
                investigate,                       display         mini-investigation
                analyze data,                                      
                and revise                                         
                explanations.                                      

  CHEM-U7-L3\   Chemistry        HS-ETS1-3,        A-CHEM-U7-L3:   I-CHEM-U7-L3 (1-2 flex
  Days 130-135  performance      RST.9-10.10       CA NGSS         days):
  (6)           capstone:                          performance     claim-evidence-reasoning
                design, argue                      evidence task   reconstruction
                from evidence,                                     
                and complete                                       
                performance                                        
                evidence.                                          
  -------------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 43 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Physics of the Universe

135 core lesson days \| 40 intervention-capacity days \| 49 primary
standards assignments \| 4 CA-tagged \| 5 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Launch, mathematical models, and diagnostic - 3 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days**   sequence**                                evidence**      
  ------------- ---------------- ------------------------ --------------- --------------------------
  PHYS-U0-L1\   Launch,          Readiness/prerequisite   A-PHYS-U0-L1:   I-PHYS-U0-L1 (1-2 flex
  Days 1 (1)    mathematical     evidence; no new primary initial model + days): phenomenon
                models, and      standard.                prediction      vocabulary and model-part
                diagnostic:                               check           scaffold
                launch the                                                
                phenomenon and                                            
                construct an                                              
                initial model.                                            

  PHYS-U0-L2\   Launch,          Readiness/prerequisite   A-PHYS-U0-L2:   I-PHYS-U0-L2 (1-2 flex
  Days 2 (1)    mathematical     evidence; no new primary investigation   days):
                models, and      standard.                notebook + data variable/data-reading
                diagnostic:                               display         mini-investigation
                investigate,                                              
                analyze data,                                             
                and revise                                                
                explanations.                                             

  PHYS-U0-L3\   Launch,          Readiness/prerequisite   A-PHYS-U0-L3:   I-PHYS-U0-L3 (1-2 flex
  Days 3 (1)    mathematical     evidence; no new primary CA NGSS         days):
                models, and      standard.                performance     claim-evidence-reasoning
                diagnostic:                               evidence task   reconstruction
                design, argue                                             
                from evidence,                                            
                and complete                                              
                performance                                               
                evidence.                                                 
  --------------------------------------------------------------------------------------------------

### Unit 1. Forces, motion, momentum, and collisions - 19 core days

  -------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**   sequence**       standards**       evidence**      
  ------------- ---------------- ----------------- --------------- --------------------------
  PHYS-U1-L1\   Forces, motion,  HS-PS2-1,         A-PHYS-U1-L1:   I-PHYS-U1-L1 (1-2 flex
  Days 4-8 (5)  momentum, and    HS-PS2-4,         initial model + days): phenomenon
                collisions:      RST.11-12.1       prediction      vocabulary and model-part
                launch the                         check           scaffold
                phenomenon and                                     
                construct an                                       
                initial model.                                     

  PHYS-U1-L2\   Forces, motion,  HS-PS2-2,         A-PHYS-U1-L2:   I-PHYS-U1-L2 (1-2 flex
  Days 9-16 (8) momentum, and    HS-PS2-5,         investigation   days):
                collisions:      WHST.11-12.1      notebook + data variable/data-reading
                investigate,                       display         mini-investigation
                analyze data,                                      
                and revise                                         
                explanations.                                      

  PHYS-U1-L3\   Forces, motion,  HS-PS2-3 \[\*\],  A-PHYS-U1-L3:   I-PHYS-U1-L3 (1-2 flex
  Days 17-22    momentum, and    HS-PS2-6          CA NGSS         days):
  (6)           collisions:      \[CA,\*\]         performance     claim-evidence-reasoning
                design, argue                      evidence task   reconstruction
                from evidence,                                     
                and complete                                       
                performance                                        
                evidence.                                          
  -------------------------------------------------------------------------------------------

### Unit 2. Forces at a distance, fields, and orbits - 18 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days**   sequence**                                evidence**      
  ------------- ---------------- ------------------------ --------------- --------------------------
  PHYS-U2-L1\   Forces at a      RST.11-12.2              A-PHYS-U2-L1:   I-PHYS-U2-L1 (1-2 flex
  Days 23-27    distance,                                 initial model + days): phenomenon
  (5)           fields, and                               prediction      vocabulary and model-part
                orbits: launch                            check           scaffold
                the phenomenon                                            
                and construct an                                          
                initial model.                                            

  PHYS-U2-L2\   Forces at a      WHST.11-12.2             A-PHYS-U2-L2:   I-PHYS-U2-L2 (1-2 flex
  Days 28-34    distance,                                 investigation   days):
  (7)           fields, and                               notebook + data variable/data-reading
                orbits:                                   display         mini-investigation
                investigate,                                              
                analyze data,                                             
                and revise                                                
                explanations.                                             

  PHYS-U2-L3\   Forces at a      Readiness/prerequisite   A-PHYS-U2-L3:   I-PHYS-U2-L3 (1-2 flex
  Days 35-40    distance,        evidence; no new primary CA NGSS         days):
  (6)           fields, and      standard.                performance     claim-evidence-reasoning
                orbits: design,                           evidence task   reconstruction
                argue from                                                
                evidence, and                                             
                complete                                                  
                performance                                               
                evidence.                                                 
  --------------------------------------------------------------------------------------------------

### Unit 3. Energy conversion, electricity, and magnetism - 19 core days

  -------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**   sequence**       standards**       evidence**      
  ------------- ---------------- ----------------- --------------- --------------------------
  PHYS-U3-L1\   Energy           HS-ESS3-2 \[\*\], A-PHYS-U3-L1:   I-PHYS-U3-L1 (1-2 flex
  Days 41-45    conversion,      HS-PS3-2,         initial model + days): phenomenon
  (5)           electricity, and HS-PS3-5 \[CA\]   prediction      vocabulary and model-part
                magnetism:                         check           scaffold
                launch the                                         
                phenomenon and                                     
                construct an                                       
                initial model.                                     

  PHYS-U3-L2\   Energy           HS-ESS3-3,        A-PHYS-U3-L2:   I-PHYS-U3-L2 (1-2 flex
  Days 46-53    conversion,      HS-PS3-3 \[\*\],  investigation   days):
  (8)           electricity, and RST.11-12.3       notebook + data variable/data-reading
                magnetism:                         display         mini-investigation
                investigate,                                       
                analyze data,                                      
                and revise                                         
                explanations.                                      

  PHYS-U3-L3\   Energy           HS-PS3-1,         A-PHYS-U3-L3:   I-PHYS-U3-L3 (1-2 flex
  Days 54-59    conversion,      HS-PS3-4,         CA NGSS         days):
  (6)           electricity, and WHST.11-12.3      performance     claim-evidence-reasoning
                magnetism:                         evidence task   reconstruction
                design, argue                                      
                from evidence,                                     
                and complete                                       
                performance                                        
                evidence.                                          
  -------------------------------------------------------------------------------------------

### Unit 4. Nuclear processes and Earth history - 19 core days

  -------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**   sequence**       standards**       evidence**      
  ------------- ---------------- ----------------- --------------- --------------------------
  PHYS-U4-L1\   Nuclear          HS-ESS2-1         A-PHYS-U4-L1:   I-PHYS-U4-L1 (1-2 flex
  Days 60-64    processes and                      initial model + days): phenomenon
  (5)           Earth history:                     prediction      vocabulary and model-part
                launch the                         check           scaffold
                phenomenon and                                     
                construct an                                       
                initial model.                                     

  PHYS-U4-L2\   Nuclear          RST.11-12.4       A-PHYS-U4-L2:   I-PHYS-U4-L2 (1-2 flex
  Days 65-72    processes and                      investigation   days):
  (8)           Earth history:                     notebook + data variable/data-reading
                investigate,                       display         mini-investigation
                analyze data,                                      
                and revise                                         
                explanations.                                      

  PHYS-U4-L3\   Nuclear          WHST.11-12.4      A-PHYS-U4-L3:   I-PHYS-U4-L3 (1-2 flex
  Days 73-78    processes and                      CA NGSS         days):
  (6)           Earth history:                     performance     claim-evidence-reasoning
                design, argue                      evidence task   reconstruction
                from evidence,                                     
                and complete                                       
                performance                                        
                evidence.                                          
  -------------------------------------------------------------------------------------------

### Unit 5. Waves, electromagnetic radiation, and information - 19 core days

  --------------------------------------------------------------------------------------------
  **Lesson /    **Lesson          **Primary         **Assessment    **Intervention lesson**
  core days**   sequence**        standards**       evidence**      
  ------------- ----------------- ----------------- --------------- --------------------------
  PHYS-U5-L1\   Waves,            HS-PS4-1,         A-PHYS-U5-L1:   I-PHYS-U5-L1 (1-2 flex
  Days 79-83    electromagnetic   HS-PS4-4,         initial model + days): phenomenon
  (5)           radiation, and    WHST.11-12.5      prediction      vocabulary and model-part
                information:                        check           scaffold
                launch the                                          
                phenomenon and                                      
                construct an                                        
                initial model.                                      

  PHYS-U5-L2\   Waves,            HS-PS4-2,         A-PHYS-U5-L2:   I-PHYS-U5-L2 (1-2 flex
  Days 84-91    electromagnetic   HS-PS4-5          investigation   days):
  (8)           radiation, and    \[CA,\*\]         notebook + data variable/data-reading
                information:                        display         mini-investigation
                investigate,                                        
                analyze data, and                                   
                revise                                              
                explanations.                                       

  PHYS-U5-L3\   Waves,            HS-PS4-3,         A-PHYS-U5-L3:   I-PHYS-U5-L3 (1-2 flex
  Days 92-97    electromagnetic   RST.11-12.5       CA NGSS         days):
  (6)           radiation, and                      performance     claim-evidence-reasoning
                information:                        evidence task   reconstruction
                design, argue                                       
                from evidence,                                      
                and complete                                        
                performance                                         
                evidence.                                           
  --------------------------------------------------------------------------------------------

### Unit 6. Stars, cosmology, and universe evolution - 18 core days

  -------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**   sequence**       standards**       evidence**      
  ------------- ---------------- ----------------- --------------- --------------------------
  PHYS-U6-L1\   Stars,           HS-ESS1-1,        A-PHYS-U6-L1:   I-PHYS-U6-L1 (1-2 flex
  Days 98-102   cosmology, and   HS-ESS1-4,        initial model + days): phenomenon
  (5)           universe         RST.11-12.6,      prediction      vocabulary and model-part
                evolution:       WHST.11-12.6      check           scaffold
                launch the                                         
                phenomenon and                                     
                construct an                                       
                initial model.                                     

  PHYS-U6-L2\   Stars,           HS-ESS1-2,        A-PHYS-U6-L2:   I-PHYS-U6-L2 (1-2 flex
  Days 103-109  cosmology, and   HS-ESS1-5,        investigation   days):
  (7)           universe         RST.11-12.7,      notebook + data variable/data-reading
                evolution:       WHST.11-12.7      display         mini-investigation
                investigate,                                       
                analyze data,                                      
                and revise                                         
                explanations.                                      

  PHYS-U6-L3\   Stars,           HS-ESS1-3,        A-PHYS-U6-L3:   I-PHYS-U6-L3 (1-2 flex
  Days 110-115  cosmology, and   HS-ESS1-6 \[CA\], CA NGSS         days):
  (6)           universe         RST.11-12.8,      performance     claim-evidence-reasoning
                evolution:       WHST.11-12.8      evidence task   reconstruction
                design, argue                                      
                from evidence,                                     
                and complete                                       
                performance                                        
                evidence.                                          
  -------------------------------------------------------------------------------------------

### Unit 7. Physics performance capstone - 20 core days

  -------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**   sequence**       standards**       evidence**      
  ------------- ---------------- ----------------- --------------- --------------------------
  PHYS-U7-L1\   Physics          HS-ETS1-1,        A-PHYS-U7-L1:   I-PHYS-U7-L1 (1-2 flex
  Days 116-120  performance      HS-ETS1-4,        initial model + days): phenomenon
  (5)           capstone: launch WHST.11-12.9      prediction      vocabulary and model-part
                the phenomenon                     check           scaffold
                and construct an                                   
                initial model.                                     

  PHYS-U7-L2\   Physics          HS-ETS1-2,        A-PHYS-U7-L2:   I-PHYS-U7-L2 (1-2 flex
  Days 121-129  performance      RST.11-12.9,      investigation   days):
  (9)           capstone:        WHST.11-12.10     notebook + data variable/data-reading
                investigate,                       display         mini-investigation
                analyze data,                                      
                and revise                                         
                explanations.                                      

  PHYS-U7-L3\   Physics          HS-ETS1-3,        A-PHYS-U7-L3:   I-PHYS-U7-L3 (1-2 flex
  Days 130-135  performance      RST.11-12.10      CA NGSS         days):
  (6)           capstone:                          performance     claim-evidence-reasoning
                design, argue                      evidence task   reconstruction
                from evidence,                                     
                and complete                                       
                performance                                        
                evidence.                                          
  -------------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 49 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Environmental Science

135 core lesson days \| 40 intervention-capacity days \| 54 primary
standards assignments \| 5 CA-tagged \| 3 starred/modeling \| 0 advanced
(+) \| 8 local extensions

### Unit 0. Launch, systems thinking, and diagnostic - 3 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary standards**    **Assessment    **Intervention lesson**
  core days**  sequence**                                evidence**      
  ------------ ---------------- ------------------------ --------------- --------------------------
  ENV-U0-L1\   Launch, systems  Readiness/prerequisite   A-ENV-U0-L1:    I-ENV-U0-L1 (1-2 flex
  Days 1 (1)   thinking, and    evidence; no new primary initial model + days): phenomenon
               diagnostic:      standard.                prediction      vocabulary and model-part
               launch the                                check           scaffold
               phenomenon and                                            
               construct an                                              
               initial model.                                            

  ENV-U0-L2\   Launch, systems  Readiness/prerequisite   A-ENV-U0-L2:    I-ENV-U0-L2 (1-2 flex
  Days 2 (1)   thinking, and    evidence; no new primary investigation   days):
               diagnostic:      standard.                notebook + data variable/data-reading
               investigate,                              display         mini-investigation
               analyze data,                                             
               and revise                                                
               explanations.                                             

  ENV-U0-L3\   Launch, systems  Readiness/prerequisite   A-ENV-U0-L3: CA I-ENV-U0-L3 (1-2 flex
  Days 3 (1)   thinking, and    evidence; no new primary NGSS            days):
               diagnostic:      standard.                performance     claim-evidence-reasoning
               design, argue                             evidence task   reconstruction
               from evidence,                                            
               and complete                                              
               performance                                               
               evidence.                                                 
  -------------------------------------------------------------------------------------------------

### Unit 1. Earth systems and biogeochemical cycles - 18 core days

  ------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**  sequence**       standards**       evidence**      
  ------------ ---------------- ----------------- --------------- --------------------------
  ENV-U1-L1\   Earth systems    ENV-LOCAL.1       A-ENV-U1-L1:    I-ENV-U1-L1 (1-2 flex
  Days 4-8 (5) and              \[LOCAL\],        initial model + days): phenomenon
               biogeochemical   HS-ESS2-2,        prediction      vocabulary and model-part
               cycles: launch   HS-ESS2-5 \[CA\], check           scaffold
               the phenomenon   RST.11-12.1                       
               and construct an                                   
               initial model.                                     

  ENV-U1-L2\   Earth systems    ENV-LOCAL.8       A-ENV-U1-L2:    I-ENV-U1-L2 (1-2 flex
  Days 9-15    and              \[LOCAL\],        investigation   days):
  (7)          biogeochemical   HS-ESS2-3,        notebook + data variable/data-reading
               cycles:          HS-ESS2-6 \[CA\], display         mini-investigation
               investigate,     WHST.11-12.1                      
               analyze data,                                      
               and revise                                         
               explanations.                                      

  ENV-U1-L3\   Earth systems    HS-ESS2-1,        A-ENV-U1-L3: CA I-ENV-U1-L3 (1-2 flex
  Days 16-21   and              HS-ESS2-4,        NGSS            days):
  (6)          biogeochemical   HS-ESS2-7         performance     claim-evidence-reasoning
               cycles: design,                    evidence task   reconstruction
               argue from                                         
               evidence, and                                      
               complete                                           
               performance                                        
               evidence.                                          
  ------------------------------------------------------------------------------------------

### Unit 2. Biodiversity, populations, and resilience - 19 core days

  ------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**  sequence**       standards**       evidence**      
  ------------ ---------------- ----------------- --------------- --------------------------
  ENV-U2-L1\   Biodiversity,    ENV-LOCAL.2       A-ENV-U2-L1:    I-ENV-U2-L1 (1-2 flex
  Days 22-26   populations, and \[LOCAL\],        initial model + days): phenomenon
  (5)          resilience:      HS-LS2-3,         prediction      vocabulary and model-part
               launch the       HS-LS2-6,         check           scaffold
               phenomenon and   HS-LS4-6 \[CA\]                   
               construct an                                       
               initial model.                                     

  ENV-U2-L2\   Biodiversity,    HS-LS2-1,         A-ENV-U2-L2:    I-ENV-U2-L2 (1-2 flex
  Days 27-34   populations, and HS-LS2-4,         investigation   days):
  (8)          resilience:      HS-LS2-7 \[\*\],  notebook + data variable/data-reading
               investigate,     RST.11-12.2       display         mini-investigation
               analyze data,                                      
               and revise                                         
               explanations.                                      

  ENV-U2-L3\   Biodiversity,    HS-LS2-2,         A-ENV-U2-L3: CA I-ENV-U2-L3 (1-2 flex
  Days 35-40   populations, and HS-LS2-5,         NGSS            days):
  (6)          resilience:      HS-LS2-8 \[CA\],  performance     claim-evidence-reasoning
               design, argue    WHST.11-12.2      evidence task   reconstruction
               from evidence,                                     
               and complete                                       
               performance                                        
               evidence.                                          
  ------------------------------------------------------------------------------------------

### Unit 3. Water, food, energy, and resource systems - 19 core days

  ------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**  sequence**       standards**       evidence**      
  ------------ ---------------- ----------------- --------------- --------------------------
  ENV-U3-L1\   Water, food,     ENV-LOCAL.3       A-ENV-U3-L1:    I-ENV-U3-L1 (1-2 flex
  Days 41-45   energy, and      \[LOCAL\],        initial model + days): phenomenon
  (5)          resource         HS-ESS3-3,        prediction      vocabulary and model-part
               systems: launch  HS-ESS3-6         check           scaffold
               the phenomenon                                     
               and construct an                                   
               initial model.                                     

  ENV-U3-L2\   Water, food,     HS-ESS3-1,        A-ENV-U3-L2:    I-ENV-U3-L2 (1-2 flex
  Days 46-53   energy, and      HS-ESS3-4         investigation   days):
  (8)          resource         \[CA,\*\],        notebook + data variable/data-reading
               systems:         RST.11-12.3       display         mini-investigation
               investigate,                                       
               analyze data,                                      
               and revise                                         
               explanations.                                      

  ENV-U3-L3\   Water, food,     HS-ESS3-2 \[\*\], A-ENV-U3-L3: CA I-ENV-U3-L3 (1-2 flex
  Days 54-59   energy, and      HS-ESS3-5,        NGSS            days):
  (6)          resource         WHST.11-12.3      performance     claim-evidence-reasoning
               systems: design,                   evidence task   reconstruction
               argue from                                         
               evidence, and                                      
               complete                                           
               performance                                        
               evidence.                                          
  ------------------------------------------------------------------------------------------

### Unit 4. Climate evidence, models, and impacts - 18 core days

  ------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**  sequence**       standards**       evidence**      
  ------------ ---------------- ----------------- --------------- --------------------------
  ENV-U4-L1\   Climate          ENV-LOCAL.4       A-ENV-U4-L1:    I-ENV-U4-L1 (1-2 flex
  Days 60-64   evidence,        \[LOCAL\]         initial model + days): phenomenon
  (5)          models, and                        prediction      vocabulary and model-part
               impacts: launch                    check           scaffold
               the phenomenon                                     
               and construct an                                   
               initial model.                                     

  ENV-U4-L2\   Climate          RST.11-12.4       A-ENV-U4-L2:    I-ENV-U4-L2 (1-2 flex
  Days 65-71   evidence,                          investigation   days):
  (7)          models, and                        notebook + data variable/data-reading
               impacts:                           display         mini-investigation
               investigate,                                       
               analyze data,                                      
               and revise                                         
               explanations.                                      

  ENV-U4-L3\   Climate          WHST.11-12.4      A-ENV-U4-L3: CA I-ENV-U4-L3 (1-2 flex
  Days 72-77   evidence,                          NGSS            days):
  (6)          models, and                        performance     claim-evidence-reasoning
               impacts: design,                   evidence task   reconstruction
               argue from                                         
               evidence, and                                      
               complete                                           
               performance                                        
               evidence.                                          
  ------------------------------------------------------------------------------------------

### Unit 5. Pollution, health, and environmental justice - 19 core days

  ------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**  sequence**       standards**       evidence**      
  ------------ ---------------- ----------------- --------------- --------------------------
  ENV-U5-L1\   Pollution,       ENV-LOCAL.5       A-ENV-U5-L1:    I-ENV-U5-L1 (1-2 flex
  Days 78-82   health, and      \[LOCAL\]         initial model + days): phenomenon
  (5)          environmental                      prediction      vocabulary and model-part
               justice: launch                    check           scaffold
               the phenomenon                                     
               and construct an                                   
               initial model.                                     

  ENV-U5-L2\   Pollution,       RST.11-12.5       A-ENV-U5-L2:    I-ENV-U5-L2 (1-2 flex
  Days 83-90   health, and                        investigation   days):
  (8)          environmental                      notebook + data variable/data-reading
               justice:                           display         mini-investigation
               investigate,                                       
               analyze data,                                      
               and revise                                         
               explanations.                                      

  ENV-U5-L3\   Pollution,       WHST.11-12.5      A-ENV-U5-L3: CA I-ENV-U5-L3 (1-2 flex
  Days 91-96   health, and                        NGSS            days):
  (6)          environmental                      performance     claim-evidence-reasoning
               justice: design,                   evidence task   reconstruction
               argue from                                         
               evidence, and                                      
               complete                                           
               performance                                        
               evidence.                                          
  ------------------------------------------------------------------------------------------

### Unit 6. Policy, engineering, and tradeoffs - 19 core days

  ------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**  sequence**       standards**       evidence**      
  ------------ ---------------- ----------------- --------------- --------------------------
  ENV-U6-L1\   Policy,          ENV-LOCAL.6       A-ENV-U6-L1:    I-ENV-U6-L1 (1-2 flex
  Days 97-101  engineering, and \[LOCAL\],        initial model + days): phenomenon
  (5)          tradeoffs:       HS-ETS1-3,        prediction      vocabulary and model-part
               launch the       RST.11-12.7,      check           scaffold
               phenomenon and   WHST.11-12.7                      
               construct an                                       
               initial model.                                     

  ENV-U6-L2\   Policy,          HS-ETS1-1,        A-ENV-U6-L2:    I-ENV-U6-L2 (1-2 flex
  Days 102-109 engineering, and HS-ETS1-4,        investigation   days):
  (8)          tradeoffs:       RST.11-12.8,      notebook + data variable/data-reading
               investigate,     WHST.11-12.8      display         mini-investigation
               analyze data,                                      
               and revise                                         
               explanations.                                      

  ENV-U6-L3\   Policy,          HS-ETS1-2,        A-ENV-U6-L3: CA I-ENV-U6-L3 (1-2 flex
  Days 110-115 engineering, and RST.11-12.6,      NGSS            days):
  (6)          tradeoffs:       WHST.11-12.6      performance     claim-evidence-reasoning
               design, argue                      evidence task   reconstruction
               from evidence,                                     
               and complete                                       
               performance                                        
               evidence.                                          
  ------------------------------------------------------------------------------------------

### Unit 7. Community investigation and capstone - 20 core days

  ------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment    **Intervention lesson**
  core days**  sequence**       standards**       evidence**      
  ------------ ---------------- ----------------- --------------- --------------------------
  ENV-U7-L1\   Community        ENV-LOCAL.7       A-ENV-U7-L1:    I-ENV-U7-L1 (1-2 flex
  Days 116-120 investigation    \[LOCAL\],        initial model + days): phenomenon
  (5)          and capstone:    WHST.11-12.9      prediction      vocabulary and model-part
               launch the                         check           scaffold
               phenomenon and                                     
               construct an                                       
               initial model.                                     

  ENV-U7-L2\   Community        RST.11-12.9,      A-ENV-U7-L2:    I-ENV-U7-L2 (1-2 flex
  Days 121-129 investigation    WHST.11-12.10     investigation   days):
  (9)          and capstone:                      notebook + data variable/data-reading
               investigate,                       display         mini-investigation
               analyze data,                                      
               and revise                                         
               explanations.                                      

  ENV-U7-L3\   Community        RST.11-12.10      A-ENV-U7-L3: CA I-ENV-U7-L3 (1-2 flex
  Days 130-135 investigation                      NGSS            days):
  (6)          and capstone:                      performance     claim-evidence-reasoning
               design, argue                      evidence task   reconstruction
               from evidence,                                     
               and complete                                       
               performance                                        
               evidence.                                          
  ------------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 54 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Grade 6 Ancient World

135 core lesson days \| 40 intervention-capacity days \| 89 primary
standards assignments \| 1 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Historical inquiry, geography, and diagnostic - 3 core days

  --------------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days** sequence**                                evidence**       
  ----------- ---------------- ------------------------ ---------------- ---------------------------------
  H6-U0-L1\   Historical       HSS-AS.6-8.CST.1         A-H6-U0-L1:      I-H6-U0-L1 (1-2 flex days):
  Days 1 (1)  inquiry,                                  source           timeline/map/source-orientation
              geography, and                            analysis +       reset
              diagnostic:                               chronology/map   
              orient in time                            check            
              and place;                                                 
              source the                                                 
              evidence set.                                              

  H6-U0-L2\   Historical       Readiness/prerequisite   A-H6-U0-L2:      I-H6-U0-L2 (1-2 flex days):
  Days 2 (1)  inquiry,         evidence; no new primary corroboration    contextualization and
              geography, and   standard.                and inquiry      corroboration scaffold
              diagnostic:                               notebook         
              analyze,                                                   
              contextualize,                                             
              and corroborate                                            
              accounts.                                                  

  H6-U0-L3\   Historical       Readiness/prerequisite   A-H6-U0-L3:      I-H6-U0-L3 (1-2 flex days):
  Days 3 (1)  inquiry,         evidence; no new primary document-based   claim-evidence reasoning
              geography, and   standard.                argument or      conference
              diagnostic:                               civic/economic   
              construct an                              task             
              evidence-based                                             
              interpretation                                             
              and transfer it.                                           
  --------------------------------------------------------------------------------------------------------

### Unit 1. Early humans, agriculture, and first communities - 18 core days

  ---------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary           **Assessment     **Intervention lesson**
  core days** sequence**       standards**         evidence**       
  ----------- ---------------- ------------------- ---------------- ---------------------------------
  H6-U1-L1\   Early humans,    HSS-6.1, HSS-6.1.3, A-H6-U1-L1:      I-H6-U1-L1 (1-2 flex days):
  Days 4-8    agriculture, and HSS-AS.6-8.REP.1,   source           timeline/map/source-orientation
  (5)         first            HSS-AS.6-8.REP.4,   analysis +       reset
              communities:     WHST.6-8.1          chronology/map   
              orient in time                       check            
              and place;                                            
              source the                                            
              evidence set.                                         

  H6-U1-L2\   Early humans,    HSS-6.1.1,          A-H6-U1-L2:      I-H6-U1-L2 (1-2 flex days):
  Days 9-15   agriculture, and HSS-AS.6-8.CST.2,   corroboration    contextualization and
  (7)         first            HSS-AS.6-8.REP.2,   and inquiry      corroboration scaffold
              communities:     HSS-AS.6-8.REP.5    notebook         
              analyze,                                              
              contextualize,                                        
              and corroborate                                       
              accounts.                                             

  H6-U1-L3\   Early humans,    HSS-6.1.2,          A-H6-U1-L3:      I-H6-U1-L3 (1-2 flex days):
  Days 16-21  agriculture, and HSS-AS.6-8.CST.3,   document-based   claim-evidence reasoning
  (6)         first            HSS-AS.6-8.REP.3,   argument or      conference
              communities:     RH.6-8.1            civic/economic   
              construct an                         task             
              evidence-based                                        
              interpretation                                        
              and transfer it.                                      
  ---------------------------------------------------------------------------------------------------

### Unit 2. Mesopotamia, Egypt, and river civilizations - 19 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H6-U2-L1\   Mesopotamia,     HSS-6.2,          A-H6-U2-L1:      I-H6-U2-L1 (1-2 flex days):
  Days 22-26  Egypt, and river HSS-6.2.3,        source           timeline/map/source-orientation
  (5)         civilizations:   HSS-6.2.6,        analysis +       reset
              orient in time   HSS-6.2.9         chronology/map   
              and place;                         check            
              source the                                          
              evidence set.                                       

  H6-U2-L2\   Mesopotamia,     HSS-6.2.1,        A-H6-U2-L2:      I-H6-U2-L2 (1-2 flex days):
  Days 27-34  Egypt, and river HSS-6.2.4,        corroboration    contextualization and
  (8)         civilizations:   HSS-6.2.7,        and inquiry      corroboration scaffold
              analyze,         RH.6-8.2          notebook         
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H6-U2-L3\   Mesopotamia,     HSS-6.2.2,        A-H6-U2-L3:      I-H6-U2-L3 (1-2 flex days):
  Days 35-40  Egypt, and river HSS-6.2.5,        document-based   claim-evidence reasoning
  (6)         civilizations:   HSS-6.2.8,        argument or      conference
              construct an     WHST.6-8.2        civic/economic   
              evidence-based                     task             
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 3. Ancient Israel, Persia, and regional exchange - 18 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H6-U3-L1\   Ancient Israel,  HSS-6.3,          A-H6-U3-L1:      I-H6-U3-L1 (1-2 flex days):
  Days 41-45  Persia, and      HSS-6.3.3,        source           timeline/map/source-orientation
  (5)         regional         RH.6-8.3          analysis +       reset
              exchange: orient                   chronology/map   
              in time and                        check            
              place; source                                       
              the evidence                                        
              set.                                                

  H6-U3-L2\   Ancient Israel,  HSS-6.3.1,        A-H6-U3-L2:      I-H6-U3-L2 (1-2 flex days):
  Days 46-52  Persia, and      HSS-6.3.4,        corroboration    contextualization and
  (7)         regional         WHST.6-8.3        and inquiry      corroboration scaffold
              exchange:                          notebook         
              analyze,                                            
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H6-U3-L3\   Ancient Israel,  HSS-6.3.2,        A-H6-U3-L3:      I-H6-U3-L3 (1-2 flex days):
  Days 53-58  Persia, and      HSS-6.3.5         document-based   claim-evidence reasoning
  (6)         regional                           argument or      conference
              exchange:                          civic/economic   
              construct an                       task             
              evidence-based                                      
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 4. Ancient India and South Asian traditions - 18 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H6-U4-L1\   Ancient India    HSS-6.5,          A-H6-U4-L1:      I-H6-U4-L1 (1-2 flex days):
  Days 59-63  and South Asian  HSS-6.5.3,        source           timeline/map/source-orientation
  (5)         traditions:      HSS-6.5.6,        analysis +       reset
              orient in time   WHST.6-8.4        chronology/map   
              and place;                         check            
              source the                                          
              evidence set.                                       

  H6-U4-L2\   Ancient India    HSS-6.5.1,        A-H6-U4-L2:      I-H6-U4-L2 (1-2 flex days):
  Days 64-70  and South Asian  HSS-6.5.4,        corroboration    contextualization and
  (7)         traditions:      HSS-6.5.7         and inquiry      corroboration scaffold
              analyze,                           notebook         
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H6-U4-L3\   Ancient India    HSS-6.5.2,        A-H6-U4-L3:      I-H6-U4-L3 (1-2 flex days):
  Days 71-76  and South Asian  HSS-6.5.5,        document-based   claim-evidence reasoning
  (6)         traditions:      RH.6-8.4          argument or      conference
              construct an                       civic/economic   
              evidence-based                     task             
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 5. Ancient China and East Asian traditions - 18 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H6-U5-L1\   Ancient China    HSS-6.6,          A-H6-U5-L1:      I-H6-U5-L1 (1-2 flex days):
  Days 77-81  and East Asian   HSS-6.6.3,        source           timeline/map/source-orientation
  (5)         traditions:      HSS-6.6.6,        analysis +       reset
              orient in time   RH.6-8.5          chronology/map   
              and place;                         check            
              source the                                          
              evidence set.                                       

  H6-U5-L2\   Ancient China    HSS-6.6.1,        A-H6-U5-L2:      I-H6-U5-L2 (1-2 flex days):
  Days 82-88  and East Asian   HSS-6.6.4,        corroboration    contextualization and
  (7)         traditions:      HSS-6.6.7,        and inquiry      corroboration scaffold
              analyze,         WHST.6-8.5        notebook         
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H6-U5-L3\   Ancient China    HSS-6.6.2,        A-H6-U5-L3:      I-H6-U5-L3 (1-2 flex days):
  Days 89-94  and East Asian   HSS-6.6.5,        document-based   claim-evidence reasoning
  (6)         traditions:      HSS-6.6.8         argument or      conference
              construct an                       civic/economic   
              evidence-based                     task             
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 6. Greece, citizenship, and cultural legacy - 19 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H6-U6-L1\   Greece,          HSS-6.4,          A-H6-U6-L1:      I-H6-U6-L1 (1-2 flex days):
  Days 95-99  citizenship, and HSS-6.4.3,        source           timeline/map/source-orientation
  (5)         cultural legacy: HSS-6.4.6,        analysis +       reset
              orient in time   RH.6-8.6,         chronology/map   
              and place;       WHST.6-8.6        check            
              source the                                          
              evidence set.                                       

  H6-U6-L2\   Greece,          HSS-6.4.1,        A-H6-U6-L2:      I-H6-U6-L2 (1-2 flex days):
  Days        citizenship, and HSS-6.4.4,        corroboration    contextualization and
  100-107 (8) cultural legacy: HSS-6.4.7,        and inquiry      corroboration scaffold
              analyze,         RH.6-8.7,         notebook         
              contextualize,   WHST.6-8.7                         
              and corroborate                                     
              accounts.                                           

  H6-U6-L3\   Greece,          HSS-6.4.2,        A-H6-U6-L3:      I-H6-U6-L3 (1-2 flex days):
  Days        citizenship, and HSS-6.4.5,        document-based   claim-evidence reasoning
  108-113 (6) cultural legacy: HSS-6.4.8,        argument or      conference
              construct an     RH.6-8.8,         civic/economic   
              evidence-based   WHST.6-8.8 \[CA\] task             
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 7. Rome, republic, empire, and legacy - 22 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary          **Assessment     **Intervention lesson**
  core days** sequence**       standards**        evidence**       
  ----------- ---------------- ------------------ ---------------- ---------------------------------
  H6-U7-L1\   Rome, republic,  HSS-6.7,           A-H6-U7-L1:      I-H6-U7-L1 (1-2 flex days):
  Days        empire, and      HSS-6.7.3,         source           timeline/map/source-orientation
  114-119 (6) legacy: orient   HSS-6.7.6,         analysis +       reset
              in time and      HSS-AS.6-8.HI.1,   chronology/map   
              place; source    HSS-AS.6-8.HI.4,   check            
              the evidence     RH.6-8.9,                           
              set.             WHST.6-8.10                         

  H6-U7-L2\   Rome, republic,  HSS-6.7.1,         A-H6-U7-L2:      I-H6-U7-L2 (1-2 flex days):
  Days        empire, and      HSS-6.7.4,         corroboration    contextualization and
  120-128 (9) legacy: analyze, HSS-6.7.7,         and inquiry      corroboration scaffold
              contextualize,   HSS-AS.6-8.HI.2,   notebook         
              and corroborate  HSS-AS.6-8.HI.5,                    
              accounts.        RH.6-8.10                           

  H6-U7-L3\   Rome, republic,  HSS-6.7.2,         A-H6-U7-L3:      I-H6-U7-L3 (1-2 flex days):
  Days        empire, and      HSS-6.7.5,         document-based   claim-evidence reasoning
  129-135 (7) legacy:          HSS-6.7.8,         argument or      conference
              construct an     HSS-AS.6-8.HI.3,   civic/economic   
              evidence-based   HSS-AS.6-8.HI.6,   task             
              interpretation   WHST.6-8.9                          
              and transfer it.                                     
  --------------------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 89 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Grade 7 Medieval/Early Modern World

135 core lesson days \| 40 intervention-capacity days \| 106 primary
standards assignments \| 1 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Historical inquiry and course launch - 3 core days

  --------------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days** sequence**                                evidence**       
  ----------- ---------------- ------------------------ ---------------- ---------------------------------
  H7-U0-L1\   Historical       HSS-AS.6-8.CST.1         A-H7-U0-L1:      I-H7-U0-L1 (1-2 flex days):
  Days 1 (1)  inquiry and                               source           timeline/map/source-orientation
              course launch:                            analysis +       reset
              orient in time                            chronology/map   
              and place;                                check            
              source the                                                 
              evidence set.                                              

  H7-U0-L2\   Historical       Readiness/prerequisite   A-H7-U0-L2:      I-H7-U0-L2 (1-2 flex days):
  Days 2 (1)  inquiry and      evidence; no new primary corroboration    contextualization and
              course launch:   standard.                and inquiry      corroboration scaffold
              analyze,                                  notebook         
              contextualize,                                             
              and corroborate                                            
              accounts.                                                  

  H7-U0-L3\   Historical       Readiness/prerequisite   A-H7-U0-L3:      I-H7-U0-L3 (1-2 flex days):
  Days 3 (1)  inquiry and      evidence; no new primary document-based   claim-evidence reasoning
              course launch:   standard.                argument or      conference
              construct an                              civic/economic   
              evidence-based                            task             
              interpretation                                             
              and transfer it.                                           
  --------------------------------------------------------------------------------------------------------

### Unit 1. The world in 300 CE - 13 core days

  ---------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary           **Assessment     **Intervention lesson**
  core days** sequence**       standards**         evidence**       
  ----------- ---------------- ------------------- ---------------- ---------------------------------
  H7-U1-L1\   The world in 300 HSS-AS.6-8.CST.2,   A-H7-U1-L1:      I-H7-U1-L1 (1-2 flex days):
  Days 4-6    CE: orient in    HSS-AS.6-8.REP.2,   source           timeline/map/source-orientation
  (3)         time and place;  HSS-AS.6-8.REP.5    analysis +       reset
              source the                           chronology/map   
              evidence set.                        check            

  H7-U1-L2\   The world in 300 HSS-AS.6-8.CST.3,   A-H7-U1-L2:      I-H7-U1-L2 (1-2 flex days):
  Days 7-12   CE: analyze,     HSS-AS.6-8.REP.3,   corroboration    contextualization and
  (6)         contextualize,   RH.6-8.1            and inquiry      corroboration scaffold
              and corroborate                      notebook         
              accounts.                                             

  H7-U1-L3\   The world in 300 HSS-AS.6-8.REP.1,   A-H7-U1-L3:      I-H7-U1-L3 (1-2 flex days):
  Days 13-16  CE: construct an HSS-AS.6-8.REP.4,   document-based   claim-evidence reasoning
  (4)         evidence-based   WHST.6-8.1          argument or      conference
              interpretation                       civic/economic   
              and transfer it.                     task             
  ---------------------------------------------------------------------------------------------------

### Unit 2. Rome and Christendom, 300--1200 - 14 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H7-U2-L1\   Rome and         HSS-7.1,          A-H7-U2-L1:      I-H7-U2-L1 (1-2 flex days):
  Days 17-19  Christendom,     HSS-7.1.3,        source           timeline/map/source-orientation
  (3)         300--1200:       HSS-7.6.2,        analysis +       reset
              orient in time   HSS-7.6.5,        chronology/map   
              and place;       HSS-7.6.8,        check            
              source the       WHST.6-8.2                         
              evidence set.                                       

  H7-U2-L2\   Rome and         HSS-7.1.1,        A-H7-U2-L2:      I-H7-U2-L2 (1-2 flex days):
  Days 20-26  Christendom,     HSS-7.6,          corroboration    contextualization and
  (7)         300--1200:       HSS-7.6.3,        and inquiry      corroboration scaffold
              analyze,         HSS-7.6.6,        notebook         
              contextualize,   HSS-7.6.9                          
              and corroborate                                     
              accounts.                                           

  H7-U2-L3\   Rome and         HSS-7.1.2,        A-H7-U2-L3:      I-H7-U2-L3 (1-2 flex days):
  Days 27-30  Christendom,     HSS-7.6.1,        document-based   claim-evidence reasoning
  (4)         300--1200:       HSS-7.6.4,        argument or      conference
              construct an     HSS-7.6.7,        civic/economic   
              evidence-based   RH.6-8.2          task             
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 3. Southwestern Asia and the world of Islam - 14 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H7-U3-L1\   Southwestern     HSS-7.2,          A-H7-U3-L1:      I-H7-U3-L1 (1-2 flex days):
  Days 31-33  Asia and the     HSS-7.2.3,        source           timeline/map/source-orientation
  (3)         world of Islam:  HSS-7.2.6         analysis +       reset
              orient in time                     chronology/map   
              and place;                         check            
              source the                                          
              evidence set.                                       

  H7-U3-L2\   Southwestern     HSS-7.2.1,        A-H7-U3-L2:      I-H7-U3-L2 (1-2 flex days):
  Days 34-40  Asia and the     HSS-7.2.4,        corroboration    contextualization and
  (7)         world of Islam:  RH.6-8.3          and inquiry      corroboration scaffold
              analyze,                           notebook         
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H7-U3-L3\   Southwestern     HSS-7.2.2,        A-H7-U3-L3:      I-H7-U3-L3 (1-2 flex days):
  Days 41-44  Asia and the     HSS-7.2.5,        document-based   claim-evidence reasoning
  (4)         world of Islam:  WHST.6-8.3        argument or      conference
              construct an                       civic/economic   
              evidence-based                     task             
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 4. South Asia, 300--1200 - 13 core days

  --------------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days** sequence**                                evidence**       
  ----------- ---------------- ------------------------ ---------------- ---------------------------------
  H7-U4-L1\   South Asia,      RH.6-8.4                 A-H7-U4-L1:      I-H7-U4-L1 (1-2 flex days):
  Days 45-47  300--1200:                                source           timeline/map/source-orientation
  (3)         orient in time                            analysis +       reset
              and place;                                chronology/map   
              source the                                check            
              evidence set.                                              

  H7-U4-L2\   South Asia,      WHST.6-8.4               A-H7-U4-L2:      I-H7-U4-L2 (1-2 flex days):
  Days 48-53  300--1200:                                corroboration    contextualization and
  (6)         analyze,                                  and inquiry      corroboration scaffold
              contextualize,                            notebook         
              and corroborate                                            
              accounts.                                                  

  H7-U4-L3\   South Asia,      Readiness/prerequisite   A-H7-U4-L3:      I-H7-U4-L3 (1-2 flex days):
  Days 54-57  300--1200:       evidence; no new primary document-based   claim-evidence reasoning
  (4)         construct an     standard.                argument or      conference
              evidence-based                            civic/economic   
              interpretation                            task             
              and transfer it.                                           
  --------------------------------------------------------------------------------------------------------

### Unit 5. East Asia, 300--1300 - 13 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H7-U5-L1\   East Asia,       HSS-7.3,          A-H7-U5-L1:      I-H7-U5-L1 (1-2 flex days):
  Days 58-60  300--1300:       HSS-7.3.3,        source           timeline/map/source-orientation
  (3)         orient in time   HSS-7.3.6,        analysis +       reset
              and place;       HSS-7.5.2,        chronology/map   
              source the       HSS-7.5.5,        check            
              evidence set.    WHST.6-8.5                         

  H7-U5-L2\   East Asia,       HSS-7.3.1,        A-H7-U5-L2:      I-H7-U5-L2 (1-2 flex days):
  Days 61-66  300--1300:       HSS-7.3.4,        corroboration    contextualization and
  (6)         analyze,         HSS-7.5,          and inquiry      corroboration scaffold
              contextualize,   HSS-7.5.3,        notebook         
              and corroborate  HSS-7.5.6                          
              accounts.                                           

  H7-U5-L3\   East Asia,       HSS-7.3.2,        A-H7-U5-L3:      I-H7-U5-L3 (1-2 flex days):
  Days 67-70  300--1300:       HSS-7.3.5,        document-based   claim-evidence reasoning
  (4)         construct an     HSS-7.5.1,        argument or      conference
              evidence-based   HSS-7.5.4,        civic/economic   
              interpretation   RH.6-8.5          task             
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 6. The Americas, 300--1490 - 13 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H7-U6-L1\   The Americas,    HSS-7.7,          A-H7-U6-L1:      I-H7-U6-L1 (1-2 flex days):
  Days 71-73  300--1490:       HSS-7.7.3,        source           timeline/map/source-orientation
  (3)         orient in time   RH.6-8.6,         analysis +       reset
              and place;       WHST.6-8.6        chronology/map   
              source the                         check            
              evidence set.                                       

  H7-U6-L2\   The Americas,    HSS-7.7.1,        A-H7-U6-L2:      I-H7-U6-L2 (1-2 flex days):
  Days 74-79  300--1490:       HSS-7.7.4,        corroboration    contextualization and
  (6)         analyze,         RH.6-8.7,         and inquiry      corroboration scaffold
              contextualize,   WHST.6-8.7        notebook         
              and corroborate                                     
              accounts.                                           

  H7-U6-L3\   The Americas,    HSS-7.7.2,        A-H7-U6-L3:      I-H7-U6-L3 (1-2 flex days):
  Days 80-83  300--1490:       HSS-7.7.5,        document-based   claim-evidence reasoning
  (4)         construct an     RH.6-8.8,         argument or      conference
              evidence-based   WHST.6-8.8 \[CA\] civic/economic   
              interpretation                     task             
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 7. West Africa, 900--1400 - 14 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H7-U7-L1\   West Africa,     HSS-7.4,          A-H7-U7-L1:      I-H7-U7-L1 (1-2 flex days):
  Days 84-86  900--1400:       HSS-7.4.3         source           timeline/map/source-orientation
  (3)         orient in time                     analysis +       reset
              and place;                         chronology/map   
              source the                         check            
              evidence set.                                       

  H7-U7-L2\   West Africa,     HSS-7.4.1,        A-H7-U7-L2:      I-H7-U7-L2 (1-2 flex days):
  Days 87-93  900--1400:       HSS-7.4.4         corroboration    contextualization and
  (7)         analyze,                           and inquiry      corroboration scaffold
              contextualize,                     notebook         
              and corroborate                                     
              accounts.                                           

  H7-U7-L3\   West Africa,     HSS-7.4.2,        A-H7-U7-L3:      I-H7-U7-L3 (1-2 flex days):
  Days 94-97  900--1400:       HSS-7.4.5         document-based   claim-evidence reasoning
  (4)         construct an                       argument or      conference
              evidence-based                     civic/economic   
              interpretation                     task             
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 8. Sites of encounter, 1150--1490 - 13 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H7-U8-L1\   Sites of         HSS-7.8,          A-H7-U8-L1:      I-H7-U8-L1 (1-2 flex days):
  Days 98-100 encounter,       HSS-7.8.3         source           timeline/map/source-orientation
  (3)         1150--1490:                        analysis +       reset
              orient in time                     chronology/map   
              and place;                         check            
              source the                                          
              evidence set.                                       

  H7-U8-L2\   Sites of         HSS-7.8.1,        A-H7-U8-L2:      I-H7-U8-L2 (1-2 flex days):
  Days        encounter,       HSS-7.8.4         corroboration    contextualization and
  101-106 (6) 1150--1490:                        and inquiry      corroboration scaffold
              analyze,                           notebook         
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H7-U8-L3\   Sites of         HSS-7.8.2,        A-H7-U8-L3:      I-H7-U8-L3 (1-2 flex days):
  Days        encounter,       HSS-7.8.5         document-based   claim-evidence reasoning
  107-110 (4) 1150--1490:                        argument or      conference
              construct an                       civic/economic   
              evidence-based                     task             
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 9. Global convergence, 1450--1750 - 13 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H7-U9-L1\   Global           HSS-7.9,          A-H7-U9-L1:      I-H7-U9-L1 (1-2 flex days):
  Days        convergence,     HSS-7.9.3,        source           timeline/map/source-orientation
  111-113 (3) 1450--1750:      HSS-7.9.6,        analysis +       reset
              orient in time   HSS-7.10.1,       chronology/map   
              and place;       HSS-7.11,         check            
              source the       HSS-7.11.3,                        
              evidence set.    HSS-7.11.6                         

  H7-U9-L2\   Global           HSS-7.9.1,        A-H7-U9-L2:      I-H7-U9-L2 (1-2 flex days):
  Days        convergence,     HSS-7.9.4,        corroboration    contextualization and
  114-119 (6) 1450--1750:      HSS-7.9.7,        and inquiry      corroboration scaffold
              analyze,         HSS-7.10.2,       notebook         
              contextualize,   HSS-7.11.1,                        
              and corroborate  HSS-7.11.4                         
              accounts.                                           

  H7-U9-L3\   Global           HSS-7.9.2,        A-H7-U9-L3:      I-H7-U9-L3 (1-2 flex days):
  Days        convergence,     HSS-7.9.5,        document-based   claim-evidence reasoning
  120-123 (4) 1450--1750:      HSS-7.10,         argument or      conference
              construct an     HSS-7.10.3,       civic/economic   
              evidence-based   HSS-7.11.2,       task             
              interpretation   HSS-7.11.5                         
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 10. Inquiry synthesis and mastery - 12 core days

  ---------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary          **Assessment     **Intervention lesson**
  core days**  sequence**       standards**        evidence**       
  ------------ ---------------- ------------------ ---------------- ---------------------------------
  H7-U10-L1\   Inquiry          HSS-AS.6-8.HI.1,   A-H7-U10-L1:     I-H7-U10-L1 (1-2 flex days):
  Days 124-126 synthesis and    HSS-AS.6-8.HI.4,   source           timeline/map/source-orientation
  (3)          mastery: orient  RH.6-8.9,          analysis +       reset
               in time and      WHST.6-8.10        chronology/map   
               place; source                       check            
               the evidence                                         
               set.                                                 

  H7-U10-L2\   Inquiry          HSS-AS.6-8.HI.2,   A-H7-U10-L2:     I-H7-U10-L2 (1-2 flex days):
  Days 127-131 synthesis and    HSS-AS.6-8.HI.5,   corroboration    contextualization and
  (5)          mastery:         RH.6-8.10          and inquiry      corroboration scaffold
               analyze,                            notebook         
               contextualize,                                       
               and corroborate                                      
               accounts.                                            

  H7-U10-L3\   Inquiry          HSS-AS.6-8.HI.3,   A-H7-U10-L3:     I-H7-U10-L3 (1-2 flex days):
  Days 132-135 synthesis and    HSS-AS.6-8.HI.6,   document-based   claim-evidence reasoning
  (4)          mastery:         WHST.6-8.9         argument or      conference
               construct an                        civic/economic   
               evidence-based                      task             
               interpretation                                       
               and transfer it.                                     
  ---------------------------------------------------------------------------------------------------

Course control check: 33 identified lesson sequences cover core workdays
1-135; all 106 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Grade 8 U.S. Growth and Conflict

135 core lesson days \| 40 intervention-capacity days \| 115 primary
standards assignments \| 1 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Historical inquiry and diagnostic - 3 core days

  --------------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days** sequence**                                evidence**       
  ----------- ---------------- ------------------------ ---------------- ---------------------------------
  H8-U0-L1\   Historical       HSS-AS.6-8.CST.1         A-H8-U0-L1:      I-H8-U0-L1 (1-2 flex days):
  Days 1 (1)  inquiry and                               source           timeline/map/source-orientation
              diagnostic:                               analysis +       reset
              orient in time                            chronology/map   
              and place;                                check            
              source the                                                 
              evidence set.                                              

  H8-U0-L2\   Historical       Readiness/prerequisite   A-H8-U0-L2:      I-H8-U0-L2 (1-2 flex days):
  Days 2 (1)  inquiry and      evidence; no new primary corroboration    contextualization and
              diagnostic:      standard.                and inquiry      corroboration scaffold
              analyze,                                  notebook         
              contextualize,                                             
              and corroborate                                            
              accounts.                                                  

  H8-U0-L3\   Historical       Readiness/prerequisite   A-H8-U0-L3:      I-H8-U0-L3 (1-2 flex days):
  Days 3 (1)  inquiry and      evidence; no new primary document-based   claim-evidence reasoning
              diagnostic:      standard.                argument or      conference
              construct an                              civic/economic   
              evidence-based                            task             
              interpretation                                             
              and transfer it.                                           
  --------------------------------------------------------------------------------------------------------

### Unit 1. Indigenous societies, encounter, and colonies - 16 core days

  ---------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary           **Assessment     **Intervention lesson**
  core days** sequence**       standards**         evidence**       
  ----------- ---------------- ------------------- ---------------- ---------------------------------
  H8-U1-L1\   Indigenous       HSS-AS.6-8.CST.2,   A-H8-U1-L1:      I-H8-U1-L1 (1-2 flex days):
  Days 4-7    societies,       HSS-AS.6-8.REP.2,   source           timeline/map/source-orientation
  (4)         encounter, and   HSS-AS.6-8.REP.5    analysis +       reset
              colonies: orient                     chronology/map   
              in time and                          check            
              place; source                                         
              the evidence                                          
              set.                                                  

  H8-U1-L2\   Indigenous       HSS-AS.6-8.CST.3,   A-H8-U1-L2:      I-H8-U1-L2 (1-2 flex days):
  Days 8-14   societies,       HSS-AS.6-8.REP.3,   corroboration    contextualization and
  (7)         encounter, and   RH.6-8.1            and inquiry      corroboration scaffold
              colonies:                            notebook         
              analyze,                                              
              contextualize,                                        
              and corroborate                                       
              accounts.                                             

  H8-U1-L3\   Indigenous       HSS-AS.6-8.REP.1,   A-H8-U1-L3:      I-H8-U1-L3 (1-2 flex days):
  Days 15-19  societies,       HSS-AS.6-8.REP.4,   document-based   claim-evidence reasoning
  (5)         encounter, and   WHST.6-8.1          argument or      conference
              colonies:                            civic/economic   
              construct an                         task             
              evidence-based                                        
              interpretation                                        
              and transfer it.                                      
  ---------------------------------------------------------------------------------------------------

### Unit 2. Revolution and founding ideas - 16 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H8-U2-L1\   Revolution and   HSS-8.1,          A-H8-U2-L1:      I-H8-U2-L1 (1-2 flex days):
  Days 20-23  founding ideas:  HSS-8.1.3,        source           timeline/map/source-orientation
  (4)         orient in time   WHST.6-8.2        analysis +       reset
              and place;                         chronology/map   
              source the                         check            
              evidence set.                                       

  H8-U2-L2\   Revolution and   HSS-8.1.1,        A-H8-U2-L2:      I-H8-U2-L2 (1-2 flex days):
  Days 24-30  founding ideas:  HSS-8.1.4         corroboration    contextualization and
  (7)         analyze,                           and inquiry      corroboration scaffold
              contextualize,                     notebook         
              and corroborate                                     
              accounts.                                           

  H8-U2-L3\   Revolution and   HSS-8.1.2,        A-H8-U2-L3:      I-H8-U2-L3 (1-2 flex days):
  Days 31-35  founding ideas:  RH.6-8.2          document-based   claim-evidence reasoning
  (5)         construct an                       argument or      conference
              evidence-based                     civic/economic   
              interpretation                     task             
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 3. Constitution, institutions, and the early republic - 16 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H8-U3-L1\   Constitution,    HSS-8.2,          A-H8-U3-L1:      I-H8-U3-L1 (1-2 flex days):
  Days 36-39  institutions,    HSS-8.2.3,        source           timeline/map/source-orientation
  (4)         and the early    HSS-8.2.6,        analysis +       reset
              republic: orient HSS-8.3.1,        chronology/map   
              in time and      HSS-8.3.4,        check            
              place; source    HSS-8.3.7                          
              the evidence                                        
              set.                                                

  H8-U3-L2\   Constitution,    HSS-8.2.1,        A-H8-U3-L2:      I-H8-U3-L2 (1-2 flex days):
  Days 40-46  institutions,    HSS-8.2.4,        corroboration    contextualization and
  (7)         and the early    HSS-8.2.7,        and inquiry      corroboration scaffold
              republic:        HSS-8.3.2,        notebook         
              analyze,         HSS-8.3.5,                         
              contextualize,   RH.6-8.3                           
              and corroborate                                     
              accounts.                                           

  H8-U3-L3\   Constitution,    HSS-8.2.2,        A-H8-U3-L3:      I-H8-U3-L3 (1-2 flex days):
  Days 47-51  institutions,    HSS-8.2.5,        document-based   claim-evidence reasoning
  (5)         and the early    HSS-8.3,          argument or      conference
              republic:        HSS-8.3.3,        civic/economic   
              construct an     HSS-8.3.6,        task             
              evidence-based   WHST.6-8.3                         
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 4. Expansion, migration, and forced removal - 16 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H8-U4-L1\   Expansion,       HSS-8.4,          A-H8-U4-L1:      I-H8-U4-L1 (1-2 flex days):
  Days 52-55  migration, and   HSS-8.4.3,        source           timeline/map/source-orientation
  (4)         forced removal:  WHST.6-8.4        analysis +       reset
              orient in time                     chronology/map   
              and place;                         check            
              source the                                          
              evidence set.                                       

  H8-U4-L2\   Expansion,       HSS-8.4.1,        A-H8-U4-L2:      I-H8-U4-L2 (1-2 flex days):
  Days 56-62  migration, and   HSS-8.4.4         corroboration    contextualization and
  (7)         forced removal:                    and inquiry      corroboration scaffold
              analyze,                           notebook         
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H8-U4-L3\   Expansion,       HSS-8.4.2,        A-H8-U4-L3:      I-H8-U4-L3 (1-2 flex days):
  Days 63-67  migration, and   RH.6-8.4          document-based   claim-evidence reasoning
  (5)         forced removal:                    argument or      conference
              construct an                       civic/economic   
              evidence-based                     task             
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 5. Reform, abolition, and sectional conflict - 16 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H8-U5-L1\   Reform,          HSS-8.5,          A-H8-U5-L1:      I-H8-U5-L1 (1-2 flex days):
  Days 68-71  abolition, and   HSS-8.5.3         source           timeline/map/source-orientation
  (4)         sectional                          analysis +       reset
              conflict: orient                   chronology/map   
              in time and                        check            
              place; source                                       
              the evidence                                        
              set.                                                

  H8-U5-L2\   Reform,          HSS-8.5.1,        A-H8-U5-L2:      I-H8-U5-L2 (1-2 flex days):
  Days 72-78  abolition, and   RH.6-8.5          corroboration    contextualization and
  (7)         sectional                          and inquiry      corroboration scaffold
              conflict:                          notebook         
              analyze,                                            
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H8-U5-L3\   Reform,          HSS-8.5.2,        A-H8-U5-L3:      I-H8-U5-L3 (1-2 flex days):
  Days 79-83  abolition, and   WHST.6-8.5        document-based   claim-evidence reasoning
  (5)         sectional                          argument or      conference
              conflict:                          civic/economic   
              construct an                       task             
              evidence-based                                      
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 6. Civil War and emancipation - 16 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H8-U6-L1\   Civil War and    HSS-8.6,          A-H8-U6-L1:      I-H8-U6-L1 (1-2 flex days):
  Days 84-87  emancipation:    HSS-8.6.3,        source           timeline/map/source-orientation
  (4)         orient in time   HSS-8.6.6,        analysis +       reset
              and place;       RH.6-8.7,         chronology/map   
              source the       WHST.6-8.7        check            
              evidence set.                                       

  H8-U6-L2\   Civil War and    HSS-8.6.1,        A-H8-U6-L2:      I-H8-U6-L2 (1-2 flex days):
  Days 88-94  emancipation:    HSS-8.6.4,        corroboration    contextualization and
  (7)         analyze,         HSS-8.6.7,        and inquiry      corroboration scaffold
              contextualize,   RH.6-8.8,         notebook         
              and corroborate  WHST.6-8.8 \[CA\]                  
              accounts.                                           

  H8-U6-L3\   Civil War and    HSS-8.6.2,        A-H8-U6-L3:      I-H8-U6-L3 (1-2 flex days):
  Days 95-99  emancipation:    HSS-8.6.5,        document-based   claim-evidence reasoning
  (5)         construct an     RH.6-8.6,         argument or      conference
              evidence-based   WHST.6-8.6        civic/economic   
              interpretation                     task             
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 7. Reconstruction, industrialization, and the West - 16 core days

  -----------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson sequence**  **Primary         **Assessment     **Intervention lesson**
  core days**                      standards**       evidence**       
  ----------- -------------------- ----------------- ---------------- ---------------------------------
  H8-U7-L1\   Reconstruction,      HSS-8.7,          A-H8-U7-L1:      I-H8-U7-L1 (1-2 flex days):
  Days        industrialization,   HSS-8.7.3,        source           timeline/map/source-orientation
  100-103 (4) and the West: orient HSS-8.8.1,        analysis +       reset
              in time and place;   HSS-8.8.4,        chronology/map   
              source the evidence  HSS-8.9,          check            
              set.                 HSS-8.9.3,                         
                                   HSS-8.9.6,                         
                                   HSS-8.10.2,                        
                                   HSS-8.10.5                         

  H8-U7-L2\   Reconstruction,      HSS-8.7.1,        A-H8-U7-L2:      I-H8-U7-L2 (1-2 flex days):
  Days        industrialization,   HSS-8.7.4,        corroboration    contextualization and
  104-110 (7) and the West:        HSS-8.8.2,        and inquiry      corroboration scaffold
              analyze,             HSS-8.8.5,        notebook         
              contextualize, and   HSS-8.9.1,                         
              corroborate          HSS-8.9.4,                         
              accounts.            HSS-8.10,                          
                                   HSS-8.10.3,                        
                                   HSS-8.10.6                         

  H8-U7-L3\   Reconstruction,      HSS-8.7.2,        A-H8-U7-L3:      I-H8-U7-L3 (1-2 flex days):
  Days        industrialization,   HSS-8.8,          document-based   claim-evidence reasoning
  111-115 (5) and the West:        HSS-8.8.3,        argument or      conference
              construct an         HSS-8.8.6,        civic/economic   
              evidence-based       HSS-8.9.2,        task             
              interpretation and   HSS-8.9.5,                         
              transfer it.         HSS-8.10.1,                        
                                   HSS-8.10.4,                        
                                   HSS-8.10.7                         
  -----------------------------------------------------------------------------------------------------

### Unit 8. Civic inquiry, memory, and mastery - 20 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary          **Assessment     **Intervention lesson**
  core days** sequence**       standards**        evidence**       
  ----------- ---------------- ------------------ ---------------- ---------------------------------
  H8-U8-L1\   Civic inquiry,   HSS-8.11,          A-H8-U8-L1:      I-H8-U8-L1 (1-2 flex days):
  Days        memory, and      HSS-8.11.3,        source           timeline/map/source-orientation
  116-120 (5) mastery: orient  HSS-8.12,          analysis +       reset
              in time and      HSS-8.12.3,        chronology/map   
              place; source    HSS-8.12.6,        check            
              the evidence     HSS-8.12.9,                         
              set.             HSS-AS.6-8.HI.3,                    
                               HSS-AS.6-8.HI.6,                    
                               WHST.6-8.9                          

  H8-U8-L2\   Civic inquiry,   HSS-8.11.1,        A-H8-U8-L2:      I-H8-U8-L2 (1-2 flex days):
  Days        memory, and      HSS-8.11.4,        corroboration    contextualization and
  121-129 (9) mastery:         HSS-8.12.1,        and inquiry      corroboration scaffold
              analyze,         HSS-8.12.4,        notebook         
              contextualize,   HSS-8.12.7,                         
              and corroborate  HSS-AS.6-8.HI.1,                    
              accounts.        HSS-AS.6-8.HI.4,                    
                               RH.6-8.9,                           
                               WHST.6-8.10                         

  H8-U8-L3\   Civic inquiry,   HSS-8.11.2,        A-H8-U8-L3:      I-H8-U8-L3 (1-2 flex days):
  Days        memory, and      HSS-8.11.5,        document-based   claim-evidence reasoning
  130-135 (6) mastery:         HSS-8.12.2,        argument or      conference
              construct an     HSS-8.12.5,        civic/economic   
              evidence-based   HSS-8.12.8,        task             
              interpretation   HSS-AS.6-8.HI.2,                    
              and transfer it. HSS-AS.6-8.HI.5,                    
                               RH.6-8.10                           
  --------------------------------------------------------------------------------------------------

Course control check: 27 identified lesson sequences cover core workdays
1-135; all 115 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Grade 9 World Geography and Contemporary Issues

135 core lesson days \| 40 intervention-capacity days \| 48 primary
standards assignments \| 1 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 14 local extensions

### Unit 0. Geographic inquiry and diagnostic - 3 core days

  --------------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days** sequence**                                evidence**       
  ----------- ---------------- ------------------------ ---------------- ---------------------------------
  H9-U0-L1\   Geographic       HSS-AS.9-12.CST.1        A-H9-U0-L1:      I-H9-U0-L1 (1-2 flex days):
  Days 1 (1)  inquiry and                               source           timeline/map/source-orientation
              diagnostic:                               analysis +       reset
              orient in time                            chronology/map   
              and place;                                check            
              source the                                                 
              evidence set.                                              

  H9-U0-L2\   Geographic       Readiness/prerequisite   A-H9-U0-L2:      I-H9-U0-L2 (1-2 flex days):
  Days 2 (1)  inquiry and      evidence; no new primary corroboration    contextualization and
              diagnostic:      standard.                and inquiry      corroboration scaffold
              analyze,                                  notebook         
              contextualize,                                             
              and corroborate                                            
              accounts.                                                  

  H9-U0-L3\   Geographic       Readiness/prerequisite   A-H9-U0-L3:      I-H9-U0-L3 (1-2 flex days):
  Days 3 (1)  inquiry and      evidence; no new primary document-based   claim-evidence reasoning
              diagnostic:      standard.                argument or      conference
              construct an                              civic/economic   
              evidence-based                            task             
              interpretation                                             
              and transfer it.                                           
  --------------------------------------------------------------------------------------------------------

### Unit 1. Place, region, scale, and spatial data - 18 core days

  ----------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary            **Assessment     **Intervention lesson**
  core days** sequence**       standards**          evidence**       
  ----------- ---------------- -------------------- ---------------- ---------------------------------
  H9-U1-L1\   Place, region,   GEO-LOCAL.1          A-H9-U1-L1:      I-H9-U1-L1 (1-2 flex days):
  Days 4-8    scale, and       \[LOCAL\],           source           timeline/map/source-orientation
  (5)         spatial data:    HSS-AS.9-12.CST.3,   analysis +       reset
              orient in time   HSS-AS.9-12.REP.2,   chronology/map   
              and place;       RH.9-10.1            check            
              source the                                             
              evidence set.                                          

  H9-U1-L2\   Place, region,   GEO-LOCAL.8          A-H9-U1-L2:      I-H9-U1-L2 (1-2 flex days):
  Days 9-15   scale, and       \[LOCAL\],           corroboration    contextualization and
  (7)         spatial data:    HSS-AS.9-12.CST.4,   and inquiry      corroboration scaffold
              analyze,         HSS-AS.9-12.REP.3,   notebook         
              contextualize,   WHST.9-10.1                           
              and corroborate                                        
              accounts.                                              

  H9-U1-L3\   Place, region,   HSS-AS.9-12.CST.2,   A-H9-U1-L3:      I-H9-U1-L3 (1-2 flex days):
  Days 16-21  scale, and       HSS-AS.9-12.REP.1,   document-based   claim-evidence reasoning
  (6)         spatial data:    HSS-AS.9-12.REP.4    argument or      conference
              construct an                          civic/economic   
              evidence-based                        task             
              interpretation                                         
              and transfer it.                                       
  ----------------------------------------------------------------------------------------------------

### Unit 2. Population, migration, and cultural landscapes - 19 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H9-U2-L1\   Population,      GEO-LOCAL.2       A-H9-U2-L1:      I-H9-U2-L1 (1-2 flex days):
  Days 22-26  migration, and   \[LOCAL\],        source           timeline/map/source-orientation
  (5)         cultural         WHST.9-10.2       analysis +       reset
              landscapes:                        chronology/map   
              orient in time                     check            
              and place;                                          
              source the                                          
              evidence set.                                       

  H9-U2-L2\   Population,      GEO-LOCAL.9       A-H9-U2-L2:      I-H9-U2-L2 (1-2 flex days):
  Days 27-34  migration, and   \[LOCAL\]         corroboration    contextualization and
  (8)         cultural                           and inquiry      corroboration scaffold
              landscapes:                        notebook         
              analyze,                                            
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H9-U2-L3\   Population,      RH.9-10.2         A-H9-U2-L3:      I-H9-U2-L3 (1-2 flex days):
  Days 35-40  migration, and                     document-based   claim-evidence reasoning
  (6)         cultural                           argument or      conference
              landscapes:                        civic/economic   
              construct an                       task             
              evidence-based                                      
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 3. Political geography, borders, and institutions - 19 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H9-U3-L1\   Political        GEO-LOCAL.3       A-H9-U3-L1:      I-H9-U3-L1 (1-2 flex days):
  Days 41-45  geography,       \[LOCAL\],        source           timeline/map/source-orientation
  (5)         borders, and     WHST.9-10.3       analysis +       reset
              institutions:                      chronology/map   
              orient in time                     check            
              and place;                                          
              source the                                          
              evidence set.                                       

  H9-U3-L2\   Political        GEO-LOCAL.10      A-H9-U3-L2:      I-H9-U3-L2 (1-2 flex days):
  Days 46-53  geography,       \[LOCAL\]         corroboration    contextualization and
  (8)         borders, and                       and inquiry      corroboration scaffold
              institutions:                      notebook         
              analyze,                                            
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H9-U3-L3\   Political        RH.9-10.3         A-H9-U3-L3:      I-H9-U3-L3 (1-2 flex days):
  Days 54-59  geography,                         document-based   claim-evidence reasoning
  (6)         borders, and                       argument or      conference
              institutions:                      civic/economic   
              construct an                       task             
              evidence-based                                      
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 4. Resources, development, and economic networks - 18 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H9-U4-L1\   Resources,       GEO-LOCAL.4       A-H9-U4-L1:      I-H9-U4-L1 (1-2 flex days):
  Days 60-64  development, and \[LOCAL\],        source           timeline/map/source-orientation
  (5)         economic         WHST.9-10.4       analysis +       reset
              networks: orient                   chronology/map   
              in time and                        check            
              place; source                                       
              the evidence                                        
              set.                                                

  H9-U4-L2\   Resources,       GEO-LOCAL.11      A-H9-U4-L2:      I-H9-U4-L2 (1-2 flex days):
  Days 65-71  development, and \[LOCAL\]         corroboration    contextualization and
  (7)         economic                           and inquiry      corroboration scaffold
              networks:                          notebook         
              analyze,                                            
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H9-U4-L3\   Resources,       RH.9-10.4         A-H9-U4-L3:      I-H9-U4-L3 (1-2 flex days):
  Days 72-77  development, and                   document-based   claim-evidence reasoning
  (6)         economic                           argument or      conference
              networks:                          civic/economic   
              construct an                       task             
              evidence-based                                      
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 5. Urbanization, environment, and climate - 19 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H9-U5-L1\   Urbanization,    GEO-LOCAL.5       A-H9-U5-L1:      I-H9-U5-L1 (1-2 flex days):
  Days 78-82  environment, and \[LOCAL\],        source           timeline/map/source-orientation
  (5)         climate: orient  WHST.9-10.5       analysis +       reset
              in time and                        chronology/map   
              place; source                      check            
              the evidence                                        
              set.                                                

  H9-U5-L2\   Urbanization,    GEO-LOCAL.12      A-H9-U5-L2:      I-H9-U5-L2 (1-2 flex days):
  Days 83-90  environment, and \[LOCAL\]         corroboration    contextualization and
  (8)         climate:                           and inquiry      corroboration scaffold
              analyze,                           notebook         
              contextualize,                                      
              and corroborate                                     
              accounts.                                           

  H9-U5-L3\   Urbanization,    RH.9-10.5         A-H9-U5-L3:      I-H9-U5-L3 (1-2 flex days):
  Days 91-96  environment, and                   document-based   claim-evidence reasoning
  (6)         climate:                           argument or      conference
              construct an                       civic/economic   
              evidence-based                     task             
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 6. Media literacy and contemporary global issues - 19 core days

  -------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days** sequence**       standards**       evidence**       
  ----------- ---------------- ----------------- ---------------- ---------------------------------
  H9-U6-L1\   Media literacy   GEO-LOCAL.6       A-H9-U6-L1:      I-H9-U6-L1 (1-2 flex days):
  Days 97-101 and contemporary \[LOCAL\],        source           timeline/map/source-orientation
  (5)         global issues:   RH.9-10.7,        analysis +       reset
              orient in time   WHST.9-10.7       chronology/map   
              and place;                         check            
              source the                                          
              evidence set.                                       

  H9-U6-L2\   Media literacy   GEO-LOCAL.13      A-H9-U6-L2:      I-H9-U6-L2 (1-2 flex days):
  Days        and contemporary \[LOCAL\],        corroboration    contextualization and
  102-109 (8) global issues:   RH.9-10.8,        and inquiry      corroboration scaffold
              analyze,         WHST.9-10.8       notebook         
              contextualize,   \[CA\]                             
              and corroborate                                     
              accounts.                                           

  H9-U6-L3\   Media literacy   RH.9-10.6,        A-H9-U6-L3:      I-H9-U6-L3 (1-2 flex days):
  Days        and contemporary WHST.9-10.6       document-based   claim-evidence reasoning
  110-115 (6) global issues:                     argument or      conference
              construct an                       civic/economic   
              evidence-based                     task             
              interpretation                                      
              and transfer it.                                    
  -------------------------------------------------------------------------------------------------

### Unit 7. Local-to-global inquiry capstone - 20 core days

  ----------------------------------------------------------------------------------------------------
  **Lesson /  **Lesson          **Primary           **Assessment     **Intervention lesson**
  core days** sequence**        standards**         evidence**       
  ----------- ----------------- ------------------- ---------------- ---------------------------------
  H9-U7-L1\   Local-to-global   GEO-LOCAL.7         A-H9-U7-L1:      I-H9-U7-L1 (1-2 flex days):
  Days        inquiry capstone: \[LOCAL\],          source           timeline/map/source-orientation
  116-120 (5) orient in time    HSS-AS.9-12.HI.2,   analysis +       reset
              and place; source HSS-AS.9-12.HI.5,   chronology/map   
              the evidence set. RH.9-10.10          check            

  H9-U7-L2\   Local-to-global   GEO-LOCAL.14        A-H9-U7-L2:      I-H9-U7-L2 (1-2 flex days):
  Days        inquiry capstone: \[LOCAL\],          corroboration    contextualization and
  121-129 (9) analyze,          HSS-AS.9-12.HI.3,   and inquiry      corroboration scaffold
              contextualize,    HSS-AS.9-12.HI.6,   notebook         
              and corroborate   WHST.9-10.9                          
              accounts.                                              

  H9-U7-L3\   Local-to-global   HSS-AS.9-12.HI.1,   A-H9-U7-L3:      I-H9-U7-L3 (1-2 flex days):
  Days        inquiry capstone: HSS-AS.9-12.HI.4,   document-based   claim-evidence reasoning
  130-135 (6) construct an      RH.9-10.9,          argument or      conference
              evidence-based    WHST.9-10.10        civic/economic   
              interpretation                        task             
              and transfer it.                                       
  ----------------------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 48 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Grade 10 Modern World

135 core lesson days \| 40 intervention-capacity days \| 93 primary
standards assignments \| 1 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Historical inquiry and diagnostic - 3 core days

  ---------------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days**  sequence**                                evidence**       
  ------------ ---------------- ------------------------ ---------------- ---------------------------------
  H10-U0-L1\   Historical       HSS-AS.9-12.CST.1        A-H10-U0-L1:     I-H10-U0-L1 (1-2 flex days):
  Days 1 (1)   inquiry and                               source           timeline/map/source-orientation
               diagnostic:                               analysis +       reset
               orient in time                            chronology/map   
               and place;                                check            
               source the                                                 
               evidence set.                                              

  H10-U0-L2\   Historical       Readiness/prerequisite   A-H10-U0-L2:     I-H10-U0-L2 (1-2 flex days):
  Days 2 (1)   inquiry and      evidence; no new primary corroboration    contextualization and
               diagnostic:      standard.                and inquiry      corroboration scaffold
               analyze,                                  notebook         
               contextualize,                                             
               and corroborate                                            
               accounts.                                                  

  H10-U0-L3\   Historical       Readiness/prerequisite   A-H10-U0-L3:     I-H10-U0-L3 (1-2 flex days):
  Days 3 (1)   inquiry and      evidence; no new primary document-based   claim-evidence reasoning
               diagnostic:      standard.                argument or      conference
               construct an                              civic/economic   
               evidence-based                            task             
               interpretation                                             
               and transfer it.                                           
  ---------------------------------------------------------------------------------------------------------

### Unit 1. Democratic ideas and revolutions - 19 core days

  -----------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary            **Assessment     **Intervention lesson**
  core days**  sequence**       standards**          evidence**       
  ------------ ---------------- -------------------- ---------------- ---------------------------------
  H10-U1-L1\   Democratic ideas HSS-10.1,            A-H10-U1-L1:     I-H10-U1-L1 (1-2 flex days):
  Days 4-8 (5) and revolutions: HSS-10.1.3,          source           timeline/map/source-orientation
               orient in time   HSS-10.2.2,          analysis +       reset
               and place;       HSS-10.2.5,          chronology/map   
               source the       HSS-AS.9-12.CST.4,   check            
               evidence set.    HSS-AS.9-12.REP.3,                    
                                WHST.9-10.1                           

  H10-U1-L2\   Democratic ideas HSS-10.1.1,          A-H10-U1-L2:     I-H10-U1-L2 (1-2 flex days):
  Days 9-16    and revolutions: HSS-10.2,            corroboration    contextualization and
  (8)          analyze,         HSS-10.2.3,          and inquiry      corroboration scaffold
               contextualize,   HSS-AS.9-12.CST.2,   notebook         
               and corroborate  HSS-AS.9-12.REP.1,                    
               accounts.        HSS-AS.9-12.REP.4                     

  H10-U1-L3\   Democratic ideas HSS-10.1.2,          A-H10-U1-L3:     I-H10-U1-L3 (1-2 flex days):
  Days 17-22   and revolutions: HSS-10.2.1,          document-based   claim-evidence reasoning
  (6)          construct an     HSS-10.2.4,          argument or      conference
               evidence-based   HSS-AS.9-12.CST.3,   civic/economic   
               interpretation   HSS-AS.9-12.REP.2,   task             
               and transfer it. RH.9-10.1                             
  -----------------------------------------------------------------------------------------------------

### Unit 2. Industrialization and social change - 18 core days

  -----------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson sequence** **Primary         **Assessment     **Intervention lesson**
  core days**                      standards**       evidence**       
  ------------ ------------------- ----------------- ---------------- ---------------------------------
  H10-U2-L1\   Industrialization   HSS-10.3,         A-H10-U2-L1:     I-H10-U2-L1 (1-2 flex days):
  Days 23-27   and social change:  HSS-10.3.3,       source           timeline/map/source-orientation
  (5)          orient in time and  HSS-10.3.6,       analysis +       reset
               place; source the   WHST.9-10.2       chronology/map   
               evidence set.                         check            

  H10-U2-L2\   Industrialization   HSS-10.3.1,       A-H10-U2-L2:     I-H10-U2-L2 (1-2 flex days):
  Days 28-34   and social change:  HSS-10.3.4,       corroboration    contextualization and
  (7)          analyze,            HSS-10.3.7        and inquiry      corroboration scaffold
               contextualize, and                    notebook         
               corroborate                                            
               accounts.                                              

  H10-U2-L3\   Industrialization   HSS-10.3.2,       A-H10-U2-L3:     I-H10-U2-L3 (1-2 flex days):
  Days 35-40   and social change:  HSS-10.3.5,       document-based   claim-evidence reasoning
  (6)          construct an        RH.9-10.2         argument or      conference
               evidence-based                        civic/economic   
               interpretation and                    task             
               transfer it.                                           
  -----------------------------------------------------------------------------------------------------

### Unit 3. Imperialism and global resistance - 19 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days**  sequence**       standards**       evidence**       
  ------------ ---------------- ----------------- ---------------- ---------------------------------
  H10-U3-L1\   Imperialism and  HSS-10.4,         A-H10-U3-L1:     I-H10-U3-L1 (1-2 flex days):
  Days 41-45   global           HSS-10.4.3,       source           timeline/map/source-orientation
  (5)          resistance:      WHST.9-10.3       analysis +       reset
               orient in time                     chronology/map   
               and place;                         check            
               source the                                          
               evidence set.                                       

  H10-U3-L2\   Imperialism and  HSS-10.4.1,       A-H10-U3-L2:     I-H10-U3-L2 (1-2 flex days):
  Days 46-53   global           HSS-10.4.4        corroboration    contextualization and
  (8)          resistance:                        and inquiry      corroboration scaffold
               analyze,                           notebook         
               contextualize,                                      
               and corroborate                                     
               accounts.                                           

  H10-U3-L3\   Imperialism and  HSS-10.4.2,       A-H10-U3-L3:     I-H10-U3-L3 (1-2 flex days):
  Days 54-59   global           RH.9-10.3         document-based   claim-evidence reasoning
  (6)          resistance:                        argument or      conference
               construct an                       civic/economic   
               evidence-based                     task             
               interpretation                                      
               and transfer it.                                    
  --------------------------------------------------------------------------------------------------

### Unit 4. World War I and its aftermath - 19 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days**  sequence**       standards**       evidence**       
  ------------ ---------------- ----------------- ---------------- ---------------------------------
  H10-U4-L1\   World War I and  HSS-10.5,         A-H10-U4-L1:     I-H10-U4-L1 (1-2 flex days):
  Days 60-64   its aftermath:   HSS-10.5.3,       source           timeline/map/source-orientation
  (5)          orient in time   RH.9-10.4         analysis +       reset
               and place;                         chronology/map   
               source the                         check            
               evidence set.                                       

  H10-U4-L2\   World War I and  HSS-10.5.1,       A-H10-U4-L2:     I-H10-U4-L2 (1-2 flex days):
  Days 65-72   its aftermath:   HSS-10.5.4,       corroboration    contextualization and
  (8)          analyze,         WHST.9-10.4       and inquiry      corroboration scaffold
               contextualize,                     notebook         
               and corroborate                                     
               accounts.                                           

  H10-U4-L3\   World War I and  HSS-10.5.2,       A-H10-U4-L3:     I-H10-U4-L3 (1-2 flex days):
  Days 73-78   its aftermath:   HSS-10.5.5        document-based   claim-evidence reasoning
  (6)          construct an                       argument or      conference
               evidence-based                     civic/economic   
               interpretation                     task             
               and transfer it.                                    
  --------------------------------------------------------------------------------------------------

### Unit 5. Totalitarianism, genocide, and World War II - 19 core days

  ----------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson           **Primary         **Assessment     **Intervention lesson**
  core days**  sequence**         standards**       evidence**       
  ------------ ------------------ ----------------- ---------------- ---------------------------------
  H10-U5-L1\   Totalitarianism,   HSS-10.6,         A-H10-U5-L1:     I-H10-U5-L1 (1-2 flex days):
  Days 79-83   genocide, and      HSS-10.6.3,       source           timeline/map/source-orientation
  (5)          World War II:      HSS-10.7.1,       analysis +       reset
               orient in time and RH.9-10.5         chronology/map   
               place; source the                    check            
               evidence set.                                         

  H10-U5-L2\   Totalitarianism,   HSS-10.6.1,       A-H10-U5-L2:     I-H10-U5-L2 (1-2 flex days):
  Days 84-91   genocide, and      HSS-10.6.4,       corroboration    contextualization and
  (8)          World War II:      HSS-10.7.2,       and inquiry      corroboration scaffold
               analyze,           WHST.9-10.5       notebook         
               contextualize, and                                    
               corroborate                                           
               accounts.                                             

  H10-U5-L3\   Totalitarianism,   HSS-10.6.2,       A-H10-U5-L3:     I-H10-U5-L3 (1-2 flex days):
  Days 92-97   genocide, and      HSS-10.7,         document-based   claim-evidence reasoning
  (6)          World War II:      HSS-10.7.3        argument or      conference
               construct an                         civic/economic   
               evidence-based                       task             
               interpretation and                                    
               transfer it.                                          
  ----------------------------------------------------------------------------------------------------

### Unit 6. Cold War, decolonization, and human rights - 18 core days

  ---------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson          **Primary         **Assessment     **Intervention lesson**
  core days**  sequence**        standards**       evidence**       
  ------------ ----------------- ----------------- ---------------- ---------------------------------
  H10-U6-L1\   Cold War,         HSS-10.8,         A-H10-U6-L1:     I-H10-U6-L1 (1-2 flex days):
  Days 98-102  decolonization,   HSS-10.8.3,       source           timeline/map/source-orientation
  (5)          and human rights: HSS-10.8.6,       analysis +       reset
               orient in time    HSS-10.9.2,       chronology/map   
               and place; source HSS-10.9.5,       check            
               the evidence set. HSS-10.9.8,                        
                                 HSS-10.10.2,                       
                                 RH.9-10.7,                         
                                 WHST.9-10.7                        

  H10-U6-L2\   Cold War,         HSS-10.8.1,       A-H10-U6-L2:     I-H10-U6-L2 (1-2 flex days):
  Days 103-109 decolonization,   HSS-10.8.4,       corroboration    contextualization and
  (7)          and human rights: HSS-10.9,         and inquiry      corroboration scaffold
               analyze,          HSS-10.9.3,       notebook         
               contextualize,    HSS-10.9.6,                        
               and corroborate   HSS-10.10,                         
               accounts.         HSS-10.10.3,                       
                                 RH.9-10.8,                         
                                 WHST.9-10.8                        
                                 \[CA\]                             

  H10-U6-L3\   Cold War,         HSS-10.8.2,       A-H10-U6-L3:     I-H10-U6-L3 (1-2 flex days):
  Days 110-115 decolonization,   HSS-10.8.5,       document-based   claim-evidence reasoning
  (6)          and human rights: HSS-10.9.1,       argument or      conference
               construct an      HSS-10.9.4,       civic/economic   
               evidence-based    HSS-10.9.7,       task             
               interpretation    HSS-10.10.1,                       
               and transfer it.  RH.9-10.6,                         
                                 WHST.9-10.6                        
  ---------------------------------------------------------------------------------------------------

### Unit 7. Globalization and contemporary connections - 20 core days

  ----------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary           **Assessment     **Intervention lesson**
  core days**  sequence**       standards**         evidence**       
  ------------ ---------------- ------------------- ---------------- ---------------------------------
  H10-U7-L1\   Globalization    HSS-10.11,          A-H10-U7-L1:     I-H10-U7-L1 (1-2 flex days):
  Days 116-120 and contemporary HSS-AS.9-12.HI.3,   source           timeline/map/source-orientation
  (5)          connections:     HSS-AS.9-12.HI.6,   analysis +       reset
               orient in time   WHST.9-10.9         chronology/map   
               and place;                           check            
               source the                                            
               evidence set.                                         

  H10-U7-L2\   Globalization    HSS-AS.9-12.HI.1,   A-H10-U7-L2:     I-H10-U7-L2 (1-2 flex days):
  Days 121-129 and contemporary HSS-AS.9-12.HI.4,   corroboration    contextualization and
  (9)          connections:     RH.9-10.9,          and inquiry      corroboration scaffold
               analyze,         WHST.9-10.10        notebook         
               contextualize,                                        
               and corroborate                                       
               accounts.                                             

  H10-U7-L3\   Globalization    HSS-AS.9-12.HI.2,   A-H10-U7-L3:     I-H10-U7-L3 (1-2 flex days):
  Days 130-135 and contemporary HSS-AS.9-12.HI.5,   document-based   claim-evidence reasoning
  (6)          connections:     RH.9-10.10          argument or      conference
               construct an                         civic/economic   
               evidence-based                       task             
               interpretation                                        
               and transfer it.                                      
  ----------------------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 93 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Grade 11 U.S. Continuity and Change

135 core lesson days \| 40 intervention-capacity days \| 118 primary
standards assignments \| 0 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Historical inquiry and diagnostic - 3 core days

  ---------------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days**  sequence**                                evidence**       
  ------------ ---------------- ------------------------ ---------------- ---------------------------------
  H11-U0-L1\   Historical       HSS-AS.9-12.CST.1        A-H11-U0-L1:     I-H11-U0-L1 (1-2 flex days):
  Days 1 (1)   inquiry and                               source           timeline/map/source-orientation
               diagnostic:                               analysis +       reset
               orient in time                            chronology/map   
               and place;                                check            
               source the                                                 
               evidence set.                                              

  H11-U0-L2\   Historical       Readiness/prerequisite   A-H11-U0-L2:     I-H11-U0-L2 (1-2 flex days):
  Days 2 (1)   inquiry and      evidence; no new primary corroboration    contextualization and
               diagnostic:      standard.                and inquiry      corroboration scaffold
               analyze,                                  notebook         
               contextualize,                                             
               and corroborate                                            
               accounts.                                                  

  H11-U0-L3\   Historical       Readiness/prerequisite   A-H11-U0-L3:     I-H11-U0-L3 (1-2 flex days):
  Days 3 (1)   inquiry and      evidence; no new primary document-based   claim-evidence reasoning
               diagnostic:      standard.                argument or      conference
               construct an                              civic/economic   
               evidence-based                            task             
               interpretation                                             
               and transfer it.                                           
  ---------------------------------------------------------------------------------------------------------

### Unit 1. Foundations and industrial transformation - 19 core days

  ------------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson          **Primary            **Assessment     **Intervention lesson**
  core days**  sequence**        standards**          evidence**       
  ------------ ----------------- -------------------- ---------------- ---------------------------------
  H11-U1-L1\   Foundations and   HSS-11.1,            A-H11-U1-L1:     I-H11-U1-L1 (1-2 flex days):
  Days 4-8 (5) industrial        HSS-11.1.3,          source           timeline/map/source-orientation
               transformation:   HSS-11.2.1,          analysis +       reset
               orient in time    HSS-11.2.4,          chronology/map   
               and place; source HSS-11.2.7,          check            
               the evidence set. HSS-11.3,                             
                                 HSS-11.3.3,                           
                                 HSS-AS.9-12.CST.2,                    
                                 HSS-AS.9-12.REP.1,                    
                                 HSS-AS.9-12.REP.4                     

  H11-U1-L2\   Foundations and   HSS-11.1.1,          A-H11-U1-L2:     I-H11-U1-L2 (1-2 flex days):
  Days 9-16    industrial        HSS-11.1.4,          corroboration    contextualization and
  (8)          transformation:   HSS-11.2.2,          and inquiry      corroboration scaffold
               analyze,          HSS-11.2.5,          notebook         
               contextualize,    HSS-11.2.8,                           
               and corroborate   HSS-11.3.1,                           
               accounts.         HSS-11.3.4,                           
                                 HSS-AS.9-12.CST.3,                    
                                 HSS-AS.9-12.REP.2,                    
                                 RH.11-12.1                            

  H11-U1-L3\   Foundations and   HSS-11.1.2,          A-H11-U1-L3:     I-H11-U1-L3 (1-2 flex days):
  Days 17-22   industrial        HSS-11.2,            document-based   claim-evidence reasoning
  (6)          transformation:   HSS-11.2.3,          argument or      conference
               construct an      HSS-11.2.6,          civic/economic   
               evidence-based    HSS-11.2.9,          task             
               interpretation    HSS-11.3.2,                           
               and transfer it.  HSS-11.3.5,                           
                                 HSS-AS.9-12.CST.4,                    
                                 HSS-AS.9-12.REP.3,                    
                                 WHST.11-12.1                          
  ------------------------------------------------------------------------------------------------------

### Unit 2. Progressivism, reform, and U.S. expansion - 18 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days**  sequence**       standards**       evidence**       
  ------------ ---------------- ----------------- ---------------- ---------------------------------
  H11-U2-L1\   Progressivism,   HSS-11.4,         A-H11-U2-L1:     I-H11-U2-L1 (1-2 flex days):
  Days 23-27   reform, and U.S. HSS-11.4.3,       source           timeline/map/source-orientation
  (5)          expansion:       HSS-11.4.6,       analysis +       reset
               orient in time   HSS-11.5.2,       chronology/map   
               and place;       HSS-11.5.5,       check            
               source the       RH.11-12.2                         
               evidence set.                                       

  H11-U2-L2\   Progressivism,   HSS-11.4.1,       A-H11-U2-L2:     I-H11-U2-L2 (1-2 flex days):
  Days 28-34   reform, and U.S. HSS-11.4.4,       corroboration    contextualization and
  (7)          expansion:       HSS-11.5,         and inquiry      corroboration scaffold
               analyze,         HSS-11.5.3,       notebook         
               contextualize,   HSS-11.5.6,                        
               and corroborate  WHST.11-12.2                       
               accounts.                                           

  H11-U2-L3\   Progressivism,   HSS-11.4.2,       A-H11-U2-L3:     I-H11-U2-L3 (1-2 flex days):
  Days 35-40   reform, and U.S. HSS-11.4.5,       document-based   claim-evidence reasoning
  (6)          expansion:       HSS-11.5.1,       argument or      conference
               construct an     HSS-11.5.4,       civic/economic   
               evidence-based   HSS-11.5.7        task             
               interpretation                                      
               and transfer it.                                    
  --------------------------------------------------------------------------------------------------

### Unit 3. World War I, the 1920s, and the Depression - 19 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days**  sequence**       standards**       evidence**       
  ------------ ---------------- ----------------- ---------------- ---------------------------------
  H11-U3-L1\   World War I, the HSS-11.6,         A-H11-U3-L1:     I-H11-U3-L1 (1-2 flex days):
  Days 41-45   1920s, and the   HSS-11.6.3,       source           timeline/map/source-orientation
  (5)          Depression:      HSS-11.7,         analysis +       reset
               orient in time   HSS-11.7.3,       chronology/map   
               and place;       HSS-11.7.6,       check            
               source the       HSS-11.8,                          
               evidence set.    HSS-11.8.3,                        
                                HSS-11.8.6,                        
                                RH.11-12.3                         

  H11-U3-L2\   World War I, the HSS-11.6.1,       A-H11-U3-L2:     I-H11-U3-L2 (1-2 flex days):
  Days 46-53   1920s, and the   HSS-11.6.4,       corroboration    contextualization and
  (8)          Depression:      HSS-11.7.1,       and inquiry      corroboration scaffold
               analyze,         HSS-11.7.4,       notebook         
               contextualize,   HSS-11.7.7,                        
               and corroborate  HSS-11.8.1,                        
               accounts.        HSS-11.8.4,                        
                                HSS-11.8.7,                        
                                WHST.11-12.3                       

  H11-U3-L3\   World War I, the HSS-11.6.2,       A-H11-U3-L3:     I-H11-U3-L3 (1-2 flex days):
  Days 54-59   1920s, and the   HSS-11.6.5,       document-based   claim-evidence reasoning
  (6)          Depression:      HSS-11.7.2,       argument or      conference
               construct an     HSS-11.7.5,       civic/economic   
               evidence-based   HSS-11.7.8,       task             
               interpretation   HSS-11.8.2,                        
               and transfer it. HSS-11.8.5,                        
                                HSS-11.8.8                         
  --------------------------------------------------------------------------------------------------

### Unit 4. World War II and the changing United States - 19 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days**  sequence**       standards**       evidence**       
  ------------ ---------------- ----------------- ---------------- ---------------------------------
  H11-U4-L1\   World War II and HSS-11.9,         A-H11-U4-L1:     I-H11-U4-L1 (1-2 flex days):
  Days 60-64   the changing     HSS-11.9.3,       source           timeline/map/source-orientation
  (5)          United States:   HSS-11.9.6,       analysis +       reset
               orient in time   WHST.11-12.4      chronology/map   
               and place;                         check            
               source the                                          
               evidence set.                                       

  H11-U4-L2\   World War II and HSS-11.9.1,       A-H11-U4-L2:     I-H11-U4-L2 (1-2 flex days):
  Days 65-72   the changing     HSS-11.9.4,       corroboration    contextualization and
  (8)          United States:   HSS-11.9.7        and inquiry      corroboration scaffold
               analyze,                           notebook         
               contextualize,                                      
               and corroborate                                     
               accounts.                                           

  H11-U4-L3\   World War II and HSS-11.9.2,       A-H11-U4-L3:     I-H11-U4-L3 (1-2 flex days):
  Days 73-78   the changing     HSS-11.9.5,       document-based   claim-evidence reasoning
  (6)          United States:   RH.11-12.4        argument or      conference
               construct an                       civic/economic   
               evidence-based                     task             
               interpretation                                      
               and transfer it.                                    
  --------------------------------------------------------------------------------------------------

### Unit 5. Cold War, prosperity, and conflict - 18 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days**  sequence**       standards**       evidence**       
  ------------ ---------------- ----------------- ---------------- ---------------------------------
  H11-U5-L1\   Cold War,        HSS-11.10,        A-H11-U5-L1:     I-H11-U5-L1 (1-2 flex days):
  Days 79-83   prosperity, and  HSS-11.10.3,      source           timeline/map/source-orientation
  (5)          conflict: orient HSS-11.10.6,      analysis +       reset
               in time and      WHST.11-12.5      chronology/map   
               place; source                      check            
               the evidence                                        
               set.                                                

  H11-U5-L2\   Cold War,        HSS-11.10.1,      A-H11-U5-L2:     I-H11-U5-L2 (1-2 flex days):
  Days 84-90   prosperity, and  HSS-11.10.4,      corroboration    contextualization and
  (7)          conflict:        HSS-11.10.7       and inquiry      corroboration scaffold
               analyze,                           notebook         
               contextualize,                                      
               and corroborate                                     
               accounts.                                           

  H11-U5-L3\   Cold War,        HSS-11.10.2,      A-H11-U5-L3:     I-H11-U5-L3 (1-2 flex days):
  Days 91-96   prosperity, and  HSS-11.10.5,      document-based   claim-evidence reasoning
  (6)          conflict:        RH.11-12.5        argument or      conference
               construct an                       civic/economic   
               evidence-based                     task             
               interpretation                                      
               and transfer it.                                    
  --------------------------------------------------------------------------------------------------

### Unit 6. Civil rights, social movements, and political change - 19 core days

  --------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days**  sequence**       standards**       evidence**       
  ------------ ---------------- ----------------- ---------------- ---------------------------------
  H11-U6-L1\   Civil rights,    HSS-11.11,        A-H11-U6-L1:     I-H11-U6-L1 (1-2 flex days):
  Days 97-101  social           HSS-11.11.3,      source           timeline/map/source-orientation
  (5)          movements, and   HSS-11.11.6,      analysis +       reset
               political        RH.11-12.7,       chronology/map   
               change: orient   WHST.11-12.7      check            
               in time and                                         
               place; source                                       
               the evidence                                        
               set.                                                

  H11-U6-L2\   Civil rights,    HSS-11.11.1,      A-H11-U6-L2:     I-H11-U6-L2 (1-2 flex days):
  Days 102-109 social           HSS-11.11.4,      corroboration    contextualization and
  (8)          movements, and   HSS-11.11.7,      and inquiry      corroboration scaffold
               political        RH.11-12.8,       notebook         
               change: analyze, WHST.11-12.8                       
               contextualize,                                      
               and corroborate                                     
               accounts.                                           

  H11-U6-L3\   Civil rights,    HSS-11.11.2,      A-H11-U6-L3:     I-H11-U6-L3 (1-2 flex days):
  Days 110-115 social           HSS-11.11.5,      document-based   claim-evidence reasoning
  (6)          movements, and   RH.11-12.6,       argument or      conference
               political        WHST.11-12.6      civic/economic   
               change:                            task             
               construct an                                        
               evidence-based                                      
               interpretation                                      
               and transfer it.                                    
  --------------------------------------------------------------------------------------------------

### Unit 7. Contemporary United States inquiry - 20 core days

  ----------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary           **Assessment     **Intervention lesson**
  core days**  sequence**       standards**         evidence**       
  ------------ ---------------- ------------------- ---------------- ---------------------------------
  H11-U7-L1\   Contemporary     HSS-AS.9-12.HI.1,   A-H11-U7-L1:     I-H11-U7-L1 (1-2 flex days):
  Days 116-120 United States    HSS-AS.9-12.HI.4,   source           timeline/map/source-orientation
  (5)          inquiry: orient  RH.11-12.9,         analysis +       reset
               in time and      WHST.11-12.10       chronology/map   
               place; source                        check            
               the evidence                                          
               set.                                                  

  H11-U7-L2\   Contemporary     HSS-AS.9-12.HI.2,   A-H11-U7-L2:     I-H11-U7-L2 (1-2 flex days):
  Days 121-129 United States    HSS-AS.9-12.HI.5,   corroboration    contextualization and
  (9)          inquiry:         RH.11-12.10         and inquiry      corroboration scaffold
               analyze,                             notebook         
               contextualize,                                        
               and corroborate                                       
               accounts.                                             

  H11-U7-L3\   Contemporary     HSS-AS.9-12.HI.3,   A-H11-U7-L3:     I-H11-U7-L3 (1-2 flex days):
  Days 130-135 United States    HSS-AS.9-12.HI.6,   document-based   claim-evidence reasoning
  (6)          inquiry:         WHST.11-12.9        argument or      conference
               construct an                         civic/economic   
               evidence-based                       task             
               interpretation                                        
               and transfer it.                                      
  ----------------------------------------------------------------------------------------------------

Course control check: 24 identified lesson sequences cover core workdays
1-135; all 118 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

## Grade 12 Government and Economics

135 core lesson days \| 40 intervention-capacity days \| 131 primary
standards assignments \| 0 CA-tagged \| 0 starred/modeling \| 0 advanced
(+) \| 0 local extensions

### Unit 0. Civic and economic reasoning diagnostic - 3 core days

  ---------------------------------------------------------------------------------------------------------
  **Lesson /   **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days**  sequence**                                evidence**       
  ------------ ---------------- ------------------------ ---------------- ---------------------------------
  H12-U0-L1\   Civic and        HSS-AS.9-12.CST.1        A-H12-U0-L1:     I-H12-U0-L1 (1-2 flex days):
  Days 1 (1)   economic                                  source           timeline/map/source-orientation
               reasoning                                 analysis +       reset
               diagnostic:                               chronology/map   
               orient in time                            check            
               and place;                                                 
               source the                                                 
               evidence set.                                              

  H12-U0-L2\   Civic and        Readiness/prerequisite   A-H12-U0-L2:     I-H12-U0-L2 (1-2 flex days):
  Days 2 (1)   economic         evidence; no new primary corroboration    contextualization and
               reasoning        standard.                and inquiry      corroboration scaffold
               diagnostic:                               notebook         
               analyze,                                                   
               contextualize,                                             
               and corroborate                                            
               accounts.                                                  

  H12-U0-L3\   Civic and        Readiness/prerequisite   A-H12-U0-L3:     I-H12-U0-L3 (1-2 flex days):
  Days 3 (1)   economic         evidence; no new primary document-based   claim-evidence reasoning
               reasoning        standard.                argument or      conference
               diagnostic:                               civic/economic   
               construct an                              task             
               evidence-based                                             
               interpretation                                             
               and transfer it.                                           
  ---------------------------------------------------------------------------------------------------------

### Unit G1. Constitutional principles and federalism - 16 core days

  ---------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary         **Assessment     **Intervention lesson**
  core days**   sequence**       standards**       evidence**       
  ------------- ---------------- ----------------- ---------------- ---------------------------------
  H12-UG1-L1\   Constitutional   HSS-PoAD.12.1.1   A-H12-UG1-L1:    I-H12-UG1-L1 (1-2 flex days):
  Days 4-7 (4)  principles and   \[GOV\],          source           timeline/map/source-orientation
                federalism:      HSS-PoAD.12.1.4   analysis +       reset
                orient in time   \[GOV\],          chronology/map   
                and place;       HSS-PoAD.12.1     check            
                source the       \[GOV\],                           
                evidence set.    HSS-PoAD.12.2.3                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.2.6                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.3.2                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.3                      
                                 \[GOV\],                           
                                 HSS-PoAD.12.4.3                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.4.6                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.5.2                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.5                      
                                 \[GOV\],                           
                                 HSS-PoAD.12.6.3                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.6.6                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.7.2                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.7.5                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.7.8                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.8.2                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.9.1                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.9.4                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.9.7                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.10                     
                                 \[GOV\]                            

  H12-UG1-L2\   Constitutional   HSS-PoAD.12.1.2   A-H12-UG1-L2:    I-H12-UG1-L2 (1-2 flex days):
  Days 8-14 (7) principles and   \[GOV\],          corroboration    contextualization and
                federalism:      HSS-PoAD.12.1.5   and inquiry      corroboration scaffold
                analyze,         \[GOV\],          notebook         
                contextualize,   HSS-PoAD.12.2.1                    
                and corroborate  \[GOV\],                           
                accounts.        HSS-PoAD.12.2.4                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.2                      
                                 \[GOV\],                           
                                 HSS-PoAD.12.3.3                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.4.1                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.4.4                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.4                      
                                 \[GOV\],                           
                                 HSS-PoAD.12.5.3                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.6.1                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.6.4                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.6                      
                                 \[GOV\],                           
                                 HSS-PoAD.12.7.3                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.7.6                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.7                      
                                 \[GOV\],                           
                                 HSS-PoAD.12.8.3                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.9.2                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.9.5                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.9.8                    
                                 \[GOV\]                            

  H12-UG1-L3\   Constitutional   HSS-PoAD.12.1.3   A-H12-UG1-L3:    I-H12-UG1-L3 (1-2 flex days):
  Days 15-19    principles and   \[GOV\],          document-based   claim-evidence reasoning
  (5)           federalism:      HSS-PoAD.12.1.6   argument or      conference
                construct an     \[GOV\],          civic/economic   
                evidence-based   HSS-PoAD.12.2.2   task             
                interpretation   \[GOV\],                           
                and transfer it. HSS-PoAD.12.2.5                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.3.1                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.3.4                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.4.2                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.4.5                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.5.1                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.5.4                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.6.2                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.6.5                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.7.1                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.7.4                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.7.7                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.8.1                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.8                      
                                 \[GOV\],                           
                                 HSS-PoAD.12.9.3                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.9.6                    
                                 \[GOV\],                           
                                 HSS-PoAD.12.9                      
                                 \[GOV\]                            
  ---------------------------------------------------------------------------------------------------

### Unit G2. Institutions, elections, and participation - 16 core days

  ----------------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days**   sequence**                                evidence**       
  ------------- ---------------- ------------------------ ---------------- ---------------------------------
  H12-UG2-L1\   Institutions,    Readiness/prerequisite   A-H12-UG2-L1:    I-H12-UG2-L1 (1-2 flex days):
  Days 20-23    elections, and   evidence; no new primary source           timeline/map/source-orientation
  (4)           participation:   standard.                analysis +       reset
                orient in time                            chronology/map   
                and place;                                check            
                source the                                                 
                evidence set.                                              

  H12-UG2-L2\   Institutions,    Readiness/prerequisite   A-H12-UG2-L2:    I-H12-UG2-L2 (1-2 flex days):
  Days 24-30    elections, and   evidence; no new primary corroboration    contextualization and
  (7)           participation:   standard.                and inquiry      corroboration scaffold
                analyze,                                  notebook         
                contextualize,                                             
                and corroborate                                            
                accounts.                                                  

  H12-UG2-L3\   Institutions,    Readiness/prerequisite   A-H12-UG2-L3:    I-H12-UG2-L3 (1-2 flex days):
  Days 31-35    elections, and   evidence; no new primary document-based   claim-evidence reasoning
  (5)           participation:   standard.                argument or      conference
                construct an                              civic/economic   
                evidence-based                            task             
                interpretation                                             
                and transfer it.                                           
  ----------------------------------------------------------------------------------------------------------

### Unit G3. Civil liberties, civil rights, and courts - 16 core days

  ----------------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days**   sequence**                                evidence**       
  ------------- ---------------- ------------------------ ---------------- ---------------------------------
  H12-UG3-L1\   Civil liberties, Readiness/prerequisite   A-H12-UG3-L1:    I-H12-UG3-L1 (1-2 flex days):
  Days 36-39    civil rights,    evidence; no new primary source           timeline/map/source-orientation
  (4)           and courts:      standard.                analysis +       reset
                orient in time                            chronology/map   
                and place;                                check            
                source the                                                 
                evidence set.                                              

  H12-UG3-L2\   Civil liberties, Readiness/prerequisite   A-H12-UG3-L2:    I-H12-UG3-L2 (1-2 flex days):
  Days 40-46    civil rights,    evidence; no new primary corroboration    contextualization and
  (7)           and courts:      standard.                and inquiry      corroboration scaffold
                analyze,                                  notebook         
                contextualize,                                             
                and corroborate                                            
                accounts.                                                  

  H12-UG3-L3\   Civil liberties, Readiness/prerequisite   A-H12-UG3-L3:    I-H12-UG3-L3 (1-2 flex days):
  Days 47-51    civil rights,    evidence; no new primary document-based   claim-evidence reasoning
  (5)           and courts:      standard.                argument or      conference
                construct an                              civic/economic   
                evidence-based                            task             
                interpretation                                             
                and transfer it.                                           
  ----------------------------------------------------------------------------------------------------------

### Unit G4. Public policy and comparative government - 16 core days

  ----------------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days**   sequence**                                evidence**       
  ------------- ---------------- ------------------------ ---------------- ---------------------------------
  H12-UG4-L1\   Public policy    Readiness/prerequisite   A-H12-UG4-L1:    I-H12-UG4-L1 (1-2 flex days):
  Days 52-55    and comparative  evidence; no new primary source           timeline/map/source-orientation
  (4)           government:      standard.                analysis +       reset
                orient in time                            chronology/map   
                and place;                                check            
                source the                                                 
                evidence set.                                              

  H12-UG4-L2\   Public policy    Readiness/prerequisite   A-H12-UG4-L2:    I-H12-UG4-L2 (1-2 flex days):
  Days 56-62    and comparative  evidence; no new primary corroboration    contextualization and
  (7)           government:      standard.                and inquiry      corroboration scaffold
                analyze,                                  notebook         
                contextualize,                                             
                and corroborate                                            
                accounts.                                                  

  H12-UG4-L3\   Public policy    Readiness/prerequisite   A-H12-UG4-L3:    I-H12-UG4-L3 (1-2 flex days):
  Days 63-67    and comparative  evidence; no new primary document-based   claim-evidence reasoning
  (5)           government:      standard.                argument or      conference
                construct an                              civic/economic   
                evidence-based                            task             
                interpretation                                             
                and transfer it.                                           
  ----------------------------------------------------------------------------------------------------------

### Unit E1. Choice, incentives, markets, and institutions - 17 core days

  ----------------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days**   sequence**                                evidence**       
  ------------- ---------------- ------------------------ ---------------- ---------------------------------
  H12-UE1-L1\   Choice,          Readiness/prerequisite   A-H12-UE1-L1:    I-H12-UE1-L1 (1-2 flex days):
  Days 68-71    incentives,      evidence; no new primary source           timeline/map/source-orientation
  (4)           markets, and     standard.                analysis +       reset
                institutions:                             chronology/map   
                orient in time                            check            
                and place;                                                 
                source the                                                 
                evidence set.                                              

  H12-UE1-L2\   Choice,          Readiness/prerequisite   A-H12-UE1-L2:    I-H12-UE1-L2 (1-2 flex days):
  Days 72-79    incentives,      evidence; no new primary corroboration    contextualization and
  (8)           markets, and     standard.                and inquiry      corroboration scaffold
                institutions:                             notebook         
                analyze,                                                   
                contextualize,                                             
                and corroborate                                            
                accounts.                                                  

  H12-UE1-L3\   Choice,          Readiness/prerequisite   A-H12-UE1-L3:    I-H12-UE1-L3 (1-2 flex days):
  Days 80-84    incentives,      evidence; no new primary document-based   claim-evidence reasoning
  (5)           markets, and     standard.                argument or      conference
                institutions:                             civic/economic   
                construct an                              task             
                evidence-based                                             
                interpretation                                             
                and transfer it.                                           
  ----------------------------------------------------------------------------------------------------------

### Unit E2. Firms, labor, competition, and regulation - 17 core days

  ----------------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary standards**    **Assessment     **Intervention lesson**
  core days**   sequence**                                evidence**       
  ------------- ---------------- ------------------------ ---------------- ---------------------------------
  H12-UE2-L1\   Firms, labor,    Readiness/prerequisite   A-H12-UE2-L1:    I-H12-UE2-L1 (1-2 flex days):
  Days 85-88    competition, and evidence; no new primary source           timeline/map/source-orientation
  (4)           regulation:      standard.                analysis +       reset
                orient in time                            chronology/map   
                and place;                                check            
                source the                                                 
                evidence set.                                              

  H12-UE2-L2\   Firms, labor,    Readiness/prerequisite   A-H12-UE2-L2:    I-H12-UE2-L2 (1-2 flex days):
  Days 89-96    competition, and evidence; no new primary corroboration    contextualization and
  (8)           regulation:      standard.                and inquiry      corroboration scaffold
                analyze,                                  notebook         
                contextualize,                                             
                and corroborate                                            
                accounts.                                                  

  H12-UE2-L3\   Firms, labor,    Readiness/prerequisite   A-H12-UE2-L3:    I-H12-UE2-L3 (1-2 flex days):
  Days 97-101   competition, and evidence; no new primary document-based   claim-evidence reasoning
  (5)           regulation:      standard.                argument or      conference
                construct an                              civic/economic   
                evidence-based                            task             
                interpretation                                             
                and transfer it.                                           
  ----------------------------------------------------------------------------------------------------------

### Unit E3. Macroeconomics, fiscal policy, and monetary policy - 17 core days

  -----------------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson          **Primary standards**    **Assessment     **Intervention lesson**
  core days**   sequence**                                 evidence**       
  ------------- ----------------- ------------------------ ---------------- ---------------------------------
  H12-UE3-L1\   Macroeconomics,   Readiness/prerequisite   A-H12-UE3-L1:    I-H12-UE3-L1 (1-2 flex days):
  Days 102-105  fiscal policy,    evidence; no new primary source           timeline/map/source-orientation
  (4)           and monetary      standard.                analysis +       reset
                policy: orient in                          chronology/map   
                time and place;                            check            
                source the                                                  
                evidence set.                                               

  H12-UE3-L2\   Macroeconomics,   Readiness/prerequisite   A-H12-UE3-L2:    I-H12-UE3-L2 (1-2 flex days):
  Days 106-113  fiscal policy,    evidence; no new primary corroboration    contextualization and
  (8)           and monetary      standard.                and inquiry      corroboration scaffold
                policy: analyze,                           notebook         
                contextualize,                                              
                and corroborate                                             
                accounts.                                                   

  H12-UE3-L3\   Macroeconomics,   Readiness/prerequisite   A-H12-UE3-L3:    I-H12-UE3-L3 (1-2 flex days):
  Days 114-118  fiscal policy,    evidence; no new primary document-based   claim-evidence reasoning
  (5)           and monetary      standard.                argument or      conference
                policy: construct                          civic/economic   
                an evidence-based                          task             
                interpretation                                              
                and transfer it.                                            
  -----------------------------------------------------------------------------------------------------------

### Unit E4. Global economics, personal finance, and policy - 17 core days

  ------------------------------------------------------------------------------------------------------
  **Lesson /    **Lesson         **Primary            **Assessment     **Intervention lesson**
  core days**   sequence**       standards**          evidence**       
  ------------- ---------------- -------------------- ---------------- ---------------------------------
  H12-UE4-L1\   Global           HSS-AS.9-12.CST.2,   A-H12-UE4-L1:    I-H12-UE4-L1 (1-2 flex days):
  Days 119-122  economics,       HSS-AS.9-12.HI.1,    source           timeline/map/source-orientation
  (4)           personal         HSS-AS.9-12.HI.4,    analysis +       reset
                finance, and     HSS-AS.9-12.REP.1,   chronology/map   
                policy: orient   HSS-AS.9-12.REP.4,   check            
                in time and      HSS-PoE.12.1.3                        
                place; source    \[ECON\],                             
                the evidence     HSS-PoE.12.1                          
                set.             \[ECON\],                             
                                 HSS-PoE.12.2.3                        
                                 \[ECON\],                             
                                 HSS-PoE.12.2.6                        
                                 \[ECON\],                             
                                 HSS-PoE.12.2.9                        
                                 \[ECON\],                             
                                 HSS-PoE.12.3.1                        
                                 \[ECON\],                             
                                 HSS-PoE.12.3.4                        
                                 \[ECON\],                             
                                 HSS-PoE.12.4.2                        
                                 \[ECON\],                             
                                 HSS-PoE.12.4                          
                                 \[ECON\],                             
                                 HSS-PoE.12.5.3                        
                                 \[ECON\],                             
                                 HSS-PoE.12.6.2                        
                                 \[ECON\],                             
                                 HSS-PoE.12.6                          
                                 \[ECON\],                             
                                 RH.11-12.3,                           
                                 RH.11-12.6,                           
                                 RH.11-12.9,                           
                                 WHST.11-12.2,                         
                                 WHST.11-12.5,                         
                                 WHST.11-12.8                          

  H12-UE4-L2\   Global           HSS-AS.9-12.CST.3,   A-H12-UE4-L2:    I-H12-UE4-L2 (1-2 flex days):
  Days 123-130  economics,       HSS-AS.9-12.HI.2,    corroboration    contextualization and
  (8)           personal         HSS-AS.9-12.HI.5,    and inquiry      corroboration scaffold
                finance, and     HSS-AS.9-12.REP.2,   notebook         
                policy: analyze, HSS-PoE.12.1.1                        
                contextualize,   \[ECON\],                             
                and corroborate  HSS-PoE.12.1.4                        
                accounts.        \[ECON\],                             
                                 HSS-PoE.12.2.1                        
                                 \[ECON\],                             
                                 HSS-PoE.12.2.4                        
                                 \[ECON\],                             
                                 HSS-PoE.12.2.7                        
                                 \[ECON\],                             
                                 HSS-PoE.12.2.10                       
                                 \[ECON\],                             
                                 HSS-PoE.12.3.2                        
                                 \[ECON\],                             
                                 HSS-PoE.12.3                          
                                 \[ECON\],                             
                                 HSS-PoE.12.4.3                        
                                 \[ECON\],                             
                                 HSS-PoE.12.5.1                        
                                 \[ECON\],                             
                                 HSS-PoE.12.5                          
                                 \[ECON\],                             
                                 HSS-PoE.12.6.3                        
                                 \[ECON\],                             
                                 RH.11-12.1,                           
                                 RH.11-12.4,                           
                                 RH.11-12.7,                           
                                 RH.11-12.10,                          
                                 WHST.11-12.3,                         
                                 WHST.11-12.6,                         
                                 WHST.11-12.9                          

  H12-UE4-L3\   Global           HSS-AS.9-12.CST.4,   A-H12-UE4-L3:    I-H12-UE4-L3 (1-2 flex days):
  Days 131-135  economics,       HSS-AS.9-12.HI.3,    document-based   claim-evidence reasoning
  (5)           personal         HSS-AS.9-12.HI.6,    argument or      conference
                finance, and     HSS-AS.9-12.REP.3,   civic/economic   
                policy:          HSS-PoE.12.1.2       task             
                construct an     \[ECON\],                             
                evidence-based   HSS-PoE.12.1.5                        
                interpretation   \[ECON\],                             
                and transfer it. HSS-PoE.12.2.2                        
                                 \[ECON\],                             
                                 HSS-PoE.12.2.5                        
                                 \[ECON\],                             
                                 HSS-PoE.12.2.8                        
                                 \[ECON\],                             
                                 HSS-PoE.12.2                          
                                 \[ECON\],                             
                                 HSS-PoE.12.3.3                        
                                 \[ECON\],                             
                                 HSS-PoE.12.4.1                        
                                 \[ECON\],                             
                                 HSS-PoE.12.4.4                        
                                 \[ECON\],                             
                                 HSS-PoE.12.5.2                        
                                 \[ECON\],                             
                                 HSS-PoE.12.6.1                        
                                 \[ECON\],                             
                                 HSS-PoE.12.6.4                        
                                 \[ECON\],                             
                                 RH.11-12.2,                           
                                 RH.11-12.5,                           
                                 RH.11-12.8,                           
                                 WHST.11-12.1,                         
                                 WHST.11-12.4,                         
                                 WHST.11-12.7,                         
                                 WHST.11-12.10                         
  ------------------------------------------------------------------------------------------------------

Course control check: 27 identified lesson sequences cover core workdays
1-135; all 131 applicable standards have a primary lesson, an assessment
artifact, and an intervention route. Intervention activation remains
limited to the separate 40-day reserve.

# Appendix G. Alignment sources and release controls

Standards sources used for this release:

  -------------------------------------------------------------------------------------------------
  **Subject**   **Authority**                    **Control source**
  ------------- -------------------------------- --------------------------------------------------
  Mathematics   California Common Core State     https://www2.cde.ca.gov/cacs/math
                Standards: Mathematics, adopted  
                2010 and modified January 2013   

  English and   California Common Core State     https://www2.cde.ca.gov/cacs/ela
  literacy      Standards for English Language   
                Arts and Literacy in             
                History/Social Studies, Science, 
                and Technical Subjects           

  Science       California Next Generation       https://www.cde.ca.gov/ci/pl/ngssstandards.asp
                Science Standards; preferred     
                integrated grades 6-8 and 2016   
                Science Framework high-school    
                three-course model               

  Social        2016 California History-Social   https://www.cde.ca.gov/ci/hs/cf/hssframework.asp
  science       Science Framework, Appendix C    
                content standards and grade-band 
                analysis skills                  
  -------------------------------------------------------------------------------------------------

Release rule: a course version cannot be published unless its core
lesson days total 135, its intervention capacity is capped at 40 days,
every active standard has one primary lesson and assessment, and any
local outcome is visibly distinguished from a California-adopted
standard. When California revises a standard, the platform creates a new
standards snapshot and requires an explicit remap before the affected
course version can be approved.

Alignment inventory for this release: 30 courses and 1846 primary
standards assignments.
