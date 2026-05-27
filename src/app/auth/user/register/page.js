"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserRegister() {
  const router = useRouter();

  // Un état pour chaque champ du formulaire
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [quartier, setQuartier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");
    setSucces("");

    // Vérification côté client : les mots de passe correspondent ?
    if (password !== confirm) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, prenom, email, telephone, quartier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErreur(data.message);
        return;
      }

      // Inscription réussie → on affiche un message puis on redirige
      setSucces("Compte créé ! Redirection...");
      setTimeout(() => router.push("/auth/user/login"), 1500);
    } catch (error) {
      setErreur("Erreur serveur, réessaye.");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#6200ee] px-6 py-12">
      <div className="w-full max-w-[420px] rounded-[40px] bg-white p-10 shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-xl font-black text-[#1d1d1f]">
            <i className="fa-solid fa-leaf text-[#6200ee]"></i> EcoTrack
          </div>
          <h2 className="mt-8 text-3xl font-bold text-[#1d1d1f]">Inscription</h2>
          <p className="mt-1 text-sm text-gray-500">Rejoignez la révolution écologique.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-3">

          {/* Chaque input a son propre value + onChange */}
          <div className="relative">
            <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-[#6200ee]"></i>
            <input type="text" placeholder="Nom" value={nom}
              onChange={(e) => setNom(e.target.value)} required
              className="w-full rounded-2xl bg-[#eff4ff] py-4 pl-14 pr-5 text-sm font-medium text-gray-800 outline-none" />
          </div>

          <div className="relative">
            <i className="fa-solid fa-user absolute left-5 top-1/2 -translate-y-1/2 text-[#6200ee]"></i>
            <input type="text" placeholder="Prénom" value={prenom}
              onChange={(e) => setPrenom(e.target.value)} required
              className="w-full rounded-2xl bg-[#eff4ff] py-4 pl-14 pr-5 text-sm font-medium text-gray-800 outline-none" />
          </div>

          <div className="relative">
            <i className="fa-solid fa-at absolute left-5 top-1/2 -translate-y-1/2 text-[#6200ee]"></i>
            {/* Correction : placeholder était "ADM-2026", c'est un champ email */}
            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-2xl bg-[#eff4ff] py-4 pl-14 pr-5 text-sm font-medium text-gray-800 outline-none" />
          </div>

          <div className="relative">
            <i className="fa-solid fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-[#6200ee]"></i>
            <input type="tel" placeholder="Numéro de téléphone" value={telephone}
              onChange={(e) => setTelephone(e.target.value)} required
              className="w-full rounded-2xl bg-[#eff4ff] py-4 pl-14 pr-5 text-sm font-medium text-gray-800 outline-none" />
          </div>

          <div className="relative">
            <i className="fa-solid fa-location-dot absolute left-5 top-1/2 -translate-y-1/2 text-[#6200ee]"></i>
            <input type="text" placeholder="Quartier de résidence" value={quartier}
              onChange={(e) => setQuartier(e.target.value)} required
              className="w-full rounded-2xl bg-[#eff4ff] py-4 pl-14 pr-5 text-sm font-medium text-gray-800 outline-none" />
          </div>

          <div className="relative">
            <i className="fa-solid fa-key absolute left-5 top-1/2 -translate-y-1/2 text-[#6200ee]"></i>
            <input type="password" placeholder="Mot de passe" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              className="w-full rounded-2xl bg-[#eff4ff] py-4 pl-14 pr-5 text-sm font-medium text-gray-800 outline-none" />
          </div>

          <div className="relative">
            <i className="fa-solid fa-check-double absolute left-5 top-1/2 -translate-y-1/2 text-[#6200ee]"></i>
            <input type="password" placeholder="Confirmer le mot de passe" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} required
              className="w-full rounded-2xl bg-[#f4f4f4] py-4 pl-14 pr-5 text-sm font-medium text-gray-400 outline-none" />
          </div>

          {/* Messages d'erreur et de succès */}
          {erreur && <p className="text-center text-sm font-medium text-red-500">{erreur}</p>}
          {succes && <p className="text-center text-sm font-medium text-green-500">{succes}</p>}

          <button type="submit" disabled={chargement}
            className="mt-6 w-full rounded-2xl bg-[#6200ee] py-5 text-lg font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50">
            {chargement ? "Inscription..." : "S'inscrire"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-gray-500">
          Déjà inscrit ?{" "}
          <Link href="/auth/user/login" className="font-bold text-[#6200ee]">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}