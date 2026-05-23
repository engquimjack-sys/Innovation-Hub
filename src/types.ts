export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  responsibleName: string;
  startDate: string;
  endDate: string;
  weekOfYear: number;
  status: "Backlog" | "To Do" | "Doing" | "Review" | "Done";
  priority: "Baixa" | "Média" | "Alta" | "Crítica";
  dependencies: string[];
  checklist: ChecklistItem[];
  attachments: Attachment[];
  commentsCount: number;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  client: string;
  responsibleId: string;
  responsibleName: string;
  startDate: string;
  endDate: string;
  status: "Não iniciado" | "Em andamento" | "Em risco" | "Atrasado" | "Concluído" | "Cancelado";
  priority: "Baixa" | "Média" | "Alta" | "Crítica";
  progress: number; // 0 to 100
  color: "Verde" | "Amarelo" | "Vermelho" | "Azul" | "Cinza";
  tags: string[];
  notes: string;
  weekOfYear: number;
}

export interface Comment {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}

export interface AIForecastResult {
  delayProbability: number;
  riskLevel: "Baixo" | "Moderado" | "Alto" | "Crítico";
  estimatedCompletionDelayDays: number;
  bottlenecks: string[];
  recommendations: string[];
  justificationText: string;
}

export type ActiveTab = "dashboard" | "projects" | "kanban" | "gantt" | "calendar" | "reports" | "audit" | "developers";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "Administrador" | "Gerente" | "Usuário";
  avatarUrl: string;
  productivity: number;
}
