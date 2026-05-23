import { GoogleGenAI } from "@google/genai";
import { Project, Task } from "./db.js";

// Lazy initialize the Google Gen AI client with appropriate telemetry options
let genAiInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genAiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ [Gemini AI] Warning: GEMINI_API_KEY is not defined. Falling back to local algorithmic predictor.");
    }
    genAiInstance = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return genAiInstance;
}

export interface AIForecastResult {
  delayProbability: number; // 0 to 100
  riskLevel: "Baixo" | "Moderado" | "Alto" | "Crítico";
  estimatedCompletionDelayDays: number;
  bottlenecks: string[];
  recommendations: string[];
  justificationText: string;
}

// Algorithmic fall-back if API key is not present or query fails
export function getLocalHeuristicForecast(project: Project, tasks: Task[]): AIForecastResult {
  const today = new Date("2026-05-22");
  const end = new Date(project.endDate);
  
  // Calculate duration and time left
  const totalDays = Math.max(1, Math.round((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  const daysSpent = Math.max(0, Math.round((today.getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  const daysLeft = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let delayProbability = 0;
  let estimatedCompletionDelayDays = 0;

  const incompleteTasks = tasks.filter(t => t.status !== "Done");
  const doneTasks = tasks.filter(t => t.status === "Done");
  const doingTasks = tasks.filter(t => t.status === "Doing");

  // Basic heuristical delay probability formula
  if (project.status === "Concluído") {
    delayProbability = 0;
    estimatedCompletionDelayDays = 0;
  } else {
    // Expected progress based on days elapsed
    const expectedProgress = Math.min(100, Math.round((daysSpent / totalDays) * 100));
    const delaySlippage = expectedProgress - project.progress;

    if (delaySlippage > 0) {
      delayProbability += delaySlippage * 1.5;
    }

    if (daysLeft < 5 && project.progress < 75) {
      delayProbability += 30;
    }

    // Task bottlenecks penalty
    delayProbability += (incompleteTasks.length / Math.max(1, tasks.length)) * 25;
    
    // Critical priority penalty
    if (project.priority === "Crítica") delayProbability += 15;
    else if (project.priority === "Alta") delayProbability += 8;

    delayProbability = Math.max(5, Math.min(98, Math.round(delayProbability)));
    estimatedCompletionDelayDays = Math.round((delayProbability / 100) * 15);
  }

  let riskLevel: AIForecastResult["riskLevel"] = "Baixo";
  if (delayProbability > 75) riskLevel = "Crítico";
  else if (delayProbability > 50) riskLevel = "Alto";
  else if (delayProbability > 25) riskLevel = "Moderado";

  const bottlenecks: string[] = [];
  if (doingTasks.length > 2) {
    bottlenecks.push(`Sobrecarga de tarefas em execução física simultânea ('Doing'): ${doingTasks.length} itens.`);
  }
  if (tasks.some(t => t.priority === "Crítica" && t.status !== "Done")) {
    bottlenecks.push("Presença de tarefas de prioridade CRÍTICA ainda pendentes de conclusão.");
  }
  const overdueTasks = tasks.filter(t => t.status !== "Done" && new Date(t.endDate) < today);
  if (overdueTasks.length > 0) {
    bottlenecks.push(`${overdueTasks.length} tarefas singulares com data limite excedida em relação a 22/05/2026.`);
  }

  if (bottlenecks.length === 0) {
    bottlenecks.push("Nenhum gargalo severo identificado no cronograma.");
  }

  const recommendations = [
    "Priorizar tarefas do caminho crítico que estejam atualmente em status 'Doing' ou 'To Do'.",
    "Realocar recursos subutilizados ou de outros projetos para nivelamento de esforço.",
    "Acompanhar semanalmente a aderência do progresso real frente à linha de base."
  ];

  const justificationText = `Análise preditiva heurística efetuada com base no progresso de ${project.progress}% planejado em relação aos ${daysSpent} dias decorridos desde ${new Date(project.startDate).toLocaleDateString("pt-BR")}. O projeto possui ${incompleteTasks.length} tarefas em aberto (de um total de ${tasks.length}). Recomenda-se acompanhamento rigoroso.`;

  return {
    delayProbability,
    riskLevel,
    estimatedCompletionDelayDays,
    bottlenecks,
    recommendations,
    justificationText
  };
}

export async function generateProjectAIWarning(project: Project, tasks: Task[]): Promise<AIForecastResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback immediately to local model if key doesn't exist
    return getLocalHeuristicForecast(project, tasks);
  }

  try {
    const ai = getGenAI();
    
    const projectSummary = {
      name: project.name,
      code: project.code,
      client: project.client,
      status: project.status,
      priority: project.priority,
      progressNum: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
      totalDurationDays: Math.round((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)),
      currentDate: "2026-05-22"
    };

    const taskSummary = tasks.map(t => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      startDate: t.startDate,
      endDate: t.endDate,
      hasChecklistPending: t.checklist.filter(c => !c.done).length > 0,
      dependenciesCount: t.dependencies.length
    }));

    const prompt = `Analise a saúde do seguinte projeto corporativo e suas subtarefas em relação à data atual "22 de Maio de 2026":
    
PROJETO:
${JSON.stringify(projectSummary, null, 2)}

TAREFAS DO PROJETO:
${JSON.stringify(taskSummary, null, 2)}

Responda ESTRITAMENTE em formato JSON que obedeça exatamente ao seguinte esquema:
{
  "delayProbability": número de 0 a 100 indicando a probabilidade de atraso do projeto,
  "riskLevel": uma das opções "Baixo" | "Moderado" | "Alto" | "Crítico",
  "estimatedCompletionDelayDays": estimativa em dias de atraso para entrega completa,
  "bottlenecks": [lista de até 3 gargalos textuais identificados, em português],
  "recommendations": [lista de até 3 recomendações preventivas práticas, em português],
  "justificationText": "parágrafo sucinto explicando as razões técnicas e matemáticas calculadas do risco de atraso, em português"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text.trim());
      return {
        delayProbability: typeof parsed.delayProbability === "number" ? parsed.delayProbability : 50,
        riskLevel: ["Baixo", "Moderado", "Alto", "Crítico"].includes(parsed.riskLevel) ? parsed.riskLevel : "Moderado",
        estimatedCompletionDelayDays: typeof parsed.estimatedCompletionDelayDays === "number" ? parsed.estimatedCompletionDelayDays : 5,
        bottlenecks: Array.isArray(parsed.bottlenecks) ? parsed.bottlenecks : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        justificationText: parsed.justificationText || "Análise elaborada com sucesso via inteligência artificial."
      };
    }
    
    return getLocalHeuristicForecast(project, tasks);
  } catch (err) {
    console.error("Error generating Gemini AI forecast: ", err);
    return getLocalHeuristicForecast(project, tasks);
  }
}
