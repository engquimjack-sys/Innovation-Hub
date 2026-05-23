import React, { useState, useMemo, useRef } from "react";
import { Project, Task } from "../types";
import {
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  AlertOctagon,
  CheckCircle,
  Clock,
  Sliders,
  Sparkles
} from "lucide-react";

interface GanttChartProps {
  projects: Project[];
  tasks: Task[];
  onSelectProject: (id: string) => void;
}

export default function GanttChart({ projects, tasks, onSelectProject }: GanttChartProps) {
  const [zoomMode, setZoomMode] = useState<"semanal" | "mensal">("semanal"); // weekly or monthly Gantt zoom
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const timelineRef = useRef<HTMLDivElement>(null);

  const UNIQUE_ASSIGNEES = useMemo(() => {
    const list = new Set<string>();
    projects.forEach(p => list.add(p.responsibleName));
    tasks.forEach(t => list.add(t.responsibleName));
    return Array.from(list).sort();
  }, [projects, tasks]);

  // Filter projects/tasks by assignee if configured
  const filteredProjects = useMemo(() => {
    if (assigneeFilter === "all") return projects;
    return projects.filter(p => p.responsibleName === assigneeFilter);
  }, [projects, assigneeFilter]);

  // Gantt Date Range bounds: Find earliest start date and latest end date of items
  const rangeBounds = useMemo(() => {
    let minDate = new Date("2026-05-01");
    let maxDate = new Date("2026-07-15");

    if (projects.length > 0) {
      const starts = projects.map(p => new Date(p.startDate).getTime());
      const ends = projects.map(p => new Date(p.endDate).getTime());
      
      const realMin = new Date(Math.min(...starts));
      const realMax = new Date(Math.max(...ends));
      
      // Pad out by buffer
      realMin.setDate(realMin.getDate() - 5);
      realMax.setDate(realMax.getDate() + 10);
      
      minDate = realMin;
      maxDate = realMax;
    }
    return { minDate, maxDate };
  }, [projects]);

  // Generate grid columns based on Zoom mode (semanal = daily blocks grouped by weeks; mensal = weekly blocks grouped by month)
  const timelineColumns = useMemo(() => {
    const columns: Array<{ dateString: string; label: string; weekNum: number; monthName: string }> = [];
    const current = new Date(rangeBounds.minDate);
    const end = new Date(rangeBounds.maxDate);

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    if (zoomMode === "semanal") {
      // Create column blocks for each day or every 2 days of grid to keep structure clean
      while (current <= end) {
        // Find week num
        const d = new Date(current);
        d.setHours(0,0,0,0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

        columns.push({
          dateString: current.toISOString().slice(0, 10),
          label: `${current.getDate()} ${monthNames[current.getMonth()]}`,
          weekNum: weekNo,
          monthName: monthNames[current.getMonth()]
        });
        current.setDate(current.getDate() + 2); // Step in 2-day increments to accommodate horizontal density
      }
    } else {
      // Monthly mode - Group by 1-week intervals
      while (current <= end) {
        const d = new Date(current);
        d.setHours(0,0,0,0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

        columns.push({
          dateString: current.toISOString().slice(0, 10),
          label: `Seman ${weekNo}`,
          weekNum: weekNo,
          monthName: monthNames[current.getMonth()]
        });
        current.setDate(current.getDate() + 7); // Step weekly
      }
    }
    return columns;
  }, [rangeBounds, zoomMode]);

  const totalGridColumns = timelineColumns.length;

  // Calculador de posicionamento horizontal da barra no Gantt
  const getGanttBarPositions = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();

    const minTime = rangeBounds.minDate.getTime();
    const maxTime = rangeBounds.maxDate.getTime();
    const totalTimeSpan = maxTime - minTime;

    // Safety margins
    const relativeStart = Math.max(0, start - minTime);
    const relativeDuration = Math.max(0, end - start);

    const startPercent = Math.min(100, Math.max(0, (relativeStart / totalTimeSpan) * 100));
    const widthPercent = Math.min(100 - startPercent, Math.max(2, (relativeDuration / totalTimeSpan) * 100));

    return {
      left: `${startPercent.toFixed(2)}%`,
      width: `${widthPercent.toFixed(2)}%`
    };
  };

  // Check if dates indicate delay
  const isOverdue = (endDateStr: string, progress: number, status: string) => {
    const today = new Date("2026-05-22");
    const end = new Date(endDateStr);
    return status !== "Concluído" && status !== "Cancelado" && end < today;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md p-5 space-y-5">
      {/* Header controls layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between text-slate-100 gap-4">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-cyan-400" /> Cronograma Integrado - Linha do Tempo Gantt
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualização dinâmica de precedências e prazos de projetos e entregas com análise de folgas.
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoomMode("semanal")}
              className={`text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer ${zoomMode === "semanal" ? "bg-slate-800 text-cyan-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
            >
              Zoom Semanal
            </button>
            <button
              onClick={() => setZoomMode("mensal")}
              className={`text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer ${zoomMode === "mensal" ? "bg-slate-800 text-cyan-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
            >
              Zoom Mensal
            </button>
          </div>

          {/* Assignee options filter */}
          <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 border border-slate-800 rounded-lg">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-xs text-slate-300 bg-transparent focus:outline-none pr-1 focus:ring-0 max-w-[140px]"
            >
              <option value="all" className="bg-slate-950 text-slate-200">Qualquer Líder</option>
              {UNIQUE_ASSIGNEES.map(item => (
                <option key={item} value={item} className="bg-slate-950 text-slate-200">{item}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Date timeline reference metadata banner */}
      <div className="bg-slate-950 rounded-lg p-3 flex items-center justify-between text-[11px] text-slate-500 border border-slate-800/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
          <span>Legenda de Cores por Status:</span>
          <span className="flex items-center gap-1 ml-2"><span className="w-2 h-2 rounded bg-cyan-500" /> Em Andamento</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Concluído</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> Em Risco</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500 animate-pulse" /> Atrasado (Flag)</span>
        </div>
        <div className="font-semibold text-slate-400 bg-slate-900 border border-slate-800 rounded px-2.5 py-0.5">
          Data de Referência: 22 de Maio, 2026
        </div>
      </div>

      {/* Primary Gantt Split Grid Structure */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex flex-col md:flex-row">
        
        {/* Left Side: Solid list of Project / Tasks titles - Width fixed on desktop */}
        <div className="w-full md:w-80 shrink-0 border-r border-slate-800 bg-slate-900/60 divide-y divide-slate-800">
          <div className="h-10 px-4 flex items-center bg-slate-900 text-slate-300 font-semibold text-xs select-none uppercase tracking-wider">
            Estrutura Analítica (EAP)
          </div>

          <div className="divide-y divide-slate-800/50">
            {filteredProjects.map(proj => {
              // Get tasks of this specific project
              const projTasks = tasks.filter(t => t.projectId === proj.id);
              
              return (
                <div key={proj.id} className="bg-slate-900/30">
                  {/* Project Row detail */}
                  <div 
                    onClick={() => onSelectProject(proj.id)}
                    className="h-14 px-3 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer border-l-4 border-cyan-500 transition-all font-sans"
                  >
                    <div className="min-w-0 pr-1 select-none">
                      <p className="text-xs font-bold text-slate-100 truncate">{proj.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                        <span className="font-semibold text-cyan-400">{proj.code}</span> • Ldr: {proj.responsibleName}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] bg-slate-950 font-semibold px-1.5 py-0.5 text-slate-300 border border-slate-800 rounded font-mono">
                      {proj.progress}%
                    </span>
                  </div>

                  {/* Tasks nested listing */}
                  {projTasks.map(t => (
                    <div key={t.id} className="h-10 pl-6 pr-3 flex items-center justify-between border-t border-slate-800/30 hover:bg-slate-800/10">
                      <div className="min-w-0 pr-1 select-none">
                        <p className="text-[11px] text-slate-300 font-medium truncate">{t.title}</p>
                        <p className="text-[9px] text-slate-500 font-mono">Status: {t.status} | {t.responsibleName}</p>
                      </div>
                      {/* Overdue alert indicator */}
                      {isOverdue(t.endDate, t.status === "Done" ? 100 : 0, t.status) && (
                        <div className="text-red-500 animate-bounce" title="Tarefa Atrasada">
                          <AlertOctagon className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
            
            {filteredProjects.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 select-none">
                Nenhum projeto pendente com os filtros informados.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Timeline scrolling canvas */}
        <div className="flex-1 overflow-x-auto" ref={timelineRef}>
          <div className="min-w-[700px] divide-y divide-slate-800 position-relative h-full">
            
            {/* Horizontal Headers Blocks representing Weeks/Calendar days */}
            <div className="h-10 flex bg-slate-900 border-b border-slate-800">
              {timelineColumns.map((col, idx) => (
                <div 
                  key={`${col.dateString}-${idx}`}
                  className="flex-1 shrink-0 border-r border-slate-800/40 text-center flex flex-col justify-center text-[10px] h-full"
                >
                  <span className="font-bold text-slate-200">{col.label}</span>
                  <span className="text-[8px] text-slate-500 font-mono uppercase">Sm {col.weekNum}</span>
                </div>
              ))}
            </div>

            {/* Scrolling grid content alignment matched with left items */}
            <div className="divide-y divide-slate-800/50">
              {filteredProjects.map(proj => {
                const projTasks = tasks.filter(t => t.projectId === proj.id);
                const projBar = getGanttBarPositions(proj.startDate, proj.endDate);

                // Set status color for project
                let prjColor = "from-cyan-500 to-indigo-600";
                if (proj.status === "Concluído") prjColor = "from-emerald-500 to-teal-600";
                else if (proj.status === "Em risco") prjColor = "from-amber-500 to-orange-600";
                else if (p_is_overdue(proj.endDate, proj.progress, proj.status)) prjColor = "from-red-500 to-rose-600";
                
                return (
                  <div key={`${proj.id}-timeline`} className="bg-slate-900/10 divide-y divide-slate-800/20">
                    
                    {/* Project timeline bar segment row */}
                    <div className="h-14 relative px-2 flex items-center">
                      {/* Grid background markers */}
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: totalGridColumns }).map((_, i) => (
                          <div key={i} className="flex-1 border-r border-slate-800/20" />
                        ))}
                      </div>

                      {/* Actual Project Gantt bar */}
                      <div 
                        style={{ left: projBar.left, width: projBar.width }}
                        className="h-7 absolute rounded-lg bg-gradient-to-r shadow-md overflow-hidden flex items-center px-2.5 min-w-[20px] transition-all z-10"
                        title={`${proj.name} [${proj.startDate.slice(0, 10)} até ${proj.endDate.slice(0, 10)}]`}
                      >
                        {/* Shimmer inner progress */}
                        <div 
                          className="absolute inset-y-0 left-0 bg-slate-950/25 transition-all" 
                          style={{ width: `${proj.progress}%` }} 
                        />
                        <span className="text-[10px] font-bold text-white relative z-20 truncate">
                          {proj.code} - {proj.progress}%
                        </span>
                      </div>
                    </div>

                    {/* Task blocks timeline child rows */}
                    {projTasks.map(t => {
                      const tBar = getGanttBarPositions(t.startDate, t.endDate);
                      const isTaskLate = isOverdue(t.endDate, t.status === "Done" ? 100 : 0, t.status);

                      let taskColorBase = "bg-slate-700 hover:bg-slate-600";
                      if (t.status === "Done") taskColorBase = "bg-emerald-600/90";
                      else if (t.status === "Doing") taskColorBase = "bg-cyan-600";
                      else if (t.status === "Review") taskColorBase = "bg-indigo-600";
                      
                      if (isTaskLate) {
                        taskColorBase = "bg-red-500/95 animate-pulse border border-red-400";
                      }

                      return (
                        <div key={`${t.id}-timeline`} className="h-10 relative px-2 flex items-center bg-slate-950/20">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex">
                            {Array.from({ length: totalGridColumns }).map((_, i) => (
                              <div key={i} className="flex-1 border-r border-slate-800/15" />
                            ))}
                          </div>

                          {/* Task visual block */}
                          <div 
                            style={{ left: tBar.left, width: tBar.width }}
                            className={`h-4 border-slate-800/30 absolute rounded-full ${taskColorBase} flex items-center justify-between px-2 text-[9px] font-bold text-slate-100 min-w-[15px] shadow-sm z-10 cursor-help`}
                            title={`${t.title} [Status: ${t.status}] [Líder: ${t.responsibleName}] [De ${t.startDate.slice(0, 10)} a ${t.endDate.slice(0, 10)}]`}
                          >
                            <span className="truncate pr-1">{t.title}</span>
                            { t.status === "Done" && (
                              <CheckCircle className="h-2.5 w-2.5 text-emerald-200 shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper inside loop function to maintain clean codes
  function p_is_overdue(endStr: string, progress: number, status: string): boolean {
    const today = new Date("2026-05-22");
    return status !== "Concluído" && status !== "Cancelado" && new Date(endStr) < today;
  }
}
