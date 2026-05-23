import React, { useState, useMemo } from "react";
import { Project, Task, Comment } from "../types";
import {
  Plus,
  MessageSquare,
  CheckSquare,
  Calendar,
  AlertTriangle,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Paperclip,
  Clock,
  Trash,
  CheckCircle,
  FolderDot
} from "lucide-react";

interface KanbanBoardProps {
  projects: Project[];
  tasks: Task[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onTaskMoved: (taskId: string, newStatus: Task["status"]) => void;
  onTaskChecklistToggle: (taskId: string, checklistId: string, done: boolean) => void;
  onAddTask: (task: Omit<Task, "id" | "weekOfYear" | "commentsCount" | "attachments">) => void;
  onDeleteTask: (id: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  commentsByTaskId: Record<string, Comment[]>;
  onLoadComments: (taskId: string) => void;
  developers?: any[];
}

const LANES: Array<{ id: Task["status"]; label: string; color: string; bg: string }> = [
  { id: "Backlog", label: "Backlog", color: "text-slate-400 bg-slate-950 border-slate-800", bg: "bg-slate-900/50" },
  { id: "To Do", label: "To Do", color: "text-indigo-400 bg-indigo-950/40 border-indigo-900/30", bg: "bg-indigo-950/10" },
  { id: "Doing", label: "Doing", color: "text-cyan-400 bg-cyan-950/40 border-cyan-900/30", bg: "bg-cyan-950/10" },
  { id: "Review", label: "Review", color: "text-amber-400 bg-amber-950/40 border-amber-900/30", bg: "bg-amber-950/10" },
  { id: "Done", label: "Done", color: "text-emerald-400 bg-emerald-950/40 border-emerald-900/40", bg: "bg-emerald-950/5" }
];

export default function KanbanBoard({
  projects,
  tasks,
  activeProjectId,
  onSelectProject,
  onTaskMoved,
  onTaskChecklistToggle,
  onAddTask,
  onDeleteTask,
  onAddComment,
  commentsByTaskId,
  onLoadComments,
  developers = []
}: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newResp, setNewResp] = useState("Rodrigo Santos");
  const [newProjId, setNewProjId] = useState(activeProjectId || (projects[0]?.id || ""));
  const [newPri, setNewPri] = useState<Task["priority"]>("Média");
  const [newStatus, setNewStatus] = useState<Task["status"]>("To Do");
  const [newStart, setNewStart] = useState("2026-05-22");
  const [newEnd, setNewEnd] = useState("2026-05-30");

  const [newCommentText, setNewCommentText] = useState("");

  const filteredTasks = useMemo(() => {
    if (!activeProjectId || activeProjectId === "all") return tasks;
    return tasks.filter(t => t.projectId === activeProjectId);
  }, [tasks, activeProjectId]);

  // Drag and Drop core logic
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId) {
      onTaskMoved(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  // Open task inspection details
  const handleInspectTask = (task: Task) => {
    setSelectedTask(task);
    onLoadComments(task.id);
  };

  const handleChecklistToggleLocal = (taskId: string, checkId: string, currentDone: boolean) => {
    onTaskChecklistToggle(taskId, checkId, !currentDone);
    
    // updates local modal state
    if (selectedTask && selectedTask.id === taskId) {
      const updatedChecklist = selectedTask.checklist.map(item => {
        if (item.id === checkId) return { ...item, done: !currentDone };
        return item;
      });
      setSelectedTask({ ...selectedTask, checklist: updatedChecklist });
    }
  };

  const handleSaveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;
    onAddComment(selectedTask.id, newCommentText.trim());
    setNewCommentText("");
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProjId) return;

    onAddTask({
      projectId: newProjId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      responsibleName: newResp,
      startDate: new Date(newStart).toISOString(),
      endDate: new Date(newEnd).toISOString(),
      status: newStatus,
      priority: newPri,
      dependencies: [],
      checklist: [
        { id: `c-${Date.now()}-1`, text: "Planejamento inicial", done: false },
        { id: `c-${Date.now()}-2`, text: "Validação com equipe", done: false }
      ]
    });

    // Reset values & close
    setNewTitle("");
    setNewDesc("");
    setIsAddOpen(false);
  };

  const showProjectCode = (pId: string) => {
    const proj = projects.find(p => p.id === pId);
    return proj ? proj.code : "";
  };

  return (
    <div className="space-y-5">
      {/* Search selection tab bar controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-100 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <FolderDot className="h-5 w-5 text-cyan-400" />
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold">Quadro Kanban Operacional</h2>
            <p className="text-[11px] text-slate-400">
              Gerencie sprints arrastando tarefas pelas fases de execução.
            </p>
          </div>
        </div>

        {/* Filters control */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={activeProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-slate-200 focus:outline-none focus:border-cyan-500 w-full sm:w-48"
          >
            <option value="all">Sprints (Todos)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.name.slice(0, 22)}...</option>
            ))}
          </select>
          <button
            onClick={() => setIsAddOpen(true)}
            className="shrink-0 flex items-center justify-center space-x-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> <span>Tarefa</span>
          </button>
        </div>
      </div>

      {/* Grid columns container representing Lanes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto min-h-[500px]">
        {LANES.map(lane => {
          const laneTasks = filteredTasks.filter(t => t.status === lane.id);
          
          return (
            <div 
              key={lane.id}
              className={`rounded-xl border border-slate-800/80 p-3.5 flex flex-col space-y-3 ${lane.bg}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, lane.id)}
            >
              {/* Header lane indicator */}
              <div className="flex items-center justify-between select-none border-b border-slate-800/60 pb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${lane.color}`}>
                  {lane.label}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-950 border border-slate-800 rounded px-1.5">
                  {laneTasks.length}
                </span>
              </div>

              {/* Task list inside lane */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] min-h-[150px]">
                {laneTasks.map(task => {
                  const doneCount = task.checklist.filter(c => c.done).length;
                  const totalCount = task.checklist.length;
                  const isCritical = task.priority === "Crítica" || task.priority === "Alta";
                  const isTaskOverdue = new Date(task.endDate) < new Date("2026-05-22") && task.status !== "Done";

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => handleInspectTask(task)}
                      className={`group relative bg-slate-900 border hover:border-slate-700/80 rounded-xl p-3.5 shadow-sm hover:shadow transition-all cursor-grab active:cursor-grabbing select-none ${isTaskOverdue ? "border-red-900/60" : "border-slate-800"}`}
                    >
                      {/* Priority Tag status */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold font-mono text-cyan-400">
                          {showProjectCode(task.projectId)}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 rounded-sm ${task.priority === "Crítica" ? "bg-red-950 text-red-400" : task.priority === "Alta" ? "bg-amber-950 text-amber-400" : "bg-slate-950 text-slate-400"}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Title description */}
                      <p className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                        {task.title}
                      </p>

                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 select-none">
                        {task.description}
                      </p>

                      {/* Checklist and comments status overview */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-800/40 mt-3 select-none">
                        <div className="flex items-center space-x-2.5">
                          {totalCount > 0 && (
                            <span className="flex items-center gap-1" title="Checklist respondidos">
                              <CheckSquare className="h-3.5 w-3.5 text-cyan-400" />
                              <span className="font-mono text-slate-400 font-semibold">{doneCount}/{totalCount}</span>
                            </span>
                          )}
                          {task.commentsCount > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span className="font-mono">{task.commentsCount}</span>
                            </span>
                          )}
                        </div>

                        {/* Date end tracker */}
                        <span className={`flex items-center gap-1 font-mono ${isTaskOverdue ? "text-red-400 font-bold" : ""}`}>
                          <Calendar className="h-3 w-3" />
                          {new Date(task.endDate).toLocaleDateString("pt-BR", { day: "numeric", month: "numeric" })}
                        </span>
                      </div>

                      {/* Hover task assignee tag */}
                      <div className="mt-2.5 flex items-center justify-between text-[9px] text-slate-400 select-none">
                        <span className="flex items-center gap-1 text-slate-300">
                          <User className="h-2.5 w-2.5 text-cyan-400" />
                          <span>{task.responsibleName}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}

                {laneTasks.length === 0 && (
                  <div className="border border-dashed border-slate-800/60 rounded-lg p-5 text-center text-[10px] text-slate-600 select-none">
                    Arraste itens até aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Create new custom task directly */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" /> Cadastrar Tarefa de Sprint
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Título do Entregável</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Implementar autenticação facial"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Descrição / Requisitos</label>
                  <textarea
                    rows={2}
                    placeholder="Detalhamento técnico do entregável..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Vincular a Projeto</label>
                  <select
                    value={newProjId}
                    onChange={(e) => setNewProjId(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name.slice(0, 20)}...</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Responsável</label>
                  <select
                    value={newResp}
                    onChange={(e) => setNewResp(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  >
                    {developers.map(dev => (
                      <option key={dev.id} value={dev.name}>{dev.name} ({dev.role})</option>
                    ))}
                    {developers.length === 0 && (
                      <>
                        <option value="Rodrigo Santos">Rodrigo Santos (User)</option>
                        <option value="Mariana Costa">Mariana Costa (Gerente)</option>
                        <option value="Carlos Silveira">Carlos Silveira (Admin)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Prioridade</label>
                  <select
                    value={newPri}
                    onChange={(e) => setNewPri(e.target.value as any)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Status Inicial</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="To Do">To Do</option>
                    <option value="Doing">Doing</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Data de Início</label>
                  <input
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Data Limite SLA</label>
                  <input
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800/40 rounded-lg text-xs font-semibold text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Task Inspection Dialog (with comments, checklists) */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-widest">
                  Tarefa Vinculada: {showProjectCode(selectedTask.projectId)}
                </span>
                <h3 className="text-sm font-bold text-slate-100 truncate mt-1">
                  {selectedTask.title}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onDeleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }}
                  className="p-1 px-2.5 rounded text-[10px] font-bold uppercase bg-red-950 border border-red-900/60 text-red-400 hover:bg-red-900/20 cursor-pointer"
                  title="Remove task permanent"
                >
                  Excluir
                </button>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-400 hover:text-slate-100 text-sm font-bold ml-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Split body: Info pane vs Comment feeds */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-5 p-5 gap-5 min-h-0">
              
              {/* Info checklist metrics column */}
              <div className="md:col-span-3 space-y-4">
                <div>
                  <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-1">Descrição / Contexto</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/40">
                    {selectedTask.description || "Nenhuma especificação técnica detalhada para este item."}
                  </p>
                </div>

                {/* Checklist widget */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                    Etapas do Desenvolvimento / Checklist
                  </h4>
                  <div className="space-y-1.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/30">
                    {selectedTask.checklist.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleChecklistToggleLocal(selectedTask.id, item.id, item.done)}
                        className="flex items-center gap-2 px-1.5 py-1 text-xs text-slate-300 hover:bg-slate-800/30 rounded cursor-pointer select-none transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          readOnly
                          className="rounded text-cyan-600 focus:ring-0 cursor-pointer"
                        />
                        <span className={item.done ? "line-through text-slate-500" : ""}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                    {selectedTask.checklist.length === 0 && (
                      <span className="text-[10px] text-slate-600 block text-center">Inexistente</span>
                    )}
                  </div>
                </div>

                {/* Predecessors / priority alerts */}
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Início</span>
                    <span className="font-mono text-slate-200 flex items-center gap-1.5 bg-slate-950 py-1 px-2.5 rounded border border-slate-800/30">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(selectedTask.startDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Entrega SLA</span>
                    <span className="font-mono text-slate-200 flex items-center gap-1.5 bg-slate-950 py-1 px-2.5 rounded border border-slate-800/30">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      {new Date(selectedTask.endDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feed Comment pane */}
              <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-5 flex flex-col h-full min-h-[250px]">
                <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-2">Comentários e Histórico</h4>
                
                {/* List block */}
                <div className="flex-1 overflow-y-auto space-y-2.5 mb-3 max-h-[220px]">
                  {(commentsByTaskId[selectedTask.id] || []).map(c => (
                    <div key={c.id} className="bg-slate-950/40 p-2.5 rounded border border-slate-800/30 space-y-1">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="font-bold text-slate-300">{c.userName}</span>
                        <span className="text-slate-500 select-none">{new Date(c.createdAt).toLocaleTimeString("pt-BR", { hour: "numeric", minute: "numeric" })}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{c.content}</p>
                    </div>
                  ))}

                  {(!commentsByTaskId[selectedTask.id] || commentsByTaskId[selectedTask.id].length === 0) && (
                    <div className="text-center py-6 text-[10px] text-slate-600">
                      Sem notas registradas. Adicione uma nota abaixo.
                    </div>
                  )}
                </div>

                {/* Form comment */}
                <form onSubmit={handleSaveComment} className="space-y-2 mt-auto">
                  <textarea
                    rows={2}
                    required
                    placeholder="Adicionar nota técnica interna..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full text-center py-1 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 text-xs font-semibold rounded text-slate-200 transition-colors cursor-pointer"
                  >
                    Publicar Notas
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
