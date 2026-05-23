import React, { useState, useMemo } from "react";
import { Project, Task } from "../types";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flag,
  Target,
  Search,
  Sparkles,
  Info
} from "lucide-react";

interface CalendarViewProps {
  projects: Project[];
  tasks: Task[];
  onSelectProject: (id: string) => void;
}

export default function CalendarView({ projects, tasks, onSelectProject }: CalendarViewProps) {
  // We represent the middle of the year 2026 where seed projects are populated
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(4); // 4 = May, 5 = June, 6 = July (0-indexed)

  const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // Navigate month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Helper inside loop: find week number from Date
  const getWeekNumForCalendarRow = (firstDayOfGridRow: Date): number => {
    const d = new Date(firstDayOfGridRow);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Days mapping in grids format for target month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // start on Monday
    const gridDays: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];

    // Fill preceding offset days (before Monday)
    const prevMonthEnd = new Date(currentYear, currentMonth, 0);
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth - 1, prevMonthEnd.getDate() - i);
      gridDays.push({ date: prevDate, isCurrentMonth: false, key: `prev-${prevDate.getDate()}` });
    }

    // Fill current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const activeDate = new Date(currentYear, currentMonth, i);
      gridDays.push({ date: activeDate, isCurrentMonth: true, key: `curr-${i}` });
    }

    // Fill remaining days of the last week row
    const totalFilled = gridDays.length;
    const remaining = totalFilled % 7 === 0 ? 0 : 7 - (totalFilled % 7);
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      gridDays.push({ date: nextDate, isCurrentMonth: false, key: `next-${i}` });
    }

    return gridDays;
  }, [currentYear, currentMonth]);

  // Aggregate deliverables by date (projects end date)
  const deliverablesAndTasksByDate = useMemo(() => {
    const map: Record<string, { projects: Project[]; tasks: Task[] }> = {};

    projects.forEach(p => {
      const dStr = new Date(p.endDate).toISOString().slice(0, 10);
      if (!map[dStr]) map[dStr] = { projects: [], tasks: [] };
      map[dStr].projects.push(p);
    });

    tasks.forEach(t => {
      const dStr = new Date(t.endDate).toISOString().slice(0, 10);
      if (!map[dStr]) map[dStr] = { projects: [], tasks: [] };
      map[dStr].tasks.push(t);
    });

    return map;
  }, [projects, tasks]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Header controls layout selection */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-slate-100 gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <CalendarDays className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold">Calendário de Entregas Corporativas</h2>
            <p className="text-[11px] text-slate-400">Linha de data de milestones e acompanhamento de tarefas finalizadas.</p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center space-x-3 bg-slate-950 px-2 py-1 border border-slate-800 rounded-lg">
          <button 
            onClick={handlePrevMonth}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-200 select-none min-w-[100px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button 
            onClick={handleNextMonth}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Week overview information strip */}
      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/40 text-[10px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Target className="h-3.5 w-3.5 text-cyan-500" />
          <span>Fitas em azul indicam as datas limite das tarefas. Ícones em laranja marcam Marcos de Entrega.</span>
        </span>
        <span className="font-semibold text-slate-400">Data de controle: 22/05/2026 (Semana 21)</span>
      </div>

      {/* Main Grid: Rows displaying 7 columns + 1 week margin indicator */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
        
        {/* Days labels */}
        <div className="grid grid-cols-8 h-9 border-b border-slate-800 bg-slate-900 select-none text-[10px] font-bold text-slate-400 tracking-wider text-center items-center">
          <div className="border-r border-slate-800 text-slate-500 uppercase h-full flex items-center justify-center">Semana</div>
          <div className="h-full flex items-center justify-center uppercase">Seg</div>
          <div className="h-full flex items-center justify-center uppercase">Ter</div>
          <div className="h-full flex items-center justify-center uppercase">Qua</div>
          <div className="h-full flex items-center justify-center uppercase">Qui</div>
          <div className="h-full flex items-center justify-center uppercase">Sex</div>
          <div className="h-full flex items-center justify-center uppercase">Sáb</div>
          <div className="h-full flex items-center justify-center uppercase text-red-500">Dom</div>
        </div>

        {/* Days grid values mapping */}
        <div className="divide-y divide-slate-800/80">
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
            const rowDays = calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7);
            const rowWeekNum = getWeekNumForCalendarRow(rowDays[0].date);

            return (
              <div key={weekIndex} className="grid grid-cols-8 min-h-[100px]">
                
                {/* Week number indicator column */}
                <div className="bg-slate-900/40 border-r border-slate-800 flex flex-col items-center justify-center text-center p-2.5 shrink-0 select-none">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Semana</span>
                  <span className="text-sm font-extrabold text-cyan-400 font-mono mt-0.5">{rowWeekNum}</span>
                </div>

                {/* 7 Day block inputs */}
                {rowDays.map((cell, idx) => {
                  const dStr = cell.date.toISOString().slice(0, 10);
                  const cellEvents = deliverablesAndTasksByDate[dStr] || { projects: [], tasks: [] };
                  const isToday = dStr === "2026-05-22";

                  return (
                    <div 
                      key={cell.key}
                      className={`p-1.5 border-r border-slate-800 last:border-r-0 flex flex-col space-y-1.5 min-h-[105px] overflow-hidden ${
                        cell.isCurrentMonth ? "bg-slate-950/20" : "bg-slate-900/15"
                      } ${isToday ? "ring-1 ring-inset ring-cyan-500/80 bg-cyan-950/5" : ""}`}
                    >
                      {/* Day number */}
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold select-none px-1">
                        <span 
                          className={
                            isToday ? "bg-cyan-500 text-slate-950 w-5 h-5 flex items-center justify-center rounded-full" :
                            cell.isCurrentMonth ? "text-slate-300" : "text-slate-600"
                          }
                          title={isToday ? "Hoje (22 de Maio, 2026)" : undefined}
                        >
                          {cell.date.getDate()}
                        </span>
                        {/* Event count indicators */}
                        { (cellEvents.projects.length > 0 || cellEvents.tasks.length > 0) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        )}
                      </div>

                      {/* Display projects and tasks as small colored chips */}
                      <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                        
                        {/* Milestone indicators */}
                        {cellEvents.projects.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => onSelectProject(p.id)}
                            className="bg-amber-950/40 border border-amber-500/40 text-amber-300 rounded text-[9px] font-bold px-1.5 py-0.5 mt-1 select-none flex items-center gap-1 cursor-pointer truncate transition-all hover:bg-amber-900/30"
                            title={`Março de Entrega do Projeto: ${p.name}`}
                          >
                            <Flag className="w-2.5 h-2.5 shrink-0 text-amber-400" />
                            <span>{p.code} - MVP</span>
                          </div>
                        ))}

                        {/* Task end indicators */}
                        {cellEvents.tasks.map(t => (
                          <div 
                            key={t.id}
                            className="bg-indigo-950/40 border border-indigo-500/30 text-cyan-300 rounded text-[9px] px-1.5 py-0.5 truncate select-none hover:bg-slate-800 flex items-center gap-1 cursor-help transition"
                            title={`Tarefa SLA: ${t.title} [Responsável: ${t.responsibleName}] [Status: ${t.status}]`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                            <span>{t.title}</span>
                          </div>
                        ))}
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
  );
}
