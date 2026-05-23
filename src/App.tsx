import React, { useState, useEffect, useMemo } from "react";
import {
  Project,
  Task,
  Comment,
  ActivityLog,
  Notification,
  UserSession,
  ActiveTab
} from "./types";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import KanbanBoard from "./components/KanbanBoard";
import GanttChart from "./components/GanttChart";
import CalendarView from "./components/CalendarView";
import ReportsView from "./components/ReportsView";
import AIForecaster from "./components/AIForecaster";
import DeveloperManagement from "./components/DeveloperManagement";
import {
  FolderOpen,
  History,
  FileText,
  UserPlus,
  TrendingUp,
  BrainCircuit,
  Settings,
  Plus,
  Trash,
  Sliders,
  Calendar,
  Lock,
  Mail,
  User,
  Sparkles,
  AlertOctagon,
  RefreshCw,
  FolderLock,
  Edit2,
  Upload
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "./supabase";
import { Language, translations } from "./translations";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);

  const today = useMemo(() => new Date("2026-05-22"), []);

  const showProjectCode = (id: string) => {
    const proj = projects.find(p => p.id === id);
    return proj ? proj.code : "";
  };

  // Core full-stack state values
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [developers, setDevelopers] = useState<UserSession[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [commentsByTaskId, setCommentsByTaskId] = useState<Record<string, Comment[]>>({});

  // Active view constraints
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");

  // Loading indicator states
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Login form status
  const [loginEmail, setLoginEmail] = useState("admin@corporativo.com");
  const [loginPassword, setLoginPassword] = useState("senha123");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Sign up form status
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState<UserSession["role"]>("Gerente");

  // System Settings, Language, and Color Theme states
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("innovation_theme") as any) || "dark";
  });
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("innovation_lang") as any) || "pt";
  });
  const t = translations[language];
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempAvatar, setTempAvatar] = useState("");

  // New project creation and editing state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [prjName, setPrjName] = useState("");
  const [prjCode, setPrjCode] = useState("");
  const [prjClient, setPrjClient] = useState("");
  const [prjDesc, setPrjDesc] = useState("");
  const [prjResp, setPrjResp] = useState("Carlos Silveira");
  const [prjPriority, setPrjPriority] = useState<Project["priority"]>("Média");
  const [prjColor, setPrjColor] = useState<Project["color"]>("Azul");
  const [prjTagsStr, setPrjTagsStr] = useState("");
  const [prjStart, setPrjStart] = useState("2026-05-22");
  const [prjEnd, setPrjEnd] = useState("2026-07-30");
  const [prjStatus, setPrjStatus] = useState<Project["status"]>("Não iniciado");
  const [prjProgress, setPrjProgress] = useState<number>(0);

  // Dynamic Theme Application Effect
  useEffect(() => {
    localStorage.setItem("innovation_theme", theme);
    const applyTheme = () => {
      const root = document.documentElement;
      if (theme === "light") {
        root.classList.add("theme-light");
      } else if (theme === "dark") {
        root.classList.remove("theme-light");
      } else {
        const isSystemLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        if (isSystemLight) {
          root.classList.add("theme-light");
        } else {
          root.classList.remove("theme-light");
        }
      }
    };
    applyTheme();

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: light)");
      const listener = () => applyTheme();
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  // Language Persistence Effect
  useEffect(() => {
    localStorage.setItem("innovation_lang", language);
  }, [language]);

  const mapAndSetUser = (supabaseUser: any) => {
    const defaultAvatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
    ];
    const avatarIndex = supabaseUser.email ? supabaseUser.email.length % defaultAvatars.length : 0;

    const mapped: UserSession = {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "Usuário Supabase",
      role: supabaseUser.user_metadata?.role || "Gerente",
      avatarUrl: supabaseUser.user_metadata?.avatar_url || defaultAvatars[avatarIndex],
      productivity: Number(supabaseUser.user_metadata?.productivity) || 85
    };

    // Load any offline user settings customized by the user
    const savedCustom = localStorage.getItem("custom_profile");
    if (savedCustom) {
      try {
        const custom = JSON.parse(savedCustom);
        if (custom.name) mapped.name = custom.name;
        if (custom.avatarUrl) mapped.avatarUrl = custom.avatarUrl;
      } catch (err) {
        console.error("Failed loading custom profile settings: ", err);
      }
    }

    setUser(mapped);
  };

  // Check and Subscribe to Supabase Session
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setToken(session.access_token);
          mapAndSetUser(session.user);
        } else {
          setToken(null);
          setUser(null);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setToken(session.access_token);
          mapAndSetUser(session.user);
        } else {
          setToken(null);
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Offline simulation fallback
      const localToken = localStorage.getItem("token");
      if (localToken) {
        setToken(localToken);
      }
    }
  }, []);

  // Sync profile data and database portfolios when token changes
  useEffect(() => {
    if (token) {
      if (!isSupabaseConfigured) {
        fetchUserSession();
      }
      loadDatabaseContent();
    }
  }, [token]);

  const fetchUserSession = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const u = await response.json();
        setUser(u);
      }
    } catch (err) {
      console.error("Failed to load user profile: ", err);
    }
  };

  // Pull database portfolios
  const loadDatabaseContent = async () => {
    setLoading(true);
    try {
      const [pRes, tRes, nRes, dRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/notifications"),
        fetch("/api/developers")
      ]);

      if (pRes.ok) {
        const prjs = await pRes.json();
        setProjects(prjs);
      }
      if (tRes.ok) {
        const tsk = await tRes.json();
        setTasks(tsk);
      }
      if (nRes.ok) {
        const notif = await nRes.json();
        setNotifications(notif);
      }
      if (dRes?.ok) {
        const devs = await dRes.json();
        setDevelopers(devs);
      }

      // Load activity logs
      const logRes = await fetch("/api/activity-logs");
      if (logRes.ok) {
        const logs = await logRes.json();
        setActivityLogs(logs);
      }
    } catch (err) {
      console.error("Error fetching databases portfolios: ", err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });
        if (error) {
          throw new Error(error.message);
        }
        if (data?.session) {
          setToken(data.session.access_token);
        }
      } catch (err: any) {
        console.warn("Supabase auth failed, trying local server login fallback...", err.message);
        // Fallback to local system authentication
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: loginEmail, password: loginPassword })
          });
          if (res.ok) {
            const localData = await res.json();
            localStorage.setItem("token", localData.token);
            setToken(localData.token);
            setUser(localData.user);
            pushNotification("Autenticado via servidor local (fallback).", "success");
            return;
          }
        } catch (localErr) {
          console.error("Local fallback authentication failed:", localErr);
        }
        setLoginError(err.message || "Credenciais corporativas inválidas no Supabase.");
      } finally {
        setLoading(false);
      }
    } else {
      // Offline/Local Simulated login
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password: loginPassword })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Login falhou.");
        }
        const data = await res.json();
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
      } catch (err: any) {
        setLoginError(err.message || "Credenciais corporativas inválidas.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: loginEmail,
          password: loginPassword,
          options: {
            data: {
              name: signupName || loginEmail.split("@")[0],
              role: signupRole,
              productivity: Math.floor(Math.random() * 20) + 75,
            }
          }
        });
        if (error) {
          throw new Error(error.message);
        }
        if (data) {
          pushNotification("Conta criada com sucesso com o Supabase! Você já pode entrar.", "success");
          setIsSignUpMode(false);
        }
      } catch (err: any) {
        console.warn("Supabase signup failed, falling back to local DB registration...", err.message);
        // Automatic fallback to local database register on port 3000 to bypass email rate limits
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: loginEmail,
              password: loginPassword,
              name: signupName,
              role: signupRole
            })
          });
          if (res.ok) {
            pushNotification(
              "Limite do Supabase excedido. Conta cadastrada localmente com sucesso! Você já pode entrar.",
              "success"
            );
            setIsSignUpMode(false);
            setLoginPassword(""); // clear password field
            return;
          } else {
            const errData = await res.json();
            throw new Error(errData.error || "Cadastro local falhou.");
          }
        } catch (localErr: any) {
          setLoginError(`Falha no Supabase (${err.message}) e no local (${localErr.message}).`);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Local Mock DB sign-up
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
            name: signupName,
            role: signupRole
          })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Cadastro local falhou.");
        }
        pushNotification("Conta local criada com sucesso! Você já pode entrar com suas credenciais.", "success");
        setIsSignUpMode(false);
        setLoginPassword(""); // clear password field
      } catch (err: any) {
        setLoginError(err.message || "Erro ao registrar usuário localmente.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("token");
    }
    setToken(null);
    setUser(null);
    setProjects([]);
    setTasks([]);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupabaseConfigured) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setForgotSuccess(true);
        pushNotification("Instruções de redefinição enviadas para seu e-mail.", "info");
      } catch (err: any) {
        setLoginError(err.message || "Erro ao redefinir senha no Supabase.");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotEmail })
        });
        if (res.ok) {
          setForgotSuccess(true);
        }
      } catch (err) {
        console.error("Forgot error: ", err);
      }
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleTaskMoved = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Reload assets state
        loadDatabaseContent();
      }
    } catch (err) {
      console.error("Task move sync failed: ", err);
    }
  };

  const handleTaskChecklistToggle = async (taskId: string, checklistId: string, newValue: boolean) => {
    try {
      const targetTask = tasks.find(t => t.id === taskId);
      if (!targetTask) return;

      const updatedChecklist = targetTask.checklist.map(item => {
        if (item.id === checklistId) return { ...item, done: newValue };
        return item;
      });

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: updatedChecklist })
      });

      if (res.ok) {
        loadDatabaseContent();
      }
    } catch (err) {
      console.error("Task checklist sync failed: ", err);
    }
  };

  const handleAddTask = async (tPayload: Omit<Task, "id" | "weekOfYear" | "commentsCount" | "attachments">) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tPayload)
      });
      if (res.ok) {
        loadDatabaseContent();
        // Trigger alert Toast simulation
        pushNotification("Sua tarefa corporativa foi vinculada ao projeto com sucesso.");
      }
    } catch (err) {
      console.error("Add task error: ", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadDatabaseContent();
        pushNotification("Tarefa excluída com sucesso.");
      }
    } catch (err) {
      console.error("Delete task failed: ", err);
    }
  };

  const handleLoadCommentsForTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const list = await res.json();
        setCommentsByTaskId(prev => ({ ...prev, [taskId]: list }));
      }
    } catch (err) {
      console.error("Failed to load comment list: ", err);
    }
  };

  const handleAddComment = async (taskId: string, content: string) => {
    try {
      const tObj = tasks.find(t => t.id === taskId);
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          projectId: tObj?.projectId || "",
          userId: user?.id || "user-admin",
          userName: user?.name || "Carlos Silveira"
        })
      });
      if (res.ok) {
        handleLoadCommentsForTask(taskId);
        loadDatabaseContent();
      }
    } catch (err) {
      console.error("Failed to post comment feedback: ", err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      if (res.ok) {
        loadDatabaseContent();
      }
    } catch (err) {
      console.error("Mark read error: ", err);
    }
  };

  // Simulating Toast pushing alerts
  const pushNotification = (text: string, type: any = "info") => {
    // Basic local state alert push for instantaneous feedback
    const id = `local-toast-${Date.now()}`;
    const newN: Notification = {
      id,
      userId: user?.id || "user-admin",
      read: false,
      text,
      type,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newN, ...prev]);
  };

  // Add or Edit Project Submit Handler
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prjName.trim() || !prjCode.trim()) return;

    try {
      const payload = {
        name: prjName.trim(),
        code: prjCode.trim(),
        description: prjDesc.trim(),
        client: prjClient.trim() || "Interno",
        responsibleName: prjResp,
        startDate: new Date(prjStart).toISOString(),
        endDate: new Date(prjEnd).toISOString(),
        status: editingProjectId ? prjStatus : "Não iniciado" as any,
        priority: prjPriority,
        color: prjColor,
        tags: prjTagsStr.split(",").map(tag => tag.trim()).filter(Boolean),
        notes: "Metas de sprint ativas.",
        progress: editingProjectId ? prjProgress : 0
      };

      const url = editingProjectId ? `/api/projects/${editingProjectId}` : "/api/projects";
      const method = editingProjectId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        loadDatabaseContent();
        setIsNewProjectOpen(false);
        setEditingProjectId(null);
        // Clear inputs
        setPrjName("");
        setPrjCode("");
        setPrjDesc("");
        setPrjClient("");
        
        const successMsg = editingProjectId 
          ? `Projeto ${payload.code} atualizado com sucesso!`
          : `Projeto ${payload.code} cadastrado com sucesso!`;
        pushNotification(successMsg, "success");
      }
    } catch (err) {
      console.error("Save project failed: ", err);
    }
  };

  const handleOpenEditProject = (p: Project) => {
    setEditingProjectId(p.id);
    setPrjName(p.name || "");
    setPrjCode(p.code || "");
    setPrjDesc(p.description || "");
    setPrjClient(p.client || "");
    setPrjResp(p.responsibleName || "Carlos Silveira");
    setPrjPriority(p.priority || "Média");
    setPrjColor(p.color || "Azul");
    setPrjTagsStr(p.tags?.join(", ") || "");
    setPrjStart(p.startDate ? p.startDate.split("T")[0] : "2026-05-22");
    setPrjEnd(p.endDate ? p.endDate.split("T")[0] : "2026-07-30");
    setPrjStatus(p.status || "Não iniciado");
    setPrjProgress(p.progress || 0);
    setIsNewProjectOpen(true);
  };

  const handleOpenSettings = () => {
    if (user) {
      setTempName(user.name || "");
      setTempAvatar(user.avatarUrl || "");
    }
    setIsSettingsOpen(true);
  };

  const handleSaveProfileSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;

    if (user) {
      const updatedUser = {
        ...user,
        name: tempName.trim(),
        avatarUrl: tempAvatar.trim()
      };
      setUser(updatedUser);
      localStorage.setItem("custom_profile", JSON.stringify({ name: tempName.trim(), avatarUrl: tempAvatar.trim() }));
      pushNotification(translations[language].successSettings || "Configurações salvas!", "success");
    }
    setIsSettingsOpen(false);
  };

  const handleOpenCreateProject = () => {
    setEditingProjectId(null);
    setPrjName("");
    setPrjCode("");
    setPrjDesc("");
    setPrjClient("");
    setPrjResp("Carlos Silveira");
    setPrjPriority("Média");
    setPrjColor("Azul");
    setPrjTagsStr("");
    setPrjStart("2026-05-22");
    setPrjEnd("2026-07-30");
    setPrjStatus("Não iniciado");
    setPrjProgress(0);
    setIsNewProjectOpen(true);
  };

  const handleDeleteProject = (id: string) => {
    const prj = projects.find(p => p.id === id);
    if (prj) {
      setProjectToDelete(prj);
    }
  };

  const handleConfirmDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        loadDatabaseContent();
        setSelectedProjectId("all");
        pushNotification(
          language === "pt" 
            ? "Projeto excluído com sucesso." 
            : language === "ko" 
              ? "프로젝트가 성공적으로 삭제되었습니다." 
              : "Project deleted successfully."
        );
      } else {
        pushNotification(
          language === "pt" 
            ? "Erro ao excluir o projeto." 
            : language === "ko" 
              ? "프로젝트 삭제 실패." 
              : "Failed to delete project.",
          "error"
        );
      }
    } catch (err) {
      console.error("Delete project failed: ", err);
      pushNotification("Erro ao processar exclusão.", "error");
    } finally {
      setProjectToDelete(null);
    }
  };

  const selectedProjectDetails = useMemo(() => {
    if (selectedProjectId === "all") return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Auth Guard view
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-cyan-950/60 border border-cyan-800/30 text-cyan-400 font-bold rounded-xl flex items-center justify-center mx-auto mb-1 animate-pulse">
              <FolderLock className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-100 uppercase">INNOVATION HUB</h1>
            <p className="text-xs text-slate-500">
              Gerenciador de projetos e tarefas corporativas
            </p>
          </div>

          {showForgot ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">E-mail de recuperação</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="voce@empresa.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {forgotSuccess ? (
                <p className="text-xs text-emerald-400 font-medium">Link de redefinição enviado com sucesso!</p>
              ) : null}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false);
                    setForgotSuccess(false);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 font-semibold cursor-pointer"
                >
                  Voltar para login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 hover:text-slate-950 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  {loading ? "Processando..." : "Enviar Instruções"}
                </button>
              </div>
            </form>
          ) : isSignUpMode ? (
            /* REGISTRATION FORM (Active for both modes) */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nome Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Silveira"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">E-mail corporativo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="voce@empresa.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cargo de Acesso</label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Gerente">Gerente</option>
                  <option value="Usuário">Usuário</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Senha Segura</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {loginError && <p className="text-xs text-red-400 font-semibold">{loginError}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 hover:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                {loading ? "Cadastrando..." : "Cadastrar Usuário"}
              </button>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(false);
                    setLoginError(null);
                  }}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  Já possui uma conta? Acesse agora
                </button>
              </div>
            </form>
          ) : (
            /* STANDARD INBOUND LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">E-mail corporativo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Senha corporativa</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(true);
                      setForgotSuccess(false);
                    }}
                    className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {loginError && <p className="text-xs text-red-400 font-semibold">{loginError}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 hover:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                {loading ? "Autenticando..." : "Autenticar no Sistema"}
              </button>

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(true);
                    setLoginError(null);
                  }}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  Não possui conta? Cadastre-se no Sistema
                </button>
              </div>
            </form>
          )}

          <div className="text-center pt-2">
            <span className="text-[10px] text-slate-500 block">
              Innovation Group SEDA-P(M) 2026
            </span>
            {!isSupabaseConfigured && (
              <span className="text-[9px] text-slate-600 block mt-1">
                Pode utilizar o e-mail padrão <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-400 font-mono">admin@corporativo.com</code> e senha <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-400 font-mono">senha123</code> para testar localmente.
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      
      {/* Dynamic Collapsible Sidebar navigation */}
      <Sidebar
        projects={projects}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeProject={selectedProjectId}
        onSelectProject={handleSelectProject}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onLogout={handleLogout}
        user={user}
        language={language}
        onOpenSettings={handleOpenSettings}
      />

      {/* Main Panel Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        
        {/* Top Header layout breadcrumb trail panel */}
        <header className="h-14 bg-slate-950 border-b border-slate-900 px-6 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">GP Corporativo</span>
            <span>/</span>
            <span className="font-bold text-cyan-400 capitalize">{activeTab}</span>

            {selectedProjectId !== "all" && (
              <>
                <span>/</span>
                <span className="bg-slate-900 px-2 py-0.5 rounded font-mono font-bold text-cyan-500 border border-slate-900">
                  {showProjectCode(selectedProjectId)}
                </span>
              </>
            )}
          </div>

          {/* Quick projects select drop & Add Project triggers */}
          <div className="flex items-center space-x-3 text-xs">
            {activeTab === "projects" && (
              <button
                onClick={handleOpenCreateProject}
                className="flex items-center justify-center space-x-1 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> <span>{t.createProject}</span>
              </button>
            )}
            <button
              onClick={loadDatabaseContent}
              className={`p-1.5 border border-slate-800 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer ${loading ? "animate-spin" : ""}`}
              title="Sincronizar base"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content Pane container */}
        <main className="p-6 flex-1 space-y-6">
          
          {loading && projects.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-12 w-12 text-cyan-500 animate-spin" />
              <p className="text-xs text-slate-500 font-semibold select-none">Carregando portfólio de 32 projetos e tarefas...</p>
            </div>
          ) : (
            <>
              {/* Conditional Active tabs mapping views */}
              {activeTab === "dashboard" && (
                <Dashboard
                  projects={projects}
                  tasks={tasks}
                  onSelectProject={handleSelectProject}
                  onNavigateToTab={setActiveTab}
                />
              )}

              {activeTab === "kanban" && (
                <KanbanBoard
                  projects={projects}
                  tasks={tasks}
                  activeProjectId={selectedProjectId}
                  onSelectProject={handleSelectProject}
                  onTaskMoved={handleTaskMoved}
                  onTaskChecklistToggle={handleTaskChecklistToggle}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                  onAddComment={handleAddComment}
                  commentsByTaskId={commentsByTaskId}
                  onLoadComments={handleLoadCommentsForTask}
                  developers={developers}
                />
              )}

              {activeTab === "gantt" && (
                <GanttChart
                  projects={projects}
                  tasks={tasks}
                  onSelectProject={handleSelectProject}
                />
              )}

              {activeTab === "calendar" && (
                <CalendarView
                  projects={projects}
                  tasks={tasks}
                  onSelectProject={handleSelectProject}
                />
              )}

              {activeTab === "reports" && (
                <ReportsView
                  projects={projects}
                  tasks={tasks}
                />
              )}

              {activeTab === "developers" && (
                <DeveloperManagement
                  developers={developers}
                  onRefreshDevelopers={loadDatabaseContent}
                  pushNotification={pushNotification}
                />
              )}

              {/* View 2: Project Management / Portfolio controls */}
              {activeTab === "projects" && (
                <div className="space-y-6">
                  {/* Detailed portfolio card grid listing */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-slate-200">
                        {t.portfolio} ({projects.length})
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">{t.brandDesc}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {projects.map(p => {
                        const isPrjOverdue = new Date(p.endDate) < today && p.status !== "Concluído";
                        const progressColor = 
                          p.color === "Verde" ? "bg-emerald-500" :
                          p.color === "Amarelo" ? "bg-amber-500" :
                          p.color === "Vermelho" ? "bg-red-500" :
                          p.color === "Azul" ? "bg-cyan-500" :
                          "bg-slate-500";

                        const badgeColor = 
                          p.color === "Verde" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
                          p.color === "Amarelo" ? "bg-amber-500/15 border-amber-500/30 text-amber-400" :
                          p.color === "Vermelho" ? "bg-red-500/15 border-red-500/30 text-red-500" :
                          p.color === "Azul" ? "bg-indigo-500/15 border-indigo-500/30 text-cyan-400" :
                          "bg-slate-500/15 border-slate-500/30 text-slate-400";

                        return (
                          <div 
                            key={p.id} 
                            onClick={() => handleSelectProject(p.id)}
                            className={`group relative bg-slate-950 rounded-xl shadow-sm hover:shadow border hover:border-slate-800 transition p-4 cursor-pointer flex flex-col justify-between ${selectedProjectId === p.id ? "ring-2 ring-cyan-500/80 bg-slate-900/60" : "border-slate-800/80"}`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold font-mono text-cyan-500 uppercase">{p.code}</span>
                                <div className="flex items-center space-x-1.5 z-10">
                                  {/* Quick options buttons inside project card */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditProject(p);
                                    }}
                                    className="p-1 hover:bg-slate-800 text-slate-500 hover:text-cyan-400 rounded transition cursor-pointer"
                                    title={t.edit}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteProject(p.id);
                                    }}
                                    className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                                    title={t.delete}
                                  >
                                    <Trash className="h-3 w-3" />
                                  </button>
                                  
                                  <span className={`inline-block border rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${badgeColor}`}>
                                    {p.status}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-1">{p.name}</p>
                              <p className="text-[10px] text-slate-400 line-clamp-3 leading-normal">{p.description}</p>
                            </div>

                            <div className="space-y-2.5 pt-4 mt-4 border-t border-slate-800/60 select-none text-[10px] text-slate-500">
                              <div className="flex justify-between">
                                <span>{t.client}: <span className="font-semibold text-slate-300">{p.client}</span></span>
                                <span>Sm Início: <span className="font-mono text-slate-400">{p.weekOfYear}</span></span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-slate-200 text-[10px] font-mono">{p.progress}%</span>
                                <div className="w-full bg-slate-800 rounded-full h-1">
                                  <span className={`${progressColor} h-1 rounded-full block`} style={{ width: `${p.progress}%` }} />
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1 text-[9px] text-slate-500">
                                <span>{t.manager}: <span className="text-slate-300 font-bold">{p.responsibleName}</span></span>
                                <span className={isPrjOverdue ? "text-red-400 font-bold" : ""}>
                                  {t.endDate}: {new Date(p.endDate).toLocaleDateString(language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "ko-KR", { day: "numeric", month: "numeric" })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* View 3: Logs de Auditoria History tracking */}
              {activeTab === "audit" && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-200">Auditoria Completa de Eventos e Histórico Operacional</h3>
                    <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider bg-slate-950 px-2 py-0.5 border border-slate-850 rounded">
                      Auditor: {user?.name}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {activityLogs.map(log => (
                      <div key={log.id} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 text-xs text-slate-400 flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-slate-200 font-medium">
                            <span className="text-cyan-400 font-bold">{log.userName}</span>: {log.details}
                          </p>
                          <div className="flex items-center space-x-3.5 text-[10px] text-slate-500">
                            {log.projectName && (
                              <span>Projeto: <span className="font-semibold text-slate-400">{log.projectName}</span></span>
                            )}
                            {log.taskTitle && (
                              <span>Tarefa: <span className="font-semibold text-slate-400">{log.taskTitle}</span></span>
                            )}
                          </div>
                        </div>

                        <span className="font-sans text-[10px] text-slate-500 select-none">
                          {new Date(log.createdAt).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "numeric", month: "short" })}
                        </span>
                      </div>
                    ))}

                    {activityLogs.length === 0 && (
                      <p className="text-center py-6 text-xs text-slate-500">Sem logs operacionais registrados.</p>
                    )}
                  </div>
                </div>
              )}

              {/* DYNAMIC SECONDARY BLOCK: AI DELAY FORECAST PANEL (Connected directly to right of panel on specific tabs) */}
              {activeTab !== "audit" && activeTab !== "reports" && (
                <AIForecaster project={selectedProjectDetails} />
              )}
            </>
          )}

        </main>
      </div>

      {/* MODAL: Creating Project Wizard popup */}
      {isNewProjectOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between select-none">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                {editingProjectId ? t.edit : t.newProject}
              </h3>
              <button 
                onClick={() => setIsNewProjectOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Nome do Projeto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Integração Pix Recorrente"
                    value={prjName}
                    onChange={(e) => setPrjName(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Código Projeto (Único)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PRJ-1099"
                    value={prjCode}
                    onChange={(e) => setPrjCode(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{t.client}</label>
                  <input
                    type="text"
                    placeholder="Ex: Banco Itaú"
                    value={prjClient}
                    onChange={(e) => setPrjClient(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Descrição e Metas</label>
                  <textarea
                    rows={2}
                    placeholder="Detalhamento técnico operacional de releases e SLAs contratuais..."
                    value={prjDesc}
                    onChange={(e) => setPrjDesc(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{t.manager}</label>
                  <select
                    value={prjResp}
                    onChange={(e) => setPrjResp(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  >
                    {developers.map(dev => (
                      <option key={dev.id} value={dev.name}>
                        {dev.name} ({dev.role})
                      </option>
                    ))}
                    {developers.length === 0 && (
                      <>
                        <option value="Carlos Silveira">Carlos Silveira (Admin)</option>
                        <option value="Mariana Costa">Mariana Costa (Gerente)</option>
                        <option value="Rodrigo Santos">Rodrigo Santos (Usuário)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Prioridade</label>
                  <select
                    value={prjPriority}
                    onChange={(e) => setPrjPriority(e.target.value as any)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">Tags (Separar por vírgula)</label>
                  <input
                    type="text"
                    placeholder="Ex: Web, API, Pix"
                    value={prjTagsStr}
                    onChange={(e) => setPrjTagsStr(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder-slate-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cor Identificadora</label>
                  <select
                    value={prjColor}
                    onChange={(e) => setPrjColor(e.target.value as any)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  >
                    <option value="Azul">Azul</option>
                    <option value="Verde">Verde</option>
                    <option value="Amarelo">Amarelo</option>
                    <option value="Vermelho">Vermelho</option>
                    <option value="Cinza">Cinza</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Data de Início</label>
                  <input
                    type="date"
                    value={prjStart}
                    onChange={(e) => setPrjStart(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Data de Término</label>
                  <input
                    type="date"
                    value={prjEnd}
                    onChange={(e) => setPrjEnd(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  />
                </div>

                {/* Status & Progress editing elements shown only when editing */}
                {editingProjectId && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">Status Geral</label>
                      <select
                        value={prjStatus}
                        onChange={(e) => setPrjStatus(e.target.value as any)}
                        className="w-full text-xs p-2 bg-slate-950 border border-cyan-900 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="Não iniciado">Não iniciado</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex justify-between">
                        <span>Progresso do Projeto</span>
                        <span className="font-mono text-cyan-400">{prjProgress}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={prjProgress}
                        onChange={(e) => setPrjProgress(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded border border-cyan-900/60 accent-cyan-500 cursor-pointer text-xs"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/60">
                {editingProjectId && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteProject(editingProjectId);
                      setIsNewProjectOpen(false);
                    }}
                    className="px-4 py-2 mr-auto bg-red-950/20 border border-red-900/40 hover:bg-red-950 text-red-400 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Excluir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNewProjectOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800/40 rounded-lg text-xs font-semibold text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SYSTEM CONFIGURATION & PREFERENCES SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between select-none">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Settings className="h-4 w-4 text-cyan-400 rotate-45" />
                {t.settings}
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfileSettingsSubmit} className="p-5 space-y-5">
              
              {/* Profile Details Edit */}
              <div className="space-y-3.5 pb-4 border-b border-slate-800/60">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
                  Perfil de Usuário
                </span>

                {/* Live Profile Card Preview */}
                <div className="flex items-center space-x-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-800 overflow-hidden shrink-0 bg-slate-950">
                    {tempAvatar ? (
                      <img src={tempAvatar} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-sm bg-slate-900">?</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{tempName || "Usuário"}</h4>
                    <p className="text-[10px] text-slate-500 font-mono font-medium truncate">{user?.role || "Membro"}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Nome de Exibição</label>
                  <input
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">{t.changeAvatar}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      className="flex-1 text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                      placeholder={t.avatarUrlPlaceholder}
                      value={tempAvatar}
                      onChange={(e) => setTempAvatar(e.target.value)}
                    />
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition select-none hover:text-cyan-400 border-dashed border-cyan-800/40">
                      <Upload className="h-3.5 w-3.5 text-cyan-400 hover:scale-115 transition-transform" />
                      <span>{language === "pt" ? "Carregar Arquivo" : language === "ko" ? "파일 선택" : "Upload File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setTempAvatar(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  {/* Avatar Quick Preset Pick grid */}
                  <div className="flex items-center space-x-2 pt-1.5">
                    <span className="text-[9px] text-slate-500 shrink-0 uppercase tracking-tight">Presets:</span>
                    <div className="flex items-center space-x-2">
                      {[
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
                      ].map((presetUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTempAvatar(presetUrl)}
                          className={`w-7 h-7 rounded-full border overflow-hidden cursor-pointer transition relative shrink-0 ${
                            tempAvatar === presetUrl ? "border-cyan-400 ring-2 ring-cyan-500/30 scale-105" : "border-slate-800 hover:border-slate-600"
                          }`}
                        >
                          <img src={presetUrl} alt="Quick pick" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Settings Selector */}
              <div className="space-y-2 pb-4 border-b border-slate-800/60">
                <label className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500 block">
                  {t.theme}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "light", label: t.light },
                    { id: "dark", label: t.dark },
                    { id: "system", label: t.system }
                  ].map((preset) => {
                    const isActive = theme === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setTheme(preset.id as any)}
                        className={`py-1.5 px-2.5 rounded-lg text-center text-[11px] font-bold border transition cursor-pointer ${
                          isActive 
                            ? "bg-slate-950 border-cyan-500 text-cyan-400" 
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Settings Selector */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500 block">
                  {t.language}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "en", label: "English" },
                    { id: "pt", label: "Português" },
                    { id: "ko", label: "한국어" }
                  ].map((preset) => {
                    const isActive = language === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setLanguage(preset.id as any)}
                        className={`py-1.5 px-2.5 rounded-lg text-center text-[11px] font-bold border transition cursor-pointer ${
                          isActive 
                            ? "bg-slate-950 border-cyan-500 text-cyan-400" 
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Footer Action Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800/40 rounded-lg text-xs font-semibold text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL PROJECTS DELETE CONFIRMATION MODAL (100% Sandbox & Iframe Safe) */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-slate-900 border border-red-900/40 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between select-none">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <AlertOctagon className="h-4.5 w-4.5 animate-pulse text-red-500" />
                {language === "pt" ? "Confirmar Remoção" : language === "ko" ? "삭제 확인" : "Confirm Deletion"}
              </h3>
              <button 
                onClick={() => setProjectToDelete(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === "pt" 
                    ? `Deseja realmente excluir permanentemente o projeto "${projectToDelete.name}" (${projectToDelete.code}) e todas as suas tarefas vinculadas?` 
                    : language === "ko" 
                      ? `"${projectToDelete.name}" (${projectToDelete.code}) 프로젝트와 하위 모든 테스크들을 영구 삭제 하시겠습니까?` 
                      : `Do you want to permanently delete project "${projectToDelete.name}" (${projectToDelete.code}) and all its linked tasks?`}
                </p>
                <div className="bg-red-955/15 text-red-400/90 text-[10px] leading-relaxed p-3 border border-red-900/20 rounded select-none font-medium">
                  {translations[language]?.confirmDelete || translations.pt.confirmDelete}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/60 select-none">
                <button
                  type="button"
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition select-none"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteProject(projectToDelete.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition select-none shadow-md"
                >
                  {language === "pt" ? "Sim, Excluir" : language === "ko" ? "예, 삭제합니다" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
