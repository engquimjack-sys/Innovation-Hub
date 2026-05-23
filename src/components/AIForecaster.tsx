import React, { useState, useEffect } from "react";
import { Project, AIForecastResult } from "../types";
import {
  BrainCircuit,
  Loader2,
  CheckCircle,
  AlertOctagon,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Info
} from "lucide-react";

interface AIForecasterProps {
  project: Project | null;
}

export default function AIForecaster({ project }: AIForecasterProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIForecastResult | null>(null);
  const [errorString, setErrorString] = useState<string | null>(null);

  // Trigger analysis when selected project changes
  useEffect(() => {
    if (!project) {
      setResult(null);
      return;
    }
    
    const fetchForecast = async () => {
      setLoading(true);
      setErrorString(null);
      try {
        const response = await fetch(`/api/projects/${project.id}/forecast`);
        if (!response.ok) {
          throw new Error("Falha ao comunicar com o servidor de inteligência.");
        }
        const data = await response.json();
        setResult(data);
      } catch (err: any) {
        console.error("AI forecaster error: ", err);
        setErrorString(err?.message || "Algo deu errado durante a execução do LLM.");
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [project]);

  if (!project) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        <BrainCircuit className="h-10 w-10 text-slate-700 mx-auto mb-3" />
        <p className="text-xs font-semibold">Previsibilidade com Inteligência Artificial</p>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
          Selecione qualquer projeto corporativo na lateral ou na aba de portfólio para obter uma análise inteligente de risco de atraso com o Gemini.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Title banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-purple-950/40 border border-purple-800/30 text-purple-400 rounded-lg animate-pulse">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">
              IA Previsão de Atrasos - Gemini 3.5
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Análise cognitiva baseada em checklists, datas-limite e dependências de {project.code}.
            </p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-950 border border-slate-800 rounded-md px-2.5 py-0.5 text-slate-400 font-mono">
          Ref: 22 de Maio
        </span>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-xs font-semibold text-slate-300">Consultando Gemini 3.5 Flash...</p>
            <p className="text-[10px] text-slate-500 max-w-xs">
              Mapeando matriz de pendências, folgas de cronograma e marcos contratuais para {project.code}.
            </p>
          </div>
        </div>
      ) : errorString ? (
        <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-lg flex items-start space-x-2.5 text-xs text-red-400">
          <AlertOctagon className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Ocorreu um Erro</p>
            <p className="text-slate-400 mt-0.5">{errorString}</p>
          </div>
        </div>
      ) : result ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Left panel: Risk gauge gauge meters */}
          <div className="md:col-span-2 bg-slate-950 border border-slate-800/50 rounded-lg p-4 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Probabilidade Calculada</span>
            
            {/* Visual Circular progression */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className="stroke-slate-800 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  className={
                    result.delayProbability > 75 ? "stroke-red-500 fill-none" :
                    result.delayProbability > 45 ? "stroke-amber-500 fill-none" : "stroke-emerald-500 fill-none"
                  }
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - result.delayProbability / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center text-slate-100 select-none">
                <span className="text-2xl font-bold font-mono">{result.delayProbability}%</span>
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Risco {result.riskLevel}</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="w-full text-xs grid grid-cols-2 gap-2 border-t border-slate-800/40 pt-2 text-slate-400">
              <div className="border-r border-slate-800/40 pr-2">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">SLA Estouro</span>
                <span className="font-mono text-slate-300 font-bold">~ {result.estimatedCompletionDelayDays} d de atraso</span>
              </div>
              <div className="pl-2">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Data Alvo Original</span>
                <span className="font-mono text-slate-300 font-bold">
                  {new Date(project.endDate).toLocaleDateString("pt-BR", { day: "numeric", month: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Right panel: analysis breakdown text recommendation */}
          <div className="md:col-span-3 space-y-4">
            
            {/* Written justification */}
            <div>
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Parecer Cognitivo do Especialista
              </h4>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/30">
                {result.justificationText}
              </p>
            </div>

            {/* Bottlenecks list */}
            {result.bottlenecks && result.bottlenecks.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Gargalos Operacionais Identificados
                </h4>
                <div className="space-y-1">
                  {result.bottlenecks.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-amber-500 mt-0.5 shrink-0 select-none">•</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations list */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">
                  Recomendações e Plano de Ação Preventivo
                </h4>
                <div className="space-y-1 bg-slate-950/20 p-2.5 rounded-lg border border-slate-800/30">
                  {result.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-emerald-500 shrink-0 select-none">✓</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-500 select-none">
          Nenhuma análise disponível.
        </div>
      )}
    </div>
  );
}
