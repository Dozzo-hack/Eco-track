"use client";

import { useState, useEffect } from "react";

export default function AdminQuartiers() {
  const [quartiers, setQuartiers] = useState([]);
  const [nouveauNom, setNouveauNom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchQuartiers();
  }, []);

  const fetchQuartiers = async () => {
    try {
      const res = await fetch("/api/admin/quartiers");
      const result = await res.json();
      if (result.success) {
        setQuartiers(result.data);
      } else {
        setError(result.message || "Erreur lors du chargement des quartiers.");
      }
    } catch (err) {
      setError("Impossible de joindre le serveur.");
    }
  };

  const handleAddQuartier = async (e) => {
    e.preventDefault();
    if (!nouveauNom.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/quartiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nouveauNom }),
      });

      const result = await res.json();

      if (result.success) {
        setSuccess(`Le quartier "${nouveauNom.toUpperCase()}" a été ajouté !`);
        setNouveauNom("");
        fetchQuartiers();
      } else {
        setError(result.message || "Une erreur est survenue.");
      }
    } catch (err) {
      setError("Erreur de connexion avec l'API.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatut = async (id, statutActuel) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/quartiers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estActif: !statutActuel }),
      });

      const result = await res.json();
      if (result.success) {
        setQuartiers(
          quartiers.map((q) => (q._id === id ? { ...q, estActif: !statutActuel } : q))
        );
      } else {
        setError(result.message || "Impossible de modifier le statut.");
      }
    } catch (err) {
      setError("Erreur réseau.");
    }
  };

  const handleDeleteQuartier = async (id, nomQuartier) => {
    if (!confirm(`Voulez-vous vraiment supprimer définitivement le quartier ${nomQuartier} ?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/quartiers/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (result.success) {
        setSuccess("Quartier supprimé avec succès.");
        setQuartiers(quartiers.filter((q) => q._id !== id));
      } else {
        setError(result.message || "Erreur lors de la suppression.");
      }
    } catch (err) {
      setError("Erreur réseau lors de la suppression.");
    }
  };

  return (
    <div className="p-6 bg-[#0c0c0e] min-h-screen text-gray-100">
      <div className="max-w-5xl mx-auto">
        
        {/* En-tête Style Centre de Contrôle */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-wider text-white uppercase font-mono">
            ZONE DE COUVERTURE
          </h1>
          <p className="text-xs text-emerald-500 font-mono mt-1">
            SYSTÈME ECOTRACK V2.0 – GESTION DES SECTEURS D'INTERVENTION
          </p>
        </div>

        {/* Messages d'alerte stylisés */}
        {error && (
          <div className="p-4 mb-6 text-sm bg-red-950/40 border border-red-800 text-red-400 rounded-xl font-mono">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="p-4 mb-6 text-sm bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-xl font-mono">
            ✅ {success}
          </div>
        )}

        {/* Formulaire d'Ajout - Carte Sombre */}
        <div className="bg-[#141416] p-6 rounded-2xl border border-gray-800/40 mb-8">
          <h2 className="text-base font-bold text-white uppercase tracking-wide mb-4 font-mono">
            Ouvrir un nouveau secteur (Douala)
          </h2>
          <form onSubmit={handleAddQuartier} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Ex: AKWA, BONAPRISO, LOGBESSOU..."
              value={nouveauNom}
              onChange={(e) => setNouveauNom(e.target.value)}
              className="flex-1 px-4 py-3 bg-[#1c1c1e] border border-gray-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white uppercase tracking-wider text-sm font-mono placeholder-gray-600"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-[#0c0c0e] font-black text-xs uppercase tracking-widest rounded-xl transition disabled:bg-emerald-800 disabled:text-gray-400 font-mono"
            >
              {loading ? "Chargement..." : "Valider la zone"}
            </button>
          </form>
        </div>

        {/* Tableau / Liste - Carte Sombre */}
        <div className="bg-[#141416] rounded-2xl border border-gray-800/40 overflow-hidden">
          <div className="p-5 border-b border-gray-800/60 flex justify-between items-center bg-[#18181a]">
            <h2 className="text-base font-bold text-white uppercase tracking-wide font-mono">
              Secteurs opérationnels enregistrés
            </h2>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
              {quartiers.length} Quartier(s)
            </span>
          </div>
          
          {quartiers.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-mono text-sm">
              Aucun secteur configuré sur le réseau EcoTrack.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-gray-300 font-mono text-sm">
                <thead>
                  <tr className="bg-[#18181a] text-xs uppercase text-gray-500 border-b border-gray-800 font-bold">
                    <th className="p-4 tracking-wider">Nom du Secteur</th>
                    <th className="p-4 tracking-wider">Disponibilité à l'inscription</th>
                    <th className="p-4 text-center tracking-wider">Actions prioritaires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {quartiers.map((quartier) => (
                    <tr key={quartier._id} className="hover:bg-[#1c1c1e]/40 transition">
                      <td className="p-4 font-bold text-white text-base tracking-wide">{quartier.nom}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold tracking-wide border ${
                            quartier.estActif
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/5 border-amber-500/20 text-amber-400"
                          }`}
                        >
                          ● {quartier.estActif ? "OUVERT / ACTIF" : "SUSPENDU / MASQUÉ"}
                        </span>
                      </td>
                      <td className="p-4 text-center flex justify-center gap-3">
                        <button
                          onClick={() => handleToggleStatut(quartier._id, quartier.estActif)}
                          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition ${
                            quartier.estActif
                              ? "border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/20"
                              : "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-600 hover:text-[#0c0c0e]"
                          }`}
                        >
                          {quartier.estActif ? "Masquer" : "Débloquer"}
                        </button>

                        <button
                          onClick={() => handleDeleteQuartier(quartier._id, quartier.nom)}
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg hover:bg-red-900 hover:text-white transition"
                        >
                          Destituer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}