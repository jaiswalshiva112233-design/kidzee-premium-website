import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_PROGRAMME_CAPACITIES,
  evaluateBatchCapacity,
  canTransitionObservation,
  ALLOWED_OBSERVATION_TRANSITIONS,
} from "../lib/admin/teacherWorkflow.ts";
import {
  canAccessAdminPath,
  ADMIN_PAGE_PERMISSION_RULES,
  ADMIN_API_PERMISSION_RULES,
} from "../lib/admin/permissions.ts";
import { DEFAULT_TEACHER_PERMISSIONS } from "../lib/admin/permissions.ts";

test("Batch capacity defaults match Kidzee operational ratios", () => {
  assert.equal(DEFAULT_PROGRAMME_CAPACITIES.PLAYGROUP, 8);
  assert.equal(DEFAULT_PROGRAMME_CAPACITIES.NURSERY, 8);
  assert.equal(DEFAULT_PROGRAMME_CAPACITIES.JUNIOR_KG, 10);
  assert.equal(DEFAULT_PROGRAMME_CAPACITIES.SENIOR_KG, 10);
  assert.equal(DEFAULT_PROGRAMME_CAPACITIES.DAYCARE, 12);
});

test("evaluateBatchCapacity detects under-capacity, near-capacity, and ratio exceedance", () => {
  // 1. Under capacity (Nursery with 5/8)
  const under = evaluateBatchCapacity("NURSERY", 5);
  assert.equal(under.exceeded, false);
  assert.equal(under.nearCapacity, false);
  assert.equal(under.activeCount, 5);
  assert.equal(under.capacity, 8);
  assert.equal(under.occupancyRate, 63);
  assert.equal(under.message, null);

  // 2. Near capacity (Nursery with 8/8)
  const full = evaluateBatchCapacity("NURSERY", 8);
  assert.equal(full.exceeded, false);
  assert.equal(full.nearCapacity, true);
  assert.equal(full.occupancyRate, 100);
  assert.match(full.message ?? "", /maximum capacity/i);

  // 3. Exceeded (Playgroup with 9/8)
  const exceeded = evaluateBatchCapacity("PLAYGROUP", 9);
  assert.equal(exceeded.exceeded, true);
  assert.equal(exceeded.activeCount, 9);
  assert.equal(exceeded.capacity, 8);
  assert.match(exceeded.message ?? "", /Teacher-to-student capacity exceeded/i);

  // 4. Custom capacity override
  const custom = evaluateBatchCapacity("DAYCARE", 14, 15);
  assert.equal(custom.exceeded, false);
  assert.equal(custom.capacity, 15);
  assert.equal(custom.activeCount, 14);
});

test("Observation report state machine enforces role boundaries and valid transitions", () => {
  // DRAFT -> SUBMITTED allowed for TEACHER, CENTRE_HEAD, OWNER
  assert.equal(canTransitionObservation("DRAFT", "SUBMITTED", "TEACHER"), true);
  assert.equal(canTransitionObservation("DRAFT", "SUBMITTED", "CENTRE_HEAD"), true);
  assert.equal(canTransitionObservation("DRAFT", "APPROVED", "TEACHER"), false);

  // SUBMITTED -> APPROVED allowed only for CENTRE_HEAD & OWNER
  assert.equal(canTransitionObservation("SUBMITTED", "APPROVED", "CENTRE_HEAD"), true);
  assert.equal(canTransitionObservation("SUBMITTED", "APPROVED", "OWNER"), true);
  assert.equal(canTransitionObservation("SUBMITTED", "APPROVED", "TEACHER"), false);

  // SUBMITTED -> CHANGES_REQUESTED allowed only for CENTRE_HEAD & OWNER
  assert.equal(canTransitionObservation("SUBMITTED", "CHANGES_REQUESTED", "CENTRE_HEAD"), true);
  assert.equal(canTransitionObservation("SUBMITTED", "CHANGES_REQUESTED", "TEACHER"), false);

  // CHANGES_REQUESTED -> SUBMITTED allowed for TEACHER
  assert.equal(canTransitionObservation("CHANGES_REQUESTED", "SUBMITTED", "TEACHER"), true);

  // APPROVED is a terminal state
  assert.equal(canTransitionObservation("APPROVED", "DRAFT", "OWNER"), false);
  assert.equal(canTransitionObservation("APPROVED", "SUBMITTED", "CENTRE_HEAD"), false);
});

test("Teacher role strictly isolates sensitive financial pages and administrative settings", () => {
  const teacherUser = {
    role: "TEACHER",
    permissions: DEFAULT_TEACHER_PERMISSIONS,
  };

  // Allowed paths
  assert.equal(canAccessAdminPath("/teacher", teacherUser), true);
  assert.equal(canAccessAdminPath("/teacher/attendance", teacherUser), true);
  assert.equal(canAccessAdminPath("/teacher/students", teacherUser), true);
  assert.equal(canAccessAdminPath("/teacher/activities", teacherUser), true);
  assert.equal(canAccessAdminPath("/teacher/observations", teacherUser), true);
  assert.equal(canAccessAdminPath("/teacher/leaves", teacherUser), true);
  assert.equal(canAccessAdminPath("/teacher/messages", teacherUser), true);

  // Blocked paths (financial, admin, billing, permissions)
  assert.equal(canAccessAdminPath("/admin/fees", teacherUser), false);
  assert.equal(canAccessAdminPath("/admin/receipts", teacherUser), false);
  assert.equal(canAccessAdminPath("/admin/settings/billing", teacherUser), false);
  assert.equal(canAccessAdminPath("/admin/settings/access", teacherUser), false);
  assert.equal(canAccessAdminPath("/admin/settings/backup", teacherUser), false);
  assert.equal(canAccessAdminPath("/admin/intelligence", teacherUser), false);
  assert.equal(canAccessAdminPath("/admin/marketing", teacherUser), false);
  assert.equal(canAccessAdminPath("/admin/growth", teacherUser), false);
  assert.equal(canAccessAdminPath("/admin/batches", teacherUser), false);
  assert.equal(canAccessAdminPath("/admin/teacher-reviews", teacherUser), false);
});

test("Centre Head and Owner have full access to Batches and Teacher Reviews", () => {
  const centreHeadUser = {
    role: "CENTRE_HEAD",
    permissions: [
      "students.manage",
      "staff.view",
      "dashboard.view",
      "attendance.manage",
    ],
  };

  const ownerUser = {
    role: "OWNER",
    permissions: ["*"],
  };

  assert.equal(canAccessAdminPath("/admin/batches", centreHeadUser), true);
  assert.equal(canAccessAdminPath("/admin/teacher-reviews", centreHeadUser), true);

  assert.equal(canAccessAdminPath("/admin/batches", ownerUser), true);
  assert.equal(canAccessAdminPath("/admin/teacher-reviews", ownerUser), true);
});

test("Internal messaging thread ID generates deterministically", () => {
  const userA = "user_123";
  const userB = "user_456";

  const threadId1 = "THR-" + [userA, userB].sort().join("-");
  const threadId2 = "THR-" + [userB, userA].sort().join("-");

  assert.equal(threadId1, threadId2);
  assert.equal(threadId1, "THR-user_123-user_456");

  const broadcastThread = "THR-" + ["user_123", "broadcast"].sort().join("-");
  assert.equal(broadcastThread, "THR-broadcast-user_123");
});
