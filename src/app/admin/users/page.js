"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Crown, CheckCircle2, XCircle, MoreVertical, Loader2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterQuartier, setFilterQuartier] = useState("Tous");
  const [filterPlan, setFilterPlan] = useState("Tous");

  // Chargement des vrais utilisateurs depuis l'API MongoDB
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/users");
        const result = await response.json();
        if (response.ok && result.success) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.nom.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuartier = filterQuartier === "Tous" || u.quartier.toLowerCase() === filterQuartier.toLowerCase();
    const matchesPlan = filterPlan === "Tous" || u.plan === filterPlan;
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
            type="text" placeholder="Rechercher par nom ou ID..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-16 pr-6 text-sm text-white outline-none focus:border-green-500/50 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-zinc-400 outline-none cursor-pointer" onChange={(e)=>setFilterQuartier(e.target.value)}>
            <option value="Tous">QUARTIERS : TOUS</option>
            <option value="Akwa">AKWA</option>
            <option value="Deido">DEIDO</option>
            <option value="Bonapriso">BONAPRISO</option>
          </select>
          <select className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-zinc-400 outline-none cursor-pointer" onChange={(e)=>setFilterPlan(e.target.value)}>
            <option value="Tous">ABONNEMENTS : TOUS</option>
            <option value="PREMIUM">PREMIUM</option>
            <option value="STANDARD">STANDARD</option>
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
          Aucun utilisateur trouvé dans la base de données.
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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-all group">
                  <td className="p-8 flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-[10px] text-zinc-500 font-black">
                      {user.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm">{user.nom}</p>
                      <p className="text-[9px] text-zinc-600 uppercase italic font-mono">{user.id}</p>
                    </div>
                  </td>
                  <td className="p-8">
                    <span className="text-[10px] text-zinc-500 uppercase flex items-center gap-2 font-black">
                      <MapPin size={10}/> {user.quartier}
                    </span>
                  </td>
                  <td className="p-8 text-center">
                    {user.plan === "PREMIUM" ? <Crown className="text-purple-500 mx-auto" size={16}/> : <span className="text-[9px] text-zinc-700">STANDARD</span>}
                  </td>
                  <td className="p-8 text-center">
                    <span className="text-amber-500 italic font-black text-lg">★ {user.points}</span>
                  </td>
                  <td className="p-8 text-center">
                    {user.statut === "Actif" ? <CheckCircle2 className="text-green-500 mx-auto" size={20} /> : <XCircle className="text-red-500 mx-auto" size={20} />}
                  </td>
                  <td className="p-8 text-right">
                    {/* 🔥 Ici l'id passé dans le href est le vrai _id MongoDB unique */}
                    <Link href={`/admin/users/${user.id}`} className="p-3 bg-zinc-900 rounded-xl hover:bg-white hover:text-black transition-all inline-block">
                      <MoreVertical size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}