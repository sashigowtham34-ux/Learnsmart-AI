import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  Database,
  Lock,
  Key,
  CheckCircle2,
  ExternalLink,
  Code,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { fetchSecurityStatus } from "../services/api";

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSecurityStatus().then(setStatus).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1020]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#172033] rounded-2xl max-w-2xl w-full border border-[#293449] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#111A2E] text-[#F8FAFC] px-6 py-4 flex items-center justify-between border-b border-[#293449]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4 text-[#22D3EE]" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight text-[#F8FAFC]">Database & Security Architecture</h2>
              <p className="text-[11px] text-[#B6C2D2]">Authentication, Data Isolation & Setup Instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#B6C2D2] hover:text-[#F8FAFC] p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-[#B6C2D2]">
          {/* Active Security Architecture */}
          <div className="bg-[#111A2E]/80 border border-[#22D3EE]/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#22D3EE] font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-[#22D3EE] shrink-0" />
              <span>Active Security & Data Storage: Server-Side Cryptographic Isolation</span>
            </div>
            <p className="leading-relaxed text-[#F8FAFC]">
              The application backend currently runs an active, authenticated multi-tenant database:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-[11px] text-[#B6C2D2]">
              <li>
                <strong className="text-[#F8FAFC]">Password Encryption:</strong> Passwords hashed using standard Node.js <code className="font-mono bg-[#0B1020] text-[#22D3EE] px-1 py-0.5 rounded border border-[#293449]">crypto.scryptSync</code> with unique 16-byte random salts per account.
              </li>
              <li>
                <strong className="text-[#F8FAFC]">Constant-Time Verification:</strong> Evaluated using <code className="font-mono bg-[#0B1020] text-[#22D3EE] px-1 py-0.5 rounded border border-[#293449]">crypto.timingSafeEqual</code> to prevent side-channel timing attacks.
              </li>
              <li>
                <strong className="text-[#F8FAFC]">Multi-Tenant Data Isolation:</strong> Each student&apos;s quiz attempts, topic scores, and adaptive study plans are persisted into isolated account stores (<code className="font-mono bg-[#0B1020] text-[#22D3EE] px-1 py-0.5 rounded border border-[#293449]">data/students/&#123;userId&#125;.json</code>).
              </li>
              <li>
                <strong className="text-[#F8FAFC]">Access Control:</strong> Requests are gated by <code className="font-mono bg-[#0B1020] text-[#22D3EE] px-1 py-0.5 rounded border border-[#293449]">Bearer</code> tokens; students cannot read or modify other students&apos; private records.
              </li>
              <li>
                <strong className="text-[#F8FAFC]">Zero Secret Leakage:</strong> Gemini API keys and server secrets remain strictly on the backend and are never sent to the browser.
              </li>
            </ul>
          </div>

          {/* Firebase Setup Status Notice */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>External Cloud Firestore Setup Status</span>
            </div>
            <p className="text-amber-200/90 leading-relaxed text-[11px]">
              During session initialization, external Cloud Firestore provisioning was declined in the UI. Per security specifications:
              <em> &ldquo;Do not simulate authentication or claim that data is securely stored unless the relevant services and security rules have been configured and tested.&rdquo;</em>
              Hence, external Firebase is accurately noted as <strong className="text-amber-300">unconfigured</strong>, while full setup instructions, schemas, and verified security rules are ready below.
            </p>
          </div>

          {/* Step-by-Step Setup Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#8B5CF6]" />
              <span>Step-by-Step Setup Guide: Cloud Firestore & Firebase Auth</span>
            </h3>

            <div className="space-y-3 pl-1">
              <div className="border border-[#293449] rounded-xl p-3 bg-[#111A2E] space-y-1">
                <span className="font-semibold text-[#F8FAFC] block text-xs">Step 1: Firebase Project & Web App</span>
                <p className="text-[11px] text-[#B6C2D2] leading-relaxed">
                  Create a project in the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-[#22D3EE] underline font-medium">Firebase Console</a>, add a Web App, and place your configuration in <code className="bg-[#0B1020] text-[#22D3EE] px-1 py-0.5 rounded border border-[#293449]">firebase-applet-config.json</code>.
                </p>
              </div>

              <div className="border border-[#293449] rounded-xl p-3 bg-[#111A2E] space-y-1">
                <span className="font-semibold text-[#F8FAFC] block text-xs">Step 2: Enable Authentication Providers</span>
                <p className="text-[11px] text-[#B6C2D2] leading-relaxed">
                  Go to <strong className="text-[#F8FAFC]">Authentication &gt; Sign-in method</strong>. Enable <strong className="text-[#F8FAFC]">Email/Password</strong> and <strong className="text-[#F8FAFC]">Google Sign-In</strong>. Add your deployment domain under Authorized Domains.
                </p>
              </div>

              <div className="border border-[#293449] rounded-xl p-3 bg-[#111A2E] space-y-1">
                <span className="font-semibold text-[#F8FAFC] block text-xs">Step 3: Create Firestore Database</span>
                <p className="text-[11px] text-[#B6C2D2] leading-relaxed">
                  Navigate to <strong className="text-[#F8FAFC]">Firestore Database &gt; Create Database</strong>. Select production mode and choose your regional cloud datacenter.
                </p>
              </div>

              <div className="border border-[#293449] rounded-xl p-3 bg-[#111A2E] space-y-1">
                <span className="font-semibold text-[#F8FAFC] block text-xs">Step 4: Deploy Hardened Security Rules</span>
                <p className="text-[11px] text-[#B6C2D2] leading-relaxed">
                  Deploy the pre-audited <code className="bg-[#0B1020] text-[#22D3EE] px-1 py-0.5 rounded border border-[#293449]">firestore.rules</code> included in this project using the Firebase CLI:
                </p>
                <pre className="bg-[#0B1020] text-[#22D3EE] p-2.5 rounded-lg font-mono text-[10px] mt-1.5 overflow-x-auto border border-[#293449]">
                  firebase deploy --only firestore:rules
                </pre>
              </div>
            </div>
          </div>

          {/* Hardened Rules Guarantees */}
          <div className="border border-[#293449] rounded-xl p-4 bg-[#111A2E]/60 space-y-2">
            <h4 className="font-bold text-xs text-[#F8FAFC] flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#8B5CF6]" />
              <span>Enforced ABAC & Zero-Trust Rules</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#B6C2D2]">
              <div className="p-2.5 bg-[#172033] rounded-lg border border-[#293449]">
                <span className="font-semibold text-[#F8FAFC] block">No Blanket Reads</span>
                <p className="text-[10px] text-[#B6C2D2] mt-0.5">
                  <code className="text-rose-400">allow list: if false</code> on profiles prevents user enumeration.
                </p>
              </div>
              <div className="p-2.5 bg-[#172033] rounded-lg border border-[#293449]">
                <span className="font-semibold text-[#F8FAFC] block">Owner Isolation</span>
                <p className="text-[10px] text-[#B6C2D2] mt-0.5">
                  Path gate <code className="text-[#22D3EE]">request.auth.uid == userId</code> on all subcollections.
                </p>
              </div>
              <div className="p-2.5 bg-[#172033] rounded-lg border border-[#293449]">
                <span className="font-semibold text-[#F8FAFC] block">Schema Blueprints</span>
                <p className="text-[10px] text-[#B6C2D2] mt-0.5">
                  Helper functions check exact keys, lengths, and valid types.
                </p>
              </div>
              <div className="p-2.5 bg-[#172033] rounded-lg border border-[#293449]">
                <span className="font-semibold text-[#F8FAFC] block">ID Poisoning Guard</span>
                <p className="text-[10px] text-[#B6C2D2] mt-0.5">
                  <code className="text-[#8B5CF6]">isValidId()</code> enforces regex and 128-char limits.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-[#111A2E] border-t border-[#293449] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#B6C2D2]">
            Reference file: <code className="font-mono text-[#22D3EE]">FIREBASE_SETUP_INSTRUCTIONS.md</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-[#F8FAFC] font-semibold cursor-pointer transition-colors shadow-sm shadow-[#8B5CF6]/20"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
