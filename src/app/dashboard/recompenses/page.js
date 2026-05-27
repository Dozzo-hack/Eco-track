"use client";
import { useState, useEffect } from "react";

export default function RecompensesPage() {
  const [userPoints, setUserPoints] = useState(0);
  const [recompensesEchangees, setRecompensesEchangees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageStatus, setMessageStatus] = useState({ text: "", isError: false });

  const nextLevelPoints = 2000;
  const progress = Math.min(100, (userPoints / nextLevelPoints) * 100);

  // Ton catalogue statique (toujours disponible)
  const catalogue = [
    { id: "1", name: "Réduction Vidange", desc: "Bénéficiez de -15% sur votre prochain passage.", price: 100, icon: "fa-tag", color: "bg-purple-100 text-purple-600" },
    { id: "2", name: "Lot de 10 Sacs Poubelle", desc: "Sacs ultra-résistants 50L en plastique recyclé.", price: 500, icon: "fa-box-archive", color: "bg-green-100 text-green-600" },
    { id: "3", name: "Rabais Abonnement", desc: "Economisez 500 FCFA sur le mois prochain.", price: 1000, icon: "fa-hand-holding-dollar", color: "bg-blue-100 text-blue-600" },
    { id: "4", name: "Bon d'achat", desc: "Vous recevrez la somme de 2000FCFA.", price: 2000, icon: "fa-trophy", color: "bg-amber-100 text-amber-600" },
  ];

  // Charger le profil utilisateur (Points + Historique) au démarrage
  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        
        if (res.ok && data.success) {
          // Gestion flexible si ton API renvoie data.user ou data.data
          const userData = data.user || data.data;
          if (userData) {
            setUserPoints(userData.points || 0);
            setRecompensesEchangees(userData.recompensesEchangees || []);
          }
        }
      } catch (err) {
        console.error("Erreur chargement points:", err);
      } finally {
        // S'exécute quoi qu'il arrive pour enlever l'état de chargement et afficher l'interface
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  // Action du clic sur le bouton Échanger
  const handleExchange = async (item) => {
    setMessageStatus({ text: "", isError: false });

    try {
      const res = await fetch("/api/user/recompenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recompenseId: item.id,
          name: item.name,
          price: item.price
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUserPoints(data.remainingPoints);
        setRecompensesEchangees(data.recompenses || []);
        setMessageStatus({ text: data.message || "Félicitations ! Votre récompense a été enregistrée.", isError: false });
      } else {
        setMessageStatus({ text: data.message || "Impossible de traiter l'échange.", isError: true });
      }
    } catch (err) {
      setMessageStatus({ text: "Erreur lors de la communication avec le serveur.", isError: true });
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-gray-500">Chargement de votre espace récompenses...</div>;

  return (
    <div className="pt-24 lg:pt-0 pb-24 space-y-8 animate-in fade-in duration-700">
      
      {/* Notifications d'achat */}
      {messageStatus.text && (
        <div className={`p-4 rounded-2xl text-sm font-bold text-center ${messageStatus.isError ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
          {messageStatus.text}
        </div>
      )}

      {/* CARD SOLDE DE POINTS DYNAMIQUE */}
      <div className="bg-[#6200ee] rounded-[40px] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <p className="text-purple-200 font-bold text-sm uppercase tracking-widest">Total de vos points</p>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-6xl font-black tracking-tighter">{userPoints.toLocaleString()} PTS</h1>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
              <i className="fa-solid fa-medal text-amber-400"></i>
              <span className="font-black text-xs uppercase italic">Statut Compte</span>
            </div>
          </div>

          <div className="w-full lg:w-1/3 space-y-3">
            <div className="flex justify-between text-xs font-black uppercase">
              <span>Objectif Fidélité</span>
              <span className="opacity-60">{Math.max(0, nextLevelPoints - userPoints)} pts restants</span>
            </div>
            <div className="h-4 bg-black/20 rounded-full overflow-hidden p-1">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* AFFICHAGE DU CATALOGUE */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <i className="fa-solid fa-gift text-[#6200ee]"></i> Catalogue de récompenses
          </h2>
          
          <div className="space-y-4">
            {catalogue.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[35px] border border-gray-50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-all">
                <div className="flex items-center gap-6 w-full">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${item.color}`}>
                    <i className={`fa-solid ${item.icon}`}></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-gray-800 text-lg leading-tight">{item.name}</h3>
                    <p className="text-gray-400 text-xs font-bold mt-1">{item.desc}</p>
                    <p className="text-[#6200ee] font-black text-sm mt-2">{item.price} pts</p>
                  </div>
                </div>
                
                {/* BOUTON INTERACTIF */}
                <button 
                  onClick={() => handleExchange(item)}
                  disabled={userPoints < item.price}
                  className={`whitespace-nowrap px-10 py-4 rounded-[22px] font-black uppercase text-xs tracking-widest transition-all ${
                    userPoints >= item.price 
                    ? 'bg-[#6200ee] text-white hover:scale-105 shadow-lg shadow-purple-100' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {userPoints >= item.price ? "Échanger" : "Points insuffisants"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SUIVI ET HISTORIQUE DES ÉCHANGES EFFECTUÉS */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
            <i className="fa-solid fa-clock-rotate-left text-[#6200ee]"></i> Suivi des échanges
          </h2>
          
          <div className="bg-white rounded-[40px] p-8 border border-gray-50 shadow-sm space-y-6">
            {recompensesEchangees.length === 0 ? (
              <p className="text-sm text-gray-400 font-bold text-center py-4">Aucun échange effectué pour le moment.</p>
            ) : (
              recompensesEchangees.map((gain, index) => (
                <div key={index} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-black text-gray-800 text-sm">{gain.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      {gain.dateEchange ? new Date(gain.dateEchange).toLocaleDateString("fr-FR") : "Récemment"}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    gain.statut === "Livré" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                  }`}>
                    {gain.statut || "En attente"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}