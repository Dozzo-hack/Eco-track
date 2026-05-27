"use client";
import React, { useState, useRef } from 'react';
import { useSession, signOut } from "next-auth/react"; // 🔥 Importation des outils NextAuth
import { Camera, LogOut, ShieldCheck, Mail } from 'lucide-react';

export default function ProfilPage() {
  const { data: session, status } = useSession();
  const [photo, setPhoto] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Patrice");
  const fileInputRef = useRef(null);

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPhoto(imageUrl);
    }
  };

  // ⏳ État de chargement pendant la récupération de la session
  if (status === "loading") {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500">Chargement du profil...</p>
      </div>
    );
  }

  // 🔒 Extraction sécurisée des informations ou fallback
  const userNom = session?.user?.name || session?.user?.nom || "Chauffeur";
  const userPrenom = session?.user?.prenom || "";
  const userEmail = session?.user?.email || "non-renseigné@ecotrack.cm";
  
  // Utilisation de l'ID ou d'une valeur fixe temporaire pour le matricule (selon ton modèle Videur)
  const userMatricule = session?.user?.id ? `CH-${session.user.id.slice(-6).toUpperCase()}` : "VT-2026-X8";

  return (
    <div className="p-6 animate-in fade-in duration-700 pb-32">
      <h2 className="text-2xl font-black text-slate-800 mb-8">Mon Profil</h2>

      <div className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-100 relative overflow-hidden mb-6">
        <div className="flex flex-col items-center">
          {/* ZONE PHOTO AVEC IMPORT GALERIE */}
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-[40px] border-4 border-orange-50 overflow-hidden shadow-2xl">
              <img src={photo} alt="Profil" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => fileInputRef.current.click()}
              className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-3 rounded-2xl shadow-lg border-4 border-white active:scale-90 transition-transform"
            >
              <Camera size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* 🔥 Affichage dynamique du nom et prénom */}
          <h3 className="text-2xl font-black text-slate-800 capitalize">
            {`${userNom} ${userPrenom}`.trim()}
          </h3>
          <p className="text-orange-500 font-bold text-xs uppercase tracking-widest bg-orange-50 px-4 py-1 rounded-full mt-2">
            Chauffeur Certifié
          </p>
        </div>

        <div className="mt-10 space-y-5">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <ShieldCheck className="text-slate-400" size={20} />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">Matricule</p>
              <p className="text-sm font-bold text-slate-700 uppercase">{userMatricule}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
            <Mail className="text-slate-400" size={20} />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase">Email Pro</p>
              <p className="text-sm font-bold text-slate-700 lowercase">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 Bouton de déconnexion relié à NextAuth */}
      <button 
        onClick={() => signOut({ callbackUrl: "/login" })} // Redirige vers le login après déconnexion
        className="w-full bg-slate-900 text-white p-6 rounded-[30px] font-black flex items-center justify-center gap-3 active:bg-red-600 transition-colors"
      >
        <LogOut size={20} /> DÉCONNEXION
      </button>
    </div>
  );
}