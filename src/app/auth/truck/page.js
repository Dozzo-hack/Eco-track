"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function TruckLogin() {
  const router = useRouter();

  const [idChauffeur, setIdChauffeur] = useState("");
  const [codePin, setCodePin] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    // type: "videur" dit à NextAuth de traiter le cas videur dans authorize()
    const result = await signIn("credentials", {
      type: "videur",
      idChauffeur,
      codePin,
      redirect: false,
    });

    setChargement(false);

    if (result?.error) {
      setErreur("ID Chauffeur ou Code PIN incorrect");
      return;
    }

    // Connexion réussie → dashboard videur
    router.push("/truck");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f39c12] p-4 font-sans">
      <div className="w-full max-w-[400px] rounded-[40px] bg-white p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-b-[10px] border-black/20">

        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-black shadow-lg">
            <i className="fa-solid fa-truck-fast text-4xl text-[#f39c12]"></i>
          </div>
          <h1 className="text-3xl font-extrabold uppercase italic tracking-tighter text-black">
            Service{" "}
            <span className="text-[#f39c12] drop-shadow-sm">Collecte</span>
          </h1>
          <div className="mt-4 inline-block rounded-full bg-black/5 px-4 py-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">
              Terminal Embarqué v2.0
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-black/30">
              <i className="fa-solid fa-id-badge text-xl"></i>
            </span>
            <input
              type="text"
              placeholder="ID CHAUFFEUR"
              value={idChauffeur}
              onChange={(e) => setIdChauffeur(e.target.value)}
              required
              className="w-full rounded-2xl border-2 border-black/10 bg-gray-50 py-5 pl-14 pr-6 text-lg font-bold placeholder:text-black/20 focus:border-[#f39c12] focus:ring-0 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-black/30">
              <i className="fa-solid fa-lock-open text-xl"></i>
            </span>
            <input
              type="password"
              placeholder="CODE PIN"
              value={codePin}
              onChange={(e) => setCodePin(e.target.value)}
              required
              className="w-full rounded-2xl border-2 border-black/10 bg-gray-50 py-5 pl-14 pr-6 text-lg font-bold tracking-[0.5em] placeholder:text-black/20 placeholder:tracking-normal focus:border-[#f39c12] focus:ring-0 outline-none transition-all"
            />
          </div>

          {erreur && (
            <p className="text-center text-sm font-bold text-red-500">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="group relative w-full overflow-hidden rounded-2xl bg-black py-6 shadow-xl transition-all active:scale-[0.95] active:bg-[#f39c12] disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center justify-center gap-3 text-xl font-black uppercase italic text-[#f39c12] group-active:text-black">
              {chargement ? (
                "Vérification..."
              ) : (
                <>
                  Démarrer le Service{" "}
                  <i className="fa-solid fa-power-off animate-pulse"></i>
                </>
              )}
            </span>
          </button>
        </form>

        <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
            <i className="fa-solid fa-location-crosshairs text-[#f39c12]"></i>
            GPS Actif
          </div>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-ping"></div>
        </div>
      </div>
    </div>
  );
}