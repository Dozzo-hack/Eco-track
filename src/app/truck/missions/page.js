"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, ChevronRight, Star, QrCode, Play, Loader2, CheckCircle2, Camera, X } from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

export default function MissionsPage() {
  const [tourneeActive, setTourneeActive] = useState(false);
  const [quartiers, setQuartiers] = useState([]);
  const [selectedQuartier, setSelectedQuartier] = useState(null);
  const [clients, setClients] = useState([]);
  
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // ÉTATS DU SCANNER CAMERA
  const [scannerOuvert, setScannerOuvert] = useState(false);
  const [clientEnCoursDeScan, setClientEnCoursDeScan] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    fetchZones();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(err => console.log("Nettoyage caméra:", err));
      }
    };
  }, []);

  const fetchZones = async () => {
    setLoadingZones(true);
    try {
      const res = await fetch('/api/truck/missions');
      const data = await res.json();
      if (data.success && data.quartiersAssignes) {
        const couleurs = ["bg-orange-500", "bg-slate-700", "bg-green-600"];
        const formatQuartiers = data.quartiersAssignes.map((nom, index) => ({
          id: index + 1,
          nom: nom,
          color: couleurs[index % couleurs.length]
        }));
        setQuartiers(formatQuartiers);
        setTourneeActive(data.statutActivite === "Actif");
      }
    } catch (err) {
      console.error("Erreur chargement zones:", err);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleToggleTournee = async (action) => {
    try {
      const res = await fetch('/api/truck/tournee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setTourneeActive(action === "START");
        if (action === "STOP") {
          setSelectedQuartier(null);
          setClients([]);
        } else {
          await fetchZones();
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Erreur de communication avec le serveur.");
    }
  };

  const handleSelectQuartier = async (quartier) => {
    if (!quartier || !quartier.nom) return;
    
    setSelectedQuartier(quartier);
    setLoadingClients(true);
    try {
      const res = await fetch(`/api/truck/missions?quartier=${encodeURIComponent(quartier.nom)}`);
      const data = await res.json();
      if (data.success) {
        setClients(data.clients || []);
      } else {
        alert(data.message);
        setSelectedQuartier(null);
      }
    } catch (err) {
      console.error("Erreur chargement clients:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  // 🛰️ FONCTION UTILITAIRE POUR OBTENIR LA POSITION GPS DU CHAUFFEUR ACCURATE
  const getChauffeurGpsLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error("Géolocalisation non supportée par le navigateur");
        resolve(null);
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Erreur de récupération GPS chauffeur:", error);
          resolve(null); // Fallback en cas de refus ou d'erreur
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  // EXECUTION D'UNE ACTION (BOUTON OU FIN DE SCAN SUCCESS) AVEC PLANNING ID + GEOLOCALISATION
  const handleClientAction = async (clientId, typeAction) => {
    setActionLoading(`${clientId}-${typeAction}`);
    
    const clientConcerne = clients.find(c => c._id === clientId);
    const planningId = clientConcerne?.planningId;

    // 🔥 ENREGISTREMENT DU GPS : On capture la position exacte du chauffeur au moment du scan
    const locationChauffeur = await getChauffeurGpsLocation();

    try {
      const res = await fetch('/api/truck/action-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetClientId: clientId, 
          actionType: typeAction,
          planningId: planningId,
          chauffeurGps: locationChauffeur // 🚀 Envoyé au backend pour le géo-ancrage !
        })
      });
      const data = await res.json();
      alert(data.message);
      
      if (data.success) {
        setClients(prev => {
          const updated = prev.map(c => 
            c._id === clientId 
              ? { 
                  ...c, 
                  ecoPoints: data.nouveauSoldePoints, 
                  statutCollecte: typeAction === "SCAN_BAC" ? "Validé" : c.statutCollecte 
                } 
              : c
          );
          return updated.sort((a, b) => {
            if (a.statutCollecte === "En attente" && b.statutCollecte === "Validé") return -1;
            if (a.statutCollecte === "Validé" && b.statutCollecte === "En attente") return 1;
            return 0;
          });
        });
      }
    } catch (err) {
      alert("Erreur lors de l'envoi de l'action.");
    } finally {
      setActionLoading(null);
    }
  };

  // DEMARRER LE MODULE DE SCAN CAMERA
  const ouvrirFenetreScanner = (client) => {
    setClientEnCoursDeScan(client);
    setScannerOuvert(true);

    setTimeout(() => {
      const html5Qrcode = new Html5Qrcode("reader");
      scannerRef.current = html5Qrcode;

      html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        },
        async (decodedText) => {
          await fermerFenetreScanner();
          
          if (decodedText.trim() === client._id) {
            handleClientAction(client._id, "SCAN_BAC");
          } else {
            alert(`Erreur : Ce QR Code appartient à un autre usager. Attendu : ${client.nom}`);
          }
        },
        (errorMessage) => {}
      ).catch(err => {
        console.error("Impossible de lancer la caméra :", err);
        alert("Caméra introuvable ou permissions refusées.");
        setScannerOuvert(false);
      });
    }, 300);
  };

  const fermerFenetreScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.log("Erreur lors de l'arrêt du scanner:", e);
      }
      scannerRef.current = null;
    }
    setScannerOuvert(false);
    setClientEnCoursDeScan(null);
  };

  if (loadingZones) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
        <p className="text-sm font-medium">Chargement de vos missions...</p>
      </div>
    );
  }

  return (
    <main className="px-5 pt-6 max-w-md mx-auto mb-24">
      {/* INTERFACE MODALE : SCANNER LIVE CAMERA */}
      {scannerOuvert && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-[35px] p-5 overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Camera size={18} className="text-orange-500" />
                <span className="text-sm">Scanner le bac abonné</span>
              </div>
              <button onClick={fermerFenetreScanner} className="bg-slate-100 p-2 rounded-full text-slate-500 active:scale-90">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 font-medium">
              Veuillez centrer le QR Code présent sur la poubelle de <strong className="text-orange-600">{clientEnCoursDeScan?.nom}</strong>.
            </p>

            <div id="reader" className="w-full overflow-hidden rounded-2xl bg-black border-2 border-slate-100"></div>

            <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Lecon en cours...</span>
            </div>
          </div>
        </div>
      )}

      {!tourneeActive ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-orange-100 p-8 rounded-[50px] mb-6">
            <Play size={48} className="text-orange-500 ml-2" fill="currentColor" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Prêt pour le service ?</h2>
          <p className="text-gray-500 mb-8 mt-2">Activez votre tournée pour voir <br/> les points de collecte assignés.</p>
          
          <button 
            onClick={() => handleToggleTournee("START")}
            className="w-full bg-orange-500 text-white p-6 rounded-[30px] font-black text-lg shadow-xl shadow-orange-200 active:scale-95 transition-all"
          >
            COMMENCER LA TOURNÉE
          </button>
        </div>
      ) : (
        <>
          {!selectedQuartier ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black flex items-center gap-2 text-slate-800">
                  <MapPin className="text-orange-500" size={24} /> Missions du jour
                </h2>
                <button 
                  onClick={() => handleToggleTournee("STOP")}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100"
                >
                  Terminer
                </button>
              </div>

              <div className="space-y-4">
                {(!quartiers || quartiers.length === 0) ? (
                  <p className="text-center text-gray-400 text-sm py-8">Aucun quartier actif trouvé pour le moment.</p>
                ) : (
                  quartiers.map((q) => (
                    <div 
                      key={q.id}
                      onClick={() => handleSelectQuartier(q)}
                      className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100 flex items-center justify-between group active:scale-95 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`${q.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner`}>
                          <Navigation size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800">{q.nom}</h3>
                          <p className="text-gray-400 text-xs font-medium">Cliquez pour voir la liste</p>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-300 group-hover:text-orange-500 transition-colors" />
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => { setSelectedQuartier(null); setClients([]); }}
                className="mb-6 flex items-center gap-1 text-orange-600 font-bold text-sm bg-orange-50 px-4 py-2 rounded-full"
              >
                ← Retour aux zones
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-800">{selectedQuartier.nom}</h2>
                <p className="text-gray-500 text-sm italic">Optimisation du trajet : 5 min / client</p>
              </div>

              {loadingClients ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="animate-spin text-orange-500 mb-2" />
                  <p className="text-xs">Recherche des abonnés...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(!clients || clients.length === 0) ? (
                    <p className="text-center text-gray-400 text-sm py-8">Aucun client actif dans ce quartier.</p>
                  ) : (
                    clients.map((client) => {
                      const estValide = client.statutCollecte === "Validé";

                      return (
                        <div 
                          key={client._id} 
                          className={`bg-white p-5 rounded-[35px] shadow-md border-t-4 transition-all duration-300 ${
                            estValide 
                              ? 'border-green-500 opacity-40 scale-[0.98]' 
                              : 'border-orange-500 opacity-100'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {estValide ? (
                                  <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 size={10} /> COLLECTÉ
                                  </span>
                                ) : (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${client.abonnement?.formule === 'Premium' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {(client.abonnement?.formule || 'Standard').toUpperCase()}
                                  </span>
                                )}
                                <span className="text-gray-300 text-[10px]">#{client._id ? client._id.substring(0, 6) : '------'}</span>
                              </div>
                              
                              <h4 className={`font-bold text-lg text-slate-800 capitalize ${estValide ? 'line-through text-gray-400' : ''}`}>
                                {client.nom} {client.prenom}
                              </h4>
                              
                              <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                                <MapPin size={12} /> {client.adresse?.rue || "Quartier " + selectedQuartier.nom}
                              </p>
                            </div>
                            
                            <div className={`p-2 rounded-xl flex flex-col items-center min-w-[55px] ${estValide ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                              <Star size={16} fill="currentColor" />
                              <span className="text-xs font-black">{client.ecoPoints}</span>
                              <span className="text-[8px] font-black uppercase text-gray-400">Pts</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              disabled={estValide || actionLoading === `${client._id}-SCAN_BAC`}
                              onClick={() => ouvrirFenetreScanner(client)}
                              className="bg-slate-900 text-white py-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                              {actionLoading === `${client._id}-SCAN_BAC` ? (
                                <Loader2 className="animate-spin" size={18} />
                              ) : (
                                <QrCode size={18} />
                              )}
                              SCANNER BAC
                            </button>
                            
                            <button 
                              disabled={estValide || actionLoading === `${client._id}-BONUS_TRI`}
                              onClick={() => handleClientAction(client._id, "BONUS_TRI")}
                              className="bg-white border-2 border-orange-500 text-orange-500 py-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                              {actionLoading === `${client._id}-BONUS_TRI` ? (
                                <Loader2 className="animate-spin" size={18} />
                              ) : (
                                "+ POINTS TRI"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}