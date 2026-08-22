import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  FactList,
  SectionHeading,
  StatusChip,
} from "@/lib/design/primitives";
import { evidenceByIds } from "@/lib/evidence/ledger";
import { actionQueue } from "@/lib/intervention/queue";
import { entryById } from "@/lib/intervention/library";

import { SiteDecideForm } from "./site-forms";

export const metadata: Metadata = {
  title: "Unresolved queue items · Beyond.Ed",
  description: "Site-admin follow-up on recommendations a teacher has not resolved.",
};

/**
 * Site-admin view of unresolved teacher queue items (blueprint §6).
 *
 * A site leader may assign an approved support when a teacher queue item
 * remains unresolved — with a recorded reason and an audit event that names the
 * site-admin role, so the action is distinguishable from a teacher's
 * (CLAUDE.md §3, §6). This does not replace instructional judgment; it is a
 * follow-up path for items that have stalled.
 */
export default async function SiteQueuePage() {
  const admin = await requireUser();
  const d = db();
  const queue = actionQueue(admin);

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Unresolved queue items
        </h1>
        <p className="mt-2 max-w-3xl text-base text-ink-muted">
          Recommendations across this site that a teacher has not yet acted on.
        </p>
      </header>

      <div className="mt-5">
        <Banner title="This is a follow-up path, not an override." tone="notice">
          Assigning from here requires a recorded reason and writes an audit event
          marked as a site-administrator action, so it is never mistaken for the
          teacher&rsquo;s decision. Coordinate with the teacher first where you can.
        </Banner>
      </div>

      <section aria-labelledby="items" className="mt-8">
        <SectionHeading id="items" hint="Most urgent first.">
          {queue.length} item{queue.length === 1 ? "" : "s"}
        </SectionHeading>

        {queue.length === 0 ? (
          <Empty>Nothing unresolved at this site.</Empty>
        ) : (
          <ul className="flex flex-col gap-5">
            {queue.map(({ recommendation: rec, student, courseTitle }) => {
              const teacherSection = d.sections.find((s) =>
                d.enrollments.some(
                  (e) => e.id === rec.enrollmentId && e.sectionId === s.id,
                ),
              );
              const teacher = d.users.find((u) => u.id === teacherSection?.teacherId);
              const triggers = evidenceByIds(rec.triggerEvidenceIds);
              const entry = entryById(rec.interventionLessonId);
              return (
                <Card as="li" key={rec.id}>
                  <CardHeader
                    title={`${student.firstName} ${student.lastName} — ${rec.standard ?? rec.skill}`}
                    hint={`${courseTitle} · teacher of record: ${teacher ? `${teacher.firstName} ${teacher.lastName}` : "unassigned"}`}
                    action={
                      <StatusChip
                        label={rec.severity.replace(/_/g, " ")}
                        tone={
                          rec.severity === "immediate" || rec.severity === "teacher_review"
                            ? "attention"
                            : "info"
                        }
                      />
                    }
                  />
                  <div className="p-5">
                    <p className="text-sm text-ink">{rec.triggerSummary}</p>
                    {triggers.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                        {triggers.map((t) => (
                          <li key={t.id}>
                            {t.id} &middot; {t.lessonCode} &middot; {t.itemId} &middot;{" "}
                            {t.correct ? "correct" : "missed"}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-4">
                      <FactList
                        columns={3}
                        items={[
                          {
                            label: "Approved support",
                            value: (
                              <>
                                <span className="font-mono text-xs">{rec.interventionLessonId}</span>
                                <span className="block">{entry?.target}</span>
                              </>
                            ),
                          },
                          {
                            label: "Return destination",
                            value: `${rec.returnLessonCode}, stage ${rec.returnStage}`,
                          },
                          { label: "Return rule", value: rec.returnRule },
                        ]}
                      />
                    </div>

                    <div className="mt-5">
                      <SiteDecideForm
                        refInput={{
                          enrollmentId: rec.enrollmentId,
                          skill: rec.skill,
                          trigger: rec.trigger,
                        }}
                        idempotencySalt={`site:${rec.enrollmentId}:${rec.skill}:${rec.trigger}`}
                        teacherName={
                          teacher ? `${teacher.firstName} ${teacher.lastName}` : "the teacher"
                        }
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
