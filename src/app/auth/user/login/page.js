"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function UserLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    // signIn envoie les credentials à NextAuth
    // type: "user" dit à NextAuth quel cas traiter dans authorize()
    const result = await signIn("credentials", {
      type: "user",
      email,
      password,
      redirect: false, // on gère la redirection nous-mêmes
    });

    setChargement(false);

    if (result?.error) {
      setErreur("Email ou mot de passe incorrect");
      return;
    }

    // Connexion réussie → dashboard utilisateur
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#6200ee] px-6">
      <div className="w-full max-w-[400px] rounded-[35px] bg-white p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-2xl font-black text-[#1d1d1f]">
            <i className="fa-solid fa-leaf text-[#6200ee]"></i> EcoTrack
          </div>
          <h2 className="mt-8 text-3xl font-bold text-[#1d1d1f]">Bon retour !</h2>
          <p className="mt-2 text-sm text-gray-500">
            Connectez-vous pour suivre vos collectes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <div className="relative">
            <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-[#6200ee]"></i>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl bg-[#eff4ff] py-4 pl-14 pr-5 text-sm font-medium text-gray-800 outline-none"
            />
          </div>

          <div className="relative">
            <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-[#6200ee]"></i>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl bg-[#eff4ff] py-4 pl-14 pr-5 text-sm font-medium text-gray-800 outline-none"
            />
          </div>

          {/* Affiche l'erreur seulement si elle existe */}
          {erreur && (
            <p className="text-center text-sm font-medium text-red-500">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="mt-6 w-full rounded-2xl bg-[#6200ee] py-5 text-lg font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-10 text-center text-sm font-medium text-gray-500">
          Pas de compte ?{" "}
          <Link href="/auth/user/register" className="font-bold text-[#6200ee]">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}