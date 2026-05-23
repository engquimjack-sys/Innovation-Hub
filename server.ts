import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { Database } from "./server/db.js";
import { generateProjectAIWarning } from "./server/gemini.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // ----------------------------------------------------
  // API ROUTES SECTION (Evaluated FIRST before Vite router)
  // ----------------------------------------------------

  // API Health Indicator
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. AUTHENTICATION ENDPOINTS
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, role } = req.body;
      if (!email || !password || !name || !role) {
        return res.status(400).json({ error: "Todos os campos (username, email, password, role) são obrigatórios." });
      }

      const existingUser = await Database.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Este endereço de e-mail já está cadastrado." });
      }

      const newUser = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase().trim(),
        passwordHash: password,
        name,
        role: role as "Administrador" | "Gerente" | "Usuário",
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
        productivity: Math.floor(Math.random() * 21) + 80
      };

      await Database.createUser(newUser);

      res.status(201).json({
        message: "Usuário cadastrado com sucesso!",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          avatarUrl: newUser.avatarUrl,
          productivity: newUser.productivity
        }
      });
    } catch (err: any) {
      console.error("❌ Register error:", err);
      res.status(500).json({ error: "Erro ao cadastrar usuário no servidor." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios." });
      }

      const user = await Database.getUserByEmail(email);
      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ error: "Credenciais inválidas. Use 'senha123'." });
      }

      // Generate mock JWT/Session structure
      const token = `jwt-mock-token-${user.id}-${Date.now()}`;
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          productivity: user.productivity
        },
        token,
        refreshToken: `jwt-refresh-${user.id}`
      });
    } catch (err: any) {
      console.error("❌ Login error:", err);
      res.status(500).json({ error: "Erro de autenticação no servidor. Redundância local ativada." });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token é obrigatório." });
      }
      const parts = refreshToken.split("-");
      const userId = parts[2];
      const user = await Database.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "Refresh token inválido." });
      }
      res.json({
        token: `jwt-mock-token-${user.id}-${Date.now()}`
      });
    } catch (err: any) {
      console.error("❌ Token refresh error:", err);
      res.status(500).json({ error: "Erro ao atualizar token." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      // Return Carlos Silveira as authenticated user by default for the sandbox environment
      const user = await Database.getUserById("user-admin");
      if (!user) return res.status(404).json({ error: "User default not found" });
      res.json(user);
    } catch (err: any) {
      console.error("❌ Get me status error:", err);
      res.status(500).json({ error: "Erro ao recuperar sessão do usuário." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório." });
    }
    const user = await Database.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "Usuário com este e-mail não foi encontrado." });
    }
    res.json({ message: "Link de recuperação enviado com sucesso para seu e-mail corporativo." });
  });

  // 1.5. DEVELOPER (TEAM MEMBER) ENDPOINTS
  app.get("/api/developers", async (req, res) => {
    try {
      const devList = await Database.getUsers();
      // Mask password for security
      const safeList = devList.map(d => ({
        id: d.id,
        email: d.email,
        name: d.name,
        role: d.role,
        avatarUrl: d.avatarUrl,
        productivity: d.productivity
      }));
      res.json(safeList);
    } catch (err: any) {
      console.error("❌ Failed to list developers:", err);
      res.status(500).json({ error: "Erro ao listar desenvolvedores" });
    }
  });

  app.post("/api/developers", async (req, res) => {
    try {
      const { email, name, role, productivity, avatarUrl, password } = req.body;
      if (!email || !name || !role) {
        return res.status(400).json({ error: "E-mail, nome e cargo são obrigatórios." });
      }

      const existingUser = await Database.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Este endereço de e-mail já está cadastrado." });
      }

      const newDev = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase().trim(),
        passwordHash: password || "senha123",
        name,
        role: role as "Administrador" | "Gerente" | "Usuário",
        avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
        productivity: productivity ? parseFloat(productivity) : (Math.floor(Math.random() * 21) + 80)
      };

      await Database.createUser(newDev);
      res.status(201).json(newDev);
    } catch (err: any) {
      console.error("❌ Failed to create developer:", err);
      res.status(500).json({ error: "Erro ao criar desenvolvedor" });
    }
  });

  app.put("/api/developers/:id", async (req, res) => {
    try {
      const { email, name, role, productivity, avatarUrl, password } = req.body;
      const id = req.params.id;

      const existingUser = await Database.getUserById(id);
      if (!existingUser) {
        return res.status(404).json({ error: "Desenvolvedor não encontrado." });
      }

      const updatedFields: any = {};
      if (email !== undefined) updatedFields.email = email;
      if (name !== undefined) updatedFields.name = name;
      if (role !== undefined) updatedFields.role = role;
      if (productivity !== undefined) updatedFields.productivity = parseFloat(productivity);
      if (avatarUrl !== undefined) updatedFields.avatarUrl = avatarUrl;
      if (password !== undefined) updatedFields.passwordHash = password;

      const result = await Database.updateUser(id, updatedFields);
      res.json(result);
    } catch (err: any) {
      console.error("❌ Failed to update developer:", err);
      res.status(500).json({ error: "Erro ao atualizar desenvolvedor" });
    }
  });

  app.delete("/api/developers/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (id === "user-admin") {
        return res.status(400).json({ error: "Não é permitido excluir o usuário administrador padrão." });
      }

      const success = await Database.deleteUser(id);
      if (!success) {
        return res.status(404).json({ error: "Desenvolvedor não encontrado." });
      }
      res.json({ message: "Desenvolvedor excluído com sucesso." });
    } catch (err: any) {
      console.error("❌ Failed to delete developer:", err);
      res.status(500).json({ error: "Erro ao deletar desenvolvedor" });
    }
  });

  // 2. PROJECT MANAGEMENT ENDPOINTS
  app.get("/api/projects", async (req, res) => {
    const list = await Database.getProjects();
    res.json(list);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const project = await Database.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: "Projeto não encontrado" });
    res.json(project);
  });

  app.post("/api/projects", async (req, res) => {
    const { name, code, description, client, responsibleName, startDate, endDate, status, priority, color, tags, notes } = req.body;
    if (!name || !code || !startDate || !endDate) {
      return res.status(400).json({ error: "Nome, código, data de início e de fim são obrigatórios." });
    }

    // Resolve manager from responsible name for demo
    let responsibleId = "user-manager";
    if (responsibleName === "Carlos Silveira") responsibleId = "user-admin";
    if (responsibleName === "Rodrigo Santos") responsibleId = "user-dev";

    const newPrj = await Database.createProject({
      name,
      code,
      description: description || "",
      client: client || "Interno",
      responsibleId,
      responsibleName: responsibleName || "Mariana Costa",
      startDate,
      endDate,
      status: status || "Não iniciado",
      priority: priority || "Média",
      color: color || "Azul",
      tags: tags || [],
      notes: notes || ""
    });

    res.status(201).json(newPrj);
  });

  app.put("/api/projects/:id", async (req, res) => {
    const updated = await Database.updateProject(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Projeto não encontrado" });
    res.json(updated);
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const isDeleted = await Database.deleteProject(req.params.id);
    if (!isDeleted) return res.status(404).json({ error: "Projeto não encontrado" });
    res.json({ success: true, message: "Projeto e tarefas vinculadas removidos." });
  });

  // 3. AI DELAY FORECAST ENGINE (Gemini Integration)
  app.get("/api/projects/:id/forecast", async (req, res) => {
    const project = await Database.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: "Projeto não encontrado" });

    const tasks = await Database.getTasks(req.params.id);
    const analysis = await generateProjectAIWarning(project, tasks);
    res.json(analysis);
  });

  // 4. TASK MANAGEMENT ENDPOINTS
  app.get("/api/tasks", async (req, res) => {
    const { projectId } = req.query;
    const list = await Database.getTasks(projectId as string | undefined);
    res.json(list);
  });

  app.get("/api/tasks/:id", async (req, res) => {
    const t = await Database.getTaskById(req.params.id);
    if (!t) return res.status(404).json({ error: "Tarefa não encontrada" });
    res.json(t);
  });

  app.post("/api/tasks", async (req, res) => {
    const { projectId, title, description, responsibleName, startDate, endDate, status, priority, dependencies, checklist } = req.body;
    if (!projectId || !title || !startDate || !endDate) {
      return res.status(400).json({ error: "Projeto, título, data de início e de fim são obrigatórios." });
    }

    const newTask = await Database.createTask({
      projectId,
      title,
      description: description || "",
      responsibleName: responsibleName || "Mariana Costa",
      startDate,
      endDate,
      status: status || "To Do",
      priority: priority || "Média",
      dependencies: dependencies || [],
      checklist: checklist || [],
      attachments: []
    });

    res.status(201).json(newTask);
  });

  app.put("/api/tasks/:id", async (req, res) => {
    const updated = await Database.updateTask(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Tarefa não encontrada" });
    res.json(updated);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const ok = await Database.deleteTask(req.params.id);
    if (!ok) return res.status(404).json({ error: "Tarefa não encontrada" });
    res.json({ success: true, message: "Tarefa excluída com sucesso." });
  });

  // Task comments list
  app.get("/api/tasks/:id/comments", async (req, res) => {
    res.json(await Database.getComments(req.params.id));
  });

  // Add task comment
  app.post("/api/tasks/:id/comments", async (req, res) => {
    const { content, userId, userName, userAvatar, projectId } = req.body;
    if (!content) return res.status(400).json({ error: "Conteúdo é obrigatório." });

    const c = await Database.addComment({
      taskId: req.params.id,
      projectId: projectId || "",
      userId: userId || "user-admin",
      userName: userName || "Carlos Silveira",
      userAvatar: userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      content
    });
    res.status(201).json(c);
  });

  // 5. ACTIVITY LOGS & NOTIFICATIONS
  app.get("/api/activity-logs", async (req, res) => {
    res.json(await Database.getActivityLogs());
  });

  app.get("/api/notifications", async (req, res) => {
    res.json(await Database.getNotifications("user-admin"));
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    await Database.markNotificationRead(req.params.id);
    res.json({ success: true });
  });

  // 6. REPORTS & KPI Performance
  app.get("/api/reports/export", async (req, res) => {
    const projects = await Database.getProjects();

    // Create a beautiful structured CSV text of our projects
    let csv = "Código,Nome do Projeto,Cliente,Responsável,Data Início,Data Término,Status,Prioridade,Progresso (%),Tags\r\n";
    projects.forEach(p => {
      csv += `"${p.code}","${p.name}","${p.client}","${p.responsibleName}","${p.startDate.slice(0, 10)}","${p.endDate.slice(0, 10)}","${p.status}","${p.priority}",${p.progress},"${p.tags.join("; ")}"\r\n`;
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=relatorio_executivo_projetos.csv");
    res.status(200).send(csv);
  });

  // ----------------------------------------------------
  // FRONTEND ROUTING & VITE MIDDLEWARE CONFIG
  // ----------------------------------------------------

  if (process.env.NODE_ENV !== "production") {
    // Mount Vite development midddleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode serving compiled static bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Instruct Express to bind to 0.0.0.0 and Port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Node.js Backend Server running on http://localhost:${PORT}`);
  });
}

startServer();
