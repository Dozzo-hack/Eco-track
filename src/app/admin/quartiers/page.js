'use client';

import { useState, useEffect } from 'react';

export default function QuartiersAdminPage() {
  const [quartiers, setQuartiers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États pour les formulaires et feedback
  const [showModal, setShowModal] = useState(false);
  const [nomQuartier, setNomQuartier] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  // 1. CHARGEMENT DES QUARTIERS (GET)
  const fetchQuartiers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/quartiers');
      const result = await res.json();
      
      if (result.success) {
        setQuartiers(result.data);
      } else {
        showFeedback('error', result.message || 'Erreur lors du chargement.');
      }
    } catch (err) {
      showFeedback('error', 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuartiers();
  }, []);

  // Fonction utilitaire pour gérer les notifications temporaires
  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // 2. CRÉATION D'UN QUARTIER (POST)
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nomQuartier.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/quartiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomQuartier }),
      });
      const result = await res.json();

      if (result.success) {
        showFeedback('success', result.message);
        setNomQuartier('');
        setShowModal(false);
        fetchQuartiers(); // Recharger la liste triée
      } else {
        showFeedback('error', result.message);
      }
    } catch (err) {
      showFeedback('error', 'Erreur lors de la création.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. TOGGLE ACTIVATION (PUT)
  const handleToggleStatut = async (id, statutActuel) => {
    try {
      const nouveauStatut = !statutActuel;
      const res = await fetch(`/api/admin/quartiers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estActif: nouveauStatut }),
      });
      const result = await res.json();

      if (result.success) {
        // Mise à jour locale rapide de l'état pour la fluidité de l'UI
        setQuartiers(quartiers.map(q => q._id === id ? { ...q, estActif: nouveauStatut } : q));
        showFeedback('success', 'Statut mis à jour avec succès.');
      } else {
        showFeedback('error', result.message);
      }
    } catch (err) {
      showFeedback('error', 'Erreur lors de la modification du statut.');
    }
  };

  // 4. SUPPRESSION DÉFINITIVE (DELETE)
  const handleDelete = async (id, nom) => {
    if (!confirm(`Voulez-vous vraiment supprimer définitivement le quartier ${nom} ?`)) return;

    try {
      const res = await fetch(`/api/admin/quartiers/${id}`, { method: 'DELETE' });
      const result = await res.json();

      if (result.success) {
        setQuartiers(quartiers.filter(q => q._id !== id));
        showFeedback('success', result.message);
      } else {
        // C'est ici que le message de sécurité "Utilisateurs inscrits" renvoyé par ton backend va s'afficher !
        showFeedback('error', result.message);
      }
    } catch (err) {
      showFeedback('error', 'Erreur lors de la tentative de suppression.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 font-sans">
      {/* Container Principal */}
      <div className="max-w-7xl mx-auto">
        
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Gestion des Quartiers
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Configurez les secteurs territoriaux opérationnels d'EcoTrack.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 shadow-md shadow-emerald-900/30 flex items-center gap-2 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter un quartier
          </button>
        </div>

        {/* Toasts / Notifications système */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 transition-all ${
            message.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
          }`}>
            <span className={`h-2 w-2 rounded-full ${message.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Section Table / Loader */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 text-sm font-mono">Synchronisation MongoDB Atlas...</p>
          </div>
        ) : quartiers.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-400 font-medium">Aucun quartier répertorié pour le moment.</p>
            <p className="text-zinc-600 text-xs mt-1">Cliquez sur le bouton en haut à droite pour initialiser le premier secteur.</p>
          </div>
        ) : (
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4">Nom du Secteur</th>
                    <th className="p-4">Ajouté Par</th>
                    <th className="p-4">Statut de Collecte</th>
                    <th className="p-4 text-right">Actions de Sécurité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-black/20">
                  {quartiers.map((q) => (
                    <tr key={q._id} className="hover:bg-zinc-900/40 transition-colors duration-150">
                      {/* Nom du quartier (Toujours propre et carré) */}
                      <td className="p-4 font-mono font-bold text-emerald-400 tracking-wide text-sm">
                        {q.nom}
                      </td>
                      
                      {/* Métadonnée de traçabilité injectée par ta session backend */}
                      <td className="p-4 text-zinc-400 text-sm">
                        {q.ajoutePar || 'Système'}
                      </td>
                      
                      {/* Statut cliquable (Switch logique connecté au PUT) */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatut(q._id, q.estActif)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            q.estActif 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                              : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:bg-zinc-700'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${q.estActif ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
                          {q.estActif ? 'Actif / Desservi' : 'Désactivé'}
                        </button>
                      </td>
                      
                      {/* Action de suppression destructive contrôlée */}
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(q._id, q.nom)}
                          className="text-zinc-500 hover:text-rose-400 p-2 rounded-md hover:bg-rose-500/10 transition-all duration-150"
                          title="Supprimer définitivement"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.74 0L9 9m4.72-4.321--1.009-.017L10.838 4.09A2.25 2.25 0 0 0 8.584 5.83l-.023.07a44.645 44.645 0 0 0 9.156 0l-.023-.07a2.25 2.25 0 0 0-2.254-1.74m-9.423 0a2.25 2.25 0 0 1 2.254-1.74m5.399 0h1.628M1.5 5.25h21" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'ajout (Overlay HTML Fluide et Sombre) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md shadow-2xl relative">
            
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              Créer une zone logistique
            </h2>
            <p className="text-xs text-zinc-400 mb-6">Le nom sera automatiquement converti en majuscules par le serveur d'infrastructure.</p>
            
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Nom du quartier / Secteur
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  disabled={submitting}
                  placeholder="Ex: Deido Secteur 4"
                  value={nomQuartier}
                  onChange={(e) => setNomQuartier(e.target.value)}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-medium transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => { setShowModal(false); setNomQuartier(''); }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !nomQuartier.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                >
                  {submitting ? 'Création...' : 'Confirmer le déploiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}