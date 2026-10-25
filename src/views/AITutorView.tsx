import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  Globe,
  Gauge,
  BookOpen,
  ArrowDownCircle,
  AlertCircle,
} from "lucide-react";
import { AppDataStore, askAITutor } from "../services/api";

interface Message {
  id: string;
  sender: "student" | "tutor";
  text: string;
  mode?: "chat" | "hint" | "test";
  timestamp: string;
}

interface AITutorViewProps {
  data: AppDataStore;
  initialSubject?: string;
  initialTopic?: string;
}

export const AITutorView: React.FC<AITutorViewProps> = ({
  data,
  initialSubject,
  initialTopic,
}) => {
  const [selectedSubject, setSelectedSubject] = useState(
    initialSubject || data.subjects[0]?.name || "C Programming"
  );
  const [selectedTopic, setSelectedTopic] = useState(
    initialTopic || "Pointers & Dynamic Memory Allocation"
  );
  const [language, setLanguage] = useState<"English" | "Telugu" | "Bilingual">(
    data.profile.preferredLanguage || "English"
  );
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">(
    data.profile.explanationLevel || "Intermediate"
  );

  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-init",
      sender: "tutor",
      text: `Hello ${data.profile.name}! I am **LearnSmart AI**, your personal engineering tutor.\n\nI can break down complex topics step-by-step, generate intuitive analogies, guide you with **progressive hints**, or test your comprehension with quick follow-ups.\n\nI also support full **English**, **Telugu (తెలుగు)**, and **Bilingual** explanations. What concept would you like to master today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (mode: "chat" | "hint" | "test" = "chat") => {
    const promptToSend = inputPrompt.trim();
    if (!promptToSend && mode === "chat") return;

    let finalPrompt = promptToSend;
    if (!finalPrompt && mode === "hint") {
      finalPrompt = `Can you give me a progressive hint on the current problem in ${selectedTopic}?`;
    } else if (!finalPrompt && mode === "test") {
      finalPrompt = `Give me a short 1-question check to test my understanding of ${selectedTopic}.`;
    }

    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      sender: "student",
      text: finalPrompt,
      mode,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const history = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await askAITutor({
        message: finalPrompt,
        conversationHistory: history,
        subject: selectedSubject,
        topic: selectedTopic,
        language,
        level,
        mode,
      });

      const tutorMsg: Message = {
        id: `msg-tutor-${Date.now()}`,
        sender: "tutor",
        text: res.reply,
        mode: res.mode as any,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate AI response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `msg-init-${Date.now()}`,
        sender: "tutor",
        text: `Chat cleared. Ready for your next concept or problem! How can I assist you in ${selectedSubject}?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const quickStarters = [
    {
      title: "Pointers & Memory in C",
      subject: "C Programming",
      topic: "Pointers & Dynamic Memory Allocation",
      prompt: "Explain pointer dereferencing and why uninitialized pointers cause segmentation faults.",
    },
    {
      title: "Double Integrals Jacobian",
      subject: "Engineering Mathematics",
      topic: "Multiple Integrals: Double & Triple Integrals",
      prompt: "Why do we multiply by 'r' when converting dx dy to polar coordinates (r dr dθ)? Give an intuitive geometric derivation.",
    },
    {
      title: "Schrödinger Wave Equation",
      subject: "Engineering Physics",
      topic: "Quantum Mechanics & Schrödinger Wave Equation",
      prompt: "Explain the physical meaning of the wave function Ψ and probability density |Ψ|² in a 1D potential well.",
    },
    {
      title: "Telugu: C పాయింటర్లు",
      subject: "C Programming",
      topic: "Pointers & Dynamic Memory Allocation",
      prompt: "C ప్రోగ్రామింగ్‌లో పాయింటర్లు మరియు మెమరీ అలోకేషన్ (malloc, free) ఎలా పనిచేస్తాయో తెలుగులో సులభంగా వివరించండి.",
      lang: "Telugu" as const,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></span>
            <span>Interactive Learning</span>
            <span aria-hidden="true" className="text-[#293449]">·</span>
            <span>Gemini 3.8 Flash Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] mt-1">
            AI Personal Tutor
          </h1>
          <p className="text-sm text-[#B6C2D2] mt-1">
            Ask questions, request intuitive analogies, request progressive hints, or test your comprehension.
          </p>
        </div>

        <button
          onClick={clearChat}
          className="px-3 py-1.5 rounded-lg border border-[#293449] bg-[#172033] text-[#B6C2D2] hover:text-[#F8FAFC] hover:bg-[#111A2E] text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Tutor Config Bar: Subject, Language, Difficulty */}
      <div className="bg-[#172033] rounded-xl border border-[#293449] p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subject */}
        <div>
          <label className="block text-[11px] font-semibold text-[#B6C2D2] uppercase tracking-wider mb-1">
            Subject Focus
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
            className="w-full text-xs bg-[#111A2E] border border-[#293449] rounded-lg px-2.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
          >
            {data.subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div>
          <label className="block text-[11px] font-semibold text-[#B6C2D2] uppercase tracking-wider mb-1">
            Current Topic Context
          </label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full text-xs bg-[#111A2E] border border-[#293449] rounded-lg px-2.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] truncate transition-colors"
          >
            {data.subjects
              .find((s) => s.name === selectedSubject)
              ?.topics.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.score}%)
                </option>
              )) || <option value="General">General</option>}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-[11px] font-semibold text-[#B6C2D2] uppercase tracking-wider mb-1">
            Explanation Language
          </label>
          <div className="flex items-center gap-1 p-1 bg-[#111A2E] rounded-lg border border-[#293449]">
            {(["English", "Telugu", "Bilingual"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  language === l
                    ? "bg-[#8B5CF6] text-white shadow-xs glow-purple-sm"
                    : "text-[#B6C2D2] hover:text-[#F8FAFC]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <label className="block text-[11px] font-semibold text-[#B6C2D2] uppercase tracking-wider mb-1">
            Academic Depth Level
          </label>
          <div className="flex items-center gap-1 p-1 bg-[#111A2E] rounded-lg border border-[#293449]">
            {(["Beginner", "Intermediate", "Advanced"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  level === lvl
                    ? "bg-[#22D3EE] text-[#0B1020] font-bold shadow-xs shadow-[#22D3EE]/30"
                    : "text-[#B6C2D2] hover:text-[#F8FAFC]"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Concept Starters */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-[#22D3EE] uppercase tracking-wider">
          Suggested Academic Concept Prompts:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {quickStarters.map((starter, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedSubject(starter.subject);
                setSelectedTopic(starter.topic);
                if (starter.lang) setLanguage(starter.lang);
                setInputPrompt(starter.prompt);
              }}
              className="p-3 text-left bg-[#172033] hover:bg-[#111A2E] border border-[#293449] hover:border-[#8B5CF6]/50 rounded-xl transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center justify-between text-[11px] text-[#B6C2D2] mb-1">
                <span>{starter.subject}</span>
                <span className="text-[#22D3EE] group-hover:text-white font-semibold transition-colors">Use →</span>
              </div>
              <p className="text-xs font-bold text-[#F8FAFC] line-clamp-1">{starter.title}</p>
              <p className="text-[11px] text-[#B6C2D2]/80 line-clamp-2 mt-0.5 leading-relaxed">
                {starter.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-[#172033] rounded-2xl border border-[#293449] shadow-sm flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isStudent = msg.sender === "student";

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isStudent ? "ml-auto justify-end" : "mr-auto"}`}
              >
                {!isStudent && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6366f1] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm glow-purple-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`rounded-2xl p-4 text-sm leading-relaxed ${
                    isStudent
                      ? "bg-[#8B5CF6] text-white shadow-sm glow-purple-sm"
                      : "bg-[#111A2E] border border-[#293449] text-[#F8FAFC]"
                  }`}
                >
                  {/* Mode badge for hints/tests */}
                  {msg.mode === "hint" && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Guiding Hint (Step-by-Step Discovery)</span>
                    </div>
                  )}
                  {msg.mode === "test" && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#22D3EE] mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Comprehension Check Question</span>
                    </div>
                  )}

                  {/* Render content with formatted breaks / code */}
                  <div className="prose prose-sm max-w-none prose-invert space-y-2 whitespace-pre-wrap text-[#F8FAFC]">
                    {msg.text}
                  </div>

                  {/* Footer with time and copy */}
                  <div className="mt-3 pt-2 border-t border-[#293449] flex items-center justify-between text-[11px] text-[#B6C2D2]/70">
                    <span>{msg.timestamp}</span>
                    {!isStudent && (
                      <button
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="hover:text-[#22D3EE] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#22D3EE]" />
                            <span className="text-[#22D3EE]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-2xl mr-auto">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6366f1] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm glow-purple-sm">
                <Sparkles className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-[#111A2E] border border-[#293449] rounded-2xl p-4 text-xs text-[#B6C2D2] flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#22D3EE] animate-bounce"></span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#22D3EE] animate-bounce [animation-delay:0.2s]"></span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#22D3EE] animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-2 font-medium text-[#F8FAFC]">Formulating explanation with step-by-step logic...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Hint / Test Affordances */}
        <div className="p-4 border-t border-[#293449] bg-[#172033] rounded-b-2xl space-y-2">
          {/* Action pills: Hint mode & Test mode */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[#B6C2D2] text-[11px] shrink-0">Tutor Actions:</span>
            <button
              onClick={() => handleSendMessage("hint")}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-[#111A2E] hover:bg-[#8B5CF6]/20 text-[#c084fc] border border-[#8B5CF6]/40 font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Get a guiding hint without revealing the entire solution"
            >
              <Lightbulb className="w-3 h-3 text-[#c084fc]" />
              <span>Give me a Hint only</span>
            </button>
            <button
              onClick={() => handleSendMessage("test")}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-[#111A2E] hover:bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/40 font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Test your understanding with a follow-up question"
            >
              <CheckCircle2 className="w-3 h-3 text-[#22D3EE]" />
              <span>Test my Understanding</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage("chat");
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Ask a question about ${selectedTopic} in ${language}...`}
              disabled={isLoading}
              className="flex-1 text-xs sm:text-sm bg-[#111A2E] border border-[#293449] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all text-[#F8FAFC] placeholder:text-[#64748b]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] disabled:opacity-40 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm glow-purple-sm shrink-0 active:scale-95"
            >
              <span>Explain</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
