import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import {
  Banner,
  Card,
  CardHeader,
  SectionHeading,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { allSequences, phaseCount, sequenceMinutes } from "@/lib/db/demo-sequences";

export const metadata: Metadata = {
  title: "Example lessons · Beyond.Ed",
  description: "Narrative lesson sequences shown as design examples.",
};

/**
 * Example lesson sequences.
 *
 * These show what a themed, multi-phase unit looks like inside the lesson
 * player. They are design examples: opening one records nothing, and finishing
 * one changes no grade, no evidence, and no pathway position. The page says so
 * before the student clicks anything.
 */
export default async function ExamplesPage() {
  await requireUser();
  const sequences = allSequences();

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Example lessons</h1>
        <p className="mt-2 max-w-2xl text-base text-ink-muted">
          Two complete lesson sequences, shown as examples of how a themed unit
          is built.
        </p>
      </header>

      <div className="mt-5">
        <Banner title="These do not affect your pathway." tone="notice">
          Opening one records nothing. Finishing one changes no grade, no
          evidence, and no position in your course. They are here so you can see
          what the design looks like end to end.
        </Banner>
      </div>

      <section aria-labelledby="sequences" className="mt-8">
        <SectionHeading id="sequences" hint="Each one runs across several short phases.">
          Sequences
        </SectionHeading>
        <div className="grid gap-4 md:grid-cols-2">
          {sequences.map((sequence) => (
            <Card key={sequence.id}>
              <CardHeader
                title={sequence.name}
                hint={`${sequence.subtitle} · ${sequence.courseTitle}`}
              />
              <div className="p-5">
                <p className="text-sm text-ink">{sequence.premise}</p>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <dt className="text-xs text-ink-muted">Missions</dt>
                    <dd className="text-lg font-bold text-ink">
                      {sequence.missions.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Phases</dt>
                    <dd className="text-lg font-bold text-ink">{phaseCount(sequence)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Minutes</dt>
                    <dd className="text-lg font-bold text-ink">
                      {sequenceMinutes(sequence)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5">
                  <Link
                    href={`/examples/${sequence.id}`}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-white hover:bg-primary-strong ${FOCUS_RING}`}
                  >
                    Open {sequence.name}
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
