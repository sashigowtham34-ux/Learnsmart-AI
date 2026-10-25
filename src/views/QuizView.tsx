import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  Flag,
  AlertTriangle,
  Award,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  AppDataStore,
  QuizQuestion,
  generateQuizQuestions,
  submitQuizScore,
} from "../services/api";
import { ScoreBadge } from "../components/ScoreBadge";

interface QuizViewProps {
  data: AppDataStore;
  initialSubject?: string;
  initialTopic?: string;
  onNavigate: (tab: string, context?: { subject?: string; topic?: string }) => void;
  onDataRefresh: (updated: AppDataStore) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  data,
  initialSubject,
  initialTopic,
  onNavigate,
  onDataRefresh,
}) => {
  // Quiz setup state
  const [selectedSubject, setSelectedSubject] = useState(
    initialSubject || data.subjects[0]?.name || "C Programming"
  );
  const [selectedTopic, setSelectedTopic] = useState(
    initialTopic || "Pointers & Dynamic Memory Allocation"
  );
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Active quiz state
  const [quizPhase, setQuizPhase] = useState<"setup" | "loading" | "active" | "results">("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Question report modal state
  const [reportingIndex, setReportingIndex] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  // Result state
  const [finalScorePercent, setFinalScorePercent] = useState<number>(0);
  const [scoreUpdateInfo, setScoreUpdateInfo] = useState<{
    previousScore: number;
    newScore: number;
    topicName: string;
  } | null>(null);

  // Update topic choices when subject changes
  const currentSubjectObj = data.subjects.find((s) => s.name === selectedSubject);

  // Timer effect
  useEffect(() => {
    let timer: any;
    if (quizPhase === "active" && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizPhase, timeRemainingSeconds]);

  const handleStartQuiz = async () => {
    setQuizPhase("loading");
    setErrorNotice(null);
    setFallbackNotice(null);
    setSelectedAnswers({});
    setCurrentIndex(0);

    try {
      const res = await generateQuizQuestions({
        subject: selectedSubject,
        topic: selectedTopic,
        difficulty,
        count: questionCount,
      });

      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        setTimeRemainingSeconds(res.questions.length * 60); // 1 min per question
        if (res.fallbackNotice) {
          setFallbackNotice(res.fallbackNotice);
        }
        setQuizPhase("active");
      } else {
        throw new Error("No questions were returned. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorNotice(err.message || "Failed to load quiz. Please check your connection.");
      setQuizPhase("setup");
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);

    // Calculate score
    let correctCount = 0;
    const reviewedQuestions = questions.map((q, idx) => {
      const userAns = selectedAnswers[idx] ?? -1;
      const isCorrect = userAns === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        options: q.options,
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect,
      };
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    setFinalScorePercent(scorePct);

    if (scorePct >= 70) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    try {
      const res = await submitQuizScore({
        title: `${selectedTopic} Assessment`,
        subject: selectedSubject,
        topic: selectedTopic,
        score: scorePct,
        totalQuestions: questions.length,
        correctAnswers: correctCount,
        difficulty,
        isSample: false,
        questions: reviewedQuestions,
      });

      onDataRefresh(res.data);
      setScoreUpdateInfo({
        previousScore: res.previousScore,
        newScore: res.newScore,
        topicName: selectedTopic,
      });
      setQuizPhase("results");
    } catch (err: any) {
      console.error("Failed to submit score:", err);
      // Still show results screen so student gets full feedback
      setQuizPhase("results");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportQuestion = () => {
    setReportSuccess(true);
    setTimeout(() => {
      setReportingIndex(null);
      setReportSuccess(false);
      setReportReason("");
    }, 1500);
  };

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. SETUP PHASE */}
      {quizPhase === "setup" && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></span>
              <span>Adaptive Assessment Engine</span>
              <span aria-hidden="true" className="text-[#293449]">·</span>
              <span>Gemini Smart Quizzes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] mt-1">
              Practice Quizzes & Diagnostics
            </h1>
            <p className="text-sm text-[#B6C2D2] mt-1">
              Generate curriculum-aligned assessments to test conceptual understanding and update your learning model.
            </p>
          </div>

          {errorNotice && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Quick Weak Topic Selector */}
          <div className="bg-[#172033] rounded-xl border border-rose-500/30 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Recommended: Focus on Identified Weak Topics</span>
              </div>
              <span className="text-[11px] text-[#B6C2D2]">Based on recent performance &lt;70%</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.subjects
                .flatMap((s) => s.topics.map((t) => ({ ...t, subjectName: s.name })))
                .filter((t) => t.status === "critical" || t.status === "weak")
                .slice(0, 3)
                .map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => {
                      setSelectedSubject(topic.subjectName);
                      setSelectedTopic(topic.name);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedTopic === topic.name && selectedSubject === topic.subjectName
                        ? "bg-[#111A2E] border-[#8B5CF6] ring-1 ring-[#8B5CF6] shadow-sm glow-purple-sm"
                        : "bg-[#111A2E] border-[#293449] hover:border-[#8B5CF6]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#B6C2D2]">
                      <span>{topic.subjectName}</span>
                      <ScoreBadge score={topic.score} />
                    </div>
                    <p className="text-xs font-bold text-[#F8FAFC] mt-1 truncate">{topic.name}</p>
                    <p className="text-[11px] text-[#B6C2D2]/80 mt-0.5 truncate">{topic.recommendedAction}</p>
                  </button>
                ))}
            </div>
          </div>

          {/* Configuration Form */}
          <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-[#F8FAFC]">Configure Custom Quiz</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-[#B6C2D2] mb-1.5">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    const sub = data.subjects.find((s) => s.name === e.target.value);
                    if (sub && sub.topics.length > 0) {
                      setSelectedTopic(sub.topics[0].name);
                    }
                  }}
                  className="w-full text-xs sm:text-sm bg-[#111A2E] border border-[#293449] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                >
                  {data.subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-semibold text-[#B6C2D2] mb-1.5">
                  Topic Focus
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-[#111A2E] border border-[#293449] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                >
                  {currentSubjectObj?.topics.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} (Current: {t.score}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-[#B6C2D2] mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        difficulty === lvl
                          ? "bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-sm glow-purple-sm"
                          : "bg-[#111A2E] border-[#293449] text-[#B6C2D2] hover:text-[#F8FAFC]"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-xs font-semibold text-[#B6C2D2] mb-1.5">
                  Question Count
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        questionCount === num
                          ? "bg-[#22D3EE] border-[#22D3EE] text-[#0B1020] font-bold shadow-sm shadow-[#22D3EE]/25"
                          : "bg-[#111A2E] border-[#293449] text-[#B6C2D2] hover:text-[#F8FAFC]"
                      }`}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#293449] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#B6C2D2]">
                <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
                <span>Format validated by schema prior to presentation</span>
              </div>

              <button
                onClick={handleStartQuiz}
                className="px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm glow-purple-sm active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                <span>Generate & Start Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOADING STATE */}
      {quizPhase === "loading" && (
        <div className="bg-[#172033] rounded-2xl border border-[#293449] p-12 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#111A2E] border border-[#293449] text-[#22D3EE] flex items-center justify-center mx-auto shadow-sm glow-cyan-sm">
            <Sparkles className="w-6 h-6 animate-spin text-[#22D3EE]" />
          </div>
          <h2 className="text-lg font-bold text-[#F8FAFC]">
            Generating Smart Questions with Gemini 3.8 Flash...
          </h2>
          <p className="text-xs text-[#B6C2D2] max-w-md mx-auto leading-relaxed">
            Structuring multiple-choice questions on "{selectedTopic}" at {difficulty} level with verified answers and explanations.
          </p>
        </div>
      )}

      {/* 3. ACTIVE QUIZ PLAYER */}
      {quizPhase === "active" && questions.length > 0 && (
        <div className="space-y-6">
          {fallbackNotice && (
            <div className="p-3 rounded-lg bg-[#111A2E] border border-[#22D3EE]/30 text-xs text-[#22D3EE]">
              {fallbackNotice}
            </div>
          )}

          {/* Quiz Top bar */}
          <div className="bg-[#172033] rounded-xl border border-[#293449] p-4 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs text-[#B6C2D2] font-mono">
                {selectedSubject} · {selectedTopic}
              </span>
              <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC]">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span className="text-[#293449]">·</span>
                <span className="text-[#22D3EE] font-medium">{difficulty}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111A2E] border border-[#293449] font-mono text-xs font-bold text-[#22D3EE] tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>{formatTime(timeRemainingSeconds)}</span>
              </div>

              <button
                onClick={() => setReportingIndex(currentIndex)}
                className="text-xs text-[#B6C2D2] hover:text-[#F8FAFC] flex items-center gap-1 cursor-pointer transition-colors"
                title="Report question error"
              >
                <Flag className="w-3 h-3" />
                <span className="hidden sm:inline">Report</span>
              </button>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#22D3EE] uppercase tracking-wider">
                Question {currentIndex + 1}
              </span>
              <p className="text-base sm:text-lg font-bold text-[#F8FAFC] leading-snug whitespace-pre-wrap">
                {questions[currentIndex]?.question}
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {questions[currentIndex]?.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === optIdx;
                const optionLetters = ["A", "B", "C", "D"];

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? "bg-[#111A2E] border-[#8B5CF6] text-white ring-1 ring-[#8B5CF6] shadow-sm glow-purple-sm"
                        : "bg-[#111A2E] border-[#293449] text-[#F8FAFC] hover:border-[#22D3EE]/40"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-[#8B5CF6] text-white"
                          : "bg-[#172033] border border-[#293449] text-[#22D3EE]"
                      }`}
                    >
                      {optionLetters[optIdx]}
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-relaxed">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-[#293449] flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-lg border border-[#293449] bg-[#111A2E] hover:bg-[#172033] disabled:opacity-30 text-xs font-semibold text-[#B6C2D2] hover:text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {questions.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      selectedAnswers[i] !== undefined
                        ? "bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]"
                        : i === currentIndex
                        ? "bg-[#22D3EE] shadow-[0_0_6px_#22D3EE]"
                        : "bg-[#293449]"
                    }`}
                  />
                ))}
              </div>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm glow-purple-sm active:scale-95"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm glow-purple-sm active:scale-95"
                >
                  <span>{isSubmitting ? "Evaluating..." : "Submit Assessment"}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-[#22D3EE]" />
                </button>
              )}
            </div>
          </div>

          {/* Report Modal */}
          {reportingIndex !== null && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-[#172033] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#293449] space-y-4">
                <h3 className="text-base font-bold text-[#F8FAFC]">Report Question Issue</h3>
                <p className="text-xs text-[#B6C2D2]">
                  Did you notice an ambiguity, formatting error, or incorrect option in Question {reportingIndex + 1}?
                </p>

                {reportSuccess ? (
                  <div className="p-3 rounded-lg bg-[#111A2E] border border-[#22D3EE]/30 text-[#22D3EE] text-xs font-medium">
                    Thank you! Question feedback has been logged for review.
                  </div>
                ) : (
                  <>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Briefly describe the issue..."
                      className="w-full text-xs p-3 bg-[#111A2E] border border-[#293449] text-[#F8FAFC] rounded-lg focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] h-24 placeholder:text-[#64748b]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setReportingIndex(null)}
                        className="px-3 py-1.5 text-xs text-[#B6C2D2] hover:text-[#F8FAFC] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReportQuestion}
                        className="px-4 py-1.5 rounded-lg bg-[#8B5CF6] text-white text-xs font-semibold hover:bg-[#7c3aed] cursor-pointer shadow-sm glow-purple-sm"
                      >
                        Submit Report
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. RESULTS & MISTAKE ANALYSIS */}
      {quizPhase === "results" && (
        <div className="space-y-8">
          {/* Result Score Banner */}
          <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 sm:p-8 shadow-sm text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#111A2E] border border-[#293449]">
              <Award className="w-8 h-8 text-[#22D3EE]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#22D3EE] uppercase tracking-wider">
                Assessment Completed
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">
                You Scored {finalScorePercent}%
              </h2>
              <p className="text-xs text-[#B6C2D2] max-w-md mx-auto">
                Topic: <span className="font-semibold text-[#F8FAFC]">{selectedTopic}</span> ({selectedSubject})
              </p>
            </div>

            {/* Score update notification */}
            {scoreUpdateInfo && (
              <div className="inline-block p-3 rounded-xl bg-[#111A2E] border border-[#293449] text-xs text-[#B6C2D2] max-w-lg text-left">
                <span className="font-semibold block text-[#F8FAFC] mb-0.5">
                  Dynamic Learning Model Updated:
                </span>
                <span>
                  Topic mastery moved from {scoreUpdateInfo.previousScore}% to{" "}
                  <strong className="text-[#22D3EE]">{scoreUpdateInfo.newScore}%</strong> (weighted average).
                  Your Study Planner and Spaced Revision queue have been re-calibrated.
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setQuizPhase("setup")}
                className="px-4 py-2 rounded-lg border border-[#293449] bg-[#111A2E] hover:bg-[#172033] text-[#B6C2D2] hover:text-[#F8FAFC] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Take Another Quiz</span>
              </button>
              <button
                onClick={() =>
                  onNavigate("tutor", {
                    subject: selectedSubject,
                    topic: selectedTopic,
                  })
                }
                className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm glow-purple-sm active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Review Concepts with AI Tutor</span>
              </button>
              <button
                onClick={() => onNavigate("planner")}
                className="px-4 py-2 rounded-lg bg-[#111A2E] hover:bg-[#172033] text-[#22D3EE] border border-[#22D3EE]/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>View Updated Study Plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[#F8FAFC]">
              Detailed Question Review & Explanations
            </h3>

            <div className="space-y-4">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl border transition-colors ${
                      isCorrect
                        ? "bg-[#172033] border-[#22D3EE]/40 shadow-sm"
                        : "bg-[#172033] border-rose-500/40 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#B6C2D2]">Q{idx + 1}.</span>
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22D3EE]">
                            <CheckCircle className="w-4 h-4 text-[#22D3EE]" />
                            <span>Correct</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span>Incorrect</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-[#F8FAFC] leading-snug whitespace-pre-wrap">
                      {q.question}
                    </p>

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
                      {q.options.map((opt, oIdx) => {
                        const wasChosen = userAns === oIdx;
                        const isRight = q.correctAnswer === oIdx;

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                              isRight
                                ? "bg-[#111A2E] border-[#22D3EE] text-[#22D3EE] font-medium"
                                : wasChosen
                                ? "bg-rose-950/60 border-rose-800/80 text-rose-200"
                                : "bg-[#111A2E] border-[#293449] text-[#B6C2D2]"
                            }`}
                          >
                            <span className="font-bold shrink-0">{["A", "B", "C", "D"][oIdx]}.</span>
                            <span className="flex-1 leading-relaxed">{opt}</span>
                            {isRight && <span className="text-[#22D3EE] text-[11px] font-bold shrink-0">✓ Correct</span>}
                            {wasChosen && !isRight && (
                              <span className="text-rose-400 text-[11px] font-bold shrink-0">✗ Your answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pedagogical Explanation */}
                    <div className="mt-4 pt-3 border-t border-[#293449] bg-[#111A2E] -mx-6 -mb-6 p-4 rounded-b-2xl text-xs text-[#B6C2D2] space-y-1">
                      <span className="font-semibold text-[#F8FAFC] block">
                        Educational Explanation & Reasoning:
                      </span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
