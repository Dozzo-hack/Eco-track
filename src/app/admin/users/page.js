"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Crown, CheckCircle2, XCircle, MoreVertical, Loader2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [quartiersBD, setQuartiersBD] = useState([]); // [{ id: "...", nom: "..." }]
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterQuartier, setFilterQuartier] = useState("Tous");
  const [filterPlan, setFilterPlan] = useState("Tous");

  // Chargement des données (Utilisateurs + Quartiers référentiels) depuis MongoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Charger la liste réelle des quartiers pour faire la correspondance ID -> NOM
        const resQuartiers = await fetch("/api/quartiers");
        const dataQuartiers = await resQuartiers.json();
        let listeQuartiersMappee = [];
        if (resQuartiers.ok && dataQuartiers.success) {
          listeQuartiersMappee = dataQuartiers.data.map(q => ({
            id: q._id.toString(),
            nom: q.nom.toUpperCase().trim()
          }));
          setQuartiersBD(listeQuartiersMappee);
        }

        // 2. Charger les vrais utilisateurs
        const response = await fetch("/api/admin/users");
        const result = await response.json();
        if (response.ok && result.success) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Extraction dynamique des plans d'abonnement présents réellement en base de données pour le filtre
  const plansDisponibles = Array.from(
    new Set(users.map(u => u.plan || u.typeAbonnement || "STANDARD"))
  ).filter(Boolean);

  // Helper pour afficher le nom du quartier à la place de l'ID brut
  const getQuartierNomAffiche = (userQuartierField) => {
    if (!userQuartierField) return "NON SPÉCIFIÉ";
    
    // Si c'est déjà un objet peuplé
    if (typeof userQuartierField === 'object' && userQuartierField.nom) {
      return userQuartierField.nom.toUpperCase();
    }

    const lookupId = userQuartierField.toString().trim();
    const match = quartiersBD.find(q => q.id === lookupId || q.nom.toUpperCase() === lookupId.toUpperCase());
    return match ? match.nom : lookupId.toUpperCase();
  };

  // Logique du filtre de tri mise à jour
  const filteredUsers = users.filter(u => {
    const userId = u._id || u.id || "";
    const userNom = u.nom || "";
    const userPlan = u.plan || u.typeAbonnement || "STANDARD";
    
    // Résolution du nom du quartier pour le filtrage textuel précis
    const quartierNom = getQuartierNomAffiche(u.quartiers || u.quartier);

    const matchesSearch = 
      userNom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      userId.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesQuartier = 
      filterQuartier === "Tous" || 
      quartierNom.toUpperCase() === filterQuartier.toUpperCase();
      
    const matchesPlan = 
      filterPlan === "Tous" || 
      userPlan.toUpperCase() === filterPlan.toUpperCase();

    return matchesSearch && matchesQuartier && matchesPlan;
  });

  return (
    <div className="min-h-screen bg-black text-zinc-400 p-8">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter text-[1.5rem]">GESTION CLIENTS</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">FILTRES AVANCÉS & ADMINISTRATION</p>
        </div>
        <button className="bg-green-500 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase hover:scale-105 transition-all">
          + AJOUTER UN CLIENT
        </button>
      </div>

      {/* FILTRES DYNAMIQUES */}
      <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-[2rem] mb-10 space-y-4">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou ID..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-16 pr-6 text-sm text-white outline-none focus:border-green-500/50 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          {/* Sélection de quartier basée sur la base de données réelle */}
          <select 
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-zinc-400 outline-none cursor-pointer" 
            onChange={(e) => setFilterQuartier(e.target.value)}
            value={filterQuartier}
          >
            <option value="Tous">QUARTIERS : TOUS</option>
            {quartiersBD.map(q => (
              <option key={q.id} value={q.nom}>{q.nom}</option>
            ))}
          </select>

          {/* Sélection d'abonnements basée sur les vrais abonnements de tes clients */}
          <select 
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-zinc-400 outline-none cursor-pointer" 
            onChange={(e) => setFilterPlan(e.target.value)}
            value={filterPlan}
          >
            <option value="Tous">ABONNEMENTS : TOUS</option>
            {plansDisponibles.map(plan => (
              <option key={plan} value={plan.toUpperCase()}>{plan.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLEAU CLIENTS */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="text-green-500 animate-spin" size={32} />
          <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">Synchronisation avec MongoDB...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-[2rem] p-16 text-center text-zinc-600 italic text-sm">
          Aucun utilisateur trouvé avec les critères de sélection actuels.
        </div>
      ) : (
        <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                <th className="p-8">CLIENT</th>
                <th className="p-8">LOCALISATION</th>
                <th className="p-8 text-center">PLAN</th>
                <th className="p-8 text-center">POINTS</th>
                <th className="p-8 text-center">STATUT</th>
                <th className="p-8 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-white font-bold">
              {filteredUsers.map((user) => {
                const currentId = user._id || user.id;
                const currentPlan = user.plan || user.typeAbonnement || "STANDARD";

                return (
                  <tr key={currentId} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-all group">
                    <td className="p-8 flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] text-zinc-500 font-black">
                        {(user.nom || "C").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm">{user.nom || "Sans nom"}</p>
                        <p className="text-[9px] text-zinc-600 uppercase italic font-mono">{currentId}</p>
                      </div>
                    </td>
                    <td className="p-8">
                      <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-2 font-black">
                        <MapPin size={10}/> {getQuartierNomAffiche(user.quartiers || user.quartier)}
                      </span>
                    </td>
                    <td className="p-8 text-center">
                      {currentPlan.toUpperCase() === "PREMIUM" ? (
                        <Crown className="text-purple-500 mx-auto" size={16}/>
                      ) : (
                        <span className="text-[9px] text-zinc-700 bg-zinc-900 px-2 py-1 rounded-md">{currentPlan.toUpperCase()}</span>
                      )}
                    </td>
                    <td className="p-8 text-center">
                      <span className="text-amber-500 italic font-black text-lg">★ {user.points || 0}</span>
                    </td>
                    <td className="p-8 text-center">
                      {user.statut === "Actif" || user.statutActivite === "Actif" || user.actif === true ? (
                        <CheckCircle2 className="text-green-500 mx-auto" size={20} />
                      ) : (
                        <XCircle className="text-red-500 mx-auto" size={20} />
                      )}
                    </td>
                    <td className="p-8 text-right">
                      <Link href={`/admin/users/${currentId}`} className="p-3 bg-zinc-900 rounded-xl hover:bg-white hover:text-black transition-all inline-block">
                        <MoreVertical size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}