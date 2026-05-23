import React, { useState, useMemo } from "react";
import { Project, Task } from "../types";
import { Language, translations } from "../translations";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  FolderLock,
  CheckCircle,
  Clock,
  Briefcase,
  Search,
  Filter,
  BarChart2,
  ListTodo
} from "lucide-react";

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  onSelectProject: (id: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export default function Dashboard({ projects, tasks, onSelectProject, onNavigateToTab }: DashboardProps) {
  const language = (localStorage.getItem("innovation_lang") as any) || "pt";
  const t = translations[language] || translations.pt;

  // Filters state
  const [filterWeek, setFilterWeek] = useState<string>("all");
  const [filterManager, setFilterManager] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Extracted unique values for filter dropdowns
  const weeksList = useMemo(() => {
    const weeks = projects.map(p => p.weekOfYear);
    return Array.from(new Set(weeks)).sort((a, b) => a - b);
  }, [projects]);

  const managersList = useMemo(() => {
    const managers = projects.map(p => p.responsibleName);
    return Array.from(new Set(managers)).sort();
  }, [projects]);

  // Filter projects & tasks
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchWeek = filterWeek === "all" || p.weekOfYear === parseInt(filterWeek);
      const matchManager = filterManager === "all" || p.responsibleName === filterManager;
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchPriority = filterPriority === "all" || p.priority === filterPriority;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.client.toLowerCase().includes(searchQuery.toLowerCase());
      return matchWeek && matchManager && matchStatus && matchPriority && matchSearch;
    });
  }, [projects, filterWeek, filterManager, filterStatus, filterPriority, searchQuery]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const proj = projects.find(p => p.id === t.projectId);
      if (!proj) return false;
      const matchWeek = filterWeek === "all" || t.weekOfYear === parseInt(filterWeek);
      const matchManager = filterManager === "all" || t.responsibleName === filterManager;
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      const matchPriority = filterPriority === "all" || t.priority === filterPriority;
      return matchWeek && matchManager && matchStatus && matchPriority;
    });
  }, [tasks, projects, filterWeek, filterManager, filterStatus, filterPriority]);

  // Executive Metrics Card Computations
  const totalProjectsCount = filteredProjects.length;
  
  const overdueProjectsCount = useMemo(() => {
    const today = new Date("2026-05-22");
    return filteredProjects.filter(p => p.status === "Atrasado" || (p.status !== "Concluído" && p.status !== "Cancelado" && new Date(p.endDate) < today)).length;
  }, [filteredProjects]);

  const completedProjectsCount = filteredProjects.filter(p => p.status === "Concluído").length;
  const pendingTasksCount = filteredTasks.filter(t => t.status !== "Done").length;
  const completedTasksCount = filteredTasks.filter(t => t.status === "Done").length;

  const averageProgress = useMemo(() => {
    if (filteredProjects.length === 0) return 0;
    const sum = filteredProjects.reduce((acc, p) => acc + p.progress, 0);
    return Math.round(sum / filteredProjects.length);
  }, [filteredProjects]);

  // Chart 1: Projects by status
  const projectsByStatusData = useMemo(() => {
    const counts: Record<string, number> = {
      "Não iniciado": 0,
      "Em andamento": 0,
      "Em risco": 0,
      "Atrasado": 0,
      "Concluído": 0,
      "Cancelado": 0
    };
    filteredProjects.forEach(p => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      } else {
        counts[p.status] = 1;
      }
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).filter(item => item.value > 0);
  }, [filteredProjects]);

  const STATUS_COLORS: Record<string, string> = {
    "Não iniciado": "#94a3b8", // gray-400
    "Em andamento": "#0ea5e9", // sky-500
    "Em risco": "#f59e0b", // amber-500
    "Atrasado": "#ef4444", // red-500
    "Concluído": "#22c55e", // emerald-500
    "Cancelado": "#64748b" // slate-500
  };

  // Chart 2: Tasks by priority
  const tasksByPriorityData = useMemo(() => {
    const counts: Record<string, number> = { "Baixa": 0, "Média": 0, "Alta": 0, "Crítica": 0 };
    filteredTasks.forEach(t => {
      if (counts[t.priority] !== undefined) counts[t.priority]++;
    });
    return Object.keys(counts).map(key => ({ name: key, quantidade: counts[key] }));
  }, [filteredTasks]);

  // Chart 3: Weekly Progress Evolution (grouped by weekOfYear of projects)
  const weeklyEvolutionData = useMemo(() => {
    const groups: Record<number, { count: number; sum: number }> = {};
    filteredProjects.forEach(p => {
      if (!groups[p.weekOfYear]) {
        groups[p.weekOfYear] = { count: 0, sum: 0 };
      }
      groups[p.weekOfYear].count++;
      groups[p.weekOfYear].sum += p.progress;
    });
    return Object.keys(groups).map(wk => {
      const wNum = parseInt(wk);
      const avg = Math.round(groups[wNum].sum / groups[wNum].count);
      return { name: `Semana ${wNum}`, progressoMedio: avg };
    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [filteredProjects]);

  // Chart 4: Burndown simulation (tasks remaining over projects schedule)
  const burndownData = useMemo(() => {
    const data = [
      { name: "Semana 18", planejado: 55, real: 54 },
      { name: "Semana 19", planejado: 45, real: 41 },
      { name: "Semana 20", planejado: 32, real: 30 },
      { name: "Semana 21", planejado: 22, real: 18 },
      { name: "Semana 22 (Atual)", planejado: 12, real: 10 },
      { name: "Semana 23", planejado: 5, real: null },
      { name: "Semana 24", planejado: 0, real: null }
    ];
    return data;
  }, []);

  return (
    <div className="space-y-6">
      {/* Search and Advanced Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between md:gap-4 space-y-3 md:space-y-0">
          <div className="flex-1 max-w-md relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por código, nome de projeto ou cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div className="flex items-center text-xs text-slate-400 gap-2">
            <Filter className="h-4 w-4 text-cyan-400" />
            <span>Filtros Rápidos</span>
            { (filterWeek !== "all" || filterManager !== "all" || filterStatus !== "all" || filterPriority !== "all" || searchQuery !== "") && (
              <button
                onClick={() => {
                  setFilterWeek("all");
                  setFilterManager("all");
                  setFilterStatus("all");
                  setFilterPriority("all");
                  setSearchQuery("");
                }}
                className="ml-2 text-cyan-400 hover:underline cursor-pointer font-medium"
              >
                Limpar todos
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 rounded-lg p-3">
          {/* Week Filter */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Semana do Ano</label>
            <select
              value={filterWeek}
              onChange={(e) => setFilterWeek(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Semanas (Todas)</option>
              {weeksList.map(wk => (
                <option key={wk} value={wk}>Semana {wk}</option>
              ))}
            </select>
          </div>

          {/* Responsible Filter */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">{t.manager}</label>
            <select
              value={filterManager}
              onChange={(e) => setFilterManager(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">{t.manager === "Developer" ? "Developers (Todos)" : "Gestores (Todos)"}</option>
              {managersList.map(mgr => (
                <option key={mgr} value={mgr}>{mgr}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Status Projeto</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Status (Todos)</option>
              <option value="Não iniciado">Não iniciado</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Em risco">Em risco</option>
              <option value="Atrasado">Atrasado</option>
              <option value="Concluído">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-1">
            <label className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Prioridade</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Prioridades (Todas)</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Keycards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-cyan-950/50 border border-cyan-800/30 text-cyan-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Projetos</p>
            <h3 className="text-2xl font-bold text-slate-100 font-mono mt-0.5">{totalProjectsCount}</h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/30 text-red-400 animate-pulse">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Atrasados / Risco</p>
            <h3 className="text-2xl font-bold text-slate-100 font-mono mt-0.5">{overdueProjectsCount}</h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/30 text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Concluídos</p>
            <h3 className="text-2xl font-bold text-slate-100 font-mono mt-0.5">{completedProjectsCount}</h3>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tarefas Ativas</p>
            <h3 className="text-2xl font-bold text-slate-100 font-mono mt-0.5">{pendingTasksCount}</h3>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-teal-400">
            <ListTodo className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Task Resolvidas</p>
            <h3 className="text-2xl font-bold text-slate-100 font-mono mt-0.5">{completedTasksCount}</h3>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center space-x-3.5">
          <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-800/25 text-teal-300">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Progresso Geral</p>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-100 font-mono">{averageProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
              <div 
                className="bg-cyan-500 h-1 rounded-full transition-all duration-500" 
                style={{ width: `${averageProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Graphs Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* G1: Project Status (Donut representation) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-cyan-400" /> Distribuição por Status de Projeto
          </h3>
          <div className="h-64 flex flex-col md:flex-row items-center justify-around">
            <div className="w-full md:w-3/5 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectsByStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {projectsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#ccc"} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", color: "#f8fafc" }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend block */}
            <div className="flex flex-col space-y-1.5 text-xs text-slate-400 w-full md:w-2/5">
              {projectsByStatusData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-200 font-semibold">{item.value} proj</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* G2: Tasks priority bar chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-cyan-400" /> Tarefas por Prioridade
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksByPriorityData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" style={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", color: "#f8fafc" }}
                />
                <Bar dataKey="quantidade" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                  {tasksByPriorityData.map((entry, index) => {
                    let color = "#0ea5e9";
                    if (entry.name === "Crítica") color = "#ef4444";
                    else if (entry.name === "Alta") color = "#f59e0b";
                    else if (entry.name === "Baixa") color = "#94a3b8";
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* G3: Weekly progress evolution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-cyan-400" /> Evolução de Progresso Médio Semanal (%)
          </h3>
          <div className="h-64">
            {weeklyEvolutionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Sem projetos suficientes para renderizar tendência.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyEvolutionData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 10 }} />
                  <YAxis type="number" domain={[0, 100]} stroke="#64748b" style={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", color: "#f8fafc" }}
                  />
                  <Area type="monotone" dataKey="progressoMedio" stroke="#10b981" fillOpacity={1} fill="url(#colorProgress)" strokeWidth={2} name="Progresso Médio (%)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* G4: Burndown Chart Simulator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-cyan-400" /> Sprint Burndown de Esforço (Tasks Restantes)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" style={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "8px", color: "#f8fafc" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="planejado" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" name="Linha Base Planejada" />
                <Line type="monotone" dataKey="real" stroke="#ef4444" strokeWidth={2.5} connectNulls name="Progresso Real Ativo" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recents Projects Table list */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Portfólio Corp - Últimos Projetos Atualizados</h3>
          <button
            onClick={() => onNavigateToTab("projects")}
            className="text-xs text-cyan-400 hover:underline hover:text-cyan-300 font-medium cursor-pointer"
          >
            Ver todos {projects.length} projetos
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/40">
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Nome / {t.client}</th>
                <th className="py-2.5 px-3">{t.manager}</th>
                <th className="py-2.5 px-3 select-none">Progresso</th>
                <th className="py-2.5 px-3">Semana</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProjects.slice(0, 6).map(p => {
                const badgeColor = 
                  p.color === "Verde" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
                  p.color === "Amarelo" ? "bg-amber-500/15 border-amber-500/30 text-amber-400" :
                  p.color === "Vermelho" ? "bg-red-500/15 border-red-500/30 text-red-400" :
                  p.color === "Azul" ? "bg-indigo-500/15 border-indigo-500/30 text-cyan-400" :
                  "bg-slate-500/15 border-slate-500/30 text-slate-400";

                return (
                  <tr 
                    key={p.id} 
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => onSelectProject(p.id)}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-400">{p.code}</td>
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-semibold text-slate-200 line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{t.client}: <span className="font-semibold text-slate-300">{p.client}</span></p>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{p.responsibleName}</td>
                    <td className="py-3 px-3 w-36">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-100 font-mono w-7">{p.progress}%</span>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 flex-1">
                          <span 
                            className="bg-cyan-500 h-1.5 rounded-full block" 
                            style={{ width: `${p.progress}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">Sm {p.weekOfYear}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeColor}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{new Date(p.endDate).toLocaleDateString("pt-BR", { day: "numeric", month: "numeric" })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
