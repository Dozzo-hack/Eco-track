"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Loader2, ShieldAlert } from "lucide-react";
import Swal from "sweetalert2";

export default function ProfilPage() {
  const { data: session, status } = useSession();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Structure initiale calquée sur ton modèle
  const [user, setUser] = useState({
    idUnique: "",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    quartier: "",
    photo: null
  });

  const [passwords, setPasswords] = useState({ old: "", new: "" });

  // Charger les vraies données depuis MongoDB via notre API
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "user") {
      const fetchProfileData = async () => {
        try {
          const res = await fetch("/api/user/profile");
          const result = await res.json();
          if (res.ok && result.success) {
            setUser(result.data);
          }
        } catch (err) {
          console.error("Erreur chargement profil client:", err);
        } finally {
          setLoadingData(false);
        }
      };
      fetchProfileData();
    }
  }, [status, session]);

  // Simulation d'import de photo (converti en Base64 ou géré par ton futur CDN)
  const handlePhotoClick = () => fileInputRef.current.click();
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser({ ...user, photo: reader.result }); // Stockage temporaire en string Base64
      };
      reader.readAsDataURL(file);
    }
  };

  // Enregistrer les modifications en base de données
  const handleSave = async () => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: user.nom,
          prenom: user.prenom,
          telephone: user.telephone,
          quartier: user.quartier,
          photo: user.photo
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setIsEditing(false);
        Swal.fire({
          icon: "success",
          title: "Profil Enregistré",
          text: "Vos informations ont été mises à jour avec succès dans MongoDB !",
          confirmButtonColor: "#6200ee"
        });
      } else {
        Swal.fire({ icon: "error", title: "Erreur", text: result.message || "Impossible de sauvegarder." });
      }
    } catch (err) {
      console.error("Erreur sauvegarde profil:", err);
    }
  };

  // Modifier le mot de passe en sécurité
  const handleUpdatePassword = async () => {
    if (!passwords.old || !passwords.new) {
      Swal.fire({ icon: "warning", text: "Veuillez remplir les champs de mot de passe." });
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.old,
          newPassword: passwords.new
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setPasswords({ old: "", new: "" });
        Swal.fire({ icon: "success", title: "Sécurité mise à jour", text: "Votre mot de passe a été modifié." });
      } else {
        Swal.fire({ icon: "error", title: "Erreur", text: result.message });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── SÉCURITÉ DES ACCÈS VIA LA SESSION ──
  if (status === "loading" || (status === "authenticated" && loadingData)) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 gap-2">
        <Loader2 className="animate-spin text-[#6200ee]" size={28} />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Synchronisation de votre profil...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "user") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <ShieldAlert className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-black text-gray-900 uppercase">Session Invalide</h2>
        <p className="text-sm text-gray-500 mt-1">Veuillez vous reconnecter pour gérer votre profil.</p>
      </div>
    );
  }

  return (
    <div className="pt-24 lg:pt-0 pb-24 space-y-8 animate-in fade-in duration-500">
      
      {/* SECTION HEADER : PHOTO & ID */}
      <div className="bg-white rounded-[45px] p-8 shadow-sm border border-gray-50 flex flex-col md:flex-row items-center gap-8">
        <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
          <div className="h-32 w-32 rounded-[40px] bg-[#6200ee] overflow-hidden flex items-center justify-center border-4 border-white shadow-xl">
            {user.photo ? (
              <img src={user.photo} alt="Profil" className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-white">
                {user.prenom ? user.prenom[0] : ""}{user.nom ? user.nom[0] : ""}
              </span>
            )}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-[40px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="fa-solid fa-camera text-white text-xl"></i>
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
        </div>

        <div className="text-center md:text-left space-y-2">
          <div className="inline-block px-4 py-1 rounded-full bg-purple-50 text-[#6200ee] text-[10px] font-black uppercase tracking-tighter border border-purple-100 font-mono">
            ID CLIENT : {user.idUnique}
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{user.prenom} {user.nom}</h1>
          <p className="text-gray-400 font-bold">{user.email}</p>
        </div>

        <div className="md:ml-auto">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-8 py-3 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-[#6200ee] transition-all flex items-center gap-3"
            >
              <i className="fa-solid fa-pen-to-square"></i> Modifier le profil
            </button>
          ) : (
            <button 
              onClick={handleSave}
              className="px-8 py-3 rounded-2xl bg-green-500 text-white font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-3 shadow-lg shadow-green-100"
            >
              <i className="fa-solid fa-check"></i> Sauvegarder
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE INFOS (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[45px] p-10 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-800 mb-8 flex items-center gap-3">
              <span className="h-2 w-2 bg-[#6200ee] rounded-full"></span>
              Informations Personnelles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ProfileField label="Nom" value={user.nom} isEditing={isEditing} onChange={(v) => setUser({...user, nom: v})} />
              <ProfileField label="Prénom" value={user.prenom} isEditing={isEditing} onChange={(v) => setUser({...user, prenom: v})} />
              <ProfileField label="Email professionnel" value={user.email} isEditing={false} onChange={() => {}} type="email" className="opacity-70 cursor-not-allowed" />
              <ProfileField label="Téléphone" value={user.telephone} isEditing={isEditing} onChange={(v) => setUser({...user, telephone: v})} />
              <ProfileField label="Quartier de résidence" value={user.quartier} isEditing={isEditing} onChange={(v) => setUser({...user, quartier: v})} className="md:col-span-2" />
            </div>
          </div>
        </div>

        {/* COLONNE SÉCURITÉ (1/3) */}
        <div className="bg-gray-50 rounded-[45px] p-10 border border-gray-200/50 flex flex-col">
          <h3 className="text-lg font-black text-gray-800 mb-8">Sécurité</h3>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mot de passe actuel</label>
              <input 
                type="password" 
                value={passwords.old}
                onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                placeholder="••••••••" 
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-[#6200ee]/10" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nouveau mot de passe</label>
              <input 
                type="password" 
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                placeholder="Saisir le nouveau" 
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-6 font-bold outline-none focus:ring-2 focus:ring-[#6200ee]/10" 
              />
            </div>

            <button 
              onClick={handleUpdatePassword}
              className="w-full py-4 rounded-2xl bg-white border-2 border-gray-200 text-gray-800 font-black uppercase text-[10px] tracking-widest hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
            >
              Actualiser la sécurité
            </button>
          </div>

          <div className="mt-10 p-4 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-[9px] font-black text-red-500 uppercase leading-relaxed text-center">
              Toute modification de mot de passe déconnectera vos autres appareils.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// Composant réutilisable inchangé pour les champs
function ProfileField({ label, value, isEditing, onChange, className = "", type = "text" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
      {isEditing ? (
        <input 
          type={type}
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-50 border-2 border-[#6200ee]/10 rounded-2xl py-4 px-6 font-bold text-gray-700 outline-none focus:border-[#6200ee] transition-all"
        />
      ) : (
        <div className="w-full bg-white border border-gray-50 rounded-2xl py-4 px-6 font-bold text-gray-800 shadow-sm italic">
          {value || "Non renseigné"}
        </div>
      )}
    </div>
  );
}