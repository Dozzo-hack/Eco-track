"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Award, Send, Loader2, Phone, Mail, User, Check, MapPin, Calendar, Crown } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const chatEndRef = useRef(null);

  const [userData, setUserData] = useState(null);
  const [quartiersBD, setQuartiersBD] = useState([]); // Référentiel des quartiers [{ id: "...", nom: "..." }]
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [pointsInput, setPointsInput] = useState("");

  // 1. Charger les données (Profil de l'utilisateur, Messages & Référentiel Quartiers)
  const loadUserAndChats = async () => {
    try {
      setLoading(true);

      // A. Charger la liste des quartiers pour décoder l'ID du client
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

      // B. Charger le profil du client et les chats
      const response = await fetch(`/api/admin/users/${id}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setUserData(result.user || result.data);
        setMessages(result.messages || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la fiche client :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadUserAndChats();
  }, [id]);

  // Scroller automatiquement au bas du chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper pour convertir l'ID du quartier du client en vrai Nom textuel
  const getQuartierNomAffiche = (userQuartierField) => {
    if (!userQuartierField) return "NON SPÉCIFIÉ";
    
    if (typeof userQuartierField === 'object' && userQuartierField.nom) {
      return userQuartierField.nom.toUpperCase();
    }

    const lookupId = userQuartierField.toString().trim();
    const match = quartiersBD.find(q => q.id === lookupId || q.nom.toUpperCase() === lookupId.toUpperCase());
    return match ? match.nom : lookupId.toUpperCase();
  };

  // 2. Gestion des Points (Ajouter / Retirer en BDD)
  const handleUpdatePoints = async (action) => {
    const amount = parseInt(pointsInput);
    if (!amount || amount <= 0) {
      Swal.fire({ icon: 'warning', title: 'Montant invalide', text: 'Veuillez entrer un nombre supérieur à 0.', background: '#18181b', color: '#fff' });
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, amount }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setUserData(result.data || result.user);
        setPointsInput("");
        Swal.fire({
          title: 'Points mis à jour !',
          text: `Le solde est désormais mis à jour avec succès.`,
          icon: 'success',
          background: '#09090b',
          color: '#fff',
          confirmButtonColor: '#6200ee'
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Erreur', text: result.message || 'Impossible de mettre à jour les points.' });
      }
    } catch (error) {
      console.error("Erreur action points :", error);
    }
  };

  // 3. Valider la remise/livraison d'un cadeau demandé
  const handleDeliverRecompense = async (index) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VALIDATE_RECOMPENSE", index }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setUserData(result.data || result.user);
        Swal.fire({ icon: 'success', title: 'Livré !', text: 'Le statut du lot a été mis à jour.', background: '#18181b', color: '#fff' });
      }
    } catch (error) {
      console.error("Erreur validation récompense :", error);
    }
  };

  // 4. Envoi d'un message au support connecté au Backend
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageText = inputMessage;
    setInputMessage("");

    // UI Optimiste : Affichage instantané
    const tempMessage = {
      _id: Date.now().toString(),
      text: messageText,
      sender: "admin",
      createdAt: new Date()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_MESSAGE", text: messageText }),
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        Swal.fire({ icon: 'error', title: 'Erreur d\'envoi', text: 'Le message n\'a pas pu être enregistré.' });
        loadUserAndChats();
      } else if (result.messages) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error("Erreur envoi message support :", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
        <Loader2 className="text-[#6200ee] animate-spin" size={36} />
        <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase">Extraction du profil client...</p>
      </div>
    );
  }

  // Détermination dynamique de l'abonnement
  const currentPlan = userData?.plan || userData?.abonnement?.type || "STANDARD";

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 font-sans">
      
      {/* Bouton Retour & Fil d'ariane */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push("/admin/users")}
          className="p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-all border border-zinc-800/50 text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Fiche Client Rapide</span>
          <h2 className="text-xs font-mono text-emerald-500">UID: {userData?._id || userData?.id}</h2>
        </div>
      </div>

      {/* Grille principale à 3 colonnes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* COLONNE 1 : POINTS & DETAILS DU COMPTE */}
        <div className="space-y-6">
          
          {/* Bloc Gestion Solde Points */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden">
            <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase block">Solde de Points</span>
            
            <div className="flex items-center gap-3 my-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Award size={24} />
              </div>
              <span className="text-4xl font-black text-amber-400 font-mono tracking-tighter">
                {userData?.ecoPoints ?? userData?.points ?? 0} <span className="text-xs text-zinc-500 font-sans uppercase font-bold">PTS</span>
              </span>
            </div>

            <div className="space-y-3 mt-6">
              <input 
                type="number" 
                placeholder="100"
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800/80 rounded-xl py-3 px-4 text-xs font-bold font-mono text-white text-center outline-none focus:border-[#6200ee] transition-colors"
              />
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleUpdatePoints("ADD")}
                  className="bg-[#6200ee] hover:bg-[#5200c4] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-colors"
                >
                  + Offrir
                </button>
                <button 
                  onClick={() => handleUpdatePoints("REMOVE")}
                  className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-colors"
                >
                  - Retirer
                </button>
              </div>
            </div>
          </div>

          {/* Bloc Détails du Compte */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 space-y-4 shadow-xl">
            <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase block">Détails Compte</span>
            
            <div className="space-y-3">
              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Client</span>
                <p className="text-xs font-bold text-zinc-200 flex items-center gap-2 mt-0.5">
                  <User size={12} className="text-zinc-500"/> {userData?.prenom || ""} {userData?.nom || "Abonné"}
                </p>
              </div>

              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Email</span>
                <p className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-2 mt-0.5">
                  <Mail size={12} className="text-zinc-500"/> {userData?.email}
                </p>
              </div>

              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Téléphone</span>
                <p className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-2 mt-0.5">
                  <Phone size={12} className="text-zinc-500"/> {userData?.telephone || "Non renseigné"}
                </p>
              </div>

              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-900">
                <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Quartier</span>
                <p className="text-xs font-bold text-zinc-200 flex items-center gap-2 mt-0.5">
                  {/* 🔑 Résolution dynamique du nom du quartier à la place de l'ID */}
                  <MapPin size={12} className="text-zinc-500"/> {getQuartierNomAffiche(userData?.quartiers || userData?.quartier)}
                </p>
              </div>
            </div>
          </div>

          {/* Bloc Statut d'Abonnement Mensuel Dynamique */}
          <div className={`bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 space-y-3 shadow-xl border-l-4 ${currentPlan.toUpperCase() === 'PREMIUM' ? 'border-l-purple-500' : 'border-l-zinc-700'}`}>
            <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase block">Abonnement Mensuel</span>
            <div className="flex justify-between items-center bg-zinc-900/30 p-3 rounded-xl border border-zinc-900">
              <div className="flex items-center gap-2">
                {currentPlan.toUpperCase() === 'PREMIUM' ? (
                  <Crown size={14} className="text-purple-400" />
                ) : (
                  <Calendar size={14} className="text-zinc-400" />
                )}
                <div className="text-left">
                  <p className="text-xs font-bold text-zinc-300">Formule : {currentPlan.toUpperCase()}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {userData?.statut === "Actif" || userData?.actif === true ? "Abonnement Actif" : "Compte Inactif"}
                  </p>
                </div>
              </div>
              <span className={`font-mono text-xs font-bold px-3 py-1 rounded-lg ${currentPlan.toUpperCase() === 'PREMIUM' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}>
                {userData?.finAbonnement ? new Date(userData.finAbonnement).toLocaleDateString("fr-FR") : "30 Jours Restants"}
              </span>
            </div>
          </div>

        </div>

        {/* COLONNE 2 : SUIVI RECOMPENSES DEMANDEES */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 flex flex-col min-h-[500px] shadow-xl">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider">Récompenses Demandées</h3>
            <p className="text-xs text-zinc-500 mt-1">Historique des choix de cadeaux de l'utilisateur.</p>
          </div>

          <div className="space-y-3 mt-6 flex-1 overflow-y-auto pr-1">
            {!userData?.recompensesEchangees || userData.recompensesEchangees.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center py-16 text-xs italic">
                Aucune récompense choisie pour le moment.
              </div>
            ) : (
              userData.recompensesEchangees.map((item, idx) => (
                <div key={item._id || idx} className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-900 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-zinc-200">{item.name}</p>
                    <span className="text-[10px] text-purple-400 font-mono font-bold">-{item.price || item.pointsCout || 0} PTS</span>
                    <span className="block text-[9px] text-zinc-600 font-mono mt-1">
                      {item.dateEchange ? new Date(item.dateEchange).toLocaleDateString("fr-FR") : ""}
                    </span>
                  </div>
                  
                  {item.statut === "En attente" ? (
                    <button 
                      onClick={() => handleDeliverRecompense(idx)} 
                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-3 py-2 border border-emerald-500/20 text-[10px] font-black rounded-xl uppercase flex items-center gap-1 transition-all"
                    >
                      <Check size={12} /> Valider
                    </button>
                  ) : (
                    <span className="text-zinc-500 border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 rounded-xl text-[9px] uppercase font-black tracking-wider">
                      Livré
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLONNE 3 : CHAT SUPPORT REINTEGRE ET CONNECTE */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] h-[550px] flex flex-col justify-between overflow-hidden shadow-2xl">
          
          {/* Entête Chat Support */}
          <div className="p-4 bg-zinc-900/40 border-b border-zinc-900 flex justify-between items-center px-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">Chat Support</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 tracking-widest">DISCUSSION DIRECTE</span>
          </div>

          {/* Flux de messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 italic text-xs text-center">
                Aucun message échangé avec cet utilisateur.
              </div>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.sender === "admin";
                return (
                  <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                    <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed shadow-md ${
                      isAdmin 
                        ? 'bg-[#6200ee] text-white rounded-tr-none' 
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-850 rounded-tl-none'
                    }`}>
                      <p>{msg.text}</p>
                      <span className={`block text-[9px] mt-2 text-right font-mono opacity-60 ${isAdmin ? 'text-purple-200' : 'text-zinc-500'}`}>
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }) : "À l'instant"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Formulaire de saisie du Support */}
          <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900/20 border-t border-zinc-900 flex gap-3 px-6">
            <input 
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 text-xs text-white outline-none focus:border-[#6200ee] transition-all font-medium py-3"
            />
            <button 
              type="submit"
              className="bg-[#6200ee] hover:bg-[#5200c4] text-white p-3.5 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center"
            >
              <Send size={14} />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}