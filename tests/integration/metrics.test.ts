import { beforeEach, describe, expect, it } from "vitest";

import { ensureSeeded } from "@/lib/db/seed";
import { clearDatabase, db } from "@/lib/db/store";
import type { User } from "@/lib/db/types";
import {
  courseAtSite,
  districtRollup,
  siteRollup,
  studentMetrics,
} from "@/lib/views/metrics";
import { caseload, minutesBand, performanceBand, positionBand } from "@/lib/views/caseload";
import { unitProgress } from "@/lib/views/pathway";
import { MIN_GROUP_SIZE } from "@/lib/rules/versions";

function user(id: string): User {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new Error(`missing ${id}`);
  return u;
}

beforeEach(() => {
  clearDatabase();
  ensureSeeded();
});

describe("completion and performance are distinct measures", () => {
  it("reports both, and neither is the other", () => {
    const m = studentMetrics(user("u_amara"));
    expect(m.completionPercent).not.toBeNull();
    expect(m.performancePercent).not.toBeNull();
    // Completion counts finished work; performance grades it. On seeded data
    // they differ, which is the point of reporting both.
    expect(m.completionPercent).not.toBe(m.performancePercent);
  });

  it("counts completion against work reached, not the whole course", () => {
    const m = studentMetrics(user("u_amara"));
    for (const course of m.courses) {
      expect(course.lessonsReached).toBeLessThan(course.lessonsTotal);
      expect(course.lessonsComplete).toBeLessThanOrEqual(course.lessonsReached);
      if (course.completionPercent !== null) {
        expect(course.completionPercent).toBeLessThanOrEqual(100);
      }
    }
  });

  it("never mixes readiness into either measure", () => {
    // The module must not import mastery at all; this is the behavioural half.
    const m = studentMetrics(user("u_amara"));
    const keys = Object.keys(m);
    expect(keys).not.toContain("readiness");
    expect(keys).not.toContain("mastery");
  });
});

describe("site and district rollups", () => {
  it("rolls every site up into the district", () => {
    const district = districtRollup("org_mra");
    expect(district.sites).toHaveLength(5);
    expect(district.students).toBe(584);
    expect(district.teachers).toBe(37);
    expect(district.performancePercent).not.toBeNull();
    expect(district.completionPercent).not.toBeNull();
  });

  it("reports a site above the threshold", () => {
    const roll = siteRollup("site_beaumont");
    expect(roll.students).toBeGreaterThanOrEqual(MIN_GROUP_SIZE);
    expect(roll.suppressed).toBe(false);
    expect(roll.performancePercent).not.toBeNull();
  });

  it("SUPPRESSES a slice below the minimum group size", () => {
    const slices = db()
      .sites.flatMap((site) =>
        ["Precalculus", "Statistics", "Quantitative Reasoning"].map((title) =>
          courseAtSite(site.id, title),
        ),
      )
      .filter((s) => s.enrollments > 0);

    const small = slices.filter((s) => s.enrollments < MIN_GROUP_SIZE);
    expect(small.length).toBeGreaterThan(0);
    for (const slice of small) {
      expect(slice.suppressed).toBe(true);
      // Suppressed means withheld, not rounded or zeroed.
      expect(slice.performancePercent).toBeNull();
      expect(slice.completionPercent).toBeNull();
    }
  });
});

describe("caseload", () => {
  it("is scoped to the teacher's own sections", () => {
    const rows = caseload(user("u_alvarez"));
    expect(rows.length).toBeGreaterThan(0);
    const d = db();
    const mySections = new Set(
      d.sections.filter((s) => s.teacherId === "u_alvarez").map((s) => s.id),
    );
    for (const row of rows) {
      const enrolled = d.enrollments.some(
        (e) => e.studentId === row.student.id && mySections.has(e.sectionId),
      );
      expect(enrolled, `${row.student.id} is not in Alvarez's sections`).toBe(true);
    }
  });

  it("filters narrow the roster and never widen it", () => {
    const all = caseload(user("u_alvarez"));
    const filtered = caseload(user("u_alvarez"), { performance: "under_60" });
    expect(filtered.length).toBeLessThanOrEqual(all.length);
    for (const row of filtered) {
      expect(row.metrics.performancePercent).not.toBeNull();
      expect(row.metrics.performancePercent as number).toBeLessThan(60);
    }
  });

  it("sorts deterministically", () => {
    const first = caseload(user("u_alvarez"), { sort: "performance" }).map(
      (r) => r.student.id,
    );
    const second = caseload(user("u_alvarez"), { sort: "performance" }).map(
      (r) => r.student.id,
    );
    expect(second).toEqual(first);
  });

  it("gives every band a written label", () => {
    expect(positionBand(-9).label).toBe("7 or more behind");
    expect(positionBand(-4).label).toBe("3-6 behind");
    expect(positionBand(-1).label).toBe("2 or fewer behind");
    expect(positionBand(3).label).toBe("2 or more ahead");
    expect(performanceBand(null)).toBeNull();
    expect(performanceBand(59.9)?.label).toBe("Under 60%");
    expect(performanceBand(80)?.label).toBe("80% or above");
    expect(minutesBand(60).label).toBe("60 or fewer");
    expect(minutesBand(161).label).toBe("More than 160");
  });
});

describe("unit progress map", () => {
  it("marks exactly one unit current and measures progress in pathway days", () => {
    const enrollment = db().enrollments.find(
      (e) => e.id === "enr_amara_Mathematics_6",
    );
    if (!enrollment) throw new Error("seed missing");
    const units = unitProgress(enrollment);

    expect(units.length).toBeGreaterThan(0);
    expect(units.filter((u) => u.state === "current")).toHaveLength(1);
    for (const unit of units) {
      expect(unit.percent).toBeGreaterThanOrEqual(0);
      expect(unit.percent).toBeLessThanOrEqual(100);
      expect(unit.daysComplete).toBeLessThanOrEqual(unit.daysTotal);
      expect(unit.month).toBeTruthy();
    }
    // Units after the current one have not started.
    const currentIndex = units.findIndex((u) => u.state === "current");
    for (const later of units.slice(currentIndex + 1)) {
      expect(later.state).toBe("not_started");
      expect(later.percent).toBe(0);
    }
  });
});
