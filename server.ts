import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { Database } from "./server/db.js";
import { generateProjectAIWarning } from "./server/gemini.js";

dotenv.config();

async function startServer() {
  const app = express();

  // Railway / Render / Cloud platforms use dynamic ports
  const PORT = process.env.PORT || 3000;

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
        return res.status(400).json({
          error:
            "Todos os campos (username, email, password, role) são obrigatórios.",
        });
      }

      const existingUser = await Database.getUserByEmail(email);

      if (existingUser) {
        return res.status(400).json({
          error: "Este endereço de e-mail já está cadastrado.",
        });
      }

      const newUser = {
        id: `user-${Date.now()}`,
        email: email.toLowerCase().trim(),
        passwordHash: password,
        name,
        role: role as "Administrador" | "Gerente" | "Usuário",
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        productivity: Math.floor(Math.random() * 21) + 80,
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
          productivity: newUser.productivity,
        },
      });
    } catch (err: any) {
      console.error("❌ Register error:", err);

      res.status(500).json({
        error: "Erro ao cadastrar usuário no servidor.",
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "Email e senha são obrigatórios.",
        });
      }

      const user = await Database.getUserByEmail(email);

      if (!user || user.passwordHash !== password) {
        return res.status(401).json({
          error: "Credenciais inválidas. Use 'senha123'.",
        });
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
          productivity: user.productivity,
        },
        token,
        refreshToken: `jwt-refresh-${user.id}`,
      });
    } catch (err: any) {
      console.error("❌ Login error:", err);

      res.status(500).json({
        error: "Erro de autenticação no servidor.",
      });
    }
  });

  // ----------------------------------------------------
  // FRONTEND ROUTING & VITE MIDDLEWARE CONFIG
  // ----------------------------------------------------

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Server startup
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Node.js Backend Server running on port ${PORT}`);
  });
}

startServer();