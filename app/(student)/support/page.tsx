import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/clock";
import { lessonContent } from "@/lib/db/demo-lesson-content";
import { db } from "@/lib/db/store";
import {
  Banner,
  Card,
  CardHeader,
  Empty,
  PreviewAction,
  SectionHeading,
} from "@/lib/design/primitives";
import { FOCUS_RING } from "@/lib/design/tokens";
import { coursesFor, messagesFor } from "@/lib/views/student";
import { focusForLesson } from "@/lib/views/learning-focus";

import { HelpRequestForm } from "./help-form";
import { VocabularyReview, type VocabCard } from "./vocabulary-review";

export const metadata: Metadata = {
  title: "Support · Beyond.Ed",
  description: "Notes, vocabulary, worked examples, and a way to reach a person.",
};

/**
 * Support (blueprint §4).
 *
 * Lesson-filtered notes, vocabulary, worked examples, accessibility tools, and
 * ways to request HUMAN help. There is no chatbot, assistant, or generated
 * answer anywhere on this page (CLAUDE.md §10) — the help request goes to the
 * student's teacher.
 */
export default async function SupportPage() {
  const student = await requireUser();
  const d = db();
  const courses = coursesFor(student);
  const messages = messagesFor(student).filter((m) => m.isHelpRequest);

  const currentLessons = courses
    .map((c) => c.current)
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const vocabulary: VocabCard[] = currentLessons.flatMap((location) => {
    const content = lessonContent(location.lesson.code);
    if (!content) return [];
    return content.vocabulary.map((v) => ({
      term: v.term,
      meaning: v.meaning,
      lessonCode: location.lesson.code,
      courseTitle: location.courseTitle,
    }));
  });

  return (
    <div className="py-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Support</h1>
        <p className="mt-2 max-w-2xl text-base text-ink-muted">
          Notes and worked examples for the lessons you are on, and a way to ask
          a person.
        </p>
      </header>

      <div className="mt-5">
        <Banner title="Help here comes from people." tone="info">
          Beyond.Ed has no tutor bot, chat assistant, or generated answers. What
          you see below is your teacher&rsquo;s material and your own lesson
          record. Asking for help sends a message to your teacher.
        </Banner>
      </div>

      <section aria-labelledby="hub" className="mt-8">
        <SectionHeading id="hub" hint="Filtered to the lessons you are on right now.">
          Helpful resources
        </SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm font-semibold text-ink">Vocabulary review</p>
            <p className="mt-1 text-xs text-ink-muted">
              Retrieval practice on the terms from your current lessons.
            </p>
            <p className="mt-2">
              <a
                href="#vocabulary"
                className={`text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
              >
                {vocabulary.length} term{vocabulary.length === 1 ? "" : "s"} ready
              </a>
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-ink">Notes and worked examples</p>
            <p className="mt-1 text-xs text-ink-muted">
              The notes outline and worked reasoning for each lesson.
            </p>
            <p className="mt-2">
              <a
                href="#materials"
                className={`text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
              >
                Open materials
              </a>
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-ink">Ask your teacher</p>
            <p className="mt-1 text-xs text-ink-muted">
              A person answers this, not the system.
            </p>
            <p className="mt-2">
              <a
                href="#ask"
                className={`text-sm font-semibold text-primary underline underline-offset-4 ${FOCUS_RING}`}
              >
                Send a message
              </a>
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm font-semibold text-ink">Video instruction</p>
            <p className="mt-1 text-xs text-ink-muted">
              Teacher-approved video with captions and a written alternative.
            </p>
            <div className="mt-2">
              <PreviewAction
                label="Watch a video"
                detail="Not built. There is no media library, no captions, and no transcripts in this build, so this control does nothing rather than appearing to work."
              />
            </div>
          </Card>
        </div>
      </section>

      <section aria-labelledby="vocabulary" className="mt-10">
        <SectionHeading
          id="vocabulary"
          hint="Terms from the lessons you are on. Flip to check yourself."
        >
          Vocabulary review
        </SectionHeading>
        <VocabularyReview cards={vocabulary} />
      </section>

      <section aria-labelledby="ask" className="mt-10">
        <SectionHeading id="ask" hint="Goes to the teacher for that course.">
          Ask for help
        </SectionHeading>
        <Card className="p-5">
          <HelpRequestForm idempotencyKey={`help:${student.id}`} />
        </Card>

        {messages.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {messages.map((m) => (
              <Card as="li" key={m.id} className="p-4">
                <p className="text-sm font-semibold text-ink">{m.subject}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Sent {formatDateTime(m.sentAt)} &middot;{" "}
                  {m.resolvedAt ? "Answered" : "Waiting on your teacher"}
                </p>
                <p className="mt-1.5 text-sm text-ink-muted">{m.body}</p>
              </Card>
            ))}
          </ul>
        ) : null}
      </section>

      <section aria-labelledby="materials" className="mt-10">
        <SectionHeading
          id="materials"
          hint="Filtered to the lessons you are currently on."
        >
          Notes, vocabulary, and worked examples
        </SectionHeading>
        {currentLessons.length === 0 ? (
          <Empty>No lessons open right now.</Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {currentLessons.map((location) => {
              const content = lessonContent(location.lesson.code);
              return (
                <Card key={location.lesson.code}>
                  <CardHeader
                    title={`${location.courseTitle} — ${location.topic}`}
                    hint={focusForLesson(location.lesson.code)?.description}
                  />
                  <div className="p-5">
                    {!content ? (
                      <Empty>
                        No notes or examples have been authored for this lesson.
                        Ask your teacher — they have the materials.
                      </Empty>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                            Vocabulary
                          </h3>
                          <dl className="mt-2 space-y-2 text-sm">
                            {content.vocabulary.map((v) => (
                              <div key={v.term}>
                                <dt className="inline font-semibold text-ink">{v.term}: </dt>
                                <dd className="inline text-ink-muted">{v.meaning}</dd>
                              </div>
                            ))}
                          </dl>
                          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-ink-muted">
                            Notes outline
                          </h3>
                          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-muted">
                            {content.notesOutline.map((n) => (
                              <li key={n}>{n}</li>
                            ))}
                          </ol>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                            Worked example
                          </h3>
                          <ol className="mt-2 space-y-3">
                            {content.workedModel.map((step, i) => (
                              <li key={step.step} className="text-sm">
                                <p className="text-ink">
                                  <span className="font-semibold">{i + 1}. </span>
                                  {step.step}
                                </p>
                                <p className="mt-0.5 text-ink-muted">{step.reasoning}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="access" className="mt-10">
        <SectionHeading id="access" hint="What this build does and does not provide.">
          Accessibility
        </SectionHeading>
        <Card className="p-5">
          <ul className="space-y-2 text-sm text-ink">
            <li>
              <span className="font-semibold">Available now:</span> every page is
              keyboard reachable with a visible focus ring, status is written in
              words as well as colour, and layouts reflow on a phone.
            </li>
            <li>
              <span className="font-semibold">Not built yet:</span> captions and
              transcripts, because there is no media in this build; text-to-speech;
              translated materials; and offline access. None of these are implied
              to work anywhere in the product.
            </li>
          </ul>
          <p className="mt-4 text-sm text-ink-muted">
            Your teachers at{" "}
            {d.sites.find((s) => s.id === student.siteId)?.shortName ?? "your site"}{" "}
            can arrange accommodations directly.
          </p>
        </Card>
      </section>
    </div>
  );
}
