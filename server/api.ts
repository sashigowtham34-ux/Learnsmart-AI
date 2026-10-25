import express from "express";
import { Type } from "@google/genai";
import { ai, hasApiKey } from "./gemini.js";
import { store, getInitialUserData } from "./store.js";
import { StudyPlannerEngine } from "./studyPlannerEngine.js";
import { authManager, requireAuth, optionalAuth, AuthenticatedRequest } from "./auth.js";

export const apiRouter = express.Router();
export const apiApp = express();

apiApp.use(express.json({ limit: "15mb" }));
apiApp.use("/api", apiRouter);

// Helper to gracefully handle transient Gemini API spikes with automatic retry
async function generateWithRetry(params: any, maxRetries = 2): Promise<any> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
}

// 1. Health & status check
apiRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey,
    model: "gemini-3.8-flash",
    timestamp: new Date().toISOString(),
  });
});

// --- AUTHENTICATION & SECURITY ENDPOINTS ---

// Register student account / create personal profile
apiRouter.post("/auth/register", (req, res) => {
  try {
    const {
      name,
      email,
      password,
      course,
      college,
      semester,
      rollNumber,
      department,
      academicYear,
      avatarUrl,
      bio,
      phoneNumber,
      targetScoreOrRank,
      examName,
      examDate,
      dailyStudyTimeMinutes,
      preferredLanguage,
      explanationLevel,
      enrolledSubjects,
      learningGoals,
    } = req.body || {};

    const result = authManager.register({
      name,
      email,
      password,
      course,
      college,
      semester,
      rollNumber,
      department,
      academicYear,
      avatarUrl,
      bio,
      phoneNumber,
      targetScoreOrRank,
    });

    const initialData = getInitialUserData({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      course: result.user.course,
      college: result.user.college,
      semester: result.user.semester,
      rollNumber,
      department,
      academicYear,
      avatarUrl,
      bio,
      phoneNumber,
      targetScoreOrRank,
      examName,
      examDate,
      dailyStudyTimeMinutes,
      preferredLanguage,
      explanationLevel,
      enrolledSubjects,
      learningGoals,
    });

    const userStore = store.saveUserStore(result.user.id, initialData);

    res.json({
      success: true,
      token: result.token,
      user: result.user,
      data: userStore,
      message: "Personal student profile created and saved successfully.",
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Direct personal profile creation endpoint
apiRouter.post("/profile/create", (req, res) => {
  try {
    const {
      name,
      email,
      password,
      course,
      college,
      semester,
      rollNumber,
      department,
      academicYear,
      avatarUrl,
      bio,
      phoneNumber,
      targetScoreOrRank,
      examName,
      examDate,
      dailyStudyTimeMinutes,
      preferredLanguage,
      explanationLevel,
      enrolledSubjects,
      learningGoals,
    } = req.body || {};

    const result = authManager.register({
      name: name || "Student",
      email: email || `student-${Date.now()}@academic.edu`,
      password,
      course,
      college,
      semester,
      rollNumber,
      department,
      academicYear,
      avatarUrl,
      bio,
      phoneNumber,
      targetScoreOrRank,
    });

    const initialData = getInitialUserData({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      course: result.user.course,
      college: result.user.college,
      semester: result.user.semester,
      rollNumber,
      department,
      academicYear,
      avatarUrl,
      bio,
      phoneNumber,
      targetScoreOrRank,
      examName,
      examDate,
      dailyStudyTimeMinutes,
      preferredLanguage,
      explanationLevel,
      enrolledSubjects,
      learningGoals,
    });

    const userStore = store.saveUserStore(result.user.id, initialData);

    res.json({
      success: true,
      token: result.token,
      user: result.user,
      data: userStore,
      message: "Personal profile created successfully.",
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Login student account
apiRouter.post("/auth/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = authManager.login({ email, password });
    const userStore = store.getUserStore(result.user.id);
    res.json({
      success: true,
      token: result.token,
      user: result.user,
      data: userStore,
      message: "Signed in successfully.",
    });
  } catch (err: any) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// One-click demo login (Rahul Sharma)
apiRouter.post("/auth/demo-login", (req, res) => {
  try {
    const result = authManager.loginDemo();
    const userStore = store.getUserStore(result.user.id);
    res.json({
      success: true,
      token: result.token,
      user: result.user,
      data: userStore,
      message: "Signed in as Demonstration Student (Rahul Sharma).",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get current authenticated user profile & data
apiRouter.get("/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userStore = store.getUserStore(req.userId!);
    res.json({
      success: true,
      user: req.user,
      data: userStore,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Logout (session token invalidation)
apiRouter.post("/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    authManager.logout(token);
  }
  res.json({ success: true, message: "Signed out securely." });
});

// Delete account and purge private data
apiRouter.delete("/auth/account", requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const deleted = authManager.deleteAccount(req.userId!);
    res.json({
      success: true,
      message: deleted
        ? "Your account and all academic data records have been permanently deleted."
        : "Account not found or already deleted.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Security & Database Architecture audit
apiRouter.get("/auth/security-status", (req, res) => {
  res.json({
    success: true,
    serverAuth: {
      status: "active",
      algorithm: "scrypt (64-byte key, 16-byte cryptographically secure random salt)",
      sessionSecurity: "256-bit entropy random tokens with server-side expiration validation",
      dataIsolation: "Multi-tenant tenant isolation per student UID (/data/students/{userId}.json)",
    },
    firebaseConfig: {
      status: "unconfigured",
      statusReason: "External Cloud Firestore setup was declined in AI Studio UI.",
      firestoreRulesPath: "firestore.rules",
      blueprintPath: "firebase-blueprint.json",
      setupGuidePath: "FIREBASE_SETUP_INSTRUCTIONS.md",
      zeroTrustABAC: true,
    },
  });
});

// 2. Data store endpoints (Secured per-student data isolation)
apiRouter.get("/data", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const data = store.getUserStore(userId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/data/reset", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const data = store.resetToDemo(userId);
    res.json({ success: true, message: "Reset to baseline state", data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/data/profile", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const updates = req.body;
    const data = store.updateProfile(userId, updates);

    let updatedUser = null;
    if (req.userId) {
      updatedUser = authManager.updateUser(req.userId, {
        name: updates.name,
        course: updates.course,
        college: updates.college,
        semester: updates.semester,
        rollNumber: updates.rollNumber,
        department: updates.department,
        academicYear: updates.academicYear,
        avatarUrl: updates.avatarUrl,
        bio: updates.bio,
        phoneNumber: updates.phoneNumber,
        targetScoreOrRank: updates.targetScoreOrRank,
      });
    }

    res.json({ success: true, data, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/data/study-plan/:id", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const { id } = req.params;
    const { status } = req.body;
    const data = store.updateStudyPlanItemStatus(userId, id, status);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/data/study-plan", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const item = req.body;
    const data = store.addStudyPlanItem(userId, item);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put("/data/study-plan/:id", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const { id } = req.params;
    const updates = req.body;
    const data = store.editStudyPlanItem(userId, id, updates);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete("/data/study-plan/:id", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const { id } = req.params;
    const data = store.deleteStudyPlanItem(userId, id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/data/study-plan/generate", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const { daysCount = 7 } = req.body || {};
    const result = store.regenerateAdaptiveSchedule(userId, Number(daysCount));
    res.json({
      success: true,
      data: result.store,
      days: result.days,
      summary: result.summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/planner/simulate", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const { dailyStudyTimeMinutes, examDate, enrolledSubjects, daysCount = 5 } = req.body || {};
    const baseStore = store.getUserStore(userId);
    const tempProfile = {
      ...baseStore.profile,
      dailyStudyTimeMinutes: Number(dailyStudyTimeMinutes) || baseStore.profile.dailyStudyTimeMinutes || 90,
      examDate: examDate || baseStore.profile.examDate,
      enrolledSubjects: Array.isArray(enrolledSubjects) && enrolledSubjects.length > 0 ? enrolledSubjects : baseStore.profile.enrolledSubjects,
    };

    const schedule = StudyPlannerEngine.generateSchedule({
      subjects: baseStore.subjects,
      profile: tempProfile,
      existingPlan: baseStore.studyPlan,
      daysCount: Number(daysCount),
    });

    res.json({
      success: true,
      schedule,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/data/revision/:id", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const { id } = req.params;
    const { status } = req.body;
    const data = store.updateRevisionStatus(userId, id, status);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post("/data/quiz", optionalAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId || "demo-student-rahul";
    const quizData = req.body;
    const result = store.recordQuizResult(userId, quizData);
    res.json({
      success: true,
      data: result.updatedData,
      topicUpdated: result.topicUpdated,
      previousScore: result.previousScore,
      newScore: result.newScore,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. AI Tutor endpoint
apiRouter.post("/tutor", async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      subject = "General Engineering",
      topic = "",
      language = "English",
      level = "Intermediate",
      mode = "chat", // 'chat' | 'hint' | 'test'
    } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, error: "A prompt message is required." });
    }

    if (!hasApiKey) {
      return res.status(503).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server. Please check the Secrets panel in AI Studio.",
      });
    }

    // Build system instructions based on language, academic level, and mode
    let systemInstruction = `You are "LearnSmart AI", a world-class, supportive, highly pedagogic personal academic tutor for engineering, college, and school students.
Target Subject: ${subject}.
Specific Topic Context: ${topic || "General concepts"}.
Target Explanation Level: ${level} (Beginner: intuitive real-world analogies, no excessive jargon; Intermediate: balanced conceptual rigor with standard college-level formulations; Advanced: deep implementation details, edge cases, formal analysis, performance & memory implications).
Output Language: ${
      language === "Telugu"
        ? "Telugu (provide clear, natural Telugu explanations using script and standard academic terminology in brackets when helpful)"
        : language === "Bilingual"
        ? "Bilingual English & Telugu (explain in clear English and provide key Telugu summaries/translations for complex points)"
        : "English (clear, concise, pedagogic English)"
    }.

Pedagogical Directives:
1. Break down difficult concepts into logical, step-by-step progressions.
2. Provide concrete, relatable examples (code snippets for C/Python, mathematical derivations for Calculus/Linear Algebra, physical intuition for Physics).
3. If the student has made a misconception or incorrect statement, explain WHY kindly and constructively.
4. When uncertain or when context is missing, transparently acknowledge uncertainty rather than hallucinating facts.
5. Format mathematical equations cleanly and code snippets in proper markdown fences.
`;

    if (mode === "hint") {
      systemInstruction += `\nSPECIAL MODE: HINT MODE.
Do NOT give away the complete final solution or full answer immediately!
Instead, provide a thoughtful guiding hint, an analogy, or a leading question that scaffolds the student's own discovery process. Encourage them to take the next step.`;
    } else if (mode === "test") {
      systemInstruction += `\nSPECIAL MODE: COMPREHENSION CHECK.
After a brief 1-2 sentence clarification, provide a targeted quick check question with 3-4 options or a brief prompt to test the student's grasp of this specific concept.`;
    }

    // Format chat messages
    const contents: any[] = [];
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      // Include last 6 messages for context
      const recent = conversationHistory.slice(-6);
      for (const turn of recent) {
        contents.push({
          role: turn.sender === "student" ? "user" : "model",
          parts: [{ text: turn.text }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await generateWithRetry({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I was unable to formulate an explanation. Please try asking again.";

    // Log this activity in student's history
    store.addActivity("tutor", `Consulted AI Tutor: "${message.substring(0, 60)}..."`, subject);

    res.json({
      success: true,
      reply,
      mode,
      language,
      level,
    });
  } catch (err: any) {
    console.error("Gemini Tutor error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to communicate with AI Tutor.",
    });
  }
});

// 4. Smart Quiz Generator
apiRouter.post("/quiz/generate", async (req, res) => {
  try {
    const {
      subject = "C Programming",
      topic = "Pointers & Dynamic Memory Allocation",
      difficulty = "Intermediate",
      count = 5,
    } = req.body;

    const questionCount = Math.min(Math.max(parseInt(count) || 5, 2), 10);

    if (!hasApiKey) {
      // Provide robust fallback questions if key is absent so test flow never fails
      const fallbackQuestions = getFallbackQuestions(subject, topic, questionCount, difficulty);
      return res.json({
        success: true,
        isFallback: true,
        questions: fallbackQuestions,
        subject,
        topic,
        difficulty,
      });
    }

    const prompt = `Generate exactly ${questionCount} multiple-choice assessment questions for an undergraduate student on the topic "${topic}" in the subject "${subject}".
Difficulty Level: ${difficulty}.
Requirements:
- Each question must test genuine conceptual understanding or problem-solving (not superficial trivia).
- Exactly 4 distinct options per question.
- Exactly one correct answer specified by zero-based index (0, 1, 2, or 3).
- Provide a detailed educational explanation explaining why the correct answer is right and why common misconceptions are wrong.
- Explicitly validate all technical terms and syntax.`;

    const response = await generateWithRetry({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The full question text, including code snippets or mathematical expressions." },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 4 answer options (Option A, B, C, D)",
              },
              correctAnswer: { type: Type.INTEGER, description: "The 0-based index of the correct answer (0 to 3)." },
              explanation: { type: Type.STRING, description: "Thorough explanation of the correct answer and common pitfalls." },
              topic: { type: Type.STRING, description: "Specific sub-topic assessed." },
              difficulty: { type: Type.STRING, description: "Difficulty rating: Beginner, Intermediate, or Advanced." },
            },
            required: ["question", "options", "correctAnswer", "explanation"],
          },
        },
      },
    });

    let questions: any[] = [];
    try {
      const text = response.text || "[]";
      questions = JSON.parse(text);
    } catch (parseErr) {
      console.warn("JSON parse failed on Gemini quiz output, using fallback:", parseErr);
      questions = getFallbackQuestions(subject, topic, questionCount, difficulty);
    }

    // Safety check on questions
    if (!Array.isArray(questions) || questions.length === 0) {
      questions = getFallbackQuestions(subject, topic, questionCount, difficulty);
    }

    // Sanitize question data
    const sanitized = questions.slice(0, questionCount).map((q, idx) => ({
      id: `q-gen-${Date.now()}-${idx}`,
      question: q.question || `Question ${idx + 1}`,
      options: Array.isArray(q.options) && q.options.length === 4
        ? q.options
        : ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: typeof q.correctAnswer === "number" && q.correctAnswer >= 0 && q.correctAnswer < 4
        ? q.correctAnswer
        : 0,
      explanation: q.explanation || "No explanation provided.",
      topic: q.topic || topic,
      difficulty: q.difficulty || difficulty,
    }));

    res.json({
      success: true,
      questions: sanitized,
      subject,
      topic,
      difficulty,
    });
  } catch (err: any) {
    console.error("Quiz generate error:", err);
    // Graceful fallback so quiz works even on rate limits
    const { subject = "C Programming", topic = "General", difficulty = "Intermediate", count = 5 } = req.body;
    const fallbackQuestions = getFallbackQuestions(subject, topic, count, difficulty);
    res.json({
      success: true,
      isFallback: true,
      fallbackNotice: "Loaded verified curriculum questions (AI service temporarily busy).",
      questions: fallbackQuestions,
      subject,
      topic,
      difficulty,
    });
  }
});

// 5. AI Study Material Assistant
apiRouter.post("/material/analyze", async (req, res) => {
  try {
    const {
      title = "Uploaded Study Material",
      content = "",
      action = "summary", // 'summary' | 'flashcards' | 'notes' | 'quiz' | 'concepts'
      focusTopic = "",
    } = req.body;

    if (!content || content.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: "Document text content is too short to analyze. Please provide at least a few sentences.",
      });
    }

    if (!hasApiKey) {
      return res.status(503).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server. Please check your AI Studio secrets.",
      });
    }

    // Truncate to reasonable token limit (~30,000 characters)
    const truncatedContent = content.slice(0, 30000);

    const promptsByAction: Record<string, string> = {
      summary: `Analyze the following study material titled "${title}".
Provide an executive, highly structured academic summary with:
1. Core Objective & Thesis
2. Key Pillars and Principles
3. Practical Application & Why It Matters for Exams
4. Critical Formulas/Definitions
Keep it concise, clear, and grounded strictly in the provided content. If certain aspects are not mentioned in the text, explicitly state that limitation.`,

      notes: `Convert the following study material titled "${title}" into structured, high-yield Quick Revision Notes.
Format with clean markdown:
- Concept Name & Definition
- Step-by-Step Mechanisms
- Common Pitfalls and Exam Traps
- Memory Mnemonics or Quick Tips
- Key Takeaways`,

      flashcards: `Generate 6 high-yield flashcards based on the following study material titled "${title}".
Return as a structured JSON array with "front" (question/prompt) and "back" (concise, precise answer).`,

      concepts: `Extract the top 5-7 most important academic concepts from the following study material titled "${title}".
For each concept, provide:
- Concept Name
- Intuitive 1-Sentence Definition
- Mathematical/Technical Formulation or Rule
- Relevance to engineering exams`,

      quiz: `Generate 4 multiple-choice revision questions grounded strictly in the provided study material titled "${title}".
Include question, 4 options, correctAnswer (0-3 index), and explanation.`,
    };

    const actionPrompt = promptsByAction[action] || promptsByAction.summary;

    let response;
    if (action === "flashcards") {
      response = await generateWithRetry({
        model: "gemini-3.8-flash",
        contents: `${actionPrompt}\n\nSTUDY MATERIAL:\n${truncatedContent}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING },
                topic: { type: Type.STRING },
              },
              required: ["front", "back"],
            },
          },
        },
      });

      const parsedCards = JSON.parse(response.text || "[]");
      store.addActivity("material", `Generated flashcards from "${title}"`);
      return res.json({
        success: true,
        action,
        title,
        flashcards: parsedCards,
        groundedInDocument: true,
      });
    } else {
      response = await generateWithRetry({
        model: "gemini-3.8-flash",
        contents: `${actionPrompt}\n\nSTUDY MATERIAL:\n${truncatedContent}`,
      });

      const output = response.text || "No analysis could be generated.";
      store.addActivity("material", `Analyzed study material: "${title}" (${action})`);

      return res.json({
        success: true,
        action,
        title,
        output,
        groundedInDocument: true,
      });
    }
  } catch (err: any) {
    console.error("Material analyze error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to analyze study material.",
    });
  }
});

// Fallback high-quality curated engineering questions
function getFallbackQuestions(subject: string, topic: string, count: number, difficulty: string) {
  const bank: Record<string, any[]> = {
    "Pointers & Dynamic Memory Allocation": [
      {
        question: "What is the result of applying the '*' operator to a pointer variable in C?",
        options: [
          "It obtains the memory address of the pointer itself",
          "It dereferences the pointer to access the value stored at the target address",
          "It multiplies the address by the size of the data type",
          "It deallocates the pointer memory",
        ],
        correctAnswer: 1,
        explanation: "The unary '*' operator dereferences the pointer, allowing direct read/write access to the value at that address.",
        topic: "Pointers & Dynamic Memory Allocation",
        difficulty: "Intermediate",
      },
      {
        question: "In C, which function is used to allocate memory dynamically on the heap without zero-initializing it?",
        options: ["calloc()", "malloc()", "realloc()", "alloca()"],
        correctAnswer: 1,
        explanation: "malloc() allocates uninitialized memory containing indeterminate (garbage) values, whereas calloc() zeroes out the allocated memory.",
        topic: "Pointers & Dynamic Memory Allocation",
        difficulty: "Beginner",
      },
      {
        question: "What is a 'dangling pointer' in C?",
        options: [
          "A pointer that is initialized to NULL",
          "A pointer pointing to a memory location that has been deallocated with free()",
          "A pointer with type void*",
          "A pointer that has circular reference to itself",
        ],
        correctAnswer: 1,
        explanation: "A dangling pointer points to memory that has been freed. Accessing it causes undefined behavior. Best practice is to set it to NULL after free().",
        topic: "Pointers & Dynamic Memory Allocation",
        difficulty: "Intermediate",
      },
      {
        question: "If 'int *p = (int*)malloc(sizeof(int)); *p = 42;' is executed, what is the best practice after calling 'free(p);'?",
        options: [
          "Call 'free(p);' a second time to ensure clearance",
          "Set 'p = NULL;' to prevent accidental dangling pointer dereferences",
          "Do nothing, C automatically sets pointers to NULL",
          "Re-cast p to (void*)",
        ],
        correctAnswer: 1,
        explanation: "free(p) only marks the heap block as reusable; the variable p still holds the old address. Setting p = NULL prevents disastrous accidental use.",
        topic: "Pointers & Dynamic Memory Allocation",
        difficulty: "Intermediate",
      },
      {
        question: "What does the declaration 'const int *ptr;' signify?",
        options: [
          "ptr is a constant pointer to a mutable integer",
          "ptr is a pointer to a constant integer (the value cannot be modified through ptr)",
          "Both ptr and the integer value are constant",
          "Illegal syntax in C99",
        ],
        correctAnswer: 1,
        explanation: "'const int *ptr' means ptr points to a const int: *ptr cannot be modified via ptr, though ptr itself can point to another address.",
        topic: "Pointers & Dynamic Memory Allocation",
        difficulty: "Advanced",
      },
    ],
    "Multiple Integrals: Double & Triple Integrals": [
      {
        question: "In changing Cartesian coordinates (x, y) to polar coordinates (r, θ) in a double integral, the differential element dx dy becomes:",
        options: ["dr dθ", "r dr dθ", "r² dr dθ", "(1/r) dr dθ"],
        correctAnswer: 1,
        explanation: "The Jacobian of the transformation from (x, y) to (r, θ) is r. Hence, dx dy = |J| dr dθ = r dr dθ.",
        topic: "Multiple Integrals: Double & Triple Integrals",
        difficulty: "Intermediate",
      },
      {
        question: "What condition allows the order of integration in a double integral to be swapped (Fubini's Theorem)?",
        options: [
          "The integrand function must be continuous over the closed, bounded region",
          "The region must be an exact circle",
          "The integrand must be linear",
          "The limits must all be zero",
        ],
        correctAnswer: 0,
        explanation: "Fubini's Theorem guarantees that for a continuous function on a closed, bounded region, the order of iterated integrals yields the identical value.",
        topic: "Multiple Integrals: Double & Triple Integrals",
        difficulty: "Intermediate",
      },
      {
        question: "What geometric quantity is represented by the double integral ∬_R 1 dA over a 2D planar region R?",
        options: ["The volume under the surface", "The exact area of region R", "The perimeter of region R", "The centroid coordinates"],
        correctAnswer: 1,
        explanation: "Integrating 1 dA over region R sums the area elements, yielding the exact area of the 2D region R.",
        topic: "Multiple Integrals: Double & Triple Integrals",
        difficulty: "Beginner",
      },
    ],
    "Quantum Mechanics & Schrödinger Wave Equation": [
      {
        question: "What does the Born interpretation state regarding the quantum wave function Ψ(x, t)?",
        options: [
          "Ψ represents the exact trajectory of the particle",
          "|Ψ(x, t)|² represents the probability density of finding the particle at position x at time t",
          "Ψ is purely a mathematical artifact with no physical connection",
          "The energy of the particle is proportional to Ψ",
        ],
        correctAnswer: 1,
        explanation: "Max Born showed that the square of the absolute value of the wave function |Ψ|² represents the probability density of particle detection.",
        topic: "Quantum Mechanics & Schrödinger Wave Equation",
        difficulty: "Intermediate",
      },
      {
        question: "For a particle of mass m in a 1-D infinite potential well of width L, the quantized energy levels E_n are proportional to:",
        options: ["n", "n²", "1/n", "√n"],
        correctAnswer: 1,
        explanation: "E_n = (n² h²) / (8 m L²). The energy levels scale quadratically with quantum number n².",
        topic: "Quantum Mechanics & Schrödinger Wave Equation",
        difficulty: "Intermediate",
      },
    ],
  };

  const topicKey = Object.keys(bank).find((k) => k.toLowerCase().includes(topic.toLowerCase())) || "Pointers & Dynamic Memory Allocation";
  const selected = bank[topicKey] || bank["Pointers & Dynamic Memory Allocation"];
  return selected.slice(0, count);
}
