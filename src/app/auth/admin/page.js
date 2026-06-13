"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AdminAuth() {
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    const result = await signIn("credentials", {
      type: "admin",
      identifiant,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setErreur("Identifiant ou mot de passe incorrect");
      setChargement(false);
      return;
    }

    // Connexion réussie → redirection directe sans vérifier la session
    // Le dashboard gère lui-même la protection
    window.location.href = "/admin";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] px-6">
      <div className="w-full max-w-[440px] rounded-[24px] bg-[#121214] p-8 shadow-2xl border border-white/5">
        <div className="flex flex-col items-center">
          <span className="rounded-md bg-[#002211] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00ff88] border border-[#00ff88]/20">
            ● System Administration
          </span>
          <h1 className="mt-8 text-4xl font-bold text-white tracking-tight">
            Accès <span className="text-gray-400 font-medium">Restreint</span>
          </h1>
          <p className="mt-3 text-center text-sm text-gray-500 leading-relaxed max-w-[280px]">
            Veuillez vous authentifier pour accéder au terminal de contrôle.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-12 space-y-7">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00ff88]">
              <i className="fa-solid fa-id-card-clip"></i> Identifiant Agent
            </label>
            <input
              type="text"
              placeholder="ADM-2026"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              required
              className="w-full rounded-xl bg-[#eef4ff] py-4 px-5 text-lg font-medium text-black outline-none shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#00ff88]">
              <i className="fa-solid fa-shield-halved"></i> Code de sécurité
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl bg-[#eef4ff] py-4 px-5 text-lg font-medium text-black outline-none shadow-inner"
            />
          </div>

          {erreur && (
            <p className="text-center text-sm font-medium text-red-400">{erreur}</p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-5 text-lg font-black uppercase tracking-tighter text-black transition-transform active:scale-[0.97] disabled:opacity-50"
          >
            {chargement ? "Vérification..." : (
              <>Accéder au Dashboard <i className="fa-solid fa-arrow-right"></i></>
            )}
          </button>
        </form>

        <div className="mt-10 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-widest text-gray-700">
          <i className="fa-solid fa-circle-info"></i>
          <span>Tentative de connexion journalisée sur l'IP : 192.168.1.XX</span>
        </div>
      </div>
    </div>
  );
}
