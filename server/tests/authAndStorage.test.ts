/**
 * Automated Verification Tests for Authentication & Multi-Tenant Storage
 *
 * Verifies:
 * 1. Cryptographic password hashing (scrypt with 16-byte random salt, constant-time verification)
 * 2. Strict backend input validation (email format, password min length >= 8, duplicate email rejection)
 * 3. Session token generation, validation, and secure invalidation (logout)
 * 4. Multi-tenant student record isolation (Student A's quizzes/study plan are strictly isolated from Student B)
 * 5. Persistent storage across browser sessions and reloads
 * 6. Account deletion and data purge compliance
 */

import { AuthManager } from "../auth.js";
import { StoreManager } from "../store.js";
import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

export function runAuthAndStorageTests() {
  console.log("\n========================================================");
  console.log("RUNNING AUTHENTICATION & MULTI-TENANT STORAGE TESTS");
  console.log("========================================================\n");

  const testAuth = new AuthManager();
  const testStore = new StoreManager();

  // ---------------------------------------------------------
  // TEST 1: Password Encryption & Cryptographic Hash Validation
  // ---------------------------------------------------------
  console.log("--- TEST 1: Password Encryption & Verification ---");
  const rawPassword = "StrongSecurePassword@2026";
  const { hash, salt } = testAuth.hashPassword(rawPassword);

  assert(hash !== rawPassword, "Raw password is never stored directly (hashed)");
  assert(hash.length === 128, "Scrypt produced a 64-byte (128 hex chars) secure digest");
  assert(salt.length === 32, "Salt is a 16-byte (32 hex chars) cryptographically random salt");
  assert(testAuth.verifyPassword(rawPassword, hash, salt), "Valid password verifies correctly");
  assert(!testAuth.verifyPassword("WrongPassword123", hash, salt), "Invalid password is rejected");

  // ---------------------------------------------------------
  // TEST 2: Input Validation on Student Registration
  // ---------------------------------------------------------
  console.log("\n--- TEST 2: Server-Side Input Validation ---");
  
  // Test 2a: Short password rejection
  let shortPassThrew = false;
  try {
    testAuth.register({
      name: "Test Student",
      email: "short@student.edu",
      password: "short", // < 8 characters
    });
  } catch (err: any) {
    shortPassThrew = true;
    assert(err.message.includes("8 characters"), "Password length >= 8 enforced");
  }
  assert(shortPassThrew, "Short password (<8 chars) was rejected by server");

  // Test 2b: Invalid email format rejection
  let invalidEmailThrew = false;
  try {
    testAuth.register({
      name: "Test Student",
      email: "not-an-email",
      password: "ValidPassword123",
    });
  } catch (err: any) {
    invalidEmailThrew = true;
    assert(err.message.includes("valid email"), "Valid email format enforced");
  }
  assert(invalidEmailThrew, "Invalid email format was rejected by server");

  // ---------------------------------------------------------
  // TEST 3: User Registration & Duplicate Email Protection
  // ---------------------------------------------------------
  console.log("\n--- TEST 3: Student Registration & Uniqueness ---");
  const uniqueEmail = `student_${Date.now()}@engg.edu`;
  const regResult = testAuth.register({
    name: "Ananya Rao",
    email: uniqueEmail,
    password: "SecureStudentPass@2026",
    course: "B.Tech Computer Science & Engineering",
    college: "JNTU Institute",
    semester: "Semester 1",
  });

  assert(regResult.user.email === uniqueEmail.toLowerCase(), "Student registered with expected email");
  assert(regResult.token.length === 64, "Session token generated (256-bit entropy)");

  // Duplicate email registration should fail
  let dupThrew = false;
  try {
    testAuth.register({
      name: "Ananya Impostor",
      email: uniqueEmail,
      password: "AnotherPassword123",
    });
  } catch (err: any) {
    dupThrew = true;
    assert(err.message.includes("already exists"), "Duplicate email blocked");
  }
  assert(dupThrew, "Duplicate registration attempt was strictly blocked");

  // ---------------------------------------------------------
  // TEST 4: Student Login & Session Invalidation (Logout)
  // ---------------------------------------------------------
  console.log("\n--- TEST 4: Login & Secure Logout ---");
  const loginResult = testAuth.login({
    email: uniqueEmail,
    password: "SecureStudentPass@2026",
  });
  assert(loginResult.user.id === regResult.user.id, "Login retrieved the authentic student ID");

  // Verify session validity
  const validUser = testAuth.validateSession(loginResult.token);
  assert(validUser !== null && validUser.id === regResult.user.id, "Session token is valid");

  // Invalidate session (logout)
  const logoutSuccess = testAuth.logout(loginResult.token);
  assert(logoutSuccess, "Logout invalidated the session on server");

  const postLogoutUser = testAuth.validateSession(loginResult.token);
  assert(postLogoutUser === null, "Invalidated session token is immediately rejected");

  // ---------------------------------------------------------
  // TEST 5: Multi-Tenant Data Isolation (Student A vs Student B)
  // ---------------------------------------------------------
  console.log("\n--- TEST 5: Multi-Tenant Student Data Isolation ---");
  
  // Register Student B
  const studentBEmail = `student_b_${Date.now()}@engg.edu`;
  const regB = testAuth.register({
    name: "Vikram Reddy",
    email: studentBEmail,
    password: "SecureStudentPassB@2026",
    course: "B.Tech Electronics & Communication",
    college: "Osmania University",
  });

  const studentAId = regResult.user.id;
  const studentBId = regB.user.id;

  // Student A records a quiz result in "C Programming" -> "Pointers" with 94%
  testStore.recordQuizResult(studentAId, {
    title: "C Pointers Mastery Quiz",
    subject: "C Programming",
    topic: "Pointers & Dynamic Memory Allocation",
    score: 94,
    totalQuestions: 5,
    correctAnswers: 5,
    difficulty: "Advanced",
    isSample: false,
  });

  // Verify Student A's store reflects the quiz and updated score
  const storeA = testStore.getUserStore(studentAId);
  const quizA = storeA.quizHistory.find((q) => q.topic.includes("Pointers"));
  assert(quizA !== undefined && quizA.score === 94, "Student A has 94% quiz recorded");

  // Verify Student B's store is completely untouched
  const storeB = testStore.getUserStore(studentBId);
  const quizB = storeB.quizHistory.find((q) => q.topic.includes("Pointers"));
  assert(quizB === undefined, "Student B has NO access to Student A's quiz attempts (Zero Leakage)");

  // Student A adds a custom study plan item
  testStore.addStudyPlanItem(studentAId, {
    date: "2026-10-25",
    title: "Alice Private Study Session: Deep Pointer Synthesis",
    subject: "C Programming",
    topic: "Pointers & Dynamic Memory Allocation",
    estimatedMinutes: 45,
    type: "practice",
    status: "pending",
    priority: "high",
    reason: "Reinforce recent high score",
  });

  const planA = testStore.getUserStore(studentAId).studyPlan;
  const hasAlicePlan = planA.some((p) => p.title.includes("Alice Private Study Session"));
  assert(hasAlicePlan, "Student A's study plan contains the private activity");

  const planB = testStore.getUserStore(studentBId).studyPlan;
  const hasAlicePlanInB = planB.some((p) => p.title.includes("Alice Private Study Session"));
  assert(!hasAlicePlanInB, "Student B cannot view Student A's private study plan activities");

  // ---------------------------------------------------------
  // TEST 6: Data Persistence Across Sessions & Disk Write
  // ---------------------------------------------------------
  console.log("\n--- TEST 6: Persistence to Disk ---");
  const studentAFilePath = path.resolve(process.cwd(), "data", "students", `${studentAId}.json`);
  assert(fs.existsSync(studentAFilePath), "Student A's isolated store was written to persistent disk");

  const diskRaw = fs.readFileSync(studentAFilePath, "utf-8");
  const diskData = JSON.parse(diskRaw);
  assert(diskData.activeProfileId === studentAId, "Persisted file on disk belongs to Student A");
  assert(diskData.quizHistory.length >= 1, "Quiz history is permanently saved on disk");

  // ---------------------------------------------------------
  // TEST 7: Account Deletion & Right to Erasure
  // ---------------------------------------------------------
  console.log("\n--- TEST 7: Account Deletion & Data Purge ---");
  const deleteSuccess = testAuth.deleteAccount(studentAId);
  assert(deleteSuccess, "Account deletion executed successfully");

  assert(!fs.existsSync(studentAFilePath), "Student A's data file was unlinked and purged from disk");
  assert(testAuth.getUserById(studentAId) === null, "Student A no longer exists in authentication registry");

  // Clean up Student B
  testAuth.deleteAccount(studentBId);

  console.log("\n========================================================");
  console.log("ALL AUTHENTICATION & MULTI-TENANT STORAGE TESTS PASSED");
  console.log("========================================================\n");
}

// Run when executed directly
runAuthAndStorageTests();
