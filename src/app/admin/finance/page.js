"use client";
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, ArrowUpRight, CreditCard, Download, Clock, CheckCircle2, 
  TrendingUp, BarChart3, Activity, X, ChevronRight, PieChart 
} from 'lucide-react';

export default function AdminFinancePage() {
  const [showStats, setShowStats] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // États d'administration des prix
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPriceValue, setNewPriceValue] = useState("");

  const [financeData, setFinanceData] = useState({
    summary: { chiffreAffaires: 0, enAttente: 0, soldeRetirable: 0 },
    graphique: [],
    analytics: { totalTrimestre: 0, projectionAvril: 0, panierMoyen: 0 },
    fluxRecents: [],
    pricing: []
  });

  const fetchFinanceMetrics = async () => {
    try {
      const res = await fetch("/api/admin/finance/stats");
      const pricingRes = await fetch("/api/admin/finance/pricing");
      
      if (res.ok && pricingRes.ok) {
        const data = await res.json();
        const pData = await pricingRes.json();
        if (data.success && pData.success) {
          setFinanceData({
            ...data,
            pricing: pData.pricing
          });
        }
      }
    } catch (err) {
      console.error("Erreur de synchronisation", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceMetrics();
  }, []);

  // Fonction pour modifier un prix de la grille
  const handleUpdatePrice = async () => {
    if (!newPriceValue || isNaN(newPriceValue)) return;
    try {
      const res = await fetch("/api/admin/finance/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: editingPlan, newPrice: newPriceValue })
      });
      if (res.ok) {
        alert("Grille tarifaire mise à jour et synchronisée avec le côté utilisateur !");
        setEditingPlan(null);
        fetchFinanceMetrics();
      }
    } catch (err) {
      alert("Erreur de mise à jour");
    }
  };

  // Export de l'historique complet des paiements au format CSV
  const handleExportData = () => {
    if (financeData.fluxRecents.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,Reference,Client,Montant,Operateur,Statut,Date\n";
    financeData.fluxRecents.forEach(tx => {
      csvContent += `${tx.reference},${tx.userName},${tx.montant},${tx.operateur},${tx.statut},${new Date(tx.createdAt).toLocaleDateString()}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EcoTrack_Finances_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-center text-white font-black pt-40 uppercase tracking-widest animate-pulse">Chargement de l'infrastructure financière...</div>;
  }

  return (
    <div className="relative min-h-screen bg-black text-white p-6 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter">FINANCES</h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Écosystème de revenus & flux monétaires</p>
        </div>
        <button 
          onClick={handleExportData}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-white hover:text-black transition-all"
        >
          <Download size={16} /> EXPORTER L'HISTORIQUE
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div onClick={() => setShowStats(true)} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] relative overflow-hidden group cursor-pointer hover:border-green-500/50 transition-all">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-2"><BarChart3 size={12}/> Chiffre d'Affaire (Global)</p>
          <h3 className="text-4xl font-black text-white italic tracking-tighter">{financeData.summary.chiffreAffaires.toLocaleString()} <span className="text-xs text-zinc-600 font-bold not-italic">FCFA</span></h3>
          <div className="mt-4 flex items-center gap-2 text-green-500 text-[10px] font-black uppercase italic"><TrendingUp size={14} /> Voir les graphiques prévisionnels</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[40px] relative">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-2">Transactions en attente</p>
          <h3 className="text-4xl font-black text-white italic tracking-tighter">{financeData.summary.enAttente}</h3>
          <div className="mt-4 flex items-center gap-2 text-orange-500 text-[10px] font-black uppercase italic"><Clock size={14} /> Vérification en ligne active</div>
        </div>

        <div className="bg-green-500 p-8 rounded-[40px] flex flex-col justify-between group">
          <div>
            <p className="text-black/60 text-[9px] font-black uppercase tracking-widest mb-1 italic">Solde Retirable</p>
            <h3 className="text-4xl font-black text-black italic tracking-tighter">{financeData.summary.soldeRetirable.toLocaleString()} <span className="text-xs text-black/40 font-bold not-italic">FCFA</span></h3>
          </div>
          <button className="mt-6 bg-black text-white w-full py-4 rounded-2xl text-[10px] font-black uppercase shadow-xl">Effectuer un retrait rapide</button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FLUX RÉCENTS */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-[45px] p-10">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3"><CreditCard className="text-green-500" size={24} /> Flux Récents</h4>
          </div>

          <div className="space-y-4">
            {financeData.fluxRecents.map((tx) => (
              <div key={tx.reference} className="flex items-center justify-between p-6 bg-zinc-900/30 rounded-3xl border border-zinc-800/50">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.statut === 'Réussi' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}><DollarSign size={20} /></div>
                  <div>
                    <p className="font-black text-sm text-white uppercase tracking-tight">{tx.userName}</p>
                    <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{new Date(tx.createdAt).toLocaleDateString()} • {tx.operateur}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-white italic tracking-tighter">{tx.montant.toLocaleString()} FCFA</p>
                  <p className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 ${tx.statut === 'Réussi' ? 'text-green-500' : 'text-red-500'}`}>{tx.statut}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GRILLE TARIFAIRE MODIFIABLE */}
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[45px] p-10">
            <h4 className="text-xl font-black text-white italic uppercase tracking-tighter mb-8">Grille Tarifaire</h4>
            <div className="space-y-4">
              {financeData.pricing.map((plan) => (
                <div key={plan.planId} className="p-6 bg-black border border-zinc-800 rounded-[2.5rem] flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">{plan.planId}</p>
                    <span className="text-2xl font-black text-white italic tracking-tighter">{plan.price.toLocaleString()} <span className="text-[10px] text-zinc-700 not-italic uppercase font-bold">FCFA</span></span>
                  </div>
                  <button 
                    onClick={() => { setEditingPlan(plan.planId); setNewPriceValue(plan.price); }} 
                    className="p-3 bg-zinc-900 rounded-xl text-green-500 hover:bg-green-500 hover:text-black transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE MODIFICATION DE TARIF */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full">
            <h3 className="text-lg font-black uppercase italic mb-4 text-white">Modifier Tarif : {editingPlan}</h3>
            <input 
              type="number"
              value={newPriceValue}
              onChange={(e) => setNewPriceValue(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl py-3 px-4 text-white font-bold mb-4 outline-none focus:border-green-500"
            />
            <div className="flex gap-4">
              <button onClick={() => setEditingPlan(null)} className="w-1/2 py-2 rounded-xl bg-zinc-800 text-xs font-bold uppercase">Annuler</button>
              <button onClick={handleUpdatePrice} className="w-1/2 py-2 rounded-xl bg-green-500 text-black font-black text-xs uppercase">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ANALYTIQUE ET PRÉVISIONNEL TRIMESTRIEL */}
      {showStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowStats(false)} />
          <div className="relative bg-zinc-950 border border-zinc-800 w-full max-w-4xl rounded-[50px] p-10 shadow-2xl">
            <div className="absolute top-0 right-0 p-8">
              <button onClick={() => setShowStats(false)} className="p-3 bg-zinc-900 text-zinc-500 rounded-2xl hover:text-white hover:bg-red-500 transition-all"><X size={20} /></button>
            </div>
            <div className="mb-12">
              <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">Analyse du Chiffre d'Affaire</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Rapport de performance trimestriel et prévisions</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-end">
              <div className="md:col-span-8 flex items-end justify-between h-64 bg-zinc-900/20 p-8 rounded-[40px] border border-zinc-900">
                {financeData.graphique.map((data, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-5 w-1/4 group">
                    <div className="relative w-full flex justify-center">
                      <div className="w-12 bg-zinc-800 rounded-2xl group-hover:bg-green-500 transition-all duration-500 h-48 relative flex items-end overflow-hidden">
                        <div className="w-full bg-green-500/30" style={{ height: data.height }} />
                      </div>
                      <div className="absolute -top-8 text-[10px] font-black text-green-500">{data.montant.toLocaleString()}</div>
                    </div>
                    <span className="text-[10px] font-black text-zinc-600 uppercase italic">{data.mois}</span>
                  </div>
                ))}
              </div>
              <div className="md:col-span-4 space-y-6">
                <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                  <p className="text-[9px] font-black text-zinc-500 uppercase mb-2">Taux de Croissance</p>
                  <p className="text-3xl font-black text-green-500 italic">+12.5%</p>
                </div>
                <div className="p-6 bg-zinc-900/50 rounded-3xl border border-zinc-800">
                  <p className="text-[9px] font-black text-zinc-500 uppercase mb-2">Panier Moyen</p>
                  <p className="text-2xl font-black text-white italic">{financeData.analytics.panierMoyen.toLocaleString()} <span className="text-[10px]">FCFA</span></p>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-10 border-t border-zinc-900 flex justify-between items-center">
              <div className="flex gap-10">
                <div>
                  <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Total Trimestre</p>
                  <p className="text-xl font-black text-white italic tracking-tighter">{financeData.analytics.totalTrimestre.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Projection Mensuelle Estimée</p>
                  <p className="text-xl font-black text-green-500 italic tracking-tighter">{financeData.analytics.projectionAvril.toLocaleString()} FCFA</p>
                </div>
              </div>
              <PieChart className="text-zinc-800" size={40} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}