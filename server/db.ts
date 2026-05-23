import fs from "fs";
import path from "path";
import { PrismaClient, Role, ProjectStatus, Priority, TaskStatus } from "@prisma/client";

// Typings for our database entities
export interface User {
  id: string;
  email: string;
  passwordHash: string; // "senha123" hashed or plain text for demo simplicity
  name: string;
  role: "Administrador" | "Gerente" | "Usuário";
  avatarUrl: string;
  productivity: number; // e.g. 0.85, 1.20
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  client: string;
  responsibleId: string;
  responsibleName: string;
  startDate: string; // ISO String
  endDate: string; // ISO String
  status: "Não iniciado" | "Em andamento" | "Em risco" | "Atrasado" | "Concluído" | "Cancelado";
  priority: "Baixa" | "Média" | "Alta" | "Crítica";
  progress: number; // 0 to 100, automatically calculated or manual
  color: "Verde" | "Amarelo" | "Vermelho" | "Azul" | "Cinza";
  tags: string[];
  notes: string;
  weekOfYear: number; // calculated from startDate
}

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
  startDate: string; // ISO String
  endDate: string; // ISO String
  weekOfYear: number;
  status: "Backlog" | "To Do" | "Doing" | "Review" | "Done";
  priority: "Baixa" | "Média" | "Alta" | "Crítica";
  dependencies: string[]; // List of task IDs
  checklist: ChecklistItem[];
  attachments: Attachment[];
  commentsCount: number;
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
  action: string; // "create", "update", "delete", "move", "comment"
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

export interface DatabaseSchema {
  users: User[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Helper to determine week number from date
export function getWeekNumber(dateIn: Date | string): number {
  const d = new Date(dateIn);
  if (isNaN(d.getTime())) return 1;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

// Initial default seed users
const seedUsers: User[] = [
  {
    id: "user-admin",
    email: "admin@corporativo.com",
    passwordHash: "senha123",
    name: "Carlos Silveira",
    role: "Administrador",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    productivity: 1.15
  },
  {
    id: "user-manager",
    email: "gerente@corporativo.com",
    passwordHash: "senha123",
    name: "Mariana Costa",
    role: "Gerente",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    productivity: 1.05
  },
  {
    id: "user-dev",
    email: "usuario@corporativo.com",
    passwordHash: "senha123",
    name: "Rodrigo Santos",
    role: "Usuário",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    productivity: 0.95
  }
];

// Generate exactly 32 high-fidelity projects with realistic names
const corporateCategories = [
  { p: "Plataforma Core Banking 3.0", client: "Banco Alfa", color: "Azul", responsible: "Mariana Costa", tags: ["Fintech", "Cloud", "Pix"] },
  { p: "Upgrade Migração Nuvem AWS", client: "Seguros Beta", color: "Azul", responsible: "Rodrigo Santos", tags: ["Infraestrutura", "AWS"] },
  { p: "Portal de Telemedicina Einstein", client: "Grupo Saúde Viva", color: "Verde", responsible: "Carlos Silveira", tags: ["Web", "Saúde"] },
  { p: "Integração Hub Logística Global", client: "Express Cargo", color: "Amarelo", responsible: "Mariana Costa", tags: ["ERP", "API"] },
  { p: "Implementação LGPD e Compliance", client: "Varejo S/A", color: "Cinza", responsible: "Carlos Silveira", tags: ["Jurídico", "Segurança"] },
  { p: "Omnichannel Checkout Rápido", client: "Mega Store", color: "Amarelo", responsible: "Rodrigo Santos", tags: ["Web", "Vendas"] },
  { p: "IA Machine Learning Combate à Fraude", client: "Invest Credit", color: "Vermelho", responsible: "Carlos Silveira", tags: ["IA", "Segurança"] },
  { p: "Fronteiras IoT Automação Agro", client: "Planeta Campo", color: "Verde", responsible: "Mariana Costa", tags: ["Hardware", "Agro"] },
  { p: "CRM de Relacionamento Clientes V2", client: "Suporte Total", color: "Cinza", responsible: "Rodrigo Santos", tags: ["SaaS", "Produtividade"] },
  { p: "Faturamento Eletrônico Automação", client: "Indústria Sul", color: "Azul", responsible: "Mariana Costa", tags: ["Fiscal", "ERP"] },
  { p: "Aplicativo Mobile de Fidelidade iOS/Android", client: "Auto Posto", color: "Verde", responsible: "Rodrigo Santos", tags: ["Mobile", "Fidelidade"] },
  { p: "Migração SAP S/4HANA Financeiro", client: "Mineração Vale", color: "Amarelo", responsible: "Carlos Silveira", tags: ["SAP", "Enterprise"] },
  { p: "Migração Banco de Dados Legacy para PostgreSQL", client: "Lojas Central", color: "Cinza", responsible: "Mariana Costa", tags: ["Database", "Postgres"] },
  { p: "Cybersecurity Audit Pen-testing", client: "Federal Gov", color: "Vermelho", responsible: "Carlos Silveira", tags: ["Segurança", "Audit"] },
  { p: "Rede Social Corporativa Interna", client: "Holding XYZ", color: "Azul", responsible: "Rodrigo Santos", tags: ["Slack", "RH"] },
  { p: "Portal do Colaborador & Admissões", client: "RH Tech", color: "Verde", responsible: "Mariana Costa", tags: ["RH", "Web"] },
  { p: "Dashboard Real-time BI Executivo", client: "Distribuidora Master", color: "Verde", responsible: "Carlos Silveira", tags: ["BI", "Analytics"] },
  { p: "Chatbot IA com NLP para Atendimento", client: "Cia Telefônica", color: "Vermelho", responsible: "Mariana Costa", tags: ["IA", "NLP"] },
  { p: "Reestruturação Supply Chain Industrial", client: "Petro S/A", color: "Amarelo", responsible: "Carlos Silveira", tags: ["Logística", "Supply"] },
  { p: "Sistema de Cobrança Recorrente Gateways", client: "SaaS Booster", color: "Azul", responsible: "Rodrigo Santos", tags: ["Pagamentos", "APIs"] },
  { p: "Migração de Switch Core Telecomunicações", client: "Operadora Link", color: "Cinza", responsible: "Mariana Costa", tags: ["Hardware", "Redes"] },
  { p: "Aplicativo Controle Frota e Combustível", client: "Transportadora Rápido", color: "Cinza", responsible: "Rodrigo Santos", tags: ["Mobile", "GPS"] },
  { p: "Gestão Ambiental Carbono Zero Tracker", client: "Ecoloop Gás", color: "Verde", responsible: "Carlos Silveira", tags: ["ESG", "Verde"] },
  { p: "E-Commerce Atacado B2B Web Portal", client: "Distribuidora Sul", color: "Azul", responsible: "Mariana Costa", tags: ["Web", "B2B"] },
  { p: "Sistema Gerenciador de Ativos TI", client: "TechCorp", color: "Cinza", responsible: "Rodrigo Santos", tags: ["ITAM", "Inventário"] },
  { p: "Modernização Totem Autoatendimento", client: "Shopping Plaza", color: "Amarelo", responsible: "Mariana Costa", tags: ["Kiosk", "React"] },
  { p: "Geolocalização Entregas Última Milha", client: "Entregas Express", color: "Vermelho", responsible: "Rodrigo Santos", tags: ["Maps", "Tracking"] },
  { p: "Suíte Produtividade Escolar Digital", client: "Colégio Futuro", color: "Verde", responsible: "Carlos Silveira", tags: ["Educação", "Edtech"] },
  { p: "Engine Governança Dados e BI Dashboards", client: "Fundo Multi", color: "Azul", responsible: "Mariana Costa", tags: ["KPI", "Metabase"] },
  { p: "Sincronizador API CRM Salesforce", client: "Global Tech", color: "Cinza", responsible: "Rodrigo Santos", tags: ["Salesforce", "API"] },
  { p: "Monitoria Computacional Servidores Zabbix", client: "Hosting Net", color: "Vermelho", responsible: "Carlos Silveira", tags: ["Infra", "Grafana"] },
  { p: "Consolidador Contábil Multi-Moeda Finanças", client: "Exchanges Inc", color: "Amarelo", responsible: "Mariana Costa", tags: ["Finanças", "Audit"] }
];

// Helper to add days to a string representation
const addDaysString = (baseStr: string, days: number): string => {
  const d = new Date(baseStr);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

// ----------------------------------------------------
// PRISMA SUPABASE INTEGRATION ENGINE
// ----------------------------------------------------

let prismaClientInstance: PrismaClient | null = null;
let prismaErrorLogged = false;

export function getPrisma(): PrismaClient | null {
  if (!Database.isPostgresOperational) {
    return null;
  }
  return prismaClientInstance;
}

// FORMAT CONVERTERS (Prisma <=> Business Schema)

function toPrismaRole(role: string): Role {
  if (role === "Administrador") return "ADMINISTRATOR";
  if (role === "Gerente") return "MANAGER";
  return "USER";
}

function fromPrismaRole(role: Role): "Administrador" | "Gerente" | "Usuário" {
  if (role === "ADMINISTRATOR") return "Administrador";
  if (role === "MANAGER") return "Gerente";
  return "Usuário";
}

function toPrismaProjectStatus(status: string): ProjectStatus {
  const s = status.trim();
  if (s === "Não iniciado") return "NOT_STARTED";
  if (s === "Em andamento") return "IN_PROGRESS";
  if (s === "Em risco") return "AT_RISK";
  if (s === "Atrasado") return "DELAYED";
  if (s === "Concluído") return "COMPLETED";
  return "CANCELLED";
}

function fromPrismaProjectStatus(status: ProjectStatus): Project["status"] {
  if (status === "NOT_STARTED") return "Não iniciado";
  if (status === "IN_PROGRESS") return "Em andamento";
  if (status === "AT_RISK") return "Em risco";
  if (status === "DELAYED") return "Atrasado";
  if (status === "COMPLETED") return "Concluído";
  return "Cancelado";
}

function toPrismaPriority(priority: string): Priority {
  const p = priority.trim();
  if (p === "Baixa") return "LOW";
  if (p === "Alta") return "HIGH";
  if (p === "Crítica") return "CRITICAL";
  return "MEDIUM";
}

function fromPrismaPriority(priority: Priority): Project["priority"] {
  if (priority === "LOW") return "Baixa";
  if (priority === "HIGH") return "Alta";
  if (priority === "CRITICAL") return "Crítica";
  return "Média";
}

function toPrismaTaskStatus(status: string): TaskStatus {
  const s = status.trim();
  if (s === "Backlog") return "BACKLOG";
  if (s === "To Do") return "TODO";
  if (s === "Doing") return "DOING";
  if (s === "Review") return "REVIEW";
  return "DONE";
}

function fromPrismaTaskStatus(status: TaskStatus): Task["status"] {
  if (status === "BACKLOG") return "Backlog";
  if (status === "TODO") return "To Do";
  if (status === "DOING") return "Doing";
  if (status === "REVIEW") return "Review";
  return "Done";
}

function fromPrismaColor(color: string): "Verde" | "Amarelo" | "Vermelho" | "Azul" | "Cinza" {
  const c = color.toLowerCase();
  if (c === "green" || c === "verde") return "Verde";
  if (c === "yellow" || c === "amarelo") return "Amarelo";
  if (c === "red" || c === "vermelho") return "Vermelho";
  if (c === "blue" || c === "azul") return "Azul";
  return "Cinza";
}

function toPrismaColor(color: string): string {
  const c = color.toLowerCase();
  if (c === "verde" || c === "green") return "green";
  if (c === "amarelo" || c === "yellow") return "yellow";
  if (c === "vermelho" || c === "red") return "red";
  if (c === "azul" || c === "blue") return "blue";
  return "gray";
}

function fromPrismaUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.passwordHash,
    name: u.name,
    role: fromPrismaRole(u.role),
    avatarUrl: u.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    productivity: u.productivity,
  };
}

function fromPrismaProject(p: any): Project {
  return {
    id: p.id,
    name: p.name,
    code: p.code,
    description: p.description || "",
    client: p.client || "Interno",
    responsibleId: p.responsibleId,
    responsibleName: p.responsible?.name || "Mariana Costa",
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    status: fromPrismaProjectStatus(p.status),
    priority: fromPrismaPriority(p.priority),
    progress: p.progress,
    color: fromPrismaColor(p.color),
    tags: p.tags ? p.tags.map((t: any) => t.name) : [],
    notes: p.notes || "",
    weekOfYear: getWeekNumber(p.startDate),
  };
}

function fromPrismaTask(t: any): Task {
  let checklist: ChecklistItem[] = [];
  try {
    checklist = typeof t.checklist === "string" ? JSON.parse(t.checklist) : t.checklist || [];
  } catch (e) {
    checklist = [];
  }

  let dependencies: string[] = [];
  try {
    dependencies = typeof t.dependencies === "string" ? JSON.parse(t.dependencies) : t.dependencies || [];
  } catch (e) {
    dependencies = [];
  }

  const attachmentsList = t.attachments ? t.attachments.map((att: any) => {
    let sizeStr = "2.4 MB";
    if (att.fileSize) {
      sizeStr = att.fileSize > 1024 * 1024 
        ? `${(att.fileSize / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(att.fileSize / 1024)} KB`;
    }
    return {
      id: att.id,
      fileName: att.fileName,
      fileSize: sizeStr,
      fileUrl: att.fileUrl,
      uploadedAt: att.createdAt.toISOString(),
    };
  }) : [];

  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description || "",
    responsibleName: t.responsible?.name || "Mariana Costa",
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    weekOfYear: getWeekNumber(t.startDate),
    status: fromPrismaTaskStatus(t.status),
    priority: fromPrismaPriority(t.priority),
    dependencies,
    checklist,
    attachments: attachmentsList,
    commentsCount: t._count?.comments || t.comments?.length || 0,
  };
}

function fromPrismaComment(c: any): Comment {
  return {
    id: c.id,
    taskId: c.taskId,
    projectId: c.task?.projectId || "",
    userId: c.userId,
    userName: c.user?.name || "Usuário",
    userAvatar: c.user?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    content: c.content,
    createdAt: c.createdAt.toISOString(),
  };
}

function fromPrismaActivityLog(l: any): ActivityLog {
  return {
    id: l.id,
    projectId: l.projectId || undefined,
    projectName: l.project?.name || undefined,
    taskId: l.taskId || undefined,
    taskTitle: l.task?.title || undefined,
    userId: l.userId,
    userName: l.user?.name || "Usuário",
    action: l.action,
    details: l.details,
    createdAt: l.createdAt.toISOString(),
  };
}

function fromPrismaNotification(n: any): Notification {
  return {
    id: n.id,
    userId: n.userId,
    text: n.text,
    type: n.type as any,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

// Seeds Supabase/PostgreSQL with mock seed records automatically on startup if empty
async function seedSupabase(prisma: PrismaClient) {
  try {
    console.log("🌱 Database is empty. Seeding realistic corporate data to Supabase...");

    // 1. Seed Users
    for (const u of seedUsers) {
      await prisma.user.create({
        data: {
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash,
          name: u.name,
          role: toPrismaRole(u.role),
          avatarUrl: u.avatarUrl,
          productivity: u.productivity,
        },
      });
    }

    const baseDate = new Date("2026-05-15").toISOString();

    // 2. Map and Seed Projects & Tasks
    for (let idx = 0; idx < corporateCategories.length; idx++) {
      const meta = corporateCategories[idx];
      const pId = `proj-${idx + 1}`;

      const startOffset = -15 + (idx * 2);
      const duration = 25 + (idx % 4) * 15;
      const projectStart = new Date(addDaysString(baseDate, startOffset));
      const projectEnd = new Date(addDaysString(projectStart.toISOString(), duration));

      let statusRaw = "Em andamento";
      if (idx % 6 === 0) statusRaw = "Em risco";
      else if (idx % 7 === 0) statusRaw = "Atrasado";
      else if (idx % 8 === 0) statusRaw = "Concluído";
      else if (idx % 11 === 0) statusRaw = "Não iniciado";
      else if (idx % 15 === 0) statusRaw = "Cancelado";

      let priorityRaw = "Média";
      if (idx % 4 === 0) priorityRaw = "Alta";
      else if (idx % 7 === 0) priorityRaw = "Crítica";
      else if (idx % 9 === 0) priorityRaw = "Baixa";

      let managerId = "user-manager";
      if (meta.responsible === "Carlos Silveira") managerId = "user-admin";
      if (meta.responsible === "Rodrigo Santos") managerId = "user-dev";

      let progress = 0;
      if (statusRaw === "Concluído") progress = 100;
      else if (statusRaw === "Não iniciado") progress = 0;
      else if (statusRaw === "Cancelado") progress = 12;
      else progress = Math.min(95, Math.max(10, 15 + (idx * 2.5)));

      // Tags management
      const tagIds: string[] = [];
      for (const tName of meta.tags) {
        const tag = await prisma.tag.upsert({
          where: { name: tName },
          update: {},
          create: { name: tName },
        });
        tagIds.push(tag.id);
      }

      await prisma.project.create({
        data: {
          id: pId,
          name: meta.p,
          code: `PRJ-${1000 + idx}`,
          description: `Implementação estratégica do projeto corporativo de ${meta.p} atendendo aos requisitos técnicos do cliente ${meta.client}.`,
          client: meta.client,
          responsibleId: managerId,
          startDate: projectStart,
          endDate: projectEnd,
          status: toPrismaProjectStatus(statusRaw),
          priority: toPrismaPriority(priorityRaw),
          progress: parseFloat(progress.toFixed(0)),
          color: toPrismaColor(meta.color),
          notes: "Milestones e entregáveis principais acordados para reuniões semanais. Indicador de performance semanal ativo.",
          tags: {
            connect: tagIds.map(id => ({ id })),
          },
        },
      });

      // Tasks for Project
      const taskMeta = [
        { title: "Mapeamento de Requisitos e Escopo", daysFromProjStart: 1, duration: 6, status: "Done", pri: "Baixa" },
        { title: "Arquitetura e Modelagem do Banco de Dados", daysFromProjStart: 5, duration: 8, status: "Done", pri: "Alta" },
        { title: "Desenvolvimento das APIs de Integração Core", daysFromProjStart: 10, duration: 15, status: "Doing", pri: "Crítica" },
        { title: "Criação do Painel Visual e Layout SPA", daysFromProjStart: 14, duration: 12, status: "To Do", pri: "Média" },
        { title: "Homologação de Segurança e Pen-Testing", daysFromProjStart: 25, duration: 6, status: "Backlog", pri: "Crítica" },
        { title: "Implantação Final e Treinamento de SLA", daysFromProjStart: 30, duration: 4, status: "Backlog", pri: "Média" },
      ];

      for (let tIdx = 0; tIdx < taskMeta.length; tIdx++) {
        const tData = taskMeta[tIdx];
        const taskId = `task-${pId}-${tIdx + 1}`;
        const tStart = new Date(addDaysString(projectStart.toISOString(), tData.daysFromProjStart));
        const tEnd = new Date(addDaysString(tStart.toISOString(), tData.duration));

        let tStatus = tData.status;
        if (statusRaw === "Concluído") {
          tStatus = "Done";
        } else if (statusRaw === "Não iniciado") {
          tStatus = "Backlog";
        }

        const chlist = [
          { id: `${taskId}-c1`, text: "Elaborar documento principal", done: tStatus === "Done" },
          { id: `${taskId}-c2`, text: "Validar com o comitê técnico", done: tStatus === "Done" || tStatus === "Review" },
          { id: `${taskId}-c3`, text: "Revisão ortográfica e padrões", done: tStatus === "Done" },
        ];

        const deps = tIdx > 0 ? [`task-${pId}-${tIdx}`] : [];

        await prisma.task.create({
          data: {
            id: taskId,
            projectId: pId,
            title: tData.title,
            description: `Atividade corporativa relacionada ao projeto ${meta.p} voltada para o entregável de ${tData.title.toLowerCase()}.`,
            responsibleId: managerId,
            startDate: tStart,
            endDate: tEnd,
            status: toPrismaTaskStatus(tStatus),
            priority: toPrismaPriority(tData.pri),
            dependencies: JSON.stringify(deps),
            checklist: JSON.stringify(chlist),
          },
        });

        // Seed attachment
        if (tIdx % 3 === 0) {
          await prisma.attachment.create({
            data: {
              id: `${taskId}-att-1`,
              taskId: taskId,
              fileName: "documento_especificacao_tecnica_v4.pdf",
              fileSize: 2516582,
              fileUrl: "#",
            },
          });
        }

        // Seed Comment
        if (tIdx % 2 === 0) {
          await prisma.comment.create({
            data: {
              id: `comm-${taskId}`,
              taskId: taskId,
              userId: "user-manager",
              content: "Tarefa progredindo conforme cronograma do sprint. Atenção às dependências operacionais.",
              createdAt: new Date(addDaysString(tStart.toISOString(), 2)),
            },
          });
        }
      }

      // Seed Project Activity Log
      await prisma.activityLog.create({
        data: {
          id: `act-seed-${pId}`,
          projectId: pId,
          userId: "user-admin",
          action: "create",
          details: `Projeto iniciado formalmente no sistema sob governança do gestor ${meta.responsible}.`,
          createdAt: projectStart,
        },
      });
    }

    // 3. Seed Notifications
    await prisma.notification.createMany({
      data: [
        {
          id: "not-1",
          userId: "user-admin",
          text: "Atenção: 3 Projetos Corporativos da área de TI estão indicando status de ATRASO.",
          type: "warning",
          read: false,
        },
        {
          id: "not-2",
          userId: "user-admin",
          text: "Sucesso: O aplicativo de Telemedicina Einstein concluiu todas as checklists com SLA excelente.",
          type: "success",
          read: false,
        },
      ],
    });

    console.log("✅ Supabase context seeding completed successfully!");
  } catch (err) {
    console.error("❌ Error while seeding Supabase:", err);
  }
}

// ----------------------------------------------------
// HYBRID DATABASE ROUTER CLASS
// ----------------------------------------------------

export class Database {
  private static data: DatabaseSchema;
  private static pgSeeded = false;
  public static isPostgresOperational = false;
  private static hasCheckedPostgres = false;

  private static async init(): Promise<void> {
    // 1. ALWAYS INITIALIZE LOCAL JSON FILE DATABASE FIRST (Guarantees local database fallback is loaded)
    if (!this.data) {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, "utf-8");
          this.data = JSON.parse(raw);
        } catch (err) {
          console.error("Failed to parse database. Recreating database file...", err);
          this.data = this.createSeed();
          this.save();
        }
      } else {
        this.data = this.createSeed();
        this.save();
      }
    }

    // 2. CHECK POSTGRES/PRISMA STATUS ONCE
    if (process.env.DATABASE_URL && !this.hasCheckedPostgres) {
      this.hasCheckedPostgres = true;
      try {
        console.log("🔌 Checking PostgreSQL/Supabase database status...");
        const testPrisma = new PrismaClient({
          datasources: {
            db: {
              url: process.env.DATABASE_URL,
            },
          },
        });
        
        // Try query count to check schema/tables and connection
        const userCount = await testPrisma.user.count();
        prismaClientInstance = testPrisma;
        this.isPostgresOperational = true;
        console.log("🔌 PostgreSQL/Supabase database is active, operational, and connected!");

        if (userCount === 0 && !this.pgSeeded) {
          console.log("🌱 Database is empty. Seeding PostgreSQL...");
          await seedSupabase(testPrisma);
          this.pgSeeded = true;
        }
      } catch (e: any) {
        console.error("⚠️ Failed to communicate with PostgreSQL/Supabase database:", e.message || e);
        console.log("🔄 Auto-falling back gracefully to high-durability local JSON database.");
        this.isPostgresOperational = false;
        prismaClientInstance = null;
      }
    }
  }

  private static createSeed(): DatabaseSchema {
    const users = [...seedUsers];
    const projects: Project[] = [];
    const tasks: Task[] = [];
    const comments: Comment[] = [];
    const activityLogs: ActivityLog[] = [];
    const notifications: Notification[] = [];

    const baseDate = "2026-05-15T00:00:00.000Z";

    corporateCategories.forEach((meta, idx) => {
      const pId = `proj-${idx + 1}`;
      
      const startOffset = -15 + (idx * 2);
      const duration = 25 + (idx % 4) * 15;
      const projectStart = addDaysString(baseDate, startOffset);
      const projectEnd = addDaysString(projectStart, duration);

      let status: Project["status"] = "Em andamento";
      if (idx % 6 === 0) status = "Em risco";
      else if (idx % 7 === 0) status = "Atrasado";
      else if (idx % 8 === 0) status = "Concluído";
      else if (idx % 11 === 0) status = "Não iniciado";
      else if (idx % 15 === 0) status = "Cancelado";

      let priority: Project["priority"] = "Média";
      if (idx % 4 === 0) priority = "Alta";
      else if (idx % 7 === 0) priority = "Crítica";
      else if (idx % 9 === 0) priority = "Baixa";

      let managerId = "user-manager";
      if (meta.responsible === "Carlos Silveira") managerId = "user-admin";
      if (meta.responsible === "Rodrigo Santos") managerId = "user-dev";

      let progress = 0;
      if (status === "Concluído") progress = 100;
      else if (status === "Não iniciado") progress = 0;
      else if (status === "Cancelado") progress = 12;
      else progress = Math.min(95, Math.max(10, 15 + (idx * 2.5)));

      projects.push({
        id: pId,
        name: meta.p,
        code: `PRJ-${1000 + idx}`,
        description: `Implementação estratégica do projeto corporativo de ${meta.p} atendendo aos requisitos técnicos do cliente ${meta.client}.`,
        client: meta.client,
        responsibleId: managerId,
        responsibleName: meta.responsible,
        startDate: projectStart,
        endDate: projectEnd,
        status,
        priority,
        progress: parseFloat(progress.toFixed(0)),
        color: meta.color as any,
        tags: meta.tags,
        notes: "Milestones e entregáveis principais acordados para reuniões semanais. Indicador de performance semanal ativo.",
        weekOfYear: getWeekNumber(projectStart)
      });

      const taskMeta = [
        { title: "Mapeamento de Requisitos e Escopo", daysFromProjStart: 1, duration: 6, status: "Done", pri: "Baixa" },
        { title: "Arquitetura e Modelagem do Banco de Dados", daysFromProjStart: 5, duration: 8, status: "Done", pri: "Alta" },
        { title: "Desenvolvimento das APIs de Integração Core", daysFromProjStart: 10, duration: 15, status: "Doing", pri: "Crítica" },
        { title: "Criação do Painel Visual e Layout SPA", daysFromProjStart: 14, duration: 12, status: "To Do", pri: "Média" },
        { title: "Homologação de Segurança e Pen-Testing", daysFromProjStart: 25, duration: 6, status: "Backlog", pri: "Crítica" },
        { title: "Implantação Final e Treinamento de SLA", daysFromProjStart: 30, duration: 4, status: "Backlog", pri: "Média" },
      ];

      taskMeta.forEach((tData, tIdx) => {
        const taskId = `task-${pId}-${tIdx + 1}`;
        const tStart = addDaysString(projectStart, tData.daysFromProjStart);
        const tEnd = addDaysString(tStart, tData.duration);

        let tStatus = tData.status as Task["status"];
        if (status === "Concluído") {
          tStatus = "Done";
        } else if (status === "Não iniciado") {
          tStatus = "Backlog";
        }

        tasks.push({
          id: taskId,
          projectId: pId,
          title: tData.title,
          description: `Atividade corporativa relacionada ao projeto ${meta.p} voltada para o entregável de ${tData.title.toLowerCase()}.`,
          responsibleName: meta.responsible,
          startDate: tStart,
          endDate: tEnd,
          weekOfYear: getWeekNumber(tStart),
          status: tStatus,
          priority: tData.pri as any,
          dependencies: tIdx > 0 ? [`task-${pId}-${tIdx}`] : [],
          checklist: [
            { id: `${taskId}-c1`, text: "Elaborar documento principal", done: tStatus === "Done" },
            { id: `${taskId}-c2`, text: "Validar com o comitê técnico", done: tStatus === "Done" || tStatus === "Review" },
            { id: `${taskId}-c3`, text: "Revisão ortográfica e padrões", done: tStatus === "Done" }
          ],
          attachments: tIdx % 3 === 0 ? [
            {
              id: `${taskId}-att-1`,
              fileName: "documento_especificacao_tecnica_v4.pdf",
              fileSize: "2.4 MB",
              fileUrl: "#",
              uploadedAt: new Date(tStart).toISOString()
            }
          ] : [],
          commentsCount: tIdx % 2 === 0 ? 1 : 0
        });

        if (tIdx % 2 === 0) {
          comments.push({
            id: `comm-${taskId}`,
            taskId: taskId,
            projectId: pId,
            userId: "user-manager",
            userName: "Mariana Costa",
            userAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
            content: "Tarefa progredindo conforme cronograma do sprint. Atenção às dependências operacionais.",
            createdAt: addDaysString(tStart, 2)
          });
        }
      });

      activityLogs.push({
        id: `act-seed-${pId}`,
        projectId: pId,
        projectName: meta.p,
        userId: "user-admin",
        userName: "Carlos Silveira",
        action: "create",
        details: `Projeto iniciado formalmente no sistema sob governança do gestor ${meta.responsible}.`,
        createdAt: projectStart
      });
    });

    notifications.push({
      id: "not-1",
      userId: "user-admin",
      text: "Atenção: 3 Projetos Corporativos da área de TI estão indicando status de ATRASO.",
      type: "warning",
      read: false,
      createdAt: new Date().toISOString()
    });

    notifications.push({
      id: "not-2",
      userId: "user-admin",
      text: "Sucesso: O aplicativo de Telemedicina Einstein concluiu todas as checklists com SLA excelente.",
      type: "success",
      read: false,
      createdAt: new Date().toISOString()
    });

    return {
      users,
      projects,
      tasks,
      comments,
      activityLogs,
      notifications
    };
  }

  private static save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
  }

  // PROJECTS CRUD
  public static async getProjects(): Promise<Project[]> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const list = await prisma.project.findMany({
        include: {
          responsible: true,
          tags: true
        }
      });
      return list.map(fromPrismaProject);
    }
    return this.data.projects;
  }

  public static async getProjectById(id: string): Promise<Project | undefined> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const p = await prisma.project.findUnique({
        where: { id },
        include: {
          responsible: true,
          tags: true
        }
      });
      return p ? fromPrismaProject(p) : undefined;
    }
    return this.data.projects.find(p => p.id === id);
  }

  public static async createProject(project: Omit<Project, "id" | "progress" | "weekOfYear">): Promise<Project> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const tagIds: string[] = [];
      if (project.tags && project.tags.length > 0) {
        for (const tName of project.tags) {
          const t = await prisma.tag.upsert({
            where: { name: tName },
            update: {},
            create: { name: tName }
          });
          tagIds.push(t.id);
        }
      }

      const newPrj = await prisma.project.create({
        data: {
          name: project.name,
          code: project.code,
          description: project.description,
          client: project.client,
          responsibleId: project.responsibleId,
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate),
          status: toPrismaProjectStatus(project.status),
          priority: toPrismaPriority(project.priority),
          progress: 0,
          color: toPrismaColor(project.color),
          notes: project.notes,
          tags: {
            connect: tagIds.map(id => ({ id }))
          }
        },
        include: {
          responsible: true,
          tags: true
        }
      });

      await this.createActivityLog({
        projectId: newPrj.id,
        projectName: newPrj.name,
        userId: "user-admin",
        userName: "Carlos Silveira",
        action: "create",
        details: `Novo projeto '${newPrj.name}' cadastrado sob responsabilidade de ${project.responsibleName}.`
      });

      return fromPrismaProject(newPrj);
    }

    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      progress: 0,
      weekOfYear: getWeekNumber(project.startDate)
    };
    this.data.projects.push(newProject);
    
    await this.createActivityLog({
      projectId: newProject.id,
      projectName: newProject.name,
      userId: "user-admin",
      userName: "Carlos Silveira",
      action: "create",
      details: `Novo projeto '${newProject.name}' cadastrado sob responsabilidade de ${newProject.responsibleName}.`
    });

    this.save();
    return newProject;
  }

  public static async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.code !== undefined) updateData.code = updates.code;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.client !== undefined) updateData.client = updates.client;
      if (updates.responsibleId !== undefined) updateData.responsibleId = updates.responsibleId;
      if (updates.startDate !== undefined) updateData.startDate = new Date(updates.startDate);
      if (updates.endDate !== undefined) updateData.endDate = new Date(updates.endDate);
      if (updates.status !== undefined) updateData.status = toPrismaProjectStatus(updates.status);
      if (updates.priority !== undefined) updateData.priority = toPrismaPriority(updates.priority);
      if (updates.progress !== undefined) updateData.progress = updates.progress;
      if (updates.color !== undefined) updateData.color = toPrismaColor(updates.color);
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      if (updates.tags !== undefined) {
        const tagIds: string[] = [];
        for (const tName of updates.tags) {
          const t = await prisma.tag.upsert({
            where: { name: tName },
            update: {},
            create: { name: tName }
          });
          tagIds.push(t.id);
        }
        updateData.tags = {
          set: tagIds.map(id => ({ id }))
        };
      }

      const p = await prisma.project.update({
        where: { id },
        data: updateData,
        include: {
          responsible: true,
          tags: true
        }
      });

      await this.createActivityLog({
        projectId: p.id,
        projectName: p.name,
        userId: "user-admin",
        userName: "Carlos Silveira",
        action: "update",
        details: `Dados do projeto '${p.name}' foram modificados.`
      });

      return fromPrismaProject(p);
    }

    const index = this.data.projects.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    const original = this.data.projects[index];
    const updated = { ...original, ...updates };

    if (updates.startDate) {
      updated.weekOfYear = getWeekNumber(updates.startDate);
    }

    this.data.projects[index] = updated;

    await this.createActivityLog({
      projectId: updated.id,
      projectName: updated.name,
      userId: "user-admin",
      userName: "Carlos Silveira",
      action: "update",
      details: `Dados do projeto '${updated.name}' foram modificados.`
    });

    this.save();
    return updated;
  }

  public static async deleteProject(id: string): Promise<boolean> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      try {
        const p = await prisma.project.findUnique({ where: { id } });
        if (!p) return false;

        await prisma.project.delete({ where: { id } });

        await this.createActivityLog({
          userId: "user-admin",
          userName: "Carlos Silveira",
          action: "delete",
          details: `Projeto '${p.name}' foi excluído permanentemente.`
        });
        return true;
      } catch (e) {
        console.error("Prisma project delete failed", e);
        return false;
      }
    }

    const index = this.data.projects.findIndex(p => p.id === id);
    if (index === -1) return false;

    const [deleted] = this.data.projects.splice(index, 1);
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== id);
    this.data.comments = this.data.comments.filter(c => c.projectId !== id);

    await this.createActivityLog({
      userId: "user-admin",
      userName: "Carlos Silveira",
      action: "delete",
      details: `Projeto '${deleted.name}' foi excluído permanentemente.`
    });

    this.save();
    return true;
  }

  public static async recalculateProjectProgress(projectId: string): Promise<void> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const pTasks = await prisma.task.findMany({ where: { projectId } });
      if (pTasks.length === 0) return;

      const doneCount = pTasks.filter(t => t.status === "DONE").length;
      const progress = Math.round((doneCount / pTasks.length) * 100);

      await prisma.project.update({
        where: { id: projectId },
        data: {
          progress,
          status: progress === 100 ? "COMPLETED" : undefined
        }
      });
      return;
    }

    const projectTasks = this.data.tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return;

    const doneCount = projectTasks.filter(t => t.status === "Done").length;
    const progress = Math.round((doneCount / projectTasks.length) * 100);

    const index = this.data.projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      this.data.projects[index].progress = progress;
      if (progress === 100) {
        this.data.projects[index].status = "Concluído" as any;
      }
      this.save();
    }
  }

  // TASKS CRUD
  public static async getTasks(projectId?: string): Promise<Task[]> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const list = await prisma.task.findMany({
        where: projectId ? { projectId } : undefined,
        include: {
          responsible: true,
          attachments: true,
          _count: {
            select: { comments: true }
          }
        }
      });
      return list.map(fromPrismaTask);
    }
    if (projectId) {
      return this.data.tasks.filter(t => t.projectId === projectId);
    }
    return this.data.tasks;
  }

  public static async getTaskById(id: string): Promise<Task | undefined> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const t = await prisma.task.findUnique({
        where: { id },
        include: {
          responsible: true,
          attachments: true,
          _count: {
            select: { comments: true }
          }
        }
      });
      return t ? fromPrismaTask(t) : undefined;
    }
    return this.data.tasks.find(t => t.id === id);
  }

  public static async createTask(task: Omit<Task, "id" | "weekOfYear" | "commentsCount">): Promise<Task> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const responsibleUser = await prisma.user.findFirst({
        where: { name: task.responsibleName }
      });
      const respId = responsibleUser ? responsibleUser.id : "user-manager";

      const created = await prisma.task.create({
        data: {
          id: `task-${Date.now()}`,
          projectId: task.projectId,
          title: task.title,
          description: task.description,
          responsibleId: respId,
          startDate: new Date(task.startDate),
          endDate: new Date(task.endDate),
          status: toPrismaTaskStatus(task.status),
          priority: toPrismaPriority(task.priority),
          dependencies: JSON.stringify(task.dependencies),
          checklist: JSON.stringify(task.checklist)
        },
        include: {
          responsible: true,
          attachments: true,
          _count: {
            select: { comments: true }
          }
        }
      });

      const proj = await prisma.project.findUnique({ where: { id: created.projectId } });

      await this.createActivityLog({
        projectId: created.projectId,
        projectName: proj?.name || "",
        taskId: created.id,
        taskTitle: created.title,
        userId: respId,
        userName: task.responsibleName,
        action: "create",
        details: `Tarefa '${created.title}' cadastrada no projeto sob responsabilidade de ${task.responsibleName}.`
      });

      await this.recalculateProjectProgress(created.projectId);
      return fromPrismaTask(created);
    }

    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      weekOfYear: getWeekNumber(task.startDate),
      commentsCount: 0
    };
    this.data.tasks.push(newTask);

    const proj = await this.getProjectById(newTask.projectId);

    await this.createActivityLog({
      projectId: newTask.projectId,
      projectName: proj?.name || "",
      taskId: newTask.id,
      taskTitle: newTask.title,
      userId: "user-manager",
      userName: "Mariana Costa",
      action: "create",
      details: `Tarefa '${newTask.title}' cadastrada no projeto sob responsabilidade de ${newTask.responsibleName}.`
    });

    await this.recalculateProjectProgress(newTask.projectId);
    this.save();
    return newTask;
  }

  public static async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const existing = await prisma.task.findUnique({ where: { id } });
      if (!existing) return undefined;

      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.startDate !== undefined) updateData.startDate = new Date(updates.startDate);
      if (updates.endDate !== undefined) updateData.endDate = new Date(updates.endDate);
      if (updates.status !== undefined) updateData.status = toPrismaTaskStatus(updates.status);
      if (updates.priority !== undefined) updateData.priority = toPrismaPriority(updates.priority);
      if (updates.checklist !== undefined) updateData.checklist = JSON.stringify(updates.checklist);
      if (updates.dependencies !== undefined) updateData.dependencies = JSON.stringify(updates.dependencies);
      
      if (updates.responsibleName !== undefined) {
        const user = await prisma.user.findFirst({ where: { name: updates.responsibleName } });
        if (user) {
          updateData.responsibleId = user.id;
        }
      }

      const t = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          responsible: true,
          attachments: true,
          _count: {
            select: { comments: true }
          }
        }
      });

      const proj = await prisma.project.findUnique({ where: { id: t.projectId } });

      let activityStr = `Tarefa '${t.title}' foi atualizada.`;
      if (updates.status && updates.status !== fromPrismaTaskStatus(existing.status)) {
        activityStr = `Tarefa '${t.title}' movida de '${fromPrismaTaskStatus(existing.status)}' para '${updates.status}'.`;
      }

      await this.createActivityLog({
        projectId: t.projectId,
        projectName: proj?.name || "",
        taskId: t.id,
        taskTitle: t.title,
        userId: "user-manager",
        userName: "Mariana Costa",
        action: "update",
        details: activityStr
      });

      await this.recalculateProjectProgress(t.projectId);
      return fromPrismaTask(t);
    }

    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index === -1) return undefined;

    const original = this.data.tasks[index];
    const updated = { ...original, ...updates };

    if (updates.startDate) {
      updated.weekOfYear = getWeekNumber(updates.startDate);
    }

    this.data.tasks[index] = updated;

    const proj = await this.getProjectById(updated.projectId);

    let activityStr = `Tarefa '${updated.title}' foi atualizada.`;
    if (updates.status && updates.status !== original.status) {
      activityStr = `Tarefa '${updated.title}' movida de '${original.status}' para '${updated.status}'.`;
    }

    await this.createActivityLog({
      projectId: updated.projectId,
      projectName: proj?.name || "",
      taskId: updated.id,
      taskTitle: updated.title,
      userId: "user-manager",
      userName: "Mariana Costa",
      action: "update",
      details: activityStr
    });

    await this.recalculateProjectProgress(updated.projectId);
    this.save();
    return updated;
  }

  public static async deleteTask(id: string): Promise<boolean> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      try {
        const t = await prisma.task.findUnique({ where: { id } });
        if (!t) return false;

        await prisma.task.delete({ where: { id } });

        const proj = await prisma.project.findUnique({ where: { id: t.projectId } });

        await this.createActivityLog({
          projectId: t.projectId,
          projectName: proj?.name || "",
          userId: "user-manager",
          userName: "Mariana Costa",
          action: "delete",
          details: `Tarefa '${t.title}' foi excluída.`
        });

        await this.recalculateProjectProgress(t.projectId);
        return true;
      } catch (e) {
        console.error("Prisma delete task failed", e);
        return false;
      }
    }

    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    const [deleted] = this.data.tasks.splice(index, 1);
    this.data.comments = this.data.comments.filter(c => c.taskId !== id);

    const proj = await this.getProjectById(deleted.projectId);

    await this.createActivityLog({
      projectId: deleted.projectId,
      projectName: proj?.name || "",
      userId: "user-manager",
      userName: "Mariana Costa",
      action: "delete",
      details: `Tarefa '${deleted.title}' foi excluída.`
    });

    await this.recalculateProjectProgress(deleted.projectId);
    this.save();
    return true;
  }

  // COMMENTS CRUD
  public static async getComments(taskId: string): Promise<Comment[]> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const list = await prisma.comment.findMany({
        where: { taskId },
        include: {
          user: true,
          task: true
        },
        orderBy: {
          createdAt: "asc"
        }
      });
      return list.map(fromPrismaComment);
    }
    return this.data.comments.filter(c => c.taskId === taskId);
  }

  public static async addComment(comment: Omit<Comment, "id" | "createdAt">): Promise<Comment> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const created = await prisma.comment.create({
        data: {
          id: `comm-${Date.now()}`,
          taskId: comment.taskId,
          userId: comment.userId,
          content: comment.content
        },
        include: {
          user: true,
          task: true
        }
      });
      return fromPrismaComment(created);
    }

    const newComment: Comment = {
      ...comment,
      id: `comm-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.comments.push(newComment);

    const tIndex = this.data.tasks.findIndex(t => t.id === comment.taskId);
    if (tIndex !== -1) {
      this.data.tasks[tIndex].commentsCount = (this.data.tasks[tIndex].commentsCount || 0) + 1;
    }

    this.save();
    return newComment;
  }

  // ACTIVITY LOGS
  public static async getActivityLogs(): Promise<ActivityLog[]> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const list = await prisma.activityLog.findMany({
        orderBy: {
          createdAt: "desc"
        },
        take: 400,
        include: {
          project: true,
          task: true,
          user: true
        }
      });
      return list.map(fromPrismaActivityLog);
    }
    return [...this.data.activityLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async createActivityLog(log: Omit<ActivityLog, "id" | "createdAt">): Promise<ActivityLog> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const created = await prisma.activityLog.create({
        data: {
          id: `act-${Date.now()}`,
          projectId: log.projectId,
          taskId: log.taskId,
          userId: log.userId,
          action: log.action,
          details: log.details
        },
        include: {
          project: true,
          task: true,
          user: true
        }
      });
      return fromPrismaActivityLog(created);
    }

    const newLog: ActivityLog = {
      ...log,
      id: `act-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.activityLogs.push(newLog);
    if (this.data.activityLogs.length > 400) {
      this.data.activityLogs.shift();
    }
    this.save();
    return newLog;
  }

  // NOTIFICATIONS CRUD
  public static async getNotifications(userId?: string): Promise<Notification[]> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const list = await prisma.notification.findMany({
        where: userId ? {
          OR: [
            { userId },
            { userId: "all" }
          ]
        } : undefined,
        orderBy: {
          createdAt: "desc"
        }
      });
      return list.map(fromPrismaNotification);
    }
    if (userId) {
      return this.data.notifications.filter(n => n.userId === userId || n.userId === "all");
    }
    return this.data.notifications;
  }

  public static async createNotification(n: Omit<Notification, "id" | "createdAt" | "read">): Promise<Notification> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const created = await prisma.notification.create({
        data: {
          id: `not-${Date.now()}`,
          userId: n.userId,
          text: n.text,
          type: n.type,
          read: false
        }
      });
      return fromPrismaNotification(created);
    }

    const newN: Notification = {
      ...n,
      id: `not-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(newN);
    this.save();
    return newN;
  }

  public static async markNotificationRead(id: string): Promise<void> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      await prisma.notification.update({
        where: { id },
        data: { read: true }
      });
      return;
    }

    const idx = this.data.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      this.data.notifications[idx].read = true;
      this.save();
    }
  }

  public static async markAllNotificationsRead(userId: string): Promise<void> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      await prisma.notification.updateMany({
        where: { userId },
        data: { read: true }
      });
      return;
    }

    this.data.notifications = this.data.notifications.map(n => {
      if (n.userId === userId) {
        return { ...n, read: true };
      }
      return n;
    });
    this.save();
  }

  // AUTHENTICATION HELPERS
  public static async getUserByEmail(email: string): Promise<User | undefined> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const u = await prisma.user.findFirst({
        where: {
          email: {
            equals: email.toLowerCase().trim(),
            mode: "insensitive"
          }
        }
      });
      return u ? fromPrismaUser(u) : undefined;
    }
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public static async getUserById(id: string): Promise<User | undefined> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const u = await prisma.user.findUnique({
        where: { id }
      });
      return u ? fromPrismaUser(u) : undefined;
    }
    return this.data.users.find(u => u.id === id);
  }

  public static async createUser(user: User): Promise<User> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const u = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email.toLowerCase().trim(),
          passwordHash: user.passwordHash,
          name: user.name,
          role: toPrismaRole(user.role),
          avatarUrl: user.avatarUrl,
          productivity: user.productivity
        }
      });
      return fromPrismaUser(u);
    }
    this.data.users.push(user);
    this.save();
    return user;
  }

  public static async getUsers(): Promise<User[]> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const dbUsers = await prisma.user.findMany();
      return dbUsers.map(u => fromPrismaUser(u));
    }
    return this.data.users;
  }

  public static async updateUser(id: string, updated: Partial<User>): Promise<User | undefined> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      const dataToUpdate: any = {};
      if (updated.email !== undefined) dataToUpdate.email = updated.email.toLowerCase().trim();
      if (updated.passwordHash !== undefined) dataToUpdate.passwordHash = updated.passwordHash;
      if (updated.name !== undefined) dataToUpdate.name = updated.name;
      if (updated.role !== undefined) dataToUpdate.role = toPrismaRole(updated.role);
      if (updated.avatarUrl !== undefined) dataToUpdate.avatarUrl = updated.avatarUrl;
      if (updated.productivity !== undefined) dataToUpdate.productivity = updated.productivity;

      const u = await prisma.user.update({
        where: { id },
        data: dataToUpdate
      });
      return fromPrismaUser(u);
    }
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updated };
      this.save();
      return this.data.users[idx];
    }
    return undefined;
  }

  public static async deleteUser(id: string): Promise<boolean> {
    await this.init();
    const prisma = getPrisma();
    if (prisma) {
      // 1. Reassign projects where this user was the responsibleId to "user-admin"
      await prisma.project.updateMany({
        where: { responsibleId: id },
        data: { responsibleId: "user-admin" }
      });

      // 2. Reassign tasks where this user was the responsibleId to "user-admin"
      await prisma.task.updateMany({
        where: { responsibleId: id },
        data: { responsibleId: "user-admin" }
      });

      // 3. Delete comments posted by this user
      await prisma.comment.deleteMany({
        where: { userId: id }
      });

      // 4. Delete activity logs generated by this user
      await prisma.activityLog.deleteMany({
        where: { userId: id }
      });

      // 5. Delete notifications for this user
      await prisma.notification.deleteMany({
        where: { userId: id }
      });

      // 6. Finally delete the user itself
      await prisma.user.delete({
        where: { id }
      });
      return true;
    }
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      const user = this.data.users[idx];
      // 1. Reassign projects to "user-admin" in JSON state
      this.data.projects = (this.data.projects || []).map(p => 
        p.responsibleId === id ? { ...p, responsibleId: "user-admin", responsibleName: "Carlos Silveira" } : p
      );
      // 2. Reassign tasks to "user-admin" in JSON state by comparing name
      this.data.tasks = (this.data.tasks || []).map(t => 
        t.responsibleName === user.name ? { ...t, responsibleName: "Carlos Silveira" } : t
      );
      // 3. Delete comments in JSON state
      this.data.comments = (this.data.comments || []).filter(c => c.userId !== id);
      // 4. Delete activity logs in JSON state
      this.data.activityLogs = (this.data.activityLogs || []).filter(l => l.userId !== id);
      // 5. Delete notifications in JSON state
      this.data.notifications = (this.data.notifications || []).filter(n => n.userId !== id);

      this.data.users.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }
}
