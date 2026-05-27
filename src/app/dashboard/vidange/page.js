"use client";
import { useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function VidangePage() {
  const [userPlan, setUserPlan] = useState("Premium"); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    typeDechet: "Plastique",
    volume: "1",
    dateSouhaitee: "",
    instructions: ""
  });

  const handleOrder = async (e) => {
    e.preventDefault();
    if (userPlan !== "Premium") return;
    if (!formData.dateSouhaitee) {
      Swal.fire({ icon: 'warning', title: 'Attention', text: 'Veuillez sélectionner une date.', background: '#fff' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/vidange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Commande validée !',
          text: 'Votre demande de vidange personnalisée a été transmise à l\'administration.',
          confirmButtonColor: '#6200ee'
        });
        // Réinitialiser le champ date et instructions
        setFormData({ ...formData, dateSouhaitee: "", instructions: "" });
        e.target.reset();
      } else {
        Swal.fire({ icon: 'error', title: 'Erreur', text: result.message || 'Une erreur est survenue.' });
      }
    } catch (error) {
      console.error("Erreur soumission vidange:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 lg:pt-0 pb-24 space-y-8 animate-in fade-in duration-500 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Nouvelle Vidange</h1>
          <p className="text-gray-500 font-bold">Planifiez votre collecte en 2 clics.</p>
        </div>
        <div className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm border ${userPlan === 'Premium' ? 'bg-purple-100 text-[#6200ee] border-purple-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
          Statut : {userPlan}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-[40px] bg-white p-8 shadow-sm border border-gray-100">
          <form onSubmit={handleOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 ml-2">Type de déchets</label>
                <select 
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#6200ee]/20"
                  value={formData.typeDechet}
                  onChange={(e) => setFormData({...formData, typeDechet: e.target.value})}
                >
                  <option value="Plastique">Plastique</option>
                  <option value="Papier / Carton">Papier / Carton</option>
                  <option value="Métal">Métal</option>
                  <option value="Verre">Verre</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 ml-2">Volume estimé</label>
                <select 
                   className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#6200ee]/20"
                   value={formData.volume}
                   onChange={(e) => setFormData({...formData, volume: e.target.value})}
                >
                  <option value="Petit (1-2 sacs)">Petit (1-2 sacs)</option>
                  <option value="Moyen (3-5 sacs)">Moyen (3-5 sacs)</option>
                  <option value="Grand (Conteneur)">Grand (Conteneur)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-400 ml-2">Date de passage souhaitée</label>
              <input 
                type="date" 
                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#6200ee]/20"
                value={formData.dateSouhaitee}
                onChange={(e) => setFormData({...formData, dateSouhaitee: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-gray-400 ml-2">Instructions pour le chauffeur</label>
              <textarea 
                placeholder="Ex: Le bac est derrière le portail noir..."
                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-gray-700 outline-none h-32 resize-none focus:ring-2 focus:ring-[#6200ee]/20"
                value={formData.instructions}
                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              ></textarea>
            </div>

            {userPlan === "Premium" ? (
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-5 rounded-2xl bg-[#6200ee] text-white font-black uppercase tracking-widest shadow-xl shadow-purple-200 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isSubmitting ? "Traitement..." : "Confirmer la vidange"}
              </button>
            ) : (
              <div className="p-6 rounded-[30px] bg-amber-50 border-2 border-amber-200 flex flex-col items-center text-center space-y-4">
                <p className="text-sm font-black text-amber-900">Option réservée aux membres Premium</p>
                <Link href="/dashboard/abonnement" className="px-8 py-3 rounded-xl bg-amber-500 text-white font-black text-xs uppercase">
                  Passer en Premium
                </Link>
              </div>
            )}
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-[40px] bg-black p-8 text-white shadow-xl">
            <h3 className="font-black text-xl italic text-[#ffcc00] mb-4 underline decoration-2">Rappel Sécurité</h3>
            <ul className="space-y-4 text-xs font-bold opacity-80">
              <li>• Veuillez séparer le verre des autres déchets.</li>
              <li>• Le chauffeur vous appellera 10 min avant son arrivée.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}