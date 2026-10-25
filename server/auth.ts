import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  hash: string;
  salt: string;
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

export interface UserSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

// Session lifetime: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthManager {
  private users: Map<string, UserAccount> = new Map();
  private sessions: Map<string, UserSession> = new Map();

  constructor() {
    this.ensureDir();
    this.loadUsers();
    this.loadSessions();
    this.ensureDemoUser();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error("Failed to create data directory:", err);
      }
    }
  }

  private loadUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, "utf-8");
        const list: UserAccount[] = JSON.parse(raw);
        for (const u of list) {
          this.users.set(u.id, u);
        }
      }
    } catch (err) {
      console.warn("Failed to read users file:", err);
    }
  }

  private saveUsers() {
    try {
      this.ensureDir();
      const list = Array.from(this.users.values());
      fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write users file:", err);
    }
  }

  private loadSessions() {
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
        const list: UserSession[] = JSON.parse(raw);
        const now = Date.now();
        for (const s of list) {
          if (new Date(s.expiresAt).getTime() > now) {
            this.sessions.set(s.token, s);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to read sessions file:", err);
    }
  }

  private saveSessions() {
    try {
      this.ensureDir();
      const list = Array.from(this.sessions.values());
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write sessions file:", err);
    }
  }

  // Pre-seed demo student "Rahul Sharma" for seamless evaluation
  public ensureDemoUser() {
    const demoEmail = "rahul.sharma@engg.edu";
    const demoId = "demo-student-rahul";

    if (!this.users.has(demoId)) {
      const { hash, salt } = this.hashPassword("DemoStudent@2026");
      const demoUser: UserAccount = {
        id: demoId,
        name: "Rahul Sharma",
        email: demoEmail.toLowerCase(),
        hash,
        salt,
        course: "B.Tech Computer Science & Engineering",
        college: "JNTU Institute of Engineering & Technology",
        semester: "Semester 1",
        rollNumber: "24CSE108",
        department: "Computer Science & Engineering",
        academicYear: "1st Year",
        avatarUrl: "",
        bio: "First-year engineering student targeting foundational mastery in C programming and discrete mathematics.",
        targetScoreOrRank: "Target 9.0+ CGPA",
        createdAt: "2026-09-01T00:00:00.000Z",
      };
      this.users.set(demoId, demoUser);
      this.saveUsers();
    }
  }

  // Cryptographic password hashing using scrypt with 16-byte random salt
  public hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return { hash, salt };
  }

  public verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const verifyHash = crypto.scryptSync(password, salt, 64).toString("hex");
      return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verifyHash, "hex"));
    } catch {
      return false;
    }
  }

  public register(params: {
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
  }): { user: Omit<UserAccount, "hash" | "salt">; token: string } {
    const email = params.email.trim().toLowerCase();
    const name = params.name.trim();

    // Input validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please provide a valid email address.");
    }
    if (name.length < 2 || name.length > 100) {
      throw new Error("Student name must be between 2 and 100 characters.");
    }
    
    // Check duplicate email
    for (const u of this.users.values()) {
      if (u.email === email) {
        throw new Error("An account with this email address already exists. Please sign in or use another email.");
      }
    }

    const passwordToUse = params.password && params.password.length >= 8 
      ? params.password 
      : crypto.randomBytes(16).toString("hex");

    const { hash, salt } = this.hashPassword(passwordToUse);
    const userId = `student-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const user: UserAccount = {
      id: userId,
      name,
      email,
      hash,
      salt,
      course: (params.course || "B.Tech Computer Science & Engineering").trim(),
      college: (params.college || "Engineering Institute").trim(),
      semester: (params.semester || "Semester 1").trim(),
      rollNumber: params.rollNumber?.trim() || "",
      department: params.department?.trim() || "Computer Science & Engineering",
      academicYear: params.academicYear?.trim() || "1st Year",
      avatarUrl: params.avatarUrl || "",
      bio: params.bio?.trim() || "",
      phoneNumber: params.phoneNumber?.trim() || "",
      targetScoreOrRank: params.targetScoreOrRank?.trim() || "Target 9.0+ CGPA",
      createdAt: new Date().toISOString(),
    };

    this.users.set(userId, user);
    this.saveUsers();

    const token = this.createSession(userId);
    const { hash: _h, salt: _s, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public updateUser(userId: string, updates: Partial<UserAccount>): Omit<UserAccount, "hash" | "salt"> | null {
    const existing = this.users.get(userId);
    if (!existing) return null;

    const updated: UserAccount = {
      ...existing,
      ...updates,
      id: existing.id,
      hash: existing.hash,
      salt: existing.salt,
    };

    this.users.set(userId, updated);
    this.saveUsers();

    const { hash: _h, salt: _s, ...safeUser } = updated;
    return safeUser;
  }

  public getAllSafeUsers(): Array<Omit<UserAccount, "hash" | "salt">> {
    return Array.from(this.users.values()).map(({ hash: _h, salt: _s, ...u }) => u);
  }

  public login(params: {
    email: string;
    password: string;
  }): { user: Omit<UserAccount, "hash" | "salt">; token: string } {
    const email = params.email.trim().toLowerCase();
    if (!email || !params.password) {
      throw new Error("Email and password are required.");
    }

    let user: UserAccount | null = null;
    for (const u of this.users.values()) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (!user || !this.verifyPassword(params.password, user.hash, user.salt)) {
      throw new Error("Invalid email or password. Please verify your credentials.");
    }

    const token = this.createSession(user.id);
    const { hash: _h, salt: _s, ...safeUser } = user;
    return { user: safeUser, token };
  }

  public loginDemo(): { user: Omit<UserAccount, "hash" | "salt">; token: string } {
    this.ensureDemoUser();
    const demo = this.users.get("demo-student-rahul")!;
    const token = this.createSession(demo.id);
    const { hash: _h, salt: _s, ...safeUser } = demo;
    return { user: safeUser, token };
  }

  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString("hex");
    const session: UserSession = {
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    };

    this.sessions.set(token, session);
    this.saveSessions();
    return token;
  }

  public validateSession(token: string): UserAccount | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.sessions.delete(token);
      this.saveSessions();
      return null;
    }

    const user = this.users.get(session.userId);
    return user || null;
  }

  public logout(token: string): boolean {
    if (this.sessions.has(token)) {
      this.sessions.delete(token);
      this.saveSessions();
      return true;
    }
    return false;
  }

  public deleteAccount(userId: string): boolean {
    if (!this.users.has(userId)) return false;

    // Remove user
    this.users.delete(userId);
    this.saveUsers();

    // Invalidate all active sessions for this user
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
      }
    }
    this.saveSessions();

    // Delete user's persistent student storage file
    const studentFile = path.join(DATA_DIR, "students", `${userId}.json`);
    if (fs.existsSync(studentFile)) {
      try {
        fs.unlinkSync(studentFile);
      } catch (err) {
        console.warn("Failed to delete student data file:", err);
      }
    }

    return true;
  }

  public getUserById(userId: string): Omit<UserAccount, "hash" | "salt"> | null {
    const user = this.users.get(userId);
    if (!user) return null;
    const { hash: _h, salt: _s, ...safeUser } = user;
    return safeUser;
  }
}

export const authManager = new AuthManager();

// Express authentication middleware
export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: Omit<UserAccount, "hash" | "salt">;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authentication required. Please sign in to access your student records.",
    });
  }

  const token = authHeader.split(" ")[1];
  const user = authManager.validateSession(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: "Session expired or invalid. Please sign in again.",
    });
  }

  const { hash: _h, salt: _s, ...safeUser } = user;
  req.userId = user.id;
  req.user = safeUser;
  next();
}

// Optional auth helper: if token is present, resolves user; otherwise defaults to demo student
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const user = authManager.validateSession(token);
    if (user) {
      const { hash: _h, salt: _s, ...safeUser } = user;
      req.userId = user.id;
      req.user = safeUser;
      return next();
    }
  }

  // Fallback to demo student if unauthenticated for read-only preview compatibility
  req.userId = "demo-student-rahul";
  req.user = authManager.getUserById("demo-student-rahul") || undefined;
  next();
}
