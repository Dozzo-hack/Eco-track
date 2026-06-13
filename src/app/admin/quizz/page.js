"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminQuizCreator() {
  const router = useRouter();
  const [title, setTitle] = useState("Le Quizz du Vendredi 🧠");
  const [description, setDescription] = useState("Répondez à 5 questions et gagnez jusqu'à 50 points !");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // États pour le message hebdomadaire "Le Saviez-vous"
  const [tipTexte, setTipTexte] = useState("");
  const [publishingTip, setPublishingTip] = useState(false);

  // Fonction de soumission de l'anecdote
  const handlePublishTip = async (e) => {
    e.preventDefault();
    if (!tipTexte.trim()) return;
    setPublishingTip(true);

    try {
      const res = await fetch("/api/admin/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: tipTexte }),
      });
      const data = await res.json();
      if (data.success) {
        alert("💡 Le Saviez-vous envoyé avec succès à tous les utilisateurs !");
        setTipTexte("");
      } else {
        alert("Erreur: " + data.message);
      }
    } catch (err) {
      alert("Impossible de joindre le serveur.");
    } finally {
      setPublishingTip(false);
    }
  };

  // Initialisation de 5 questions vides
  const [questions, setQuestions] = useState(
    Array(5).fill(null).map((_, i) => ({
      questionText: ``,
      options: ["", "", "", ""],
      correctAnswerIndex: 0
    }))
  );

  const handleQuestionTextChange = (index, val) => {
    const updated = [...questions];
    updated[index].questionText = val;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, val) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = val;
    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (qIndex, oIndex) => {
    const updated = [...questions];
    updated[qIndex].correctAnswerIndex = Number(oIndex);
    setQuestions(updated);
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // <-- Correction de la faute de frappe ici
    setMessage({ type: "", text: "" });

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim() || questions[i].options.some(opt => !opt.trim())) {
        setMessage({ type: "error", text: `Veuillez remplir intégralement la Question ${i + 1} et toutes ses options.` });
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/quizz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, questions })
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setTimeout(() => router.push("/admin"), 2000);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Impossible de joindre le serveur de configuration." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-black min-h-screen text-white animate-in fade-in duration-700">
      
      {/* HEADER */}
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">COMPOSER LE QUIZ</h2>
          <p className="text-green-500 text-xs font-mono uppercase tracking-[0.2em]">
            Génération automatique du contenu hebdomadaire EcoTrack
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`p-6 rounded-3xl mb-8 flex items-center gap-4 border ${
          message.type === "success" ? "bg-green-500/10 border-green-500 text-green-400" : "bg-red-500/10 border-red-500 text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle /> : <AlertCircle />}
          <span className="font-black text-sm uppercase tracking-tight">{message.text}</span>
        </div>
      )}

      {/* SECTION AUTONOME : LE SAVIEZ-VOUS (Sortie du formulaire global) */}
      <div className="rounded-[40px] bg-[#111] p-8 border border-zinc-800 shadow-sm space-y-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg">
            <i className="fa-solid fa-lightbulb"></i>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase text-zinc-200 tracking-wider">MESSAGE HEBDOMADAIRE : LE SAVIEZ-VOUS ?</h3>
            <p className="text-xs text-zinc-500 font-bold">Saisissez l'anecdote verte qui sera poussée sur les écrans des abonnés chaque vendredi.</p>
          </div>
        </div>

        <form onSubmit={handlePublishTip} className="space-y-4">
          <textarea
            value={tipTexte}
            onChange={(e) => setTipTexte(e.target.value)}
            placeholder="Ex: Recycler une seule tonne de papier permet de sauver 17 arbres et d'économiser 26 000 litres d'eau..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-6 font-bold text-sm text-zinc-300 outline-none h-24 resize-none focus:ring-2 focus:ring-emerald-500/20 placeholder-zinc-600"
          ></textarea>
          
          <button
            type="submit"
            disabled={publishingTip || !tipTexte.trim()}
            className="px-6 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            {publishingTip ? "Publication..." : "Publier l'anecdote"}
          </button>
        </form>
      </div>

      {/* FORMULAIRE PRINCIPAL : CONFIGURATION DU QUIZ */}
      <form onSubmit={handleQuizSubmit} className="space-y-10">
        
        {/* BLOC INFOS GENERALES */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[45px] p-8 space-y-6">
          <h3 className="text-xl font-black italic uppercase text-green-500 flex items-center gap-2">
            <HelpCircle size={20}/> Configuration de l'entête
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block mb-2">Titre affiché aux utilisateurs</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-green-500 outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block mb-2">Sous-titre explicatif</label>
              <input 
                type="text" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-green-500 outline-none transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {/* QUESTIONS */}
        <div className="space-y-8">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-zinc-900 border border-zinc-800 rounded-[45px] p-8 relative">
              <div className="absolute top-6 right-8 bg-zinc-800 text-zinc-400 text-xs font-mono font-bold px-4 py-2 rounded-full border border-zinc-700">
                QUESTION {qIndex + 1} / 5
              </div>

              <div className="mb-6">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block mb-2">Énoncé du problème écologique</label>
                <input 
                  type="text"
                  placeholder="Ex: Quel déchet met plus de 400 ans à se dégrader dans la nature ?"
                  value={q.questionText}
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  className="w-full md:w-3/4 bg-black border border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-green-500 outline-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-3 bg-black/40 border border-zinc-800/60 rounded-2xl p-3 hover:border-zinc-700 transition-all">
                    <input 
                      type="radio" 
                      name={`correct-${qIndex}`}
                      checked={q.correctAnswerIndex === oIndex}
                      onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                      className="w-5 h-5 accent-green-500 cursor-pointer"
                    />
                    <input 
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                      value={option}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                      className="w-full bg-transparent border-0 text-xs font-bold text-zinc-300 focus:text-white outline-none"
                      required
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 italic mt-3 font-medium">
                * Cochez le bouton radio à gauche de la case pour définir la réponse valide.
              </p>
            </div>
          ))}
        </div>

        {/* BOUTON DE SOUMISSION DU QUIZ */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} /> {loading ? "PUBLICATION EN COURS..." : "PROPAGER LE QUIZ SUR LES DASHBOARDS"}
        </button>

      </form>
    </div>
  );
}