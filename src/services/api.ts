// Client-side API service to communicate with secure backend endpoints

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
  examDate: string;
  notificationSettings: {
    dailyReminders: boolean;
    quizAlerts: boolean;
    spacedRevision: boolean;
  };
  isSampleData: boolean;
}

export interface TopicPerformance {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  score: number;
  attempts: number;
  lastAssessed: string;
  status: "critical" | "weak" | "proficient" | "mastered";
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

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
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

export interface AuthUser {
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
  createdAt: string;
}

const TOKEN_KEY = "learnsmart_auth_token";

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearStoredAuthToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function getAuthHeaders(customHeaders: Record<string, string> = {}): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };
  const token = getStoredAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Client-side image processor: compresses and resizes user uploaded photos to ~25-45KB data URL
export function processImageFileToDataUrl(file: File, maxSize = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please upload a valid image file (PNG, JPG, WebP, GIF)."));
      return;
    }
    // Max 10MB file limit
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("Image file size must be under 10MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode uploaded image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Draw and compress with smooth bilinear resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.86);
        resolve(compressedDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface RegisterProfileParams {
  name: string;
  email: string;
  password?: string;
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
}

// Authentication API methods
export async function registerStudent(
  params: RegisterProfileParams
): Promise<{ token: string; user: AuthUser; data: AppDataStore; message: string }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Registration failed");
  }
  setStoredAuthToken(json.token);
  return json;
}

export async function createPersonalProfile(
  params: RegisterProfileParams
): Promise<{ token: string; user: AuthUser; data: AppDataStore; message: string }> {
  const res = await fetch("/api/profile/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to create personal profile");
  }
  setStoredAuthToken(json.token);
  return json;
}

export async function loginStudent(
  email: string,
  password: string
): Promise<{ token: string; user: AuthUser; data: AppDataStore; message: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Login failed");
  }
  setStoredAuthToken(json.token);
  return json;
}

export async function loginDemoStudent(): Promise<{
  token: string;
  user: AuthUser;
  data: AppDataStore;
  message: string;
}> {
  const res = await fetch("/api/auth/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Demo login failed");
  }
  setStoredAuthToken(json.token);
  return json;
}

export async function checkAuthSession(): Promise<{ user: AuthUser; data: AppDataStore } | null> {
  const token = getStoredAuthToken();
  if (!token) return null;
  try {
    const res = await fetch("/api/auth/me", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      clearStoredAuthToken();
      return null;
    }
    const json = await res.json();
    return json.success ? { user: json.user, data: json.data } : null;
  } catch {
    return null;
  }
}

export async function logoutStudent(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } catch {}
  clearStoredAuthToken();
}

export async function deleteAccountPermanently(): Promise<void> {
  const res = await fetch("/api/auth/account", {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to delete account");
  }
  clearStoredAuthToken();
}

export async function fetchSecurityStatus(): Promise<any> {
  const res = await fetch("/api/auth/security-status", {
    headers: getAuthHeaders(),
  });
  return await res.json();
}

export async function fetchStoreData(): Promise<AppDataStore> {
  const res = await fetch("/api/data", {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load data: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function resetDemoStore(): Promise<AppDataStore> {
  const res = await fetch("/api/data/reset", {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to reset data: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function updateProfileSettings(updates: Partial<StudentProfile>): Promise<AppDataStore> {
  const res = await fetch("/api/data/profile", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    throw new Error(`Failed to update profile: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function updateStudyPlanStatus(id: string, status: StudyPlanItem["status"]): Promise<AppDataStore> {
  const res = await fetch(`/api/data/study-plan/${id}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update study plan item: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function addCustomStudyPlanItem(item: Omit<StudyPlanItem, "id">): Promise<AppDataStore> {
  const res = await fetch("/api/data/study-plan", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    throw new Error(`Failed to add study plan item: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function editPlanActivity(id: string, updates: Partial<StudyPlanItem>): Promise<AppDataStore> {
  const res = await fetch(`/api/data/study-plan/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    throw new Error(`Failed to edit study plan item: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function deletePlanActivity(id: string): Promise<AppDataStore> {
  const res = await fetch(`/api/data/study-plan/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to delete study plan item: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function regenerateAdaptivePlan(daysCount = 7): Promise<{
  data: AppDataStore;
  days: any[];
  summary: any;
}> {
  const res = await fetch("/api/data/study-plan/generate", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ daysCount }),
  });
  if (!res.ok) {
    throw new Error(`Failed to regenerate study plan: ${res.statusText}`);
  }
  return await res.json();
}

export async function simulateStudyPlanScenario(params: {
  dailyStudyTimeMinutes: number;
  examDate?: string;
  enrolledSubjects?: string[];
  daysCount?: number;
}): Promise<{
  success: boolean;
  schedule: {
    days: any[];
    allScheduledItems: StudyPlanItem[];
    summary: any;
  };
}> {
  const res = await fetch("/api/planner/simulate", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Failed to simulate schedule: ${res.statusText}`);
  }
  return await res.json();
}

export async function updateRevisionItemStatus(id: string, status: RevisionItem["status"]): Promise<AppDataStore> {
  const res = await fetch(`/api/data/revision/${id}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update revision status: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function submitQuizScore(result: Omit<QuizResult, "id" | "completedAt">): Promise<{
  data: AppDataStore;
  topicUpdated: TopicPerformance | null;
  previousScore: number;
  newScore: number;
}> {
  const res = await fetch("/api/data/quiz", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(result),
  });
  if (!res.ok) {
    throw new Error(`Failed to record quiz result: ${res.statusText}`);
  }
  return await res.json();
}

export async function askAITutor(params: {
  message: string;
  conversationHistory: { sender: "student" | "tutor"; text: string }[];
  subject: string;
  topic?: string;
  language: "English" | "Telugu" | "Bilingual";
  level: "Beginner" | "Intermediate" | "Advanced";
  mode?: "chat" | "hint" | "test";
}): Promise<{ reply: string; mode: string }> {
  const res = await fetch("/api/tutor", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Tutor error: ${res.statusText}`);
  }
  return json;
}

export async function generateQuizQuestions(params: {
  subject: string;
  topic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  count: number;
}): Promise<{ questions: QuizQuestion[]; isFallback?: boolean; fallbackNotice?: string }> {
  const res = await fetch("/api/quiz/generate", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Quiz generation error: ${res.statusText}`);
  }
  return json;
}

export async function analyzeStudyMaterial(params: {
  title: string;
  content: string;
  action: "summary" | "flashcards" | "notes" | "quiz" | "concepts";
  focusTopic?: string;
}): Promise<{
  action: string;
  title: string;
  output?: string;
  flashcards?: { front: string; back: string; topic?: string }[];
  groundedInDocument: boolean;
}> {
  const res = await fetch("/api/material/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Study material analysis error: ${res.statusText}`);
  }
  return json;
}
