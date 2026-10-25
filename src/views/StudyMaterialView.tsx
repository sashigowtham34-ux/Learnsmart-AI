import React, { useState } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  BookOpen,
  Layers,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  FileCode,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { analyzeStudyMaterial } from "../services/api";

interface Flashcard {
  front: string;
  back: string;
  topic?: string;
}

export const StudyMaterialView: React.FC = () => {
  const [documentTitle, setDocumentTitle] = useState("Unit 2: C Pointers, Dynamic Memory & Structs");
  const [documentContent, setDocumentContent] = useState(
    `UNIT 2: POINTERS AND DYNAMIC MEMORY ALLOCATION IN C
1. Introduction to Pointers:
A pointer is a variable whose value is the address of another variable. Direct memory access is achieved using the address-of operator (&) and dereference/indirection operator (*).
Example:
  int x = 10;
  int *ptr = &x; // ptr holds the address of x
  *ptr = 20;     // modifies x through dereference

2. Pointer Arithmetic:
When an integer is added to a pointer (ptr + 1), the pointer advances by sizeof(*ptr) bytes, not 1 byte.
For arrays, the array name 'arr' decays to a pointer to its first element (&arr[0]).
Thus, arr[i] is semantically identical to *(arr + i).

3. Dynamic Memory Allocation Functions (stdlib.h):
- malloc(size): Allocates raw uninitialized memory block of 'size' bytes from the heap. If allocation fails, returns NULL. Must check for NULL before dereferencing.
- calloc(num, size): Allocates (num * size) bytes and initializes every bit to zero.
- realloc(ptr, new_size): Resizes previously allocated heap block, preserving existing data up to minimum of old and new sizes.
- free(ptr): Releases allocated memory block back to heap. Failure to call free() causes a Memory Leak. Accessing ptr after free() creates a Dangling Pointer with undefined behavior.

4. Common Pitfalls and Vulnerabilities:
- Uninitialized / Wild Pointer: Dereferencing ptr without assignment causes SIGSEGV (Segmentation Fault).
- Memory Leak: Allocating memory without freeing before losing the pointer handle.
- Double Free: Calling free(ptr) twice on the same pointer crashes the runtime allocator.
- Buffer Overflow: Writing beyond malloc'd boundary corrupts heap management metadata.`
  );

  const [selectedAction, setSelectedAction] = useState<"summary" | "notes" | "flashcards" | "concepts" | "quiz">("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results
  const [analysisOutput, setAnalysisOutput] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Record<number, boolean>>({});

  // Preloaded curriculum notes
  const sampleNotes = [
    {
      title: "Unit 2: C Pointers, Dynamic Memory & Structs",
      subject: "C Programming",
      content: `UNIT 2: POINTERS AND DYNAMIC MEMORY ALLOCATION IN C
1. Introduction to Pointers:
A pointer is a variable whose value is the address of another variable. Direct memory access is achieved using the address-of operator (&) and dereference/indirection operator (*).
Example:
  int x = 10;
  int *ptr = &x; // ptr holds the address of x
  *ptr = 20;     // modifies x through dereference

2. Pointer Arithmetic:
When an integer is added to a pointer (ptr + 1), the pointer advances by sizeof(*ptr) bytes, not 1 byte.
For arrays, the array name 'arr' decays to a pointer to its first element (&arr[0]).
Thus, arr[i] is semantically identical to *(arr + i).

3. Dynamic Memory Allocation Functions (stdlib.h):
- malloc(size): Allocates raw uninitialized memory block of 'size' bytes from the heap. If allocation fails, returns NULL. Must check for NULL before dereferencing.
- calloc(num, size): Allocates (num * size) bytes and initializes every bit to zero.
- realloc(ptr, new_size): Resizes previously allocated heap block, preserving existing data up to minimum of old and new sizes.
- free(ptr): Releases allocated memory block back to heap. Failure to call free() causes a Memory Leak. Accessing ptr after free() creates a Dangling Pointer with undefined behavior.

4. Common Pitfalls and Vulnerabilities:
- Uninitialized / Wild Pointer: Dereferencing ptr without assignment causes SIGSEGV (Segmentation Fault).
- Memory Leak: Allocating memory without freeing before losing the pointer handle.
- Double Free: Calling free(ptr) twice on the same pointer crashes the runtime allocator.
- Buffer Overflow: Writing beyond malloc'd boundary corrupts heap management metadata.`,
    },
    {
      title: "Unit 3: Multiple Integrals & Polar Transformations",
      subject: "Engineering Mathematics",
      content: `UNIT 3: MULTIPLE INTEGRALS & COORDINATE TRANSFORMATIONS
1. Double Integrals over Planar Regions:
∬_R f(x, y) dA represents the volume under z = f(x, y) over region R.
If f(x, y) = 1, then ∬_R 1 dA calculates the planar Area of region R.

2. Change of Variables and the Jacobian:
When transforming from (x, y) to (u, v):
  ∬_R f(x, y) dx dy = ∬_S f(x(u,v), y(u,v)) |J| du dv
where the Jacobian determinant J is:
  J = ∂(x, y)/∂(u, v) = (∂x/∂u * ∂y/∂v) - (∂x/∂v * ∂y/∂u).

3. Polar Coordinates (r, θ):
x = r cos θ, y = r sin θ.
Jacobian determinant:
  |J| = r.
Hence, the differential area element becomes:
  dx dy = r dr dθ.
Always include the extra 'r' factor when integrating in polar coordinates!

4. Fubini's Theorem:
If f(x, y) is continuous on a closed rectangular region [a, b] × [c, d], the iterated integrals are equal:
  ∫_a^b ∫_c^d f(x, y) dy dx = ∫_c^d ∫_a^b f(x, y) dx dy.
For non-rectangular regions, reversing order of integration requires sketching the bounding curves and re-evaluating variable limits.`,
    },
    {
      title: "Unit 4: Quantum Mechanics & Schrödinger Wave Equations",
      subject: "Engineering Physics",
      content: `UNIT 4: QUANTUM MECHANICS & WAVE-PARTICLE DUALITY
1. De Broglie Hypothesis:
Matter exhibits wave-like properties with de Broglie wavelength:
  λ = h / p = h / (m * v)
where h is Planck's constant (6.626 × 10^-34 J·s) and p is momentum.

2. Born Interpretation of Wavefunction Ψ:
The complex wave function Ψ(x, t) contains all knowable information about a quantum system.
Physical significance:
  P(x, t) = |Ψ(x, t)|² = Ψ* Ψ
represents the probability density of finding the particle at position x at time t.
Normalization condition:
  ∫_{-∞}^{∞} |Ψ|² dx = 1 (the particle must exist somewhere in the universe).

3. Time-Independent Schrödinger Equation (1-D):
  (-ħ² / 2m) * (d²Ψ/dx²) + V(x)Ψ = EΨ
where ħ = h / 2π, m is mass, V(x) is potential energy, and E is total energy.

4. Particle in a 1-D Infinite Potential Well (Width L):
Potential: V(x) = 0 for 0 < x < L, and V(x) = ∞ elsewhere.
Boundary conditions: Ψ(0) = 0, Ψ(L) = 0.
Allowed wavefunctions:
  Ψ_n(x) = √(2/L) * sin(nπx / L)
Quantized Energy levels:
  E_n = (n² h²) / (8 m L²), for quantum numbers n = 1, 2, 3...
Note: Zero-point energy (n = 1) is non-zero: E_1 = h² / (8mL²). A quantum particle can never be at absolute rest in a confined box (Heisenberg uncertainty principle).`,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size exceeds 10MB limit. Please upload a smaller study document.");
      return;
    }

    setErrorMessage(null);
    setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setDocumentContent(text);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Could not read file. Supported formats: .txt, .md, plain text notes.");
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async (action: "summary" | "notes" | "flashcards" | "concepts" | "quiz") => {
    setSelectedAction(action);
    setIsLoading(true);
    setErrorMessage(null);
    setAnalysisOutput(null);
    setFlashcards([]);
    setActiveCardIndex(0);
    setIsFlipped(false);

    try {
      const res = await analyzeStudyMaterial({
        title: documentTitle,
        content: documentContent,
        action,
      });

      if (action === "flashcards" && res.flashcards) {
        setFlashcards(res.flashcards);
      } else {
        setAnalysisOutput(res.output || "No analysis could be generated.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze study material.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-[#22D3EE] font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></span>
          <span>Document Intelligence</span>
          <span aria-hidden="true" className="text-[#293449]">·</span>
          <span>Grounded Gemini Analysis</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC] mt-1">
          AI Study Material Assistant
        </h1>
        <p className="text-sm text-[#B6C2D2] mt-1">
          Extract high-yield revision summaries, interactive flashcards, and conceptual quizzes strictly grounded in your lecture notes or syllabus documents.
        </p>
      </div>

      {/* Preloaded Samples Bar */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-[#22D3EE] uppercase tracking-wider">
          Quick-Load First-Year Engineering Study Notes:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sampleNotes.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDocumentTitle(sample.title);
                setDocumentContent(sample.content);
                setAnalysisOutput(null);
                setFlashcards([]);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                documentTitle === sample.title
                  ? "bg-[#111A2E] border-[#8B5CF6] ring-1 ring-[#8B5CF6] shadow-sm glow-purple-sm"
                  : "bg-[#172033] border-[#293449] hover:border-[#8B5CF6]/50"
              }`}
            >
              <span className="text-[11px] font-mono text-[#22D3EE] block">{sample.subject}</span>
              <p className="text-xs font-bold text-[#F8FAFC] mt-0.5 line-clamp-1">{sample.title}</p>
              <p className="text-[11px] text-[#B6C2D2] mt-1 line-clamp-2 leading-relaxed">
                {sample.content.substring(0, 100)}...
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Upload and Document Editor Split */}
      <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#B6C2D2]">
              Document Name / Topic
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="text-sm font-bold text-[#F8FAFC] bg-[#111A2E] border border-[#293449] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] w-full sm:w-96"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="px-3.5 py-2 rounded-lg border border-[#293449] bg-[#111A2E] hover:border-[#22D3EE]/50 text-[#22D3EE] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Upload File (.txt, .md, .pdf)</span>
              <input
                type="file"
                accept=".txt,.md,.pdf,text/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-[#B6C2D2]/70">Max 10MB</span>
          </div>
        </div>

        {/* Text Area */}
        <div>
          <label className="block text-[11px] font-semibold text-[#B6C2D2] uppercase tracking-wider mb-1">
            Document Content / Extracted Text ({documentContent.length} chars)
          </label>
          <textarea
            value={documentContent}
            onChange={(e) => setDocumentContent(e.target.value)}
            rows={8}
            placeholder="Paste your lecture notes, textbook excerpts, or syllabus text here..."
            className="w-full text-xs font-mono p-4 bg-[#111A2E] border border-[#293449] rounded-xl text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#B6C2D2] mr-2 font-medium">Generate AI Tool:</span>

          <button
            onClick={() => handleAnalyze("summary")}
            disabled={isLoading}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedAction === "summary" && !flashcards.length && analysisOutput
                ? "bg-[#8B5CF6] text-white shadow-sm glow-purple-sm"
                : "bg-[#111A2E] hover:bg-[#111A2E]/80 border border-[#293449] text-[#B6C2D2] hover:text-[#F8FAFC]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Executive Summary</span>
          </button>

          <button
            onClick={() => handleAnalyze("flashcards")}
            disabled={isLoading}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedAction === "flashcards" && flashcards.length > 0
                ? "bg-[#8B5CF6] text-white shadow-sm glow-purple-sm"
                : "bg-[#111A2E] hover:bg-[#111A2E]/80 border border-[#293449] text-[#B6C2D2] hover:text-[#F8FAFC]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Flashcards</span>
          </button>

          <button
            onClick={() => handleAnalyze("notes")}
            disabled={isLoading}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedAction === "notes"
                ? "bg-[#8B5CF6] text-white shadow-sm glow-purple-sm"
                : "bg-[#111A2E] hover:bg-[#111A2E]/80 border border-[#293449] text-[#B6C2D2] hover:text-[#F8FAFC]"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Revision Notes</span>
          </button>

          <button
            onClick={() => handleAnalyze("concepts")}
            disabled={isLoading}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedAction === "concepts"
                ? "bg-[#8B5CF6] text-white shadow-sm glow-purple-sm"
                : "bg-[#111A2E] hover:bg-[#111A2E]/80 border border-[#293449] text-[#B6C2D2] hover:text-[#F8FAFC]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span>Key Concepts & Formulas</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-[#172033] rounded-2xl border border-[#293449] p-8 text-center space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#111A2E] border border-[#293449] text-[#22D3EE] flex items-center justify-center mx-auto glow-cyan-sm">
            <Sparkles className="w-5 h-5 animate-spin text-[#22D3EE]" />
          </div>
          <h3 className="text-sm font-bold text-[#F8FAFC]">
            Grounding analysis in "{documentTitle}"...
          </h3>
          <p className="text-xs text-[#B6C2D2]">
            Extracting core academic relationships, definitions, and high-yield notes.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* FLASHCARDS DISPLAY */}
      {flashcards.length > 0 && !isLoading && (
        <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#22D3EE]">
              <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
              <span>Grounded in Uploaded Material</span>
              <span className="text-[#293449]">·</span>
              <span className="text-[#B6C2D2]">
                Card {activeCardIndex + 1} of {flashcards.length}
              </span>
            </div>

            <div className="text-xs text-[#B6C2D2]">
              Mastered:{" "}
              <strong className="text-[#22D3EE]">
                {Object.values(masteredCards).filter(Boolean).length}
              </strong>{" "}
              / {flashcards.length}
            </div>
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-xl mx-auto h-64 rounded-2xl border border-[#293449] bg-gradient-to-br from-[#111A2E] via-[#172033] to-[#111A2E] p-8 flex flex-col justify-between cursor-pointer shadow-sm hover:border-[#8B5CF6]/50 transition-all select-none glow-purple-sm"
          >
            <div className="flex items-center justify-between text-xs text-[#B6C2D2]">
              <span className="font-semibold uppercase tracking-wider">
                {isFlipped ? "Answer / Explanation" : "Concept Question (Click to flip)"}
              </span>
              <span className="text-[11px] text-[#22D3EE] font-medium">Click to flip ↷</span>
            </div>

            <div className="text-center my-auto px-4">
              <p
                className={`text-base sm:text-lg font-bold leading-relaxed ${
                  isFlipped ? "text-[#22D3EE] font-normal" : "text-[#F8FAFC]"
                }`}
              >
                {isFlipped
                  ? flashcards[activeCardIndex]?.back
                  : flashcards[activeCardIndex]?.front}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#B6C2D2]/70">
              <span>{flashcards[activeCardIndex]?.topic || documentTitle}</span>
              <span>{isFlipped ? "Verified from text" : "Click card to test recall"}</span>
            </div>
          </div>

          {/* Flashcard navigation & mastery buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setActiveCardIndex((prev) => Math.max(0, prev - 1));
                setIsFlipped(false);
              }}
              disabled={activeCardIndex === 0}
              className="px-4 py-2 rounded-lg border border-[#293449] bg-[#111A2E] text-xs font-semibold text-[#B6C2D2] hover:text-[#F8FAFC] disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>

            <button
              onClick={() => {
                setMasteredCards((prev) => ({
                  ...prev,
                  [activeCardIndex]: !prev[activeCardIndex],
                }));
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                masteredCards[activeCardIndex]
                  ? "bg-[#111A2E] border-[#22D3EE] text-[#22D3EE]"
                  : "bg-[#111A2E] border-[#293449] text-[#B6C2D2] hover:border-[#8B5CF6]/50"
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>{masteredCards[activeCardIndex] ? "Mastered" : "Mark Mastered"}</span>
            </button>

            <button
              onClick={() => {
                setActiveCardIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                setIsFlipped(false);
              }}
              disabled={activeCardIndex === flashcards.length - 1}
              className="px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-semibold disabled:opacity-30 cursor-pointer shadow-sm glow-purple-sm active:scale-95"
            >
              Next Card
            </button>
          </div>
        </div>
      )}

      {/* TEXT ANALYSIS OUTPUT (Summary, Notes, Concepts) */}
      {analysisOutput && !isLoading && (
        <div className="bg-[#172033] rounded-2xl border border-[#293449] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#293449]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#22D3EE]">
              <ShieldCheck className="w-4 h-4 text-[#22D3EE]" />
              <span>Grounded strictly in uploaded document: "{documentTitle}"</span>
            </div>
            <span className="text-xs text-[#B6C2D2] capitalize">{selectedAction} generated</span>
          </div>

          <div className="prose prose-sm max-w-none prose-invert text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">
            {analysisOutput}
          </div>
        </div>
      )}
    </div>
  );
};
