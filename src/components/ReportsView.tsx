import React, { useState, useMemo } from "react";
import { Project, Task } from "../types";
import { Language, translations } from "../translations";
import {
  FileText,
  Download,
  AlertTriangle,
  Award,
  Clock,
  Sparkles,
  TrendingUp,
  Table,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react";

interface ReportsViewProps {
  projects: Project[];
  tasks: Task[];
}

export default function ReportsView({ projects, tasks }: ReportsViewProps) {
  const language = (localStorage.getItem("innovation_lang") as any) || "pt";
  const t = translations[language] || translations.pt;
  const [activeReportTab, setActiveReportTab] = useState<"sla" | "delays" | "team">("sla");

  const today = new Date("2026-05-22");

  // Filter 1: Delayed Projects (Status = Atrasado OR endDate passed today and not Done)
  const delayedProjects = useMemo(() => {
    return projects.filter(p => p.status === "Atrasado" || (p.status !== "Concluído" && p.status !== "Cancelado" && new Date(p.endDate) < today));
  }, [projects]);

  // Filter 2: Critical Pending Tasks (Status !== Done AND priority === Crítica / Alta)
  const criticalTasks = useMemo(() => {
    return tasks.filter(t => t.status !== "Done" && (t.priority === "Crítica" || t.priority === "Alta"));
  }, [tasks]);

  // Calculate team execution stats
  const teamPerformance = useMemo(() => {
    const list = [
      { name: "Carlos Silveira", role: "Administrador", completed: 0, pending: 0, sla: 98, codeSpeed: "Excelente" },
      { name: "Mariana Costa", role: "Gerente", completed: 0, pending: 0, sla: 94, codeSpeed: "Excelente" },
      { name: "Rodrigo Santos", role: "Usuário", completed: 0, pending: 0, sla: 88, codeSpeed: "Boa" }
    ];

    tasks.forEach(t => {
      list.forEach(member => {
        if (t.responsibleName === member.name) {
          if (t.status === "Done") {
            member.completed++;
          } else {
            member.pending++;
          }
        }
      });
    });

    return list;
  }, [tasks]);

  // Overall portfolio metric calculations
  const totalSlaRatio = useMemo(() => {
    const completedTasksOnTime = tasks.filter(t => {
      if (t.status !== "Done") return false;
      const tEnd = new Date(t.endDate);
      const tStart = new Date(t.startDate);
      // Simulation of prompt delivery
      return true;
    }).length;
    return tasks.length > 0 ? Math.round((completedTasksOnTime / tasks.length) * 100) : 100;
  }, [tasks]);

  const handleExportCSV = () => {
    // Navigate straight to our Express CSV builder
    window.location.href = "/api/reports/export";
  };

  return (
    <div className="space-y-5">
      {/* Excel/PDF Simulation Banner controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between text-slate-100 gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-3 text-slate-100">
          <div className="p-2.5 bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 rounded-lg">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Painel de Exportação e Auditoria</h2>
            <p className="text-[11px] text-slate-400">Emita relatórios executivos homologados para auditorias e reuniões de diretoria.</p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 hover:text-white text-xs font-semibold rounded-lg text-slate-100 transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" /> <span>Exportar Base Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Grid selector report tabs */}
      <div className="grid grid-cols-3 gap-2.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
        <button
          onClick={() => setActiveReportTab("sla")}
          className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeReportTab === "sla" ? "bg-slate-900 text-cyan-400 font-bold border border-slate-800" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Relatório de SLAs
        </button>
        <button
          onClick={() => setActiveReportTab("delays")}
          className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeReportTab === "delays" ? "bg-slate-900 text-red-400 font-bold border border-slate-800" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Projetos Atrasados E Gargalos
        </button>
        <button
          onClick={() => setActiveReportTab("team")}
          className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeReportTab === "team" ? "bg-slate-900 text-teal-400 font-bold border border-slate-800" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Metrificação de Equipe
        </button>
      </div>

      {/* Main Container of reports tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm min-h-[300px]">
        {activeReportTab === "sla" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-cyan-400" /> Aderência Geral de SLA e Indicadores de Qualidade
              </h3>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-mono">Maio 2026</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/40 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Acordo de SLA de Integridade</span>
                <p className="text-3xl font-extrabold text-slate-100 font-mono">92.4%</p>
                <span className="text-[10px] text-slate-400 flex items-center gap-1"><TrendingUp className="h-3 w-3 text-emerald-400" /> +1.2% em relação ao mês anterior</span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/40 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Tarefas Concluídas / Semana</span>
                <p className="text-3xl font-extrabold text-slate-100 font-mono">5.2 proj</p>
                <span className="text-[10px] text-slate-500">Média de releases semanais de features</span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/40 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Desvio Médio de Cronogramas</span>
                <p className="text-3xl font-extrabold text-slate-100 font-mono">~ 3 dias</p>
                <span className="text-[10px] text-red-400 font-semibold">Tolerância aceitável excedida em 12%</span>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <h4 className="text-xs font-semibold text-slate-300">Análise SLA Corporativa por Divisão de Projetos</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/50 bg-slate-950/40 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Divisão Tecnológica</th>
                      <th className="py-2.5 px-3">Projetos Ativos</th>
                      <th className="py-2.5 px-3">Aderência SLA</th>
                      <th className="py-2.5 px-3">Qualidade releases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    <tr className="hover:bg-slate-800/25">
                      <td className="py-3 px-3 font-semibold">Finanças e Core Fintech</td>
                      <td className="py-3 px-3 font-mono font-bold">8 projetos</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 font-mono">94%</span>
                          <div className="w-20 bg-slate-800 rounded-full h-1"><span className="bg-cyan-500 block h-1 rounded text-[2px]" style={{ width: "94%" }} /></div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-semibold">Excelente</td>
                    </tr>
                    <tr className="hover:bg-slate-800/25">
                      <td className="py-3 px-3 font-semibold">Saúde e Telemedicina Einstein</td>
                      <td className="py-3 px-3 font-mono font-bold">4 projetos</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 font-mono">98%</span>
                          <div className="w-20 bg-slate-800 rounded-full h-1"><span className="bg-emerald-500 block h-1 rounded text-[2px]" style={{ width: "98%" }} /></div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-emerald-500 font-semibold">Excelente</td>
                    </tr>
                    <tr className="hover:bg-slate-800/25">
                      <td className="py-3 px-3 font-semibold">Infraestrutura em Nuvem (AWS/GCP)</td>
                      <td className="py-3 px-3 font-mono font-bold">12 projetos</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 font-mono">85%</span>
                          <div className="w-20 bg-slate-800 rounded-full h-1"><span className="bg-amber-500 block h-1 rounded text-[2px]" style={{ width: "85%" }} /></div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-amber-500 font-semibold">Moderado</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeReportTab === "delays" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Projetos Críticos com Risco de Estouro de Cronograma
              </h3>
              <span className="text-[10px] bg-red-950 font-semibold px-2 py-0.5 rounded text-red-400 font-mono">
                {delayedProjects.length} Registros de Atraso
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/50 bg-slate-950/20 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2 px-3">Código</th>
                    <th className="py-2 px-3">Projeto</th>
                    <th className="py-2 px-3">{t.manager}</th>
                    <th className="py-2 px-3">Data Limite Contrato</th>
                    <th className="py-2 px-3 select-none">Progresso Alvo</th>
                    <th className="py-2 px-3">SLA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {delayedProjects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/25">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-400">{p.code}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-[10px] text-slate-500">{t.client}: {p.client}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{p.responsibleName}</td>
                      <td className="py-2.5 px-3 font-mono text-read-400 text-red-300">{new Date(p.endDate).toLocaleDateString("pt-BR")}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-100 font-mono">{p.progress}%</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-950 border border-red-900 text-red-400">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {delayedProjects.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-500 font-semibold select-none">
                        Parabéns! Nenhum projeto pendente de cronograma em atraso.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Critical backlog task sections */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Gargalos Operacionais em Atividades Críticas ({criticalTasks.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {criticalTasks.slice(0, 4).map(t => (
                  <div key={t.id} className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2 select-none animate-ping" />
                    <div>
                      <p className="font-semibold text-slate-200 text-xs lines-clamp-1">{t.title}</p>
                      <p className="text-[10px] text-slate-500">Dono: <span className="text-slate-400 font-semibold">{t.responsibleName}</span> • Limite: {new Date(t.endDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeReportTab === "team" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-teal-400 flex items-center gap-1.5">
                < Award className="h-4 w-4" /> Produtividade e Capacidade de Carga da Equipe Técnica
              </h3>
              <span className="text-[10px] bg-teal-950 px-2 py-0.5 rounded text-teal-400 font-mono">
                Auditoria de SLA Semanal
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/50 bg-slate-950/20 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2 px-3">Profissional</th>
                    <th className="py-2 px-3 text-center">Atividades Entregues</th>
                    <th className="py-2 px-3 text-center">Sobrecarga Físico (Pendentes)</th>
                    <th className="py-2 px-3 text-center">Aderência Histórica SLA (%)</th>
                    <th className="py-2 px-3 text-center">Nível Produtividade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {teamPerformance.map(member => (
                    <tr key={member.name} className="hover:bg-slate-800/25">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-200">{member.name}</p>
                        <p className="text-[10px] text-slate-500">{member.role}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">{member.completed} tasks</td>
                      <td className="py-2.5 px-3 text-center font-mono text-amber-500 font-semibold">{member.pending} ativas</td>
                      <td className="py-2.5 px-3 text-center font-mono text-cyan-400 font-bold">{member.sla}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                          {member.codeSpeed}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Performance analysis metrics */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/40 text-[10px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-300">Dica de Gestão Executiva pelo Líder:</p>
              <p className="leading-relaxed">O nível de sobrecarga física ideal por colaborador é de no máximo **3 tarefas ativas** simultaneamente. Atualmente, o índice médio de produtividade encontra-se estável, indicando excelente capacidade de vazão do comitê corporativo.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
