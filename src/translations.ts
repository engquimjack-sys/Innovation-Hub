export type Language = "pt" | "en" | "ko";

export interface TranslationSet {
  brandName: string;
  brandDesc: string;
  dashboard: string;
  portfolio: string;
  kanban: string;
  gantt: string;
  calendar: string;
  reports: string;
  audit: string;
  allProjects: string;
  quickProjects: string;
  globalSLA: string;
  criticalDelay: string;
  logout: string;
  createProject: string;
  syncDatabase: string;
  edit: string;
  delete: string;
  loading: string;
  cancel: string;
  save: string;
  editProject: string;
  newProject: string;
  notStarted: string;
  inProgress: string;
  atRisk: string;
  overdue: string;
  completed: string;
  cancelled: string;
  low: string;
  medium: string;
  high: string;
  critical: string;
  projectName: string;
  projectCode: string;
  client: string;
  description: string;
  manager: string;
  priority: string;
  color: string;
  tags: string;
  startDate: string;
  endDate: string;
  progress: string;
  actions: string;
  settings: string;
  changeAvatar: string;
  theme: string;
  language: string;
  light: string;
  dark: string;
  system: string;
  avatarUrlPlaceholder: string;
  saveChanges: string;
  successSettings: string;
  confirmDelete: string;
  developers: string;
}

export const translations: Record<Language, TranslationSet> = {
  pt: {
    brandName: "INNOVATION HUB",
    brandDesc: "Gerencie seus projetos e tarefas corporativas conectando diretamente ao seu Supabase.",
    dashboard: "Dashboard Executivo",
    portfolio: "Portfólio de Projetos",
    kanban: "Quadro Kanban",
    gantt: "Gráfico de Gantt",
    calendar: "Calendário",
    reports: "Relatórios & SLAs",
    audit: "Logs de Auditoria",
    allProjects: "Todos os projetos",
    quickProjects: "Projetos Rápidos (EAP)",
    globalSLA: "SLA Global",
    criticalDelay: "Estouro Crítico",
    logout: "Fazer Logout",
    createProject: "Cadastrar Projeto",
    syncDatabase: "Sincronizar base",
    edit: "Editar",
    delete: "Excluir",
    loading: "Carregando...",
    cancel: "Cancelar",
    save: "Salvar",
    editProject: "Editar Projeto",
    newProject: "Cadastrar Novo Projeto",
    notStarted: "Não iniciado",
    inProgress: "Em andamento",
    atRisk: "Em risco",
    overdue: "Atrasado",
    completed: "Concluído",
    cancelled: "Cancelado",
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
    projectName: "Nome do Projeto",
    projectCode: "Código Projeto (Único)",
    client: "PIC",
    description: "Descrição e Metas",
    manager: "Developer",
    priority: "Prioridade",
    color: "Cor Identificadora",
    tags: "Tags (Separar por vírgula)",
    startDate: "Data de Início",
    endDate: "Data de Término",
    progress: "Progresso",
    actions: "Ações",
    settings: "Configurações do Sistema",
    changeAvatar: "Alterar Foto de Perfil",
    theme: "Tema de Cores",
    language: "Idioma",
    light: "Modo Claro",
    dark: "Modo Escuro",
    system: "Modo do Sistema",
    avatarUrlPlaceholder: "URL da Imagem de Perfil",
    saveChanges: "Salvar Alterações",
    successSettings: "Configurações atualizadas com sucesso!",
    confirmDelete: "Aviso: Deseja realmente excluir este livro/projeto e todas suas tarefas? Esta ação é irreversível.",
    developers: "Minha Equipe / Developers"
  },
  en: {
    brandName: "INNOVATION HUB",
    brandDesc: "Manage your corporate projects and tasks directly connected with your Supabase.",
    dashboard: "Executive Dashboard",
    portfolio: "Project Portfolio",
    kanban: "Kanban Board",
    gantt: "Gantt Chart",
    calendar: "Calendar View",
    reports: "Reports & SLAs",
    audit: "Audit Logs",
    allProjects: "All projects",
    quickProjects: "Quick Projects (WBS)",
    globalSLA: "Global SLA",
    criticalDelay: "Critical Delay",
    logout: "Log Out",
    createProject: "Create Project",
    syncDatabase: "Sync Database",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    cancel: "Cancel",
    save: "Save",
    editProject: "Edit Project",
    newProject: "Register New Project",
    notStarted: "Not started",
    inProgress: "In progress",
    atRisk: "At risk",
    overdue: "Overdue",
    completed: "Completed",
    cancelled: "Cancelled",
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
    projectName: "Project Name",
    projectCode: "Project Code (Unique)",
    client: "PIC",
    description: "Description & Goals",
    manager: "Developer",
    priority: "Priority",
    color: "Identifying Color",
    tags: "Tags (Comma separated)",
    startDate: "Start Date",
    endDate: "End Date",
    progress: "Progress",
    actions: "Actions",
    settings: "System Settings",
    changeAvatar: "Change Profile Picture",
    theme: "Color Theme",
    language: "Language",
    light: "Light Mode",
    dark: "Dark Mode",
    system: "System Mode",
    avatarUrlPlaceholder: "Profile Image URL",
    saveChanges: "Save Changes",
    successSettings: "Settings updated successfully!",
    confirmDelete: "Warning: Do you really want to delete this project and all its tasks? This action is irreversible.",
    developers: "My Team / Developers"
  },
  ko: {
    brandName: "INNOVATION HUB",
    brandDesc: "Supabase와 직접 연결하여 기업 프로젝트와 작업을 관리합니다.",
    dashboard: "경영진 대시보드",
    portfolio: "프로젝트 포트폴리오",
    kanban: "칸반 보드",
    gantt: "간트 차트",
    calendar: "캘린더 뷰",
    reports: "보고서 & SLA",
    audit: "감사 로그",
    allProjects: "모든 프로젝트",
    quickProjects: "빠른 프로젝트 (WBS)",
    globalSLA: "글로벌 SLA",
    criticalDelay: "임계 지연",
    logout: "로그아웃",
    createProject: "프로젝트 등록",
    syncDatabase: "데이터 동기화",
    edit: "수정",
    delete: "삭제",
    loading: "로딩 중...",
    cancel: "취소",
    save: "저장",
    editProject: "프로젝트 수정",
    newProject: "새 프로젝트 등록",
    notStarted: "시작 전",
    inProgress: "진행 중",
    atRisk: "위험 상태",
    overdue: "지연됨",
    completed: "완료됨",
    cancelled: "취소됨",
    low: "낮음",
    medium: "보통",
    high: "높음",
    critical: "긴급",
    projectName: "프로젝트 이름",
    projectCode: "프로젝트 코드 (고유)",
    client: "PIC",
    description: "설명 및 목표",
    manager: "Developer",
    priority: "우선순위",
    color: "컬러 아이덴티티",
    tags: "태그 (쉼표로 구분)",
    startDate: "시작일",
    endDate: "종료일",
    progress: "진행률",
    actions: "작업",
    settings: "시스템 설정",
    changeAvatar: "프로필 사진 변경",
    theme: "컬러 테마",
    language: "언어 선택",
    light: "라이트 모드",
    dark: "다크 모드",
    system: "시스템 설정 모드",
    avatarUrlPlaceholder: "프로필 이미지 URL",
    saveChanges: "설정 저장",
    successSettings: "설정이 성공적으로 업데이트되었습니다!",
    confirmDelete: "경고: 이 프로젝트와 모든 관련 작업을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    developers: "나의 팀 / Developers"
  }
};
