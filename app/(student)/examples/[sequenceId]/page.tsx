import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import {
  Banner,
  Card,
  CardHeader,
  FactList,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import {
  phaseCount,
  sequenceById,
  sequenceMinutes,
} from "@/lib/db/demo-sequences";
import { lessonLabel } from "@/lib/views/learning-focus";

export default async function SequencePage({
  params,
}: {
  params: Promise<{ sequenceId: string }>;
}) {
  const { sequenceId } = await params;
  await requireUser();
  const sequence = sequenceById(sequenceId);
  if (!sequence) notFound();

  // Numbered up front rather than counted during render: the phase number is
  // derived data, not render state.
  const numbered = new Map<string, number>();
  sequence.missions
    .flatMap((m) => m.phases)
    .forEach((phase, i) => numbered.set(phase.id, i + 1));

  return (
    <div className="py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link
          href="/examples"
          className={`underline underline-offset-4 hover:text-primary ${FOCUS_RING}`}
        >
          Example lessons
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink">{sequence.name}</span>
      </nav>

      <header className="mt-3">
        <p className="text-xs font-bold uppercase tracking-wider text-positive">
          Example lesson sequence
        </p>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ink">
          {sequence.name}
        </h1>
        <p className="mt-1.5 text-base text-ink-muted">
          {sequence.subtitle} &middot; {sequence.courseTitle}
        </p>
      </header>

      <div className="mt-5">
        <Banner title="Nothing here is recorded." tone="notice">
          This sequence does not affect pathway progression. No evidence is
          written, no grade changes, and no lesson state moves.
        </Banner>
      </div>

      <div className="mt-5">
        <Card className="p-5">
          <p className="text-base text-ink">{sequence.premise}</p>
          <div className="mt-4">
            <FactList
              columns={3}
              items={[
                { label: "Missions", value: `${sequence.missions.length}` },
                { label: "Phases", value: `${phaseCount(sequence)}` },
                { label: "Total minutes", value: `${sequenceMinutes(sequence)}` },
              ]}
            />
          </div>
          <div className="mt-4 rounded-lg bg-surface-sunken px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              What to notice about the design
            </p>
            <p className="mt-1 text-sm text-ink">{sequence.designNote}</p>
          </div>
        </Card>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        {sequence.missions.map((mission) => (
          <Card key={mission.id}>
            <CardHeader title={mission.title} hint={mission.premise} />
            <ol className="divide-y divide-line">
              {mission.phases.map((phase) => {
                const phaseNumber = numbered.get(phase.id) ?? 0;
                return (
                  <li key={phase.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">
                        Phase {phaseNumber}. {phase.title}
                      </p>
                      <span className="text-xs text-ink-muted">
                        About {phase.minutes} minutes
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-ink">{phase.objective}</p>
                    <p className="mt-1.5 text-sm text-ink-muted">{phase.brief}</p>
                    <p className="mt-2 text-xs text-ink-muted">
                      Builds on{" "}
                      {lessonLabel(phase.linkedLessonCode)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-xs text-ink-muted">
        Each phase connects back to a real lesson in the course. The storyline
        and the phase text are demonstration content and have not been reviewed
        or adopted by a curriculum author.
      </p>
    </div>
  );
}
