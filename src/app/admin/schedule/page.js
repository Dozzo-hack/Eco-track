"use client";
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Plus, Trash2, Edit3, Loader2, Crown, Inbox } from 'lucide-react';

export default function SchedulePage() {
  const [zones, setZones] = useState([]);
  const [premiumOrders, setPremiumOrders] = useState([]); 
  const [quartiersBD, setQuartiersBD] = useState([]); 
  const [chauffeursBD, setChauffeursBD] = useState([]); 
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const resQuartiers = await fetch("/api/quartiers");
      const dataQuartiers = await resQuartiers.json();
      if (resQuartiers.ok && dataQuartiers.success) {
        const listeQuartiersMappee = dataQuartiers.data.map(q => ({
          id: q._id.toString(),
          nom: q.nom.toUpperCase().trim()
        }));
        setQuartiersBD(listeQuartiersMappee);
      }

      const resChauffeurs = await fetch("/api/admin/get-videurs");
      const dataChauffeurs = await resChauffeurs.json();
      if (resChauffeurs.ok && dataChauffeurs.success) {
        const listeChauffeursMappee = dataChauffeurs.data.map(c => ({
          id: c._id.toString(),
          nom: c.nom || c.name || `Chauffeur #${c._id.toString().slice(-4)}`
        }));
        setChauffeursBD(listeChauffeursMappee);
      }

      const resSchedule = await fetch("/api/admin/schedule");
      const dataSchedule = await resSchedule.json();
      if (resSchedule.ok && dataSchedule.success) setZones(dataSchedule.data);

      const resPremium = await fetch("/api/user/vidange?role=admin");
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
    
    let currentQuartierId = "";
    if (isEditing) {
      const qField = existingData.quartiers || existingData.quartier;
      if (qField) {
        currentQuartierId = typeof qField === 'object' ? qField._id?.toString() : qField.toString();
      }
    }

    let currentChauffeurId = "";
    if (isEditing && existingData.chauffeur) {
      currentChauffeurId = typeof existingData.chauffeur === 'object' 
        ? existingData.chauffeur._id?.toString() 
        : existingData.chauffeur.toString();
    }

    const { value: formValues } = await Swal.fire({
      title: `<span style="color:#fff; font-family:monospace;">${isEditing ? 'MODIFIER' : 'PROGRAMMER'} COLLECTE</span>`,
      background: '#0a0a0a',
      html: `
        <div style="display:flex; flex-direction:column; gap:15px; padding:10px;">
          <select id="swal-quartier" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0; height:50px; padding:0 10px;">
            <option value="" disabled ${!currentQuartierId ? 'selected' : ''}>Sélectionnez le quartier</option>
            ${quartiersBD.map(q => `<option value="${q.id}" ${currentQuartierId === q.id ? 'selected' : ''}>${q.nom}</option>`).join('')}
          </select>

          <input id="swal-date" type="date" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0;" value="${defaultDate}">
          
          <select id="swal-type" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0; height:50px; padding:0 10px;">
            <option value="Plastique" ${isEditing && existingData.typeDechet === 'Plastique' ? 'selected' : ''}>Plastique</option>
            <option value="Verre" ${isEditing && existingData.typeDechet === 'Verre' ? 'selected' : ''}>Verre</option>
            <option value="Tout-venant" ${isEditing && existingData.typeDechet === 'Tout-venant' ? 'selected' : ''}>Tout-venant</option>
          </select>
          
          <select id="swal-chauffeur" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0; height:50px; padding:0 10px;">
            <option value="" disabled ${!currentChauffeurId ? 'selected' : ''}>Choisir un chauffeur réel</option>
            ${chauffeursBD.map(c => `<option value="${c.id}" ${currentChauffeurId === c.id ? 'selected' : ''}>${c.nom}</option>`).join('')}
          </select>
        </div>
      `,
      focusConfirm: false,
      confirmButtonColor: '#22c55e',
      showCancelButton: true,
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const quartier = document.getElementById('swal-quartier').value; 
        const date = document.getElementById('swal-date').value;
        const type = document.getElementById('swal-type').value;
        const chauffeur = document.getElementById('swal-chauffeur').value;
        if (!quartier || !date || !chauffeur) {
          Swal.showValidationMessage('Veuillez remplir tous les champs');
          return false;
        }
        return { quartiers: quartier, datePrevue: date, typeDechet: type, chauffeur: chauffeur };
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
          // 🔔 NOUVEAU : Envoi de la notification au chauffeur pour le Master Schedule
          try {
            const quartierNom = quartiersBD.find(q => q.id === formValues.quartiers)?.nom || "la zone prévue";
            const dateAffichee = new Date(formValues.datePrevue).toLocaleDateString("fr-FR");
            
            await fetch('/api/admin/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chauffeurId: formValues.chauffeur,
                titre: isEditing ? "Mise à jour de votre tournée" : "Nouvelle tournée assignée",
                contenu: `Vous avez été assigné à une collecte le ${dateAffichee} dans le quartier : ${quartierNom}. Type : ${formValues.typeDechet}.`,
                type: "assignation"
              })
            });
          } catch (notifErr) {
            console.error("Erreur lors de l'envoi de la notification Master Schedule:", notifErr);
          }

          Swal.fire({ icon: 'success', title: 'Plan mis à jour !', background: '#0a0a0a', color: '#fff' });
          fetchData();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  // 🚀 Assignation Premium
  const openPremiumModal = async (order) => {
    const nomClient = order.userId ? `${order.userId.nom} ${order.userId.prenom}` : "Inconnu";
    const nomQuartier = order.userId?.quartier?.nom || "Non spécifié";

    const { value: chauffeurId } = await Swal.fire({
      title: '<span style="color:#fff; font-family:monospace;">ASSIGNER CHAUFFEUR PREMIUM</span>',
      background: '#0a0a0a',
      html: `
        <div style="display:flex; flex-direction:column; gap:12px; padding:10px; text-align:left;">
          <p style="color:#a1a1aa; font-size:13px; margin:0;">
            <strong style="color:#fff;">Client :</strong> ${nomClient.toUpperCase()}<br/>
            <strong style="color:#fff;">Quartier :</strong> ${nomQuartier.toUpperCase()}<br/>
            <strong style="color:#fff;">Date souhaitée :</strong> ${new Date(order.dateSouhaitee).toLocaleDateString("fr-FR")}<br/>
            <strong style="color:#fff;">Type :</strong> ${order.typeDechet}
          </p>
          <hr style="border-color:#222; margin: 5px 0;"/>
          <select id="swal-premium-chauffeur" class="swal2-input" style="background:#1a1a1a; color:#fff; border:1px solid #333; margin:0; height:50px; padding:0 10px; width:100%;">
            <option value="" disabled selected>Sélectionner le chauffeur</option>
            ${chauffeursBD.map(c => `<option value="${c.id}">${c.nom}</option>`).join('')}
          </select>
        </div>
      `,
      focusConfirm: false,
      confirmButtonColor: '#a855f7',
      showCancelButton: true,
      cancelButtonText: 'Annuler',
      preConfirm: () => {
        const chauffeur = document.getElementById('swal-premium-chauffeur').value;
        if (!chauffeur) {
          Swal.showValidationMessage('Veuillez sélectionner un chauffeur');
          return false;
        }
        return chauffeur;
      }
    });

    if (chauffeurId) {
      try {
        const response = await fetch("/api/user/vidange", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commandeId: order._id, videurId: chauffeurId }),
        });

        if (response.ok) {
          // 🔔 NOUVEAU : Envoi de la notification au chauffeur pour la commande Premium
          try {
            const dateAffichee = new Date(order.dateSouhaitee).toLocaleDateString("fr-FR");
            await fetch('/api/admin/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chauffeurId: chauffeurId,
                titre: "Nouvelle Mission Premium 👑",
                contenu: `Vous avez été assigné au client ${nomClient.toUpperCase()} (${nomQuartier}) pour le ${dateAffichee}.`,
                type: "assignation"
              })
            });
          } catch (notifErr) {
            console.error("Erreur lors de l'envoi de la notification Premium:", notifErr);
          }

          Swal.fire({ icon: 'success', title: 'Chauffeur assigné avec succès !', background: '#0a0a0a', color: '#fff' });
          fetchData();
        } else {
          Swal.fire({ icon: 'error', title: 'Une erreur est survenue.', background: '#0a0a0a' });
        }
      } catch (error) {
        console.error("Erreur lors de l'assignation premium :", error);
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

  const getQuartierNomAffiche = (idOrObj) => {
    if (!idOrObj) return "NON SPÉCIFIÉ";
    if (typeof idOrObj === 'object') {
      if (idOrObj.nom) return idOrObj.nom.toUpperCase();
      if (idOrObj._id) {
        const match = quartiersBD.find(q => q.id === idOrObj._id.toString());
        if (match) return match.nom;
      }
    }
    const valueStr = idOrObj.toString().trim();
    const matchParNom = quartiersBD.find(q => q.nom.toUpperCase() === valueStr.toUpperCase());
    if (matchParNom) return matchParNom.nom;
    const matchParId = quartiersBD.find(q => q.id === valueStr);
    if (matchParId) return matchParId.nom;
    return valueStr.toUpperCase();
  };

  const getChauffeurNomAffiche = (idOrObj) => {
    if (!idOrObj) return "NON ASSIGNÉ";
    if (typeof idOrObj === 'object' && (idOrObj.nom || idOrObj.name)) return idOrObj.nom || idOrObj.name;
    const lookupId = typeof idOrObj === 'object' ? idOrObj._id?.toString() : idOrObj.toString();
    const match = chauffeursBD.find(c => c.id === lookupId);
    return match ? match.nom : "MISSIONNAIRE EXTÉRIEUR";
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
                    <td className="p-6">
                      <span className="font-black text-green-500 italic text-lg uppercase">
                        {getQuartierNomAffiche(z.quartiers || z.quartier)}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-xs font-bold border border-zinc-800">
                        {new Date(z.datePrevue).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td className="p-6"><span className="bg-zinc-800 px-3 py-1 rounded-full text-[10px] font-black text-zinc-300">{z.typeDechet}</span></td>
                    <td className="p-6 text-zinc-400 font-bold text-sm">
                      {getChauffeurNomAffiche(z.chauffeur)}
                    </td>
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

      {/* SECTION 2: COMMANDES DE VIDANGES CUSTOM PREMIUM */}
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
            {premiumOrders.map((order) => {
              const nomQuartier = order.userId?.quartier?.nom || "Non spécifié";
              const nomClient = order.userId ? `${order.userId.nom} ${order.userId.prenom}` : "Client Inconnu";

              return (
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
                    
                    <div className="mt-4 p-3 bg-purple-500/5 rounded-2xl border border-purple-500/10 space-y-1">
                      <p className="text-xs text-zinc-400 font-bold">Client : <span className="text-white uppercase">{nomClient}</span></p>
                      <p className="text-xs text-zinc-400 font-bold">Quartier : <span className="text-purple-400 uppercase">{nomQuartier}</span></p>
                    </div>

                    <div className="mt-3 space-y-1">
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
                      onClick={() => openPremiumModal(order)}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-900/20"
                    >
                      Valider & Assigner Chauffeur
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}