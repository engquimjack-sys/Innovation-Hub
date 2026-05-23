import React, { useState } from "react";
import { UserSession } from "../types";
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  Sparkles, 
  User, 
  Mail, 
  Percent, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  X,
  Shield,
  Briefcase,
  Link
} from "lucide-react";

interface DeveloperManagementProps {
  developers: UserSession[];
  onRefreshDevelopers: () => void;
  pushNotification: (text: string, type: "info" | "warning" | "success" | "error") => void;
}

export default function DeveloperManagement({
  developers,
  onRefreshDevelopers,
  pushNotification
}: DeveloperManagementProps) {
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingDev, setEditingDev] = useState<UserSession | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserSession["role"]>("Usuário");
  const [productivity, setProductivity] = useState("100");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deletion state
  const [deletingDevId, setDeletingDevId] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("Usuário");
    setProductivity("100");
    setAvatarUrl("");
    setErrorMsg(null);
    setEditingDev(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsOpenForm(true);
  };

  const handleOpenEdit = (dev: UserSession) => {
    resetForm();
    setEditingDev(dev);
    setName(dev.name);
    setEmail(dev.email);
    setPassword(""); // Keep password empty on edit unless user provides new one
    setRole(dev.role);
    setProductivity(String(dev.productivity));
    setAvatarUrl(dev.avatarUrl || "");
    setIsOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const numericProd = parseFloat(productivity) || 100;

    // Validate email uniqueness locally (among loaded developers)
    const normalizedEmail = email.toLowerCase().trim();
    const isEmailTaken = developers.some(
      d => d.email.toLowerCase().trim() === normalizedEmail && d.id !== editingDev?.id
    );

    if (isEmailTaken) {
      setErrorMsg("Este endereço de e-mail já está sendo utilizado por outro desenvolvedor.");
      setIsLoading(false);
      return;
    }

    try {
      if (editingDev) {
        // Edit mode (PUT)
        const payload: any = {
          name,
          email: normalizedEmail,
          role,
          productivity: numericProd,
          avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`
        };

        if (password) {
          payload.password = password;
        }

        const res = await fetch(`/api/developers/${editingDev.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro ao atualizar dados do developer.");
        }

        pushNotification(`Developer "${name}" atualizado com sucesso no sistema!`, "success");
      } else {
        // Create mode (POST)
        const payload = {
          name,
          email: normalizedEmail,
          role,
          productivity: numericProd,
          avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
          password: password || "senha123"
        };

        const res = await fetch("/api/developers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro ao cadastrar novo developer.");
        }

        pushNotification(`Novo Developer "${name}" cadastrado com sucesso!`, "success");
      }

      onRefreshDevelopers();
      setIsOpenForm(false);
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro de servidor ao processar requisição.");
      pushNotification(err.message || "Erro ao salvar perfil do developer.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDevId) return;

    try {
      const res = await fetch(`/api/developers/${deletingDevId}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir developer.");
      }

      pushNotification("Developer removido do sistema com sucesso.", "success");
      onRefreshDevelopers();
      setDeletingDevId(null);
    } catch (err: any) {
      pushNotification(err.message || "Erro ao excluir o desenvolvedor.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card with action */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              Gestão de Equipe & Developers
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre, edite perfis e remova os desenvolvedores cadastrados na corporação para as atribuições de tarefas e acompanhamento de metas.
            </p>
          </div>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            Cadastrar Developer
          </button>
        </div>

        {/* Developer Grid / List layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {developers.map(dev => (
            <div 
              key={dev.id} 
              className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition relative group overflow-hidden"
            >
              {/* Highlight bar base on Role level */}
              <div className={`absolute top-0 left-0 w-full h-[3px] ${
                dev.role === "Administrador" ? "bg-gradient-to-r from-red-500 to-pink-500" :
                dev.role === "Gerente" ? "bg-gradient-to-r from-cyan-500 to-blue-500" :
                "bg-slate-700"
              }`} />

              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={dev.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
                        alt={dev.name} 
                        className="w-12 h-12 rounded-full border border-slate-800 object-cover referrerPolicy='no-referrer'"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{dev.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                        <Mail className="h-3 w-3 inline text-slate-600" />
                        {dev.email}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                    dev.role === "Administrador" ? "bg-red-950/40 border border-red-800/40 text-red-400" :
                    dev.role === "Gerente" ? "bg-cyan-950/40 border border-cyan-800/40 text-cyan-400" :
                    "bg-slate-900 border border-slate-800 text-slate-400"
                  }`}>
                    {dev.role}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900/60 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-900/60 flex flex-col justify-center">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Produtividade</span>
                    <span className="text-sm font-semibold text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                      <Percent className="h-3 w-3 text-emerald-500" />
                      {dev.productivity}%
                    </span>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-900/60 flex flex-col justify-center">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Identificador</span>
                    <span className="text-[10px] font-semibold text-slate-400 font-mono mt-0.5 truncate" title={dev.id}>
                      {dev.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons group hover style */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-900/60">
                <button
                  onClick={() => handleOpenEdit(dev)}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
                  title="Editar Perfil"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                
                {dev.id !== "user-admin" && (
                  <button
                    onClick={() => setDeletingDevId(dev.id)}
                    className="p-1.5 bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    title="Remover Developer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {developers.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-600 block text-sm">
              Nenhum desenvolvedor cadastrado no sistema.
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT SLIDING OVERLAY FORM */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between select-none">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                {editingDev ? "Editar Perfil do Developer" : "Cadastrar Novo Developer"}
              </h3>
              <button 
                onClick={() => setIsOpenForm(false)}
                className="text-slate-400 hover:text-slate-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
              {errorMsg && (
                <div className="bg-red-950/40 border border-red-800/40 text-red-300 text-xs p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-500" /> Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amanda Nogueira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-805 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-500" /> E-mail corporativo
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: amanda@corporativo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-805 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-slate-500" /> Senha {editingDev ? "(Deixe em branco para manter)" : ""}
                </label>
                <input
                  type="password"
                  placeholder={editingDev ? "••••••••" : "Ex: senha123 (Se vazio, padrão: senha123)"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-805 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-slate-500" /> Cargo / Nível
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-805 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Usuário">Usuário (Developer)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-slate-500" /> Produtividade (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    placeholder="100"
                    value={productivity}
                    onChange={(e) => setProductivity(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-805 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                  <Link className="h-3.5 w-3.5 text-slate-500" /> URL da Imagem de Perfil (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Se deixar vazio, gerará um avatar no padrão corporativo..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-950 border border-slate-805 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className="px-4 py-2 hover:bg-slate-850 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  {isLoading ? "Processando..." : editingDev ? "Salvar Alterações" : "Cadastrar Developer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCLUSION CONFIRMATION MODAL */}
      {deletingDevId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 text-center shadow-2xl">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3 animate-bounce" />
            <span className="text-sm font-bold text-slate-200 block">Excluir Desenvolvedor</span>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Deseja realmente remover permanentemente este desenvolvedor do sistema corporativo? Esta ação é de alta criticidade e não poderá ser desfeita.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setDeletingDevId(null)}
                className="px-4 py-2 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
