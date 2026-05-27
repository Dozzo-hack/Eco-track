"use client";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Plus, Trash2, Edit3, Truck, Loader2, Crown, Inbox } from 'lucide-react';

export default function SchedulePage() {
  const [zones, setZones] = useState([]);
  const [premiumOrders, setPremiumOrders] = useState([]); // 🔥 Stocker les commandes Premium
  const [loading, setLoading] = useState(true);

  const CHAUFFEURS = ["Patrice N.", "Ibrahim N.", "Samuel E.", "Moussa T."];

  const fetchData = async () => {
    try {
      setLoading(true);
      // Charger le planning standard
      const resSchedule = await fetch("/api/admin/schedule");
      const dataSchedule = await resSchedule.json();
      if (resSchedule.ok && dataSchedule.success) setZones(dataSchedule.data);

      // Charger les commandes Premium
      const resPremium = await fetch("/api/user/vidange");
      const dataPremium = await resPremium.json();
      if (resPremium.ok && dataPremium.success) setPremiumOrders(dataPremium.data);

    } catch (error) {
      console.error("Erreur de chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = async (existingData = null) => {
    const isEditing = !!existingData;
    let defaultDate = isEditing && existingData.datePrevue ? new Date(existingData.datePrevue).toISOString().split('T')[0] : "";

    const { value: formValues } = await Swal.fire({
      title: `<span style="color:#fff; font-family:monospace;">${isEditing ? 'MODIFIER' : 'PROGRAMMER'} COLLECTE</span>`,
      background: '#0a0a0a',
      html: `
        <div style="display:flex; flex-direction:column; gap:15px; padding:10px;">
          <input id="swal-quartier" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0;" placeholder="Quartier ou Adresse Premium" value="${isEditing ? (existingData.quartiers || "") : ''}">
          <input id="swal-date" type="date" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0;" value="${defaultDate}">
          <select id="swal-type" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0; height:50px; padding:0 10px;">
            <option value="Plastique" ${isEditing && existingData.typeDechet === 'Plastique' ? 'selected' : ''}>Plastique</option>
            <option value="Verre" ${isEditing && existingData.typeDechet === 'Verre' ? 'selected' : ''}>Verre</option>
            <option value="Tout-venant" ${isEditing && existingData.typeDechet === 'Tout-venant' ? 'selected' : ''}>Tout-venant</option>
          </select>
          <select id="swal-chauffeur" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0; height:50px; padding:0 10px;">
            <option value="" disabled ${!isEditing ? 'selected' : ''}>Choisir un chauffeur</option>
            ${CHAUFFEURS.map(c => `<option value="${c}" ${isEditing && existingData.chauffeur === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      `,
      focusConfirm: false,
      confirmButtonColor: '#22c55e',
      showCancelButton: true,
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const quartier = document.getElementById('swal-quartier').value.trim();
        const date = document.getElementById('swal-date').value;
        const type = document.getElementById('swal-type').value;
        const chauffeur = document.getElementById('swal-chauffeur').value;
        if (!quartier || !date || !chauffeur) {
          Swal.showValidationMessage('Veuillez remplir tous les champs');
          return false;
        }
        return { quartier, date, type, chauffeur };
      }
    });

    if (formValues) {
      try {
        const url = isEditing ? `/api/admin/schedule/${existingData._id}` : "/api/admin/schedule";
        const response = await fetch(url, {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formValues),
        });

        if (response.ok) {
          Swal.fire({ icon: 'success', title: 'Plan mis à jour !', background: '#0a0a0a', color: '#fff' });
          fetchData();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const deleteZone = async (id) => {
    const confirmation = await Swal.fire({
      title: 'Supprimer ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      background: '#0a0a0a',
      color: '#fff'
    });

    if (confirmation.isConfirmed) {
      const response = await fetch(`/api/admin/schedule/${id}`, { method: "DELETE" });
      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'Supprimé !', background: '#0a0a0a' });
        fetchData();
      }
    }
  };

  return (
    <div className="animate-in fade-in duration-700 p-6 space-y-12">
      
      {/* SECTION 1: MASTER SCHEDULE GENERAL */}
      <div>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black italic text-white tracking-tighter">MASTER SCHEDULE</h2>
          <button
            onClick={() => openModal()}
            className="bg-green-500 text-black px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          >
            <Plus size={18} /> NOUVELLE VIDANGE
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="text-green-500 animate-spin" size={32} /></div>
        ) : zones.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-[2rem] p-12 text-center text-zinc-600 italic text-sm">Aucun planning général.</div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-900 rounded-[35px] overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/50 text-[10px] uppercase font-black text-zinc-500 tracking-widest border-b border-zinc-900">
                <tr>
                  <th className="p-6">Quartiers</th>
                  <th className="p-6 text-center">Date prévue</th>
                  <th className="p-6">Type</th>
                  <th className="p-6">Chauffeur</th>
                  <th className="p-6 text-right">Options</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z._id} className="border-b border-zinc-900/50 hover:bg-white/[0.02] transition-all">
                    <td className="p-6"><span className="font-black text-green-500 italic text-lg uppercase">{z.quartiers}</span></td>
                    <td className="p-6 text-center">
                      <span className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-bold border border-zinc-800">
                        {new Date(z.datePrevue).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td className="p-6"><span className="bg-zinc-800 px-3 py-1 rounded-full text-[10px] font-black text-zinc-300">{z.typeDechet}</span></td>
                    <td className="p-6 text-zinc-400 font-bold text-sm">{z.chauffeur}</td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(z)} className="p-3 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white"><Edit3 size={16}/></button>
                        <button onClick={() => deleteZone(z._id)} className="p-3 bg-zinc-900 rounded-xl text-zinc-500 hover:text-red-500"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🔥 SECTION 2: COMMANDES DE VIDANGES CUSTOM PREMIUM */}
      <div className="pt-6">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="text-purple-500 animate-pulse" size={24} />
          <h2 className="text-2xl font-black italic text-white tracking-tighter uppercase">Demandes Personnalisées Premium</h2>
          <span className="bg-purple-500/10 text-purple-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-purple-500/20">
            {premiumOrders.length} DEMANDE(S)
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="text-purple-500 animate-spin" size={32} /></div>
        ) : premiumOrders.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-[2rem] p-16 text-center text-zinc-600 flex flex-col items-center gap-2 bg-zinc-950/20">
            <Inbox size={24} className="text-zinc-700" />
            <p className="italic text-sm font-medium">Aucune commande personnalisée pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {premiumOrders.map((order) => (
              <div key={order._id} className="bg-zinc-950 border border-zinc-900 hover:border-purple-500/30 transition-all rounded-[30px] p-6 space-y-4 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="bg-purple-500 text-black text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      Client Premium
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      Souhaité le : {new Date(order.dateSouhaitee).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  
                  <div className="mt-4 space-y-1">
                    <h4 className="text-lg font-black text-white capitalize">Type : {order.typeDechet}</h4>
                    <p className="text-xs font-bold text-zinc-400">Volume : <span className="text-purple-400">{order.volume}</span></p>
                  </div>

                  {order.instructions && (
                    <div className="mt-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-900">
                      <p className="text-xs text-zinc-400 italic font-medium">🗣️ "{order.instructions}"</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => openModal({ quartiers: "Adresse Client Premium", typeDechet: order.typeDechet, datePrevue: order.dateSouhaitee })}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-900/20"
                  >
                    Valider & Assigner Chauffeur
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}