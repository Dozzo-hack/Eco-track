"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");
    setMessage("");
    setChargement(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErreur(data.error || "Une erreur est survenue");
      } else {
        setMessage("Un e-mail de récupération a été envoyé si le compte existe.");
        setEmail("");
      }
    } catch (err) {
      setErreur("Impossible de joindre le serveur");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#6200ee] px-6">
      <div className="w-full max-w-[400px] rounded-[35px] bg-white p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-[#1d1d1f]">Récupération de compte</h2>
          <p className="mt-2 text-sm text-gray-500">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="relative">
            <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-[#6200ee]"></i>
            <input
              type="email"
              placeholder="Votre e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl bg-[#eff4ff] py-4 pl-14 pr-5 text-sm font-medium text-gray-800 outline-none"
            />
          </div>

          {erreur && <p className="text-center text-sm font-medium text-red-500">{erreur}</p>}
          {message && <p className="text-center text-sm font-medium text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-2xl bg-[#6200ee] py-4 text-md font-bold text-white transition-all disabled:opacity-50"
          >
            {chargement ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/user/login" className="text-sm font-bold text-[#6200ee] hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}