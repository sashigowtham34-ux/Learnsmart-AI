import fs from "fs";
import path from "path";
import { StudyPlannerEngine } from "./studyPlannerEngine.js";

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  course: string;
  college: string;
  semester: string;
  rollNumber?: string;
  department?: string;
  academicYear?: string;
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
  targetScoreOrRank?: string;
  enrolledSubjects: string[];
  learningGoals: string[];
  preferredLanguage: "English" | "Telugu" | "Bilingual";
  dailyStudyTimeMinutes: number;
  explanationLevel: "Beginner" | "Intermediate" | "Advanced";
  examName: string;
  examDate: string; // ISO string e.g. "2026-11-15"
  notificationSettings: {
    dailyReminders: boolean;
    quizAlerts: boolean;
    spacedRevision: boolean;
  };
  isSampleData: boolean;
}

export type TopicStatus = "critical" | "weak" | "proficient" | "mastered";

export interface TopicPerformance {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  score: number; // 0-100
  attempts: number;
  lastAssessed: string;
  status: TopicStatus;
  recommendation: string;
  recommendedAction: string;
}

export interface SubjectData {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  progressPercent: number;
  topics: TopicPerformance[];
}

export interface StudyPlanItem {
  id: string;
  date: string;
  title: string;
  subject: string;
  topic: string;
  estimatedMinutes: number;
  type: "lesson" | "practice" | "revision" | "quiz";
  status: "pending" | "completed" | "postponed";
  priority: "high" | "medium" | "low";
  reason: string;
  completedAt?: string;
}

export interface RevisionItem {
  id: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  score: number;
  dueDate: string;
  intervalDays: number;
  lastReviewedDate: string;
  status: "pending" | "completed" | "postponed" | "needs_practice";
  priority: "high" | "medium" | "low";
}

export interface QuizResult {
  id: string;
  title: string;
  subject: string;
  topic: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  completedAt: string;
  isSample: boolean;
  questions?: {
    question: string;
    options: string[];
    userAnswer: number;
    correctAnswer: number;
    explanation: string;
    isCorrect: boolean;
  }[];
}

export interface ActivityLog {
  id: string;
  type: "quiz" | "tutor" | "material" | "study_plan" | "revision";
  description: string;
  subject?: string;
  timestamp: string;
  score?: number;
}

export interface AppDataStore {
  activeProfileId: string;
  profile: StudentProfile;
  subjects: SubjectData[];
  studyPlan: StudyPlanItem[];
  revisionQueue: RevisionItem[];
  quizHistory: QuizResult[];
  activityLogs: ActivityLog[];
  lastUpdated: string;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "student_store.json");

// Evaluates topic performance according to the user specification rules:
// - Below 40%: Recommend reviewing fundamentals and guided examples.
// - 40% to 69%: Recommend targeted practice and additional explanations.
// - 70% to 84%: Recommend intermediate exercises and revision.
// - 85% and above: Recommend advanced exercises or a review assessment.
export function evaluateTopicStatus(score: number): {
  status: TopicStatus;
  recommendation: string;
  recommendedAction: string;
} {
  if (score < 40) {
    return {
      status: "critical",
      recommendation: "Score below 40%: Critical concept gap. Recommend reviewing core fundamentals and step-by-step guided examples before attempting quizzes.",
      recommendedAction: "Review Fundamentals & Step-by-Step AI Explanations",
    };
  } else if (score < 70) {
    return {
      status: "weak",
      recommendation: "Score 40%–69%: Needs reinforcement. Recommend targeted practice questions, debugging exercises, and additional explanations.",
      recommendedAction: "Targeted Practice & Guided Problem Solving",
    };
  } else if (score < 85) {
    return {
      status: "proficient",
      recommendation: "Score 70%–84%: Good grasp. Recommend intermediate exercise sets and spaced revision sessions to solidify mastery.",
      recommendedAction: "Intermediate Problem Sets & Spaced Revision",
    };
  } else {
    return {
      status: "mastered",
      recommendation: "Score 85%+: Strong mastery. Recommend advanced application exercises or periodic review assessment to maintain retention.",
      recommendedAction: "Advanced Synthesis & Periodic Maintenance Quiz",
    };
  }
}

// Generate the initial demonstration data for a First-Year Engineering Student (Rahul Sharma - CSE)
export function getInitialDemoData(): AppDataStore {
  const profile: StudentProfile = {
    id: "demo-student-rahul",
    name: "Rahul Sharma",
    email: "rahul.sharma@engg.edu",
    course: "B.Tech Computer Science & Engineering",
    college: "JNTU Institute of Engineering & Technology",
    semester: "Semester 1",
    avatarUrl: "/src/assets/images/avatar_student_rahul_1791958434281.jpg",
    enrolledSubjects: [
      "C Programming",
      "Python Programming",
      "Engineering Mathematics",
      "Engineering Physics",
    ],
    learningGoals: [
      "Clear Midterm Exams with 90%+ in Programming",
      "Master Pointer manipulation and dynamic memory allocation in C",
      "Gain strong intuition for Linear Algebra & Eigenvalues",
      "Prepare for First-Year Technical Viva and Lab Assessments",
    ],
    preferredLanguage: "English",
    dailyStudyTimeMinutes: 90,
    explanationLevel: "Intermediate",
    examName: "First Semester Mid-Term Examinations",
    examDate: "2026-11-15",
    notificationSettings: {
      dailyReminders: true,
      quizAlerts: true,
      spacedRevision: true,
    },
    isSampleData: true,
  };

  const rawSubjects = [
    {
      id: "subj-c",
      name: "C Programming",
      code: "CS101",
      category: "Computer Science",
      description: "Procedural programming, memory models, pointers, dynamic memory, structs and file streams.",
      topics: [
        { name: "Variables, Data Types & Operators", score: 88, attempts: 4, lastAssessed: "2026-10-10" },
        { name: "Control Structures & Loops", score: 78, attempts: 3, lastAssessed: "2026-10-08" },
        { name: "Functions, Recursion & Storage Classes", score: 72, attempts: 3, lastAssessed: "2026-10-09" },
        { name: "Arrays & String Manipulation", score: 65, attempts: 4, lastAssessed: "2026-10-11" },
        { name: "Pointers & Dynamic Memory Allocation", score: 38, attempts: 5, lastAssessed: "2026-10-12" }, // CRITICAL
        { name: "Structures, Unions & File I/O", score: 45, attempts: 2, lastAssessed: "2026-10-07" }, // WEAK
      ],
    },
    {
      id: "subj-python",
      name: "Python Programming",
      code: "CS102",
      category: "Computer Science",
      description: "Python syntax, data structures, list comprehensions, object-oriented concepts, and modules.",
      topics: [
        { name: "Basic Syntax, Variables & Conditionals", score: 92, attempts: 5, lastAssessed: "2026-10-06" },
        { name: "Lists, Tuples, Sets & Dictionaries", score: 85, attempts: 4, lastAssessed: "2026-10-09" },
        { name: "Functions, Lambdas & Scope", score: 80, attempts: 3, lastAssessed: "2026-10-10" },
        { name: "OOP Concepts: Classes & Inheritance", score: 62, attempts: 4, lastAssessed: "2026-10-11" }, // WEAK
        { name: "Exception Handling & File Operations", score: 70, attempts: 2, lastAssessed: "2026-10-08" },
      ],
    },
    {
      id: "subj-maths",
      name: "Engineering Mathematics",
      code: "MA101",
      category: "Mathematics",
      description: "Matrices, rank, linear systems, eigenvalues, differential calculus, multiple integrals, and vector analysis.",
      topics: [
        { name: "Matrices, Rank & Linear Systems", score: 82, attempts: 4, lastAssessed: "2026-10-05" },
        { name: "Eigenvalues, Eigenvectors & Cayley-Hamilton", score: 68, attempts: 3, lastAssessed: "2026-10-09" }, // WEAK
        { name: "Differential Calculus & Mean Value Theorems", score: 75, attempts: 4, lastAssessed: "2026-10-08" },
        { name: "Multiple Integrals: Double & Triple Integrals", score: 48, attempts: 3, lastAssessed: "2026-10-12" }, // WEAK
        { name: "Vector Calculus: Gradient, Divergence & Curl", score: 58, attempts: 2, lastAssessed: "2026-10-10" }, // WEAK
      ],
    },
    {
      id: "subj-physics",
      name: "Engineering Physics",
      code: "PH101",
      category: "Physical Sciences",
      description: "Wave optics, interference, lasers, fiber optics, quantum mechanics, and semiconductor physics.",
      topics: [
        { name: "Interference & Diffraction of Light", score: 84, attempts: 3, lastAssessed: "2026-10-07" },
        { name: "Lasers & Optical Fiber Communication", score: 76, attempts: 3, lastAssessed: "2026-10-09" },
        { name: "Quantum Mechanics & Schrödinger Wave Equation", score: 52, attempts: 4, lastAssessed: "2026-10-11" }, // WEAK
        { name: "Electromagnetic Theory & Maxwell Equations", score: 66, attempts: 3, lastAssessed: "2026-10-10" }, // WEAK
        { name: "Semiconductors & P-N Junction Physics", score: 88, attempts: 4, lastAssessed: "2026-10-06" },
      ],
    },
  ];

  const subjects: SubjectData[] = rawSubjects.map((sub) => {
    const topicPerfs: TopicPerformance[] = sub.topics.map((t, idx) => {
      const evaluation = evaluateTopicStatus(t.score);
      return {
        id: `${sub.id}-t${idx + 1}`,
        name: t.name,
        subjectId: sub.id,
        subjectName: sub.name,
        score: t.score,
        attempts: t.attempts,
        lastAssessed: t.lastAssessed,
        status: evaluation.status,
        recommendation: evaluation.recommendation,
        recommendedAction: evaluation.recommendedAction,
      };
    });

    const avgScore = Math.round(
      topicPerfs.reduce((sum, item) => sum + item.score, 0) / topicPerfs.length
    );

    return {
      id: sub.id,
      name: sub.name,
      code: sub.code,
      category: sub.category,
      description: sub.description,
      progressPercent: avgScore,
      topics: topicPerfs,
    };
  });

  const todayStr = "2026-10-14";

  const studyPlan: StudyPlanItem[] = [
    {
      id: "plan-1",
      date: todayStr,
      title: "Master Pointer Dereferencing & Memory Addresses",
      subject: "C Programming",
      topic: "Pointers & Dynamic Memory Allocation",
      estimatedMinutes: 30,
      type: "lesson",
      status: "pending",
      priority: "high",
      reason: "Critical Weakness (<40% on recent quiz): Requires foundational memory mental-model review.",
    },
    {
      id: "plan-2",
      date: todayStr,
      title: "Interactive Practice: 5 Pointer Arithmetic Problems",
      subject: "C Programming",
      topic: "Pointers & Dynamic Memory Allocation",
      estimatedMinutes: 20,
      type: "practice",
      status: "pending",
      priority: "high",
      reason: "Apply learned rules on array-pointer equivalence and pointer incrementing.",
    },
    {
      id: "plan-3",
      date: todayStr,
      title: "Multiple Integrals: Region of Integration Change",
      subject: "Engineering Mathematics",
      topic: "Multiple Integrals: Double & Triple Integrals",
      estimatedMinutes: 25,
      type: "revision",
      status: "pending",
      priority: "medium",
      reason: "Recent score 48%: Scheduled for Day-2 spaced repetition review.",
    },
    {
      id: "plan-4",
      date: todayStr,
      title: "1-D Infinite Potential Well Guided Quiz",
      subject: "Engineering Physics",
      topic: "Quantum Mechanics & Schrödinger Wave Equation",
      estimatedMinutes: 15,
      type: "quiz",
      status: "pending",
      priority: "medium",
      reason: "Targeted checkpoint to test boundary condition calculations.",
    },
  ];

  const revisionQueue: RevisionItem[] = [
    {
      id: "rev-1",
      topicId: "subj-c-t5",
      topicName: "Pointers & Dynamic Memory Allocation",
      subjectName: "C Programming",
      score: 38,
      dueDate: todayStr,
      intervalDays: 1,
      lastReviewedDate: "2026-10-12",
      status: "pending",
      priority: "high",
    },
    {
      id: "rev-2",
      topicId: "subj-maths-t4",
      topicName: "Multiple Integrals: Double & Triple Integrals",
      subjectName: "Engineering Mathematics",
      score: 48,
      dueDate: todayStr,
      intervalDays: 2,
      lastReviewedDate: "2026-10-12",
      status: "pending",
      priority: "medium",
    },
    {
      id: "rev-3",
      topicId: "subj-physics-t3",
      topicName: "Quantum Mechanics & Schrödinger Wave Equation",
      subjectName: "Engineering Physics",
      score: 52,
      dueDate: "2026-10-15",
      intervalDays: 3,
      lastReviewedDate: "2026-10-11",
      status: "pending",
      priority: "medium",
    },
    {
      id: "rev-4",
      topicId: "subj-python-t4",
      topicName: "OOP Concepts: Classes & Inheritance",
      subjectName: "Python Programming",
      score: 62,
      dueDate: "2026-10-16",
      intervalDays: 4,
      lastReviewedDate: "2026-10-11",
      status: "pending",
      priority: "low",
    },
  ];

  const quizHistory: QuizResult[] = [
    {
      id: "q-hist-1",
      title: "C Pointers & Memory Address Basics",
      subject: "C Programming",
      topic: "Pointers & Dynamic Memory Allocation",
      score: 38,
      totalQuestions: 5,
      correctAnswers: 2,
      difficulty: "Intermediate",
      completedAt: "2026-10-12T18:30:00.000Z",
      isSample: true,
      questions: [
        {
          question: "What is the output of declaring 'int *ptr;' without initialization and immediately printing '*ptr'?",
          options: [
            "Prints 0",
            "Prints null address",
            "Undefined behavior / Segmentation fault (dereferencing wild pointer)",
            "Compile time error",
          ],
          userAnswer: 0,
          correctAnswer: 2,
          explanation: "An uninitialized pointer in C holds garbage memory address. Dereferencing it (*ptr) invokes undefined behavior, often crashing with a segmentation fault.",
          isCorrect: false,
        },
        {
          question: "If 'int arr[5] = {10, 20, 30, 40, 50};', what does '*(arr + 2)' evaluate to?",
          options: ["10", "20", "30", "Address of element 2"],
          userAnswer: 2,
          correctAnswer: 2,
          explanation: "'arr' decays to a pointer to arr[0]. '(arr + 2)' points to arr[2], so '*(arr + 2)' accesses 30.",
          isCorrect: true,
        },
        {
          question: "Which C standard library function frees dynamically allocated heap memory?",
          options: ["delete()", "free()", "dispose()", "dealloc()"],
          userAnswer: 1,
          correctAnswer: 1,
          explanation: "In C, free() in stdlib.h deallocates memory allocated by malloc(), calloc(), or realloc().",
          isCorrect: true,
        },
        {
          question: "What happens if you malloc(sizeof(int) * 10) and lose the pointer reference without calling free()?",
          options: ["Automatic garbage collection", "Memory leak", "Heap overflow immediately", "Buffer overflow"],
          userAnswer: 0,
          correctAnswer: 1,
          explanation: "C lacks automatic garbage collection. Losing heap pointer addresses causes a memory leak.",
          isCorrect: false,
        },
        {
          question: "What is the type of '&ptr' if 'int *ptr;'?",
          options: ["int", "int*", "int** (pointer to a pointer)", "void*"],
          userAnswer: 1,
          correctAnswer: 2,
          explanation: "'ptr' is an int*. The address-of operator '&' on 'ptr' yields 'int**' (pointer to pointer).",
          isCorrect: false,
        },
      ],
    },
    {
      id: "q-hist-2",
      title: "Multiple Integrals & Coordinate Systems",
      subject: "Engineering Mathematics",
      topic: "Multiple Integrals: Double & Triple Integrals",
      score: 48,
      totalQuestions: 5,
      correctAnswers: 2,
      difficulty: "Intermediate",
      completedAt: "2026-10-12T11:15:00.000Z",
      isSample: true,
    },
    {
      id: "q-hist-3",
      title: "Quantum Wavefunctions & Probability Density",
      subject: "Engineering Physics",
      topic: "Quantum Mechanics & Schrödinger Wave Equation",
      score: 52,
      totalQuestions: 5,
      correctAnswers: 3,
      difficulty: "Intermediate",
      completedAt: "2026-10-11T16:45:00.000Z",
      isSample: true,
    },
    {
      id: "q-hist-4",
      title: "Variables, Expressions & Syntax in C",
      subject: "C Programming",
      topic: "Variables, Data Types & Operators",
      score: 88,
      totalQuestions: 5,
      correctAnswers: 4,
      difficulty: "Beginner",
      completedAt: "2026-10-10T14:20:00.000Z",
      isSample: true,
    },
    {
      id: "q-hist-5",
      title: "Python Data Structures: Lists & Dictionaries",
      subject: "Python Programming",
      topic: "Lists, Tuples, Sets & Dictionaries",
      score: 85,
      totalQuestions: 5,
      correctAnswers: 4,
      difficulty: "Intermediate",
      completedAt: "2026-10-09T17:00:00.000Z",
      isSample: true,
    },
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: "act-1",
      type: "quiz",
      description: "Completed C Pointers & Memory Address Basics Quiz (Score: 38%)",
      subject: "C Programming",
      timestamp: "2026-10-12T18:30:00.000Z",
      score: 38,
    },
    {
      id: "act-2",
      type: "study_plan",
      description: "System updated recommendations: Flagged C Pointers as Critical Weakness (<40%)",
      subject: "C Programming",
      timestamp: "2026-10-12T18:31:00.000Z",
    },
    {
      id: "act-3",
      type: "quiz",
      description: "Completed Multiple Integrals Checkpoint Quiz (Score: 48%)",
      subject: "Engineering Mathematics",
      timestamp: "2026-10-12T11:15:00.000Z",
      score: 48,
    },
    {
      id: "act-4",
      type: "tutor",
      description: "Consulted AI Tutor on 'Why does Schrödinger equation use complex numbers?'",
      subject: "Engineering Physics",
      timestamp: "2026-10-11T20:10:00.000Z",
    },
    {
      id: "act-5",
      type: "revision",
      description: "Marked 'Variables & Operators' review completed",
      subject: "C Programming",
      timestamp: "2026-10-10T15:00:00.000Z",
    },
  ];

  return {
    activeProfileId: profile.id,
    profile,
    subjects,
    studyPlan,
    revisionQueue,
    quizHistory,
    activityLogs,
    lastUpdated: new Date().toISOString(),
  };
}

// Generate initial data for a newly registered student
export function getInitialUserData(user: {
  id: string;
  name: string;
  email: string;
  course?: string;
  college?: string;
  semester?: string;
  rollNumber?: string;
  department?: string;
  academicYear?: string;
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
  targetScoreOrRank?: string;
  examName?: string;
  examDate?: string;
  dailyStudyTimeMinutes?: number;
  preferredLanguage?: "English" | "Telugu" | "Bilingual";
  explanationLevel?: "Beginner" | "Intermediate" | "Advanced";
  enrolledSubjects?: string[];
  learningGoals?: string[];
}): AppDataStore {
  const defaultExamDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const profile: StudentProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    course: user.course || "B.Tech Computer Science & Engineering",
    college: user.college || "Engineering Institute",
    semester: user.semester || "Semester 1",
    rollNumber: user.rollNumber || "",
    department: user.department || "Computer Science & Engineering",
    academicYear: user.academicYear || "1st Year",
    avatarUrl: user.avatarUrl || "",
    bio: user.bio || "",
    phoneNumber: user.phoneNumber || "",
    targetScoreOrRank: user.targetScoreOrRank || "Target 9.0+ CGPA",
    enrolledSubjects: user.enrolledSubjects && user.enrolledSubjects.length > 0 ? user.enrolledSubjects : [
      "C Programming",
      "Python Programming",
      "Engineering Mathematics",
      "Engineering Physics",
    ],
    learningGoals: user.learningGoals && user.learningGoals.length > 0 ? user.learningGoals : [
      `Excel in ${user.course || "Engineering"} examinations`,
      "Master foundational programming and analytical problem solving",
      "Maintain consistent daily study rhythm with spaced revision",
    ],
    preferredLanguage: user.preferredLanguage || "English",
    dailyStudyTimeMinutes: user.dailyStudyTimeMinutes || 90,
    explanationLevel: user.explanationLevel || "Intermediate",
    examName: user.examName || "Semester End Examinations",
    examDate: user.examDate || defaultExamDate,
    notificationSettings: {
      dailyReminders: true,
      quizAlerts: true,
      spacedRevision: true,
    },
    isSampleData: false,
  };

  // Base subjects for first-year technical curriculum
  const demoData = getInitialDemoData();
  const subjects: SubjectData[] = demoData.subjects.map((sub) => ({
    ...sub,
    progressPercent: 70,
    topics: sub.topics.map((t) => ({
      ...t,
      score: 70,
      attempts: 0,
      lastAssessed: new Date().toISOString().split("T")[0],
      status: "proficient" as TopicStatus,
      recommendation: "Begin with diagnostic assessment or foundational review.",
      recommendedAction: "Diagnostic Assessment",
    })),
  }));

  const initialSchedule = StudyPlannerEngine.generateSchedule({
    subjects,
    profile,
    existingPlan: [],
    daysCount: 7,
  });

  return {
    activeProfileId: profile.id,
    profile,
    subjects,
    studyPlan: initialSchedule.allScheduledItems,
    revisionQueue: [],
    quizHistory: [],
    activityLogs: [
      {
        id: `act-${Date.now()}`,
        type: "study_plan",
        description: `Student account created for ${user.name}. Personalized study plan initialized.`,
        timestamp: new Date().toISOString(),
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

const STUDENTS_DIR = path.resolve(DATA_DIR, "students");

// Persistent Multi-Tenant File-Based Store Manager
export class StoreManager {
  private userStores: Map<string, AppDataStore> = new Map();

  constructor() {
    this.ensureDirs();
    // Warm up the demo student
    this.getUserStore("demo-student-rahul");
  }

  private ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error("Error creating data directory:", err);
      }
    }
    if (!fs.existsSync(STUDENTS_DIR)) {
      try {
        fs.mkdirSync(STUDENTS_DIR, { recursive: true });
      } catch (err) {
        console.error("Error creating students directory:", err);
      }
    }
  }

  private getStudentFilePath(userId: string): string {
    const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return path.join(STUDENTS_DIR, `${safeId}.json`);
  }

  public getUserStore(userId = "demo-student-rahul"): AppDataStore {
    if (this.userStores.has(userId)) {
      return this.userStores.get(userId)!;
    }

    const filePath = this.getStudentFilePath(userId);
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        this.userStores.set(userId, parsed);
        return parsed;
      }
    } catch (err) {
      console.warn(`Could not read student store for ${userId}, generating fresh store:`, err);
    }

    // Special check for demo student from legacy store_file if available
    if (userId === "demo-student-rahul") {
      try {
        if (fs.existsSync(STORE_FILE)) {
          const raw = fs.readFileSync(STORE_FILE, "utf-8");
          const parsed = JSON.parse(raw);
          this.userStores.set(userId, parsed);
          this.saveUserStore(userId, parsed);
          return parsed;
        }
      } catch {}
      const initialDemo = getInitialDemoData();
      this.userStores.set(userId, initialDemo);
      this.saveUserStore(userId, initialDemo);
      return initialDemo;
    }

    // Default fallback for newly registered students
    const fallbackStore = getInitialUserData({
      id: userId,
      name: "Enrolled Student",
      email: `${userId}@student.engg.edu`,
      course: "B.Tech Computer Science & Engineering",
      college: "Engineering Institute",
      semester: "Semester 1",
    });

    this.userStores.set(userId, fallbackStore);
    this.saveUserStore(userId, fallbackStore);
    return fallbackStore;
  }

  public saveUserStore(userId: string, newData?: AppDataStore): AppDataStore {
    this.ensureDirs();
    const dataToSave = newData || this.userStores.get(userId) || this.getUserStore(userId);
    dataToSave.lastUpdated = new Date().toISOString();
    this.userStores.set(userId, dataToSave);

    try {
      const filePath = this.getStudentFilePath(userId);
      fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), "utf-8");

      // Keep legacy file in sync for demo student
      if (userId === "demo-student-rahul") {
        fs.writeFileSync(STORE_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
      }
    } catch (err) {
      console.error(`Failed to write student store to disk for ${userId}:`, err);
    }

    return dataToSave;
  }

  // Backward-compatible get()
  public get(userId = "demo-student-rahul"): AppDataStore {
    return this.getUserStore(userId);
  }

  // Backward-compatible save()
  public save(userIdOrData: string | AppDataStore = "demo-student-rahul", maybeData?: AppDataStore): AppDataStore {
    let targetUserId = "demo-student-rahul";
    let dataToSave: AppDataStore | undefined = undefined;

    if (typeof userIdOrData === "string") {
      targetUserId = userIdOrData;
      dataToSave = maybeData;
    } else if (typeof userIdOrData === "object" && userIdOrData !== null) {
      dataToSave = userIdOrData;
      targetUserId = dataToSave.activeProfileId || "demo-student-rahul";
    }

    return this.saveUserStore(targetUserId, dataToSave);
  }

  public resetToDemo(userId = "demo-student-rahul"): AppDataStore {
    if (userId === "demo-student-rahul") {
      const demo = getInitialDemoData();
      return this.saveUserStore(userId, demo);
    } else {
      const existing = this.getUserStore(userId);
      const resetStore = getInitialUserData({
        id: userId,
        name: existing.profile.name,
        email: existing.profile.email,
        course: existing.profile.course,
        college: existing.profile.college,
        semester: existing.profile.semester,
      });
      return this.saveUserStore(userId, resetStore);
    }
  }

  public updateProfile(
    userIdOrUpdates: string | Partial<StudentProfile>,
    maybeUpdates?: Partial<StudentProfile>
  ): AppDataStore {
    let userId = "demo-student-rahul";
    let updates: Partial<StudentProfile> = {};

    if (typeof userIdOrUpdates === "string") {
      userId = userIdOrUpdates;
      updates = maybeUpdates || {};
    } else {
      updates = userIdOrUpdates;
    }

    const currentStore = this.getUserStore(userId);
    currentStore.profile = {
      ...currentStore.profile,
      ...updates,
      isSampleData: false,
    };
    this.addActivity(userId, "study_plan", "Updated student profile settings");
    return this.saveUserStore(userId, currentStore);
  }

  public addActivity(
    first: string,
    second: any,
    third?: any,
    fourth?: any,
    fifth?: any
  ) {
    let userId = "demo-student-rahul";
    let type: ActivityLog["type"] = "study_plan";
    let description = "";
    let subject: string | undefined = undefined;
    let score: number | undefined = undefined;

    const activityTypes = ["quiz", "tutor", "material", "study_plan", "revision"];

    if (activityTypes.includes(first)) {
      type = first as ActivityLog["type"];
      description = second || "";
      subject = third;
      score = fourth;
    } else {
      userId = first;
      type = second as ActivityLog["type"];
      description = third || "";
      subject = fourth;
      score = fifth;
    }

    const currentStore = this.getUserStore(userId);
    const log: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      description,
      subject,
      timestamp: new Date().toISOString(),
      score,
    };
    currentStore.activityLogs.unshift(log);
    if (currentStore.activityLogs.length > 50) {
      currentStore.activityLogs.pop();
    }
  }

  public recordQuizResult(
    userIdOrResult: string | Omit<QuizResult, "id" | "completedAt">,
    maybeResult?: Omit<QuizResult, "id" | "completedAt">
  ): {
    updatedData: AppDataStore;
    topicUpdated: TopicPerformance | null;
    previousScore: number;
    newScore: number;
  } {
    let userId = "demo-student-rahul";
    let result: Omit<QuizResult, "id" | "completedAt">;

    if (typeof userIdOrResult === "string") {
      userId = userIdOrResult;
      result = maybeResult!;
    } else {
      result = userIdOrResult;
    }

    const currentStore = this.getUserStore(userId);
    const fullResult: QuizResult = {
      ...result,
      id: `quiz-res-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };

    currentStore.quizHistory.unshift(fullResult);

    let topicUpdated: TopicPerformance | null = null;
    let previousScore = 0;
    let newScore = result.score;

    for (const sub of currentStore.subjects) {
      if (sub.name.toLowerCase() === result.subject.toLowerCase() || sub.id === result.subject) {
        const topic = sub.topics.find(
          (t) => t.name.toLowerCase() === result.topic.toLowerCase() || t.id === result.topic
        );
        if (topic) {
          previousScore = topic.score;
          // Weighted moving average: 60% recent performance, 40% historical score
          const updatedScore = Math.round(topic.score * 0.4 + result.score * 0.6);
          topic.score = updatedScore;
          topic.attempts += 1;
          topic.lastAssessed = new Date().toISOString().split("T")[0];

          const evaluation = evaluateTopicStatus(updatedScore);
          topic.status = evaluation.status;
          topic.recommendation = evaluation.recommendation;
          topic.recommendedAction = evaluation.recommendedAction;
          topicUpdated = topic;
          newScore = updatedScore;
        }

        const avg = Math.round(
          sub.topics.reduce((acc, t) => acc + t.score, 0) / sub.topics.length
        );
        sub.progressPercent = avg;
      }
    }

    this.addActivity(
      userId,
      "quiz",
      `Completed quiz on "${result.topic}" (${result.subject}) with score ${result.score}%`,
      result.subject,
      result.score
    );

    this.rebalanceStudyPlanAndRevision(userId, result.subject, result.topic, newScore);
    this.saveUserStore(userId, currentStore);

    return {
      updatedData: currentStore,
      topicUpdated,
      previousScore,
      newScore,
    };
  }

  private rebalanceStudyPlanAndRevision(userId: string, subject: string, topic: string, score: number) {
    const currentStore = this.getUserStore(userId);
    const today = new Date().toISOString().split("T")[0];

    if (score < 40) {
      const exists = currentStore.studyPlan.some(
        (p) => p.topic.toLowerCase() === topic.toLowerCase() && p.status === "pending"
      );
      if (!exists) {
        currentStore.studyPlan.unshift({
          id: `plan-${Date.now()}`,
          date: today,
          title: `Emergency Review: Fundamental concepts for ${topic}`,
          subject,
          topic,
          estimatedMinutes: 25,
          type: "lesson",
          status: "pending",
          priority: "high",
          reason: `Recent assessment score fell to ${score}% (<40% critical threshold). Review fundamentals recommended.`,
        });
      }
    } else if (score >= 70) {
      currentStore.studyPlan = currentStore.studyPlan.filter(
        (p) => !(p.topic.toLowerCase() === topic.toLowerCase() && p.type === "lesson" && p.status === "pending")
      );
    }

    this.regenerateAdaptiveSchedule(userId, 7);

    const existingRevIndex = currentStore.revisionQueue.findIndex(
      (r) => r.topicName.toLowerCase() === topic.toLowerCase()
    );

    const intervalDays = score < 40 ? 1 : score < 70 ? 2 : score < 85 ? 4 : 7;
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + intervalDays);
    const dueDateStr = dueDateObj.toISOString().split("T")[0];

    if (existingRevIndex >= 0) {
      currentStore.revisionQueue[existingRevIndex].score = score;
      currentStore.revisionQueue[existingRevIndex].intervalDays = intervalDays;
      currentStore.revisionQueue[existingRevIndex].dueDate = dueDateStr;
      currentStore.revisionQueue[existingRevIndex].lastReviewedDate = today;
      currentStore.revisionQueue[existingRevIndex].status = "pending";
      currentStore.revisionQueue[existingRevIndex].priority = score < 70 ? "high" : "medium";
    } else {
      currentStore.revisionQueue.push({
        id: `rev-${Date.now()}`,
        topicId: `custom-t-${Date.now()}`,
        topicName: topic,
        subjectName: subject,
        score,
        dueDate: dueDateStr,
        intervalDays,
        lastReviewedDate: today,
        status: "pending",
        priority: score < 70 ? "high" : "medium",
      });
    }
  }

  public updateStudyPlanItemStatus(
    userIdOrId: string,
    idOrStatus: string | StudyPlanItem["status"],
    maybeStatus?: StudyPlanItem["status"]
  ): AppDataStore {
    let userId = "demo-student-rahul";
    let id = "";
    let status: StudyPlanItem["status"] = "pending";

    if (maybeStatus !== undefined) {
      userId = userIdOrId;
      id = idOrStatus as string;
      status = maybeStatus;
    } else {
      id = userIdOrId;
      status = idOrStatus as StudyPlanItem["status"];
    }

    const currentStore = this.getUserStore(userId);
    const item = currentStore.studyPlan.find((p) => p.id === id);
    if (item) {
      item.status = status;
      if (status === "completed") {
        item.completedAt = new Date().toISOString();
        this.addActivity(userId, "study_plan", `Completed study activity: "${item.title}"`, item.subject);
      }
    }
    return this.saveUserStore(userId, currentStore);
  }

  public addStudyPlanItem(
    userIdOrItem: string | Omit<StudyPlanItem, "id">,
    maybeItem?: Omit<StudyPlanItem, "id">
  ): AppDataStore {
    let userId = "demo-student-rahul";
    let item: Omit<StudyPlanItem, "id">;

    if (typeof userIdOrItem === "string") {
      userId = userIdOrItem;
      item = maybeItem!;
    } else {
      item = userIdOrItem;
    }

    const currentStore = this.getUserStore(userId);
    const newItem: StudyPlanItem = {
      ...item,
      id: `plan-${Date.now()}`,
    };
    currentStore.studyPlan.push(newItem);
    this.addActivity(userId, "study_plan", `Added new study goal: "${item.title}"`, item.subject);
    return this.saveUserStore(userId, currentStore);
  }

  public editStudyPlanItem(
    userIdOrId: string,
    idOrUpdates: string | Partial<StudyPlanItem>,
    maybeUpdates?: Partial<StudyPlanItem>
  ): AppDataStore {
    let userId = "demo-student-rahul";
    let id = "";
    let updates: Partial<StudyPlanItem> = {};

    if (maybeUpdates !== undefined) {
      userId = userIdOrId;
      id = idOrUpdates as string;
      updates = maybeUpdates;
    } else {
      id = userIdOrId;
      updates = idOrUpdates as Partial<StudyPlanItem>;
    }

    const currentStore = this.getUserStore(userId);
    const item = currentStore.studyPlan.find((p) => p.id === id);
    if (item) {
      if (updates.title !== undefined) item.title = updates.title;
      if (updates.estimatedMinutes !== undefined) item.estimatedMinutes = Number(updates.estimatedMinutes);
      if (updates.type !== undefined) item.type = updates.type;
      if (updates.priority !== undefined) item.priority = updates.priority;
      if (updates.date !== undefined) item.date = updates.date;
      if (updates.status !== undefined) item.status = updates.status;
      this.addActivity(userId, "study_plan", `Edited study plan activity: "${item.title}"`, item.subject);
    }
    return this.saveUserStore(userId, currentStore);
  }

  public deleteStudyPlanItem(userIdOrId: string, maybeId?: string): AppDataStore {
    let userId = "demo-student-rahul";
    let id = "";

    if (maybeId !== undefined) {
      userId = userIdOrId;
      id = maybeId;
    } else {
      id = userIdOrId;
    }

    const currentStore = this.getUserStore(userId);
    const idx = currentStore.studyPlan.findIndex((p) => p.id === id);
    if (idx >= 0) {
      const removed = currentStore.studyPlan.splice(idx, 1)[0];
      this.addActivity(userId, "study_plan", `Removed activity from study plan: "${removed.title}"`, removed.subject);
    }
    return this.saveUserStore(userId, currentStore);
  }

  public regenerateAdaptiveSchedule(
    userIdOrDays: string | number = "demo-student-rahul",
    maybeDays = 7
  ): { store: AppDataStore; days: any[]; summary: any } {
    let userId = "demo-student-rahul";
    let daysCount = 7;

    if (typeof userIdOrDays === "string") {
      userId = userIdOrDays;
      daysCount = maybeDays;
    } else {
      daysCount = Number(userIdOrDays) || 7;
    }

    const currentStore = this.getUserStore(userId);
    const schedule = StudyPlannerEngine.generateSchedule({
      subjects: currentStore.subjects,
      profile: currentStore.profile,
      existingPlan: currentStore.studyPlan,
      daysCount,
    });

    const completedItems = currentStore.studyPlan.filter((p) => p.status === "completed");
    const mergedPlan = [
      ...completedItems,
      ...schedule.allScheduledItems.filter((item) => !completedItems.some((c) => c.id === item.id)),
    ];

    currentStore.studyPlan = mergedPlan;
    this.addActivity(
      userId,
      "study_plan",
      `Regenerated adaptive ${daysCount}-day study schedule based on quiz performance`
    );
    this.saveUserStore(userId, currentStore);

    return {
      store: currentStore,
      days: schedule.days,
      summary: schedule.summary,
    };
  }

  public updateRevisionStatus(
    userIdOrId: string,
    idOrStatus: string | RevisionItem["status"],
    maybeStatus?: RevisionItem["status"]
  ): AppDataStore {
    let userId = "demo-student-rahul";
    let id = "";
    let status: RevisionItem["status"] = "pending";

    if (maybeStatus !== undefined) {
      userId = userIdOrId;
      id = idOrStatus as string;
      status = maybeStatus;
    } else {
      id = userIdOrId;
      status = idOrStatus as RevisionItem["status"];
    }

    const currentStore = this.getUserStore(userId);
    const item = currentStore.revisionQueue.find((r) => r.id === id);
    if (item) {
      item.status = status;
      if (status === "completed") {
        item.intervalDays = Math.min(item.intervalDays * 2, 21);
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + item.intervalDays);
        item.dueDate = nextDate.toISOString().split("T")[0];
        item.lastReviewedDate = new Date().toISOString().split("T")[0];
        this.addActivity(userId, "revision", `Completed spaced revision for "${item.topicName}"`, item.subjectName);
      } else if (status === "postponed") {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1);
        item.dueDate = nextDate.toISOString().split("T")[0];
      }
    }
    return this.saveUserStore(userId, currentStore);
  }
}

export const store = new StoreManager();
