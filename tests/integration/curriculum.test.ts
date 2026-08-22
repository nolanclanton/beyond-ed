import { beforeEach, describe, expect, it } from "vitest";

import { readableAudit } from "@/lib/audit/log";
import {
  approveVersion,
  publicationGate,
  publishVersion,
  retireVersion,
  submitForReview,
  versionById,
} from "@/lib/curriculum/authoring";
import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
import type { User } from "@/lib/db/types";
import { currentEvidence } from "@/lib/evidence/ledger";
import { RULE_VERSIONS } from "@/lib/rules/versions";

function user(id: string): User {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new Error(`missing ${id}`);
  return u;
}

const DRAFT = "cv_Mathematics_6_2026_2";

describe("curriculum versioning (CLAUDE.md §7)", () => {
  beforeEach(() => {
    clearDatabase();
    ensureSeeded();
  });

  it("only a curriculum author moves a version forward", () => {
    // Dr Okonjo is an org admin WITHOUT the curriculum-author authorization.
    expect(user("u_okonjo").role).toBe("org_admin");
    expect(user("u_okonjo").curriculumAuthor).toBe(false);
    expect(() => submitForReview(user("u_okonjo"), DRAFT, "Reason.", "k1")).toThrow(
      /separate authorization you do not hold/,
    );

    // Ms Haddad holds it as her role.
    expect(submitForReview(user("u_haddad"), DRAFT, "Ready for review.", "k2").status).toBe(
      "in_review",
    );
  });

  it("recognises a teacher who also holds the authorization", () => {
    expect(user("u_alvarez").role).toBe("teacher");
    expect(user("u_alvarez").curriculumAuthor).toBe(true);
    expect(submitForReview(user("u_alvarez"), DRAFT, "Ready.", "k").status).toBe("in_review");
  });

  it("refuses to publish a version that is not approved", () => {
    const gate = publicationGate(DRAFT);
    expect(gate.eligible).toBe(false);
    expect(gate.blockers[0]).toContain("Only an approved version can be published");
    expect(() => publishVersion(user("u_haddad"), DRAFT, "Reason.", "k")).toThrow(
      /Publication blocked/,
    );
  });

  it("publishes an approved version that validates its day budget", () => {
    submitForReview(user("u_haddad"), DRAFT, "Ready for review.", "k1");
    approveVersion(user("u_haddad"), DRAFT, "Reviewed by the committee.", "k2");

    const gate = publicationGate(DRAFT);
    expect(gate.eligible).toBe(true);
    expect(gate.report.pathwayDays).toBe(135);
    expect(gate.report.totalDays).toBe(175);
    expect(gate.report.ruleVersion).toBe(RULE_VERSIONS.dayBudget);

    const published = publishVersion(user("u_haddad"), DRAFT, "Approved 2026-08-20.", "k3");
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeTruthy();
  });

  it("audits every lifecycle move with a reason", () => {
    submitForReview(user("u_haddad"), DRAFT, "Ready for review.", "k1");
    approveVersion(user("u_haddad"), DRAFT, "Reviewed by the committee.", "k2");
    publishVersion(user("u_haddad"), DRAFT, "Approved 2026-08-20.", "k3");

    const events = readableAudit(user("u_okonjo")).filter((e) => e.targetId === DRAFT);
    expect(events.map((e) => e.action).sort()).toEqual([
      "curriculum.approve",
      "curriculum.publish",
      "curriculum.submit_for_review",
    ]);
    for (const e of events) expect(e.reason.length).toBeGreaterThan(0);
  });

  it("does not move a running roster section to the new version", () => {
    const section = db().sections.find((s) => s.courseTitle === "Mathematics 6");
    if (!section) throw new Error("seed missing");
    const pinnedTo = section.courseVersionId;

    submitForReview(user("u_haddad"), DRAFT, "Ready.", "k1");
    approveVersion(user("u_haddad"), DRAFT, "Reviewed.", "k2");
    publishVersion(user("u_haddad"), DRAFT, "Published.", "k3");

    const after = db().sections.find((s) => s.id === section.id);
    expect(after?.courseVersionId).toBe(pinnedTo);
    expect(after?.courseVersionId).not.toBe(DRAFT);
  });

  it("does not alter prior evidence or the version it was recorded against", () => {
    const before = currentEvidence({ studentId: "u_amara" }).map((e) => ({
      id: e.id,
      courseVersionId: e.courseVersionId,
      correct: e.correct,
    }));

    submitForReview(user("u_haddad"), DRAFT, "Ready.", "k1");
    approveVersion(user("u_haddad"), DRAFT, "Reviewed.", "k2");
    publishVersion(user("u_haddad"), DRAFT, "Published.", "k3");

    const after = currentEvidence({ studentId: "u_amara" }).map((e) => ({
      id: e.id,
      courseVersionId: e.courseVersionId,
      correct: e.correct,
    }));
    expect(after).toEqual(before);
  });

  it("refuses to retire a version that roster sections still reference", () => {
    const published = db().courseVersions.find(
      (v) => v.courseTitle === "Mathematics 6" && v.status === "published",
    );
    if (!published) throw new Error("seed missing");
    expect(() => retireVersion(user("u_haddad"), published.id, "Superseded.", "k")).toThrow(
      /still reference this version/,
    );
  });

  it("requires a reason for every move", () => {
    expect(() => submitForReview(user("u_haddad"), DRAFT, "", "k")).toThrow(
      /requires a recorded reason/,
    );
    expect(versionById(DRAFT)?.status).toBe("draft");
  });

  it("rejects an illegal lifecycle jump", () => {
    expect(() => approveVersion(user("u_haddad"), DRAFT, "Reason.", "k")).toThrow(
      /Illegal curriculum transition/,
    );
  });
});
