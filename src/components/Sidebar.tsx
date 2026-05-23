import React, { useState } from "react";
import { ActiveTab, Project, Notification, UserSession } from "../types";
import { Language, translations } from "../translations";
import {
  Menu,
  X,
  LayoutDashboard,
  FolderOpen,
  Kanban,
  CalendarDays,
  Calendar,
  FileSpreadsheet,
  History,
  Bell,
  Settings,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  LogOut,
  FolderDot,
  Users
} from "lucide-react";

interface SidebarProps {
  projects: Project[];
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activeProject: string;
  onSelectProject: (id: string) => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onLogout: () => void;
  user: UserSession | null;
  language: Language;
  onOpenSettings: () => void;
}

export default function Sidebar({
  projects,
  activeTab,
  onSelectTab,
  activeProject,
  onSelectProject,
  notifications,
  onMarkNotificationRead,
  onLogout,
  user,
  language,
  onOpenSettings
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true); // Open / collapse toggle
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const t = translations[language] || translations.pt;

  const tabsMeta = [
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard },
    { id: "projects", label: t.portfolio, icon: FolderOpen },
    { id: "kanban", label: t.kanban, icon: Kanban },
    { id: "gantt", label: t.gantt, icon: CalendarDays },
    { id: "calendar", label: t.calendar, icon: Calendar },
    { id: "reports", label: t.reports, icon: FileSpreadsheet },
    { id: "developers", label: t.developers, icon: Users },
    { id: "audit", label: t.audit, icon: History }
  ];

  return (
    <div className={`relative flex flex-col h-screen shrink-0 bg-slate-950 border-r border-slate-900 transition-all duration-300 z-40 ${isOpen ? "w-64" : "w-16"}`}>
      
      {/* Sidebar Header brand collapsible trigger */}
      <div className="h-14 px-4 border-b border-slate-900 flex items-center justify-between">
        {isOpen ? (
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-900/50 text-cyan-400 font-bold border border-cyan-800/30">
              <FolderDot className="h-4.5 w-4.5" />
            </div>
            <span className="text-xs font-black tracking-widest text-slate-100 uppercase">
              {t.brandName}
            </span>
          </div>
        ) : (
          <div className="mx-auto text-cyan-400" title={t.brandName}>
            <FolderDot className="h-5 w-5" />
          </div>
        )}

        {/* Hamburger toggle button - desktop side */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-500 hover:text-slate-200 hidden md:block cursor-pointer"
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Profile quick stats inside side panel */}
      {isOpen && user && (
        <div className="p-3.5 bg-slate-900/40 border-b border-slate-900/80 flex items-center space-x-3 text-xs select-none">
          <div className="relative shrink-0">
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-9 h-9 rounded-full border border-slate-800 object-cover referrerPolicy='no-referrer'" 
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-200 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-medium truncate">{user.role}</p>
          </div>
          
          {/* Action Buttons group: Settings & Notifications */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onOpenSettings}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
              title={t.settings}
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Unread Alerts Trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition relative cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-10 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 space-y-2 z-50 text-xs text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                    <span className="font-bold">Notificações ({unreadCount})</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      fechar
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          onMarkNotificationRead(n.id);
                          setShowNotifications(false);
                        }}
                        className={`p-2 rounded border hover:bg-slate-950 transition cursor-pointer flex items-start gap-2 ${n.read ? "bg-slate-900/20 border-slate-800/40" : "bg-slate-950 border-cyan-900/30 text-slate-100"}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.type === "success" ? "bg-emerald-500" : "bg-orange-500"}`} />
                        <div className="min-w-0 flex-1 text-[11px] leading-relaxed">
                          <p className="line-clamp-3">{n.text}</p>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">{new Date(n.createdAt).toLocaleTimeString("pt-BR", { hour: "numeric", minute: "numeric" })}</p>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="text-center py-4 text-slate-600 text-[10px]">Sem alertas pendentes.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION SECTION */}
      <div className="flex-1 py-4 flex flex-col space-y-1 overflow-y-auto">
        {tabsMeta.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as ActiveTab)}
              className={`w-full h-10 px-4 flex items-center transition-all cursor-pointer relative group ${
                isActive 
                  ? "text-cyan-400 font-bold bg-slate-900 border-l-4 border-cyan-500" 
                  : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-100"
              }`}
            >
              <TabIcon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-300"}`} />
              {isOpen && (
                <span className="text-xs ml-3 truncate select-none">
                  {tab.label}
                </span>
              )}
              {!isOpen && (
                <div className="absolute left-16 bg-slate-900 border border-slate-800 text-[10px] text-slate-200 px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all pointer-events-none z-50">
                  {tab.label}
                </div>
              )}
            </button>
          );
        })}

        {/* NESTED QUICK PROJECT SELECTOR (Shown only when Sidebar is Expanded) */}
        {isOpen && (
          <div className="pt-6 px-4 space-y-2 select-none">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-600 block">
              {t.quickProjects}
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin select-none">
              <button
                onClick={() => onSelectProject("all")}
                className={`w-full py-1 px-2 rounded text-left text-[11px] font-semibold transition truncate ${
                  activeProject === "all" ? "bg-slate-900 text-cyan-400 font-bold" : "text-slate-400 hover:bg-slate-900/20 hover:text-slate-200"
                }`}
              >
                📁 {t.allProjects} ({projects.length})
              </button>
              {projects.slice(0, 10).map(p => (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className={`w-full py-1.5 px-2 text-left text-[11px] font-medium transition truncate block rounded flex items-center justify-between ${
                    activeProject === p.id ? "bg-slate-900 text-cyan-400 font-bold" : "text-slate-500 hover:bg-slate-900/10 hover:text-slate-300"
                  }`}
                  title={p.name}
                >
                  <span className="truncate">{p.code} • {p.name}</span>
                  <span className="text-[9px] font-mono text-slate-500 text-right shrink-0">{p.progress}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER USER MANAGEMENT & ACTION LOGOUT */}
      <div className="p-3.5 border-t border-slate-900 bg-slate-950 flex flex-col space-y-2 mt-auto">
        {isOpen && (
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>{t.globalSLA}: <span className="font-mono font-bold text-slate-300">92%</span></span>
            <span>{t.criticalDelay}: <span className="text-red-400 animate-pulse font-bold">{t.critical}</span></span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full text-left flex items-center h-8 text-slate-500 hover:text-red-400 px-1 py-1 text-xs font-semibold rounded transition-colors group cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {isOpen && <span className="ml-3">{t.logout}</span>}
        </button>
      </div>

    </div>
  );
}
